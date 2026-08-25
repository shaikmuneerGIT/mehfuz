import { Router } from "express";
import { prisma } from "../lib/prisma";

export const catalogRouter = Router();

catalogRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
});

catalogRouter.get("/products", async (req, res) => {
  const { category, featured, q } = req.query;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      // A product with no sellable pack size would render as "From ₹0".
      variants: { some: { isActive: true } },
      ...(category ? { category: { slug: String(category) } } : {}),
      ...(featured === "true" ? { isFeatured: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: String(q) } },
              { description: { contains: String(q) } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { priceInr: "asc" } },
    },
    orderBy: { name: "asc" },
  });
  res.json(products);
});

catalogRouter.get("/products/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { priceInr: "asc" } },
    },
  });
  if (!product || !product.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});
