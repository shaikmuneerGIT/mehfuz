import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { generateOrderNumber } from "../lib/orderNumber";
import {
  sendOrderNotifications,
  sendPaymentRefNotifications,
  sendPaymentConfirmedNotifications,
} from "../lib/mailer";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import { HttpError } from "../middleware/errors";

export const ordersRouter = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many orders placed. Please try again later." },
});

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
  paymentMethod: z.enum(["COD", "UPI"]).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
});

// Env-configurable so shipping can be switched off (fee 0) or re-priced
// without a rebuild — edit the server .env and restart.
const SHIPPING_THRESHOLD_INR = Number(process.env.SHIPPING_THRESHOLD_INR ?? 999);
const SHIPPING_FEE_INR = Number(process.env.SHIPPING_FEE_INR ?? 79);

ordersRouter.post("/", checkoutLimiter, async (req, res) => {
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
        paymentMethod: data.paymentMethod ?? "COD",
        // UPI orders start unpaid; the admin marks them paid after checking
        // the money actually arrived. COD has no payment status.
        paymentStatus: data.paymentMethod === "UPI" ? "UNPAID" : null,
        subtotalInr,
        shippingInr,
        totalInr,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    for (const item of data.items) {
      // Guard the decrement on stock still being sufficient so two orders
      // placed at the same time can't drive stock negative. A miss here
      // means someone else took the last of it — roll the whole order back.
      const { count } = await tx.variant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (count === 0) {
        const variant = variants.find((v) => v.id === item.variantId);
        throw new HttpError(
          409,
          `Sorry, ${variant?.product.name ?? "an item"} just sold out. Please adjust your cart and try again.`
        );
      }
    }

    return created;
  });

  // After the transaction is committed — an email failure must never
  // roll back or delay a placed order.
  sendOrderNotifications(order);

  res.status(201).json(order);
});

// Order numbers are date + 4 random digits, so without a limiter an
// attacker could enumerate them and harvest customer addresses.
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many order lookups. Please try again later." },
});

ordersRouter.get("/:orderNumber", lookupLimiter, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber as string },
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

// Customer reports the UTR / transaction reference of their UPI payment.
// This is only a claim — the admin verifies against the bank statement and
// marks the order paid; the reference itself never changes paymentStatus.
// Customers give just the last few digits of the UTR — full 12-digit IDs
// are error-prone to copy; 4-6 trailing digits are enough to match the
// transaction in the UPI app.
const paymentRefSchema = z.object({ utr: z.string().min(4).max(40) });

ordersRouter.post("/:orderNumber/payment-ref", checkoutLimiter, async (req, res) => {
  const parsed = paymentRefSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please enter the UPI transaction reference (UTR)" });
  }
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber as string },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentMethod !== "UPI") {
    return res.status(400).json({ error: "This order is not a UPI order" });
  }
  if (order.paymentStatus === "PAID") {
    return res.status(400).json({ error: "This order is already marked as paid" });
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentRef: parsed.data.utr.trim() },
    include: { items: true },
  });

  // Alert the shop (verify & mark paid) and acknowledge the customer.
  sendPaymentRefNotifications(updated, updated.paymentRef!);

  res.json({ ok: true, paymentRef: updated.paymentRef });
});

const paymentStatusSchema = z.object({ paymentStatus: z.enum(["PAID", "UNPAID"]) });

ordersRouter.patch("/:id/payment", requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = paymentStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payment status" });

  const before = await prisma.order.findUnique({ where: { id: req.params.id as string } });
  const order = await prisma.order.update({
    where: { id: req.params.id as string },
    data: { paymentStatus: parsed.data.paymentStatus },
    include: { items: true },
  });

  // Confirmation emails wait for the money: both parties hear from us only
  // on the transition into PAID, never on re-marking an already-paid order.
  if (parsed.data.paymentStatus === "PAID" && before?.paymentStatus !== "PAID") {
    sendPaymentConfirmedNotifications(order);
  }

  res.json(order);
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
    where: { id: req.params.id as string },
    data: { status: parsed.data.status },
  });
  res.json(order);
});
