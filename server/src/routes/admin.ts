import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";
import { packGrams, availablePacks, syncVariantStock, moveGrams, setGrams } from "../lib/stock";
import { parseWeightKg } from "../lib/shipping";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

/** Empty/whitespace optional text fields become null instead of being kept. */
function blankToNull(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["description", "origin", "badge", "imageUrl"]) {
    if (key in out && typeof out[key] === "string" && !(out[key] as string).trim()) {
      out[key] = null;
    }
  }
  return out;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---- Categories ----

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  origin: z.string().optional(),
  // Home-page presentation, editable from the admin Categories page.
  imageUrl: z.string().optional(),
  showOnHome: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

adminRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
});

adminRouter.post("/categories", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid category data" });
  const { name, description, origin } = parsed.data;
  const category = await prisma.category.create({
    data: { name, slug: slugify(name), description, origin },
  });
  res.status(201).json(category);
});

adminRouter.put("/categories/:id", async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid category data" });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.name) data.slug = slugify(parsed.data.name);
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json(category);
});

adminRouter.delete("/categories/:id", async (req, res) => {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    return res.status(409).json({
      error: `This category still has ${productCount} product(s). Move or delete them first.`,
    });
  }

  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---- Products ----

const variantInput = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  priceInr: z.number().int().min(1),
  stock: z.number().int().min(0).default(100),
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  origin: z.string().optional(),
  badge: z.string().optional(),
  // Either an uploaded path (/uploads/…) or an absolute URL. Empty means
  // "use the built-in illustration".
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string(),
  variants: z.array(variantInput).min(1),
});

adminRouter.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product data", details: parsed.error.flatten() });
  }
  const { variants, ...productData } = parsed.data;

  // A new product holds nothing until a delivery is recorded or its weight is
  // set on the Stock page. Creating it with pack counts would advertise stock
  // that checkout then refuses, because stockGrams starts at zero.
  const product = await prisma.product.create({
    data: {
      ...(blankToNull(productData) as typeof productData),
      slug: slugify(productData.name) + "-" + Math.random().toString(36).slice(2, 7),
      variants: {
        create: variants.map((v) => ({ label: v.label, priceInr: v.priceInr, stock: 0 })),
      },
    },
    include: { variants: true, category: true },
  });
  res.status(201).json(product);
});

adminRouter.put("/products/:id", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product data", details: parsed.error.flatten() });
  }
  const { variants, ...productData } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { variants: { where: { isActive: true } } },
  });
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const removed = existing.variants.filter((v) => !incomingIds.has(v.id));

  // A pack size that appears in a past order is deactivated rather than
  // deleted, so order history keeps pointing at something real.
  const orderedVariantIds = new Set(
    (
      await prisma.orderItem.findMany({
        where: { variantId: { in: removed.map((v) => v.id) } },
        select: { variantId: true },
      })
    ).map((oi) => oi.variantId)
  );

  // Stock is not edited here: pack counts are derived from the product's bulk
  // weight, which the Stock page owns. Accepting a number here would create a
  // second set of books that immediately disagrees with the first.
  await prisma.$transaction([
    ...removed.map((v) =>
      orderedVariantIds.has(v.id)
        ? prisma.variant.update({ where: { id: v.id }, data: { isActive: false } })
        : prisma.variant.delete({ where: { id: v.id } })
    ),
    ...variants.map((v) =>
      v.id
        ? prisma.variant.update({
            where: { id: v.id },
            data: { label: v.label, priceInr: v.priceInr },
          })
        : prisma.variant.create({
            data: { label: v.label, priceInr: v.priceInr, productId: req.params.id },
          })
    ),
    prisma.product.update({
      where: { id: req.params.id },
      data: blankToNull(productData) as typeof productData,
    }),
  ]);

  await syncVariantStock([req.params.id]);

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { variants: { where: { isActive: true } }, category: true },
  });
  res.json(product);
});

