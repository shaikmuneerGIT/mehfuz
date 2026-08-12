import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateOrderNumber } from "../lib/orderNumber";
import { requireAdmin, AuthedRequest } from "../middleware/auth";

export const ordersRouter = Router();

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8).max(15),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4).max(10),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
});

const SHIPPING_THRESHOLD_INR = 999;
const SHIPPING_FEE_INR = 79;

ordersRouter.post("/", async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid order data", details: parsed.error.flatten() });
  }
  const data = parsed.data;

  const variantIds = data.items.map((i) => i.variantId);
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: { product: true },
  });

  if (variants.length !== new Set(variantIds).size) {
    return res.status(400).json({ error: "One or more selected items are no longer available" });
  }

  for (const item of data.items) {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant || variant.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for ${variant?.product.name ?? "an item"}`,
      });
    }
  }

  let subtotalInr = 0;
  const orderItemsData = data.items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId)!;
    const lineTotal = variant.priceInr * item.quantity;
    subtotalInr += lineTotal;
    return {
      productId: variant.productId,
      variantId: variant.id,
      nameSnapshot: variant.product.name,
      labelSnapshot: variant.label,
      priceInr: variant.priceInr,
      quantity: item.quantity,
    };
  });

  const shippingInr = subtotalInr >= SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_FEE_INR;
  const totalInr = subtotalInr + shippingInr;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        notes: data.notes || null,
        subtotalInr,
        shippingInr,
        totalInr,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    for (const item of data.items) {
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  res.status(201).json(order);
});

ordersRouter.get("/:orderNumber", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

ordersRouter.get("/", requireAdmin, async (_req: AuthedRequest, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  res.json(orders);
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

ordersRouter.patch("/:id/status", requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });
  res.json(order);
});
