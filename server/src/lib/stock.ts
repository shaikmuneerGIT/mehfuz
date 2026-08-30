import { prisma } from "./prisma";

/**
 * Stock is not a free-floating number — it is the result of an arithmetic that
 * must always close:
 *
 *     in stock = received + adjustments - sold
 *
 * `received` comes from recorded deliveries, `sold` from every pack in a
 * non-cancelled order. Anything else that moves stock — a physical count, an
 * order edited or deleted, a delivery removed — writes an adjustment for
 * exactly the amount it moved, so the identity survives it.
 *
 * Everything here is expressed as Prisma operations rather than executed, so a
 * caller can drop them into the same transaction as the change that caused them.
 */

export interface StockMove {
  variantId: string;
  /** Positive puts units back on the shelf, negative takes them off. */
  delta: number;
  reason: string;
}

/**
 * Apply moves that are NOT explained by a delivery or a sale, recording an
 * adjustment for each. Stock is floored at zero — a shop can't hold -3 packs —
 * and the floored remainder is folded into the adjustment so the arithmetic
 * still closes.
 */
export async function applyAdjustments(moves: StockMove[]) {
  const real = moves.filter((m) => m.delta !== 0);
  if (real.length === 0) return [];

  const current = await prisma.variant.findMany({
    where: { id: { in: real.map((m) => m.variantId) } },
    select: { id: true, stock: true },
  });
  const stockById = new Map(current.map((v) => [v.id, v.stock]));

  return real.flatMap((m) => {
    const before = stockById.get(m.variantId) ?? 0;
    const after = Math.max(0, before + m.delta);
    return [
      prisma.variant.update({ where: { id: m.variantId }, data: { stock: after } }),
      prisma.stockAdjustment.create({
        data: { variantId: m.variantId, quantity: after - before, reason: m.reason },
      }),
    ];
  });
}

/**
 * Moves caused by a sale changing — an order edited, cancelled, deleted or
 * un-cancelled. These need NO adjustment: `sold` is recomputed from the orders
 * themselves, so moving stock by the same amount keeps the identity intact.
 * Only the part lost to the zero floor is recorded, since nothing else explains it.
 */
export async function applySaleMoves(moves: StockMove[]) {
  const real = moves.filter((m) => m.delta !== 0);
  if (real.length === 0) return [];

  const current = await prisma.variant.findMany({
    where: { id: { in: real.map((m) => m.variantId) } },
    select: { id: true, stock: true },
  });
  const stockById = new Map(current.map((v) => [v.id, v.stock]));

  return real.flatMap((m) => {
    const before = stockById.get(m.variantId) ?? 0;
    const wanted = before + m.delta;
    const after = Math.max(0, wanted);
    const ops: unknown[] = [
      prisma.variant.update({ where: { id: m.variantId }, data: { stock: after } }),
    ];
    if (after !== wanted) {
      ops.push(
        prisma.stockAdjustment.create({
          data: {
            variantId: m.variantId,
            quantity: after - wanted,
            reason: `${m.reason} (stock could not go below zero)`,
          },
        })
      );
    }
    return ops;
  });
}

export interface Reconciliation {
  variantId: string;
  received: number;
  sold: number;
  adjusted: number;
  stock: number;
  /** What stock must be for the arithmetic to close. */
  expected: number;
  reconciles: boolean;
}

/** The three ledgers behind every pack's stock, for the admin stock page. */
export async function reconcileStock(): Promise<Map<string, Reconciliation>> {
  const [variants, receivedRows, soldRows, adjustedRows] = await Promise.all([
    prisma.variant.findMany({ select: { id: true, stock: true } }),
    prisma.stockReceiptItem.groupBy({ by: ["variantId"], _sum: { quantity: true } }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: { order: { status: { not: "CANCELLED" } } },
    }),
    prisma.stockAdjustment.groupBy({ by: ["variantId"], _sum: { quantity: true } }),
  ]);

  const received = new Map(receivedRows.map((r) => [r.variantId, r._sum.quantity ?? 0]));
  const sold = new Map(soldRows.map((r) => [r.variantId, r._sum.quantity ?? 0]));
  const adjusted = new Map(adjustedRows.map((r) => [r.variantId, r._sum.quantity ?? 0]));

  return new Map(
    variants.map((v) => {
      const rec = received.get(v.id) ?? 0;
      const sld = sold.get(v.id) ?? 0;
      const adj = adjusted.get(v.id) ?? 0;
      const expected = rec + adj - sld;
      return [
        v.id,
        {
          variantId: v.id,
          received: rec,
          sold: sld,
          adjusted: adj,
          stock: v.stock,
          expected,
          reconciles: expected === v.stock,
        },
      ];
    })
  );
}
