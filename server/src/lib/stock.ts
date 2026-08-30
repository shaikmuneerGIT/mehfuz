import { prisma } from "./prisma";
import { parseWeightKg } from "./shipping";

/**
 * Stock in this shop is bulk weight, not a count of pre-made packs. The same
 * sack of almonds fills 250g, 500g or 1kg packs, so what can be sold is
 * decided in grams and every pack count is derived from it:
 *
 *     packs of a size = floor(grams on hand / that size)
 *
 * Counting packs independently is what made the figures impossible: two 1kg
 * packs received minus two 500g packs sold is 1 kg left, but per-pack books
 * could not take a 500g sale from a 1kg pack and invented an opening balance
 * to cover it.
 */

// ---- Bulk weight: what a shop that repacks actually holds ----

/**
 * A pack's weight in whole grams. Grams (not kilos) keep every figure an
 * integer, so weight arithmetic never drifts the way floats do.
 */
export function packGrams(label: string): number {
  return Math.round(parseWeightKg(label) * 1000);
}

/**
 * How many of a pack size the bulk on hand can fill. This is the whole point:
 * 250 g of anjeer left is one 250g pack and *nothing else* — no 500g, no 1kg.
 */
export function availablePacks(stockGrams: number, grams: number): number {
  if (grams <= 0) return 0;
  return Math.max(0, Math.floor(stockGrams / grams));
}

/** Total grams for a set of pack picks. */
export function gramsFor(items: { label: string; quantity: number }[]): number {
  return items.reduce((g, i) => g + packGrams(i.label) * i.quantity, 0);
}

/**
 * Per-pack stock is a view of the bulk weight, not a separate fact, so it is
 * recomputed from grams after every movement. Keeping it in the database means
 * the storefront, cart limits and low-stock alerts need no special knowledge
 * of weight — they keep reading `variant.stock` and simply see the truth.
 */
export async function syncVariantStock(productIds: string[]) {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (ids.length === 0) return;

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, stockGrams: true, variants: { select: { id: true, label: true, stock: true } } },
  });

  const updates = products.flatMap((p) =>
    p.variants
      .map((v) => ({ v, want: availablePacks(p.stockGrams, packGrams(v.label)) }))
      .filter(({ v, want }) => v.stock !== want)
      .map(({ v, want }) => prisma.variant.update({ where: { id: v.id }, data: { stock: want } }))
  );
  if (updates.length) await prisma.$transaction(updates);
}

/**
 * Move bulk weight for a product and bring its pack counts back in line.
 *
 * The write is atomic (increment/decrement, not read-then-write), so a
 * checkout committing at the same moment cannot be silently overwritten by a
 * stale figure read a moment earlier.
 */
export async function moveGrams(deltas: Map<string, number>, _reason: string) {
  const real = [...deltas.entries()].filter(([, g]) => g !== 0);
  if (real.length === 0) return;

  for (const [id, delta] of real) {
    if (delta > 0) {
      await prisma.product.update({
        where: { id },
        data: { stockGrams: { increment: delta } },
      });
      continue;
    }
    // Take weight off only if it is actually there; a shop cannot hold a
    // negative amount, so anything short of that empties the product.
    const { count } = await prisma.product.updateMany({
      where: { id, stockGrams: { gte: -delta } },
      data: { stockGrams: { decrement: -delta } },
    });
    if (count === 0) {
      await prisma.product.update({ where: { id }, data: { stockGrams: 0 } });
    }
  }
  await syncVariantStock(real.map(([id]) => id));
}

/** Set a product's weight outright — what a stock-take does. */
export async function setGrams(productId: string, grams: number) {
  await prisma.product.update({
    where: { id: productId },
    data: { stockGrams: Math.max(0, Math.round(grams)) },
  });
  await syncVariantStock([productId]);
}
