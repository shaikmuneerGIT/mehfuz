import { Router, urlencoded } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { sendPaymentConfirmedNotifications } from "../lib/mailer";
import {
  payuConfig,
  payuPaymentUrl,
  payuAmount,
  buildRequestParams,
  isResponseHashValid,
  verifyPaymentWithPayu,
} from "../lib/payu";

export const payuRouter = Router();

const SITE = process.env.SITE_URL ?? "https://mehfuzdryfruits.in";

const initiateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment attempts. Please try again later." },
});

/**
 * Hands the browser the exact form fields to POST to PayU's hosted checkout
 * (UPI QR, cards, net banking). Amount and order come from the database, never
 * from the client, so the payable total can't be tampered with.
 */
payuRouter.post("/initiate", initiateLimiter, async (req, res) => {
  const config = payuConfig();
  if (!config) return res.status(503).json({ error: "Online payment is not configured" });

  const parsed = z.object({ orderNumber: z.string().min(6).max(40) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentStatus === "PAID") {
    return res.status(400).json({ error: "This order is already paid" });
  }
  if (order.status === "CANCELLED") {
    return res.status(400).json({ error: "This order was cancelled" });
  }

  const params = buildRequestParams(config, {
    txnid: order.orderNumber,
    amount: payuAmount(order.totalInr),
    productinfo: `Mehfuz order ${order.orderNumber}`,
    firstname: order.customerName.slice(0, 60),
    // PayU requires an email; fall back to the shop's own address when the
    // customer didn't leave one.
    email: order.email || "orders@mehfuzdryfruits.in",
    phone: order.phone.replace(/\D/g, "").slice(-10),
    surl: `${SITE}/api/payu/callback`,
    furl: `${SITE}/api/payu/callback`,
  });

  res.json({ action: payuPaymentUrl(config), params });
});

/**
 * PayU posts the result here (both success and failure URLs). We verify the
 * response hash, then confirm the payment server-to-server with PayU before
 * marking anything paid, and finally redirect the customer to their order page.
 */
payuRouter.post("/callback", urlencoded({ extended: false }), async (req, res) => {
  const config = payuConfig();
  const body = req.body as Record<string, string | undefined>;
  const txnid = body.txnid ?? "";
  const orderUrl = `${SITE}/order-confirmed/${encodeURIComponent(txnid)}`;

  if (!config || !txnid) return res.redirect(303, `${SITE}/shop`);

  try {
    // 1. The posted response must carry a hash we can reproduce.
    if (!isResponseHashValid(config, body)) {
      console.error("PayU callback hash mismatch for", txnid);
      return res.redirect(303, `${orderUrl}?payment=failed`);
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: txnid },
      include: { items: true },
    });
    if (!order) return res.redirect(303, `${SITE}/shop`);
    if (order.paymentStatus === "PAID") return res.redirect(303, `${orderUrl}?payment=success`);

    if ((body.status ?? "").toLowerCase() !== "success") {
      return res.redirect(303, `${orderUrl}?payment=failed`);
    }

    // 2. Ask PayU directly — the browser-posted body alone is not trusted.
    const verification = await verifyPaymentWithPayu(config, txnid);
    if (!verification.ok) {
      console.error("PayU verify_payment did not confirm", txnid, verification.status);
      return res.redirect(303, `${orderUrl}?payment=pending`);
    }

    // 3. The amount PayU captured must match what the order actually costs.
    if (Number(verification.amount) !== order.totalInr) {
      console.error(
        `PayU amount mismatch for ${txnid}: captured ${verification.amount}, expected ${order.totalInr}`
      );
      return res.redirect(303, `${orderUrl}?payment=pending`);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paymentRef: verification.payuId ?? body.mihpayid ?? null,
      },
      include: { items: true },
    });
    sendPaymentConfirmedNotifications(updated);

    return res.redirect(303, `${orderUrl}?payment=success`);
  } catch (err) {
    console.error("PayU callback failed:", err instanceof Error ? err.message : err);
    return res.redirect(303, `${orderUrl}?payment=pending`);
  }
});
