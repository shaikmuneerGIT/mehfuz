import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

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

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug: slugify(productData.name) + "-" + Math.random().toString(36).slice(2, 7),
      variants: { create: variants.map(({ id, ...v }) => v) },
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
            data: { label: v.label, priceInr: v.priceInr, stock: v.stock },
          })
        : prisma.variant.create({
            data: {
              label: v.label,
              priceInr: v.priceInr,
              stock: v.stock,
              productId: req.params.id,
            },
          })
    ),
    prisma.product.update({ where: { id: req.params.id }, data: productData }),
  ]);

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
    ...items.map((i) =>
      prisma.variant.update({
        where: { id: i.variantId },
        data: { stock: { increment: i.quantity } },
      })
    ),
  ]);

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