adminRouter.delete("/products/:id", async (req, res) => {
  // Order history references products, so a product that has ever been
  // ordered must not be hard-deleted — that would destroy past orders.
  // The admin UI offers to hide it from the shop instead.
  const ordered = await prisma.orderItem.count({ where: { productId: req.params.id } });
  if (ordered > 0) {
    return res.status(409).json({
      error:
        "This product has past orders, so deleting it would remove them from your order history. Hide it from the shop instead.",
      canHide: true,
    });
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

const visibilitySchema = z.object({ isActive: z.boolean() });

adminRouter.patch("/products/:id/visibility", async (req, res) => {
  const parsed = visibilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid visibility value" });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: parsed.data.isActive },
  });
  res.json(product);
});

adminRouter.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      // Deactivated pack sizes are retired, not editable — keep them out of
      // the admin list so they don't reappear in the edit form.
      variants: { where: { isActive: true }, orderBy: { priceInr: "asc" } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
});

// ---- Stock receipts ----

const stockReceiptSchema = z.object({
  productId: z.string(),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
  totalCostInr: z.number().int().min(0),
  receivedAt: z.string().datetime().optional(),
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

adminRouter.post("/stock-receipts", async (req, res) => {
  const parsed = stockReceiptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid stock receipt data" });
  const { productId, supplierName, notes, totalCostInr, receivedAt, items } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const variants = await prisma.variant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
  });

  // Every pack size in this delivery must actually belong to the product
  // it's being received against — otherwise stock would silently land on
  // the wrong product's variant.
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const distinctIds = new Set(items.map((i) => i.variantId));
  if (variants.length !== distinctIds.size || variants.some((v) => v.productId !== productId)) {
    return res.status(400).json({ error: "One or more pack sizes don't belong to this product" });
  }

  const [receipt] = await prisma.$transaction([
    prisma.stockReceipt.create({
      data: {
        productId,
        supplierName: supplierName || null,
        notes: notes || null,
        totalCostInr,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        items: {
          create: items.map((i) => ({
            variantId: i.variantId,
            labelSnapshot: variantById.get(i.variantId)!.label,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    }),
  ]);

  // A delivery adds bulk weight; pack counts follow from it.
  const receivedGrams = items.reduce(
    (g, i) => g + packGrams(variantById.get(i.variantId)!.label) * i.quantity,
    0
  );
  await moveGrams(new Map([[productId, receivedGrams]]), "delivery recorded");

  res.status(201).json({
    id: receipt.id,
    productId: receipt.productId,
    productName: product.name,
    supplierName: receipt.supplierName,
    notes: receipt.notes,
    totalCostInr: receipt.totalCostInr,
    receivedAt: receipt.receivedAt,
    items: receipt.items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      labelSnapshot: i.labelSnapshot,
      quantity: i.quantity,
    })),
  });
});

/**
 * Inventory reconciliation: for every sellable pack, what's on the shelf now,
 * how much was recorded as received, and how much has actually been sold.
 * "Opening" is whatever the current stock can't be explained by those two —
 * i.e. stock that existed before deliveries were being recorded, or manual
 * edits on the product form.
 */
adminRouter.get("/stock-overview", async (_req, res) => {
  const [products, receipts, sales] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        stockGrams: true,
        variants: {
          where: { isActive: true },
          select: { id: true, label: true, priceInr: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.stockReceiptItem.groupBy({ by: ["variantId"], _sum: { quantity: true } }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: { order: { status: { not: "CANCELLED" } } },
    }),
  ]);

  const receivedPacks = new Map(receipts.map((r) => [r.variantId, r._sum.quantity ?? 0]));
  const soldPacks = new Map(sales.map((r) => [r.variantId, r._sum.quantity ?? 0]));

  const productRows = products
    .filter((p) => p.variants.length > 0)
    .map((p) => {
      const packs = p.variants
        .map((v) => {
          const grams = packGrams(v.label);
          return {
            variantId: v.id,
            productName: p.name,
            productActive: p.isActive,
            label: v.label,
            priceInr: v.priceInr,
            packGrams: grams,
            received: receivedPacks.get(v.id) ?? 0,
            sold: soldPacks.get(v.id) ?? 0,
            // What this pack size can be filled with from the bulk on hand.
            available: availablePacks(p.stockGrams, grams),
          };
        })
        .sort((a, b) => a.packGrams - b.packGrams);

      const receivedGrams = packs.reduce((g, v) => g + v.received * v.packGrams, 0);
      const soldGrams = packs.reduce((g, v) => g + v.sold * v.packGrams, 0);
      // Whatever the delivery and sales records don't explain: stock already
      // on the shelf, or a hand count. Defined as the residual, so the four
      // figures on screen always add up exactly.
      const openingGrams = p.stockGrams - receivedGrams + soldGrams;
      // Value the bulk at the best price per gram the pack sizes offer.
      const perGram = packs.length
        ? Math.min(...packs.map((v) => v.priceInr / v.packGrams))
        : 0;

      return {
        productId: p.id,
        productName: p.name,
        productActive: p.isActive,
        stockGrams: p.stockGrams,
        receivedGrams,
        soldGrams,
        openingGrams,
        stockValueInr: Math.round(p.stockGrams * perGram),
        packs,
      };
    })
    .sort((a, b) => a.stockGrams - b.stockGrams || a.productName.localeCompare(b.productName));

  res.json({
    products: productRows,
    totals: {
      productCount: productRows.length,
      gramsInStock: productRows.reduce((g, p) => g + p.stockGrams, 0),
      gramsSold: productRows.reduce((g, p) => g + p.soldGrams, 0),
      gramsReceived: productRows.reduce((g, p) => g + p.receivedGrams, 0),
      stockValueInr: productRows.reduce((v, p) => v + p.stockValueInr, 0),
      outOfStock: productRows.filter((p) => p.stockGrams === 0).length,
      lowStock: productRows.filter(
        (p) => p.stockGrams > 0 && p.stockGrams < LOW_STOCK_GRAMS
      ).length,
    },
  });
});

/**
 * Where a product's sold weight went: the orders that consumed it, newest
 * first. "Sold 250 g" is not an answer on its own — the owner needs to see
 * whose order it was.
 */
adminRouter.get("/stock-sales/:productId", async (req, res) => {
  const items = await prisma.orderItem.findMany({
    where: { productId: req.params.productId as string },
    include: {
      order: {
        select: {
          orderNumber: true,
          customerName: true,
          phone: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
    orderBy: { order: { createdAt: "desc" } },
    take: 100,
  });

  res.json(
    items.map((i) => ({
      orderNumber: i.order.orderNumber,
      customerName: i.order.customerName,
      phone: i.order.phone,
      status: i.order.status,
      paymentStatus: i.order.paymentStatus,
      createdAt: i.order.createdAt,
      label: i.labelSnapshot,
      quantity: i.quantity,
      grams: packGrams(i.labelSnapshot) * i.quantity,
      // A cancelled order is shown but does not count towards sold weight.
      countsTowardsSold: i.order.status !== "CANCELLED",
    }))
  );
});

/**
 * A physical stock-take: the owner states how much of a product is actually
 * there, as a weight. Weight is the only unambiguous way to say it — asking
 * for a count of each pack size cannot work, because 1 kg IS four 250g packs
 * AND two 500g packs AND one 1kg pack at the same time, so adding those
 * together would triple the real stock.
 */
const stockWeightSchema = z.object({
  weights: z
    .array(
      z.object({
        productId: z.string().min(1),
        grams: z.number().int().min(0).max(100_000_000),
      })
    )
    .min(1)
    .max(500),
});

adminRouter.put("/stock-weights", async (req, res) => {
  const parsed = stockWeightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid stock weights" });

  const known = await prisma.product.findMany({
    where: { id: { in: parsed.data.weights.map((w) => w.productId) } },
    select: { id: true },
  });
  const knownIds = new Set(known.map((p) => p.id));
  const updates = parsed.data.weights.filter((w) => knownIds.has(w.productId));

  for (const w of updates) {
    await setGrams(w.productId, w.grams);
  }

  res.json({ updated: updates.length });
});

/**
 * Re-derive every pack count from the weight on hand. Nothing here can drift
 * any more — pack counts are a view, not a second set of books — so this is
 * only a repair hatch if a count is ever edited outside the app.
 */
adminRouter.post("/stock-reconcile", async (_req, res) => {
  const products = await prisma.product.findMany({ select: { id: true } });
  await syncVariantStock(products.map((p) => p.id));
  res.json({ reconciled: products.length, packs: products.length });
});


// Deleting a receipt also takes back the stock it added, so inventory keeps
// matching the deliveries actually recorded. Stock is floored at zero — units
// already sold can't be un-sold.
adminRouter.delete("/stock-receipts/:id", async (req, res) => {
  const receipt = await prisma.stockReceipt.findUnique({
    where: { id: req.params.id as string },
    include: { items: true },
  });
  if (!receipt) return res.status(404).json({ error: "Stock entry not found" });

  // Removing the delivery takes its weight back off the shelf.
  const removedGrams = receipt.items.reduce(
    (g, i) => g + packGrams(i.labelSnapshot) * i.quantity,
    0
  );
  await prisma.stockReceipt.delete({ where: { id: receipt.id } });
  await moveGrams(new Map([[receipt.productId, -removedGrams]]), "delivery removed");

  res.status(204).send();
});

adminRouter.get("/stock-receipts", async (_req, res) => {
  const receipts = await prisma.stockReceipt.findMany({
    include: { product: true, items: true },
    orderBy: { receivedAt: "desc" },
  });
  res.json(
    receipts.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      supplierName: r.supplierName,
      notes: r.notes,
      totalCostInr: r.totalCostInr,
      receivedAt: r.receivedAt,
      items: r.items.map((i) => ({
        id: i.id,
        variantId: i.variantId,
        labelSnapshot: i.labelSnapshot,
        quantity: i.quantity,
      })),
    }))
  );
});

// ---- Expenses ----

const expenseSchema = z.object({
  title: z.string().min(2),
  category: z.string().optional(),
  notes: z.string().optional(),
  amountInr: z.number().int().min(1),
  incurredAt: z.string().datetime().optional(),
});

adminRouter.get("/expenses", async (_req, res) => {
  const expenses = await prisma.expense.findMany({ orderBy: { incurredAt: "desc" } });
  res.json(expenses);
});

adminRouter.post("/expenses", async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid expense data" });
  const { title, category, notes, amountInr, incurredAt } = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      title,
      category: category || null,
      notes: notes || null,
      amountInr,
      incurredAt: incurredAt ? new Date(incurredAt) : new Date(),
    },
  });
  res.status(201).json(expense);
});

