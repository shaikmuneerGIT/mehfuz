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
  paymentMethod: z.enum(["COD", "UPI", "PAYU"]).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
});

import { loadShippingConfig, quoteShipping, cartWeightKg } from "../lib/shipping";

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

  // Delivery is Hyderabad-only: the same quote shown at checkout decides
  // serviceability and the km-based fee here, so nobody can order past it.
  const shippingConfig = await loadShippingConfig();
  // Weight comes from the real variants, never from the client.
  const weightKg = cartWeightKg(
    data.items.map((item) => ({
      label: variants.find((v) => v.id === item.variantId)!.label,
      quantity: item.quantity,
    }))
  );
  const shippingQuote = quoteShipping(shippingConfig, subtotalInr, data.pincode, weightKg);
  if (!shippingQuote.serviceable) {
    return res.status(400).json({
      error:
        "Sorry, we currently deliver only within Hyderabad. Message us on WhatsApp (+91 98489 18992) and we'll try to arrange delivery for you.",
    });
  }
  const shippingInr = shippingQuote.feeInr;
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
        // Prepaid orders (UPI QR or PayU) start unpaid: UPI is confirmed by
        // the admin, PayU by its verified callback. COD has no payment status.
        paymentStatus:
          data.paymentMethod === "UPI" || data.paymentMethod === "PAYU" ? "UNPAID" : null,
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
// transaction in the UPI app. Digits only: a real customer once typed
// "payment done" here, which is useless for matching the transaction.
const paymentRefSchema = z.object({
  utr: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{4,16}$/, "digits only")),
});

ordersRouter.post("/:orderNumber/payment-ref", checkoutLimiter, async (req, res) => {
  const parsed = paymentRefSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Please enter only the digits of the transaction ID (e.g. 731205)",
    });
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

/**
 * Adjust what an order costs (admin): a negotiated discount, a waived or
 * corrected delivery fee. Item lines stay untouched, so the difference between
 * subtotal + shipping and the new total is shown as a discount on the order
 * page, emails and invoice.
 */
const amountSchema = z.object({
  totalInr: z.number().int().min(0).max(10_000_000),
  shippingInr: z.number().int().min(0).max(100_000).optional(),
});

ordersRouter.patch("/:id/amount", requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = amountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid amount" });

  const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const shippingInr = parsed.data.shippingInr ?? order.shippingInr;
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { totalInr: parsed.data.totalInr, shippingInr },
    include: { items: true },
  });
  res.json(updated);
});

// Hard-delete an order (admin) — for test orders and junk. Items cascade.
ordersRouter.delete("/:id", requireAdmin, async (req: AuthedRequest, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  await prisma.order.delete({ where: { id: order.id } });
  res.status(204).send();
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
