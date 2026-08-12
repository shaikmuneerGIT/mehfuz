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
    include: { variants: true },
  });
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const toDelete = existing.variants.filter((v) => !incomingIds.has(v.id));

  await prisma.$transaction([
    ...toDelete.map((v) => prisma.variant.delete({ where: { id: v.id } })),
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
    include: { variants: true, category: true },
  });
  res.json(product);
});

adminRouter.delete("/products/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

adminRouter.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    include: { variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
});

// ---- Dashboard summary ----

adminRouter.get("/summary", async (_req, res) => {
  const [productCount, orderCount, pendingOrders, revenueAgg] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      _sum: { totalInr: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);
  res.json({
    productCount,
    orderCount,
    pendingOrders,
    totalRevenueInr: revenueAgg._sum.totalInr ?? 0,
  });
});
