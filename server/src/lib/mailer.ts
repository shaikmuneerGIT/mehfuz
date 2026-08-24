import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";
import { formatInr } from "./formatInr";

// Email is optional infrastructure: with SMTP env vars unset the app runs
// exactly as before and order notifications are silently skipped.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL;

const transport =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: (process.env.SMTP_PORT ?? "465") === "465",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

type OrderWithItems = Order & { items: OrderItem[] };

function orderLines(order: OrderWithItems): string {
  const items = order.items
    .map((i) => `  • ${i.nameSnapshot} (${i.labelSnapshot}) × ${i.quantity} — ${formatInr(i.priceInr * i.quantity)}`)
    .join("\n");
  return [
    `Order: ${order.orderNumber}`,
    ``,
    items,
    ``,
    `Subtotal: ${formatInr(order.subtotalInr)}`,
    `Shipping: ${order.shippingInr === 0 ? "Free" : formatInr(order.shippingInr)}`,
    `Total: ${formatInr(order.totalInr)}`,
    ``,
    `Payment: ${order.paymentMethod === "UPI" ? "UPI (prepaid)" : "Cash on Delivery"}`,
    ``,
    `Delivery address:`,
    `  ${order.customerName}, ${order.phone}`,
    `  ${order.addressLine1}${order.addressLine2 ? ", " + order.addressLine2 : ""}`,
    `  ${order.city}, ${order.state} ${order.pincode}`,
    order.notes ? `\nNotes: ${order.notes}` : ``,
  ].join("\n");
}

/**
 * Sends the customer confirmation (when they left an email) and the shop
 * alert. Deliberately fire-and-forget: an SMTP hiccup must never fail a
 * checkout that has already been committed to the database.
 */
export function sendOrderNotifications(order: OrderWithItems): void {
  if (!transport) return;
  const from = `"Mehfuz Dry Fruits" <${SMTP_USER}>`;
  const body = orderLines(order);

  if (order.email) {
    const isUnpaidUpi = order.paymentMethod === "UPI" && order.paymentStatus !== "PAID";
    const upiId = process.env.UPI_ID;
    const payUrl = `https://mehfuzdryfruits.in/order-confirmed/${order.orderNumber}`;
    transport
      .sendMail({
        from,
        to: order.email,
        subject: isUnpaidUpi
          ? `Complete your payment — order ${order.orderNumber} | Mehfuz Dry Fruits`
          : `Order confirmed — ${order.orderNumber} | Mehfuz Dry Fruits`,
        text:
          `Dear ${order.customerName},\n\n` +
          `Thank you for shopping with Mehfuz! Your order has been placed.\n\n` +
          `${body}\n\n` +
          (isUnpaidUpi
            ? `TO COMPLETE YOUR PAYMENT (${formatInr(order.totalInr)}):\n` +
              `  1. Open this link to see the QR code: ${payUrl}\n` +
              `  2. Scan it with any UPI app (GPay, PhonePe, Paytm)` +
              (upiId ? `, or pay directly to UPI ID: ${upiId}\n` : `\n`) +
              `  3. Put your order number ${order.orderNumber} in the payment note\n` +
              `  4. Enter the transaction reference (UTR) on the same page\n\n` +
              `We pack your order as soon as the payment is confirmed.\n\n`
            : order.paymentMethod === "UPI"
              ? `We will pack your order as soon as your UPI payment is confirmed.\n\n`
              : `Please keep the amount ready — you pay when the order arrives.\n\n`) +
          `Questions? Call or WhatsApp +91 98489 18992.\n\nMehfuz — Premium Dry Fruits & Commodities\nhttps://mehfuzdryfruits.in`,
      })
      .catch((err) => console.error("Customer email failed:", err.message));
  }

  if (NOTIFY_EMAIL) {
    transport
      .sendMail({
        from,
        to: NOTIFY_EMAIL,
        subject: `New order ${order.orderNumber} — ${formatInr(order.totalInr)} (${order.paymentMethod})`,
        text: `A new order just came in on mehfuzdryfruits.in:\n\n${body}\n\nOpen the admin panel: https://mehfuzdryfruits.in/admin`,
      })
      .catch((err) => console.error("Owner alert email failed:", err.message));
  }
}