adminRouter.delete("/expenses/:id", async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---- Dashboard summary ----

const LOW_STOCK_THRESHOLD = 5;
// Half a kilo left of a product is worth a warning, whatever pack sizes it sells in.
const LOW_STOCK_GRAMS = 500;

adminRouter.get("/summary", async (_req, res) => {
  const [productCount, orderCount, pendingOrders, revenueAgg, stockCostAgg, expenseAgg, lowStock] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        _sum: { totalInr: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.stockReceipt.aggregate({ _sum: { totalCostInr: true } }),
      prisma.expense.aggregate({ _sum: { amountInr: true } }),
      prisma.variant.findMany({
        where: {
          stock: { lte: LOW_STOCK_THRESHOLD },
          isActive: true,
          product: { isActive: true },
        },
        include: { product: { select: { name: true } } },
        orderBy: { stock: "asc" },
        take: 15,
      }),
    ]);
  const totalRevenueInr = revenueAgg._sum.totalInr ?? 0;
  const totalStockCostInr = stockCostAgg._sum.totalCostInr ?? 0;
  const totalExpensesInr = expenseAgg._sum.amountInr ?? 0;
  res.json({
    productCount,
    orderCount,
    pendingOrders,
    totalRevenueInr,
    totalStockCostInr,
    totalExpensesInr,
    profitInr: totalRevenueInr - totalStockCostInr - totalExpensesInr,
    lowStock: lowStock.map((v) => ({
      variantId: v.id,
      productName: v.product.name,
      label: v.label,
      stock: v.stock,
    })),
  });
});

/**
 * What the shop actually earned.
 *
 * The headline figure is deliberately NOT "money in minus money spent on
 * stock": buying a 10 kg sack in one month and selling it over three would
 * show a loss then a windfall. Earnings are measured against the cost of the
 * goods that were actually SOLD, worked out from what was paid for them:
 *
 *     cost per gram  = what a product's deliveries cost / grams they brought in
 *     cost of sales  = grams sold x cost per gram
 *     earnings       = what customers paid for goods - cost of sales
 *
 * Delivery is left out of earnings entirely. The fee a customer pays is
 * collected on the courier's behalf and handed straight to DTDC, so counting
 * it as income would inflate every figure on the page.
 */
adminRouter.get("/earnings", async (req, res) => {
  // "paid" is the honest default — an unpaid order is not money earned.
  const paidOnly = req.query.paidOnly !== "false";

  const [orders, receipts, expenses, products] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        ...(paidOnly ? { paymentStatus: "PAID" } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockReceipt.findMany({ include: { items: true } }),
    prisma.expense.findMany(),
    prisma.product.findMany({
      select: { id: true, name: true, stockGrams: true },
    }),
  ]);

  // What each product's stock costs per gram, from its recorded deliveries.
  const costByProduct = new Map<string, { paid: number; grams: number }>();
  for (const r of receipts) {
    const grams = r.items.reduce((g, i) => g + packGrams(i.labelSnapshot) * i.quantity, 0);
    const acc = costByProduct.get(r.productId) ?? { paid: 0, grams: 0 };
    acc.paid += r.totalCostInr;
    acc.grams += grams;
    costByProduct.set(r.productId, acc);
  }
  const costPerGram = (productId: string) => {
    const c = costByProduct.get(productId);
    return c && c.grams > 0 ? c.paid / c.grams : 0;
  };

  // Per product: what sold, what it earned, what it cost.
  const perProduct = new Map<
    string,
    { productId: string; productName: string; gramsSold: number; revenueInr: number; costInr: number }
  >();

  let goodsRevenueInr = 0;
  let shippingCollectedInr = 0;
  let discountsInr = 0;
  let costOfSalesInr = 0;
  let unpricedGramsSold = 0;

  for (const order of orders) {
    const itemsTotal = order.items.reduce((s, i) => s + i.priceInr * i.quantity, 0);
    // The admin can edit an order's total, so the difference between the line
    // items and what was charged is a discount (or a surcharge, if negative).
    const discount = itemsTotal + order.shippingInr - order.totalInr;
    discountsInr += discount;
    shippingCollectedInr += order.shippingInr;

    for (const item of order.items) {
      const grams = packGrams(item.labelSnapshot) * item.quantity;
      const lineRevenue = item.priceInr * item.quantity;
      const perGram = costPerGram(item.productId);
      const lineCost = Math.round(grams * perGram);
      if (perGram === 0) unpricedGramsSold += grams;

      goodsRevenueInr += lineRevenue;
      costOfSalesInr += lineCost;

      const row = perProduct.get(item.productId) ?? {
        productId: item.productId,
        productName: item.nameSnapshot,
        gramsSold: 0,
        revenueInr: 0,
        costInr: 0,
      };
      row.gramsSold += grams;
      row.revenueInr += lineRevenue;
      row.costInr += lineCost;
      perProduct.set(item.productId, row);
    }
  }

  // A discount comes off the goods, since delivery is charged at cost.
  const netGoodsRevenueInr = goodsRevenueInr - discountsInr;
  const grossEarningsInr = netGoodsRevenueInr - costOfSalesInr;
  const expensesInr = expenses.reduce((s, e) => s + e.amountInr, 0);
  const netEarningsInr = grossEarningsInr - expensesInr;

  // Money still sitting on the shelf, valued at what it cost.
  const stockAtCostInr = products.reduce(
    (s, p) => s + Math.round(p.stockGrams * costPerGram(p.id)),
    0
  );

  const productRows = [...perProduct.values()]
    .map((r) => ({
      ...r,
      earningsInr: r.revenueInr - r.costInr,
      marginPct: r.revenueInr > 0 ? Math.round(((r.revenueInr - r.costInr) / r.revenueInr) * 100) : 0,
    }))
    .sort((a, b) => b.earningsInr - a.earningsInr);

  res.json({
    paidOnly,
    orderCount: orders.length,
    goodsRevenueInr,
    discountsInr,
    netGoodsRevenueInr,
    shippingCollectedInr,
    costOfSalesInr,
    grossEarningsInr,
    expensesInr,
    netEarningsInr,
    stockAtCostInr,
    marginPct:
      netGoodsRevenueInr > 0 ? Math.round((grossEarningsInr / netGoodsRevenueInr) * 100) : 0,
    // Sold weight with no purchase price behind it — its cost counts as zero,
    // which flatters earnings, so the page says so rather than hiding it.
    unpricedGramsSold,
    products: productRows,
  });
});

// ---- Shipping / delivery-fee configuration ----

const shippingConfigSchema = z.object({
  enabled: z.boolean(),
  warehousePincode: z.string().regex(/^\d{6}$/, "6-digit pincode"),
  freeAbove: z.number().int().min(0).max(100000),
  upto500gFee: z.number().int().min(0).max(5000),
  upto1kgFee: z.number().int().min(0).max(5000),
  midPerKgFee: z.number().int().min(0).max(5000),
  bulkPerKgFee: z.number().int().min(0).max(5000),
  cityRadiusKm: z.number().int().min(1).max(500),
});

adminRouter.get("/shipping", async (_req, res) => {
  const { loadShippingConfig } = await import("../lib/shipping");
  res.json(await loadShippingConfig());
});

adminRouter.put("/shipping", async (req, res) => {
  const parsed = shippingConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid shipping settings", details: parsed.error.flatten() });
  }
  const { saveShippingConfig } = await import("../lib/shipping");
  await saveShippingConfig(parsed.data);
  res.json(parsed.data);
});

// ---- Hero slideshow banners ----

const heroSlideSchema = z.object({
  image: z.string().min(1),
  tag: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  ctaText: z.string().min(1),
  ctaLink: z.string().min(1),
  badge: z.string().min(1),
});

adminRouter.put("/hero-slides", async (req, res) => {
  const parsed = z.object({ slides: z.array(heroSlideSchema).min(1).max(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid slide data" });
  const value = JSON.stringify(parsed.data.slides);
  await prisma.setting.upsert({
    where: { key: "heroSlides" },
    update: { value },
    create: { key: "heroSlides", value },
  });
  res.json({ ok: true, slides: parsed.data.slides });
});

// ---- Database backup ----

// The whole shop lives in one SQLite file; letting the admin download it
// from the panel beats asking them to dig through the hosting file manager.
adminRouter.get("/backup", (_req, res) => {
  const dbPath = process.env.DB_FILE
    ? path.resolve(process.env.DB_FILE)
    : path.resolve(process.cwd(), "prisma", "prod.db");
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: "Database file not found on this server" });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  res.download(dbPath, `mehfuz-backup-${stamp}.db`);
});
