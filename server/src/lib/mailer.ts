import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";
import { formatInr } from "./formatInr";
import { generateInvoicePdf } from "./invoice";
import {
  customerEmailHtml,
  ownerEmailHtml,
  paymentRefOwnerHtml,
  paymentRefCustomerHtml,
} from "./emailTemplate";

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
    `Payment: ${
      order.paymentMethod === "COD"
        ? "Cash on Delivery"
        : order.paymentMethod === "PAYU"
          ? "Paid online (PayU)"
          : "UPI (prepaid)"
    }`,
    ``,
    `Delivery address:`,
    `  ${order.customerName}, ${order.phone}`,
    `  ${order.addressLine1}${order.addressLine2 ? ", " + order.addressLine2 : ""}`,
    `  ${order.city}, ${order.state} ${order.pincode}`,
    order.notes ? `\nNotes: ${order.notes}` : ``,
  ].join("\n");
}

/**
 * Order confirmation for both parties. Nothing is sent while a UPI order is
 * still awaiting payment — those emails go out from
 * {@link sendPaymentConfirmedNotifications} once the payment is confirmed.
 * Fire-and-forget: an SMTP hiccup must never fail a committed checkout.
 */
export async function sendOrderNotifications(order: OrderWithItems): Promise<void> {
  if (!transport) return;

  // An unpaid prepaid order (UPI QR or PayU) is not a confirmed order — stay
  // silent until the money is confirmed.
  const prepaid = order.paymentMethod === "UPI" || order.paymentMethod === "PAYU";
  if (prepaid && order.paymentStatus !== "PAID") return;

  const from = `"Mehfuz Dry Fruits" <${SMTP_USER}>`;
  const body = orderLines(order);

  // The invoice rides along with both confirmations; if rendering ever
  // fails the emails still go out, just without the attachment.
  let attachments: { filename: string; content: Buffer }[] = [];
  try {
    const pdf = await generateInvoicePdf(order);
    attachments = [{ filename: `Invoice-${order.orderNumber}.pdf`, content: pdf }];
  } catch (err) {
    console.error("Invoice render failed:", err instanceof Error ? err.message : err);
  }

  if (order.email) {
    transport
      .sendMail({
        from,
        to: order.email,
        subject: `Order confirmed — ${order.orderNumber} | Mehfuz Dry Fruits`,
        text:
          `Dear ${order.customerName},\n\n` +
          `Thank you for shopping with Mehfuz! Your order is confirmed.\n\n` +
          `${body}\n\n` +
          (order.paymentMethod !== "COD"
            ? `Payment received — your order is being packed.\n\n`
            : `Please keep the amount ready — you pay when the order arrives.\n\n`) +
          `Questions? Call or WhatsApp +91 98489 18992.\n\nMehfuz — Premium Dry Fruits & Commodities\nhttps://mehfuzdryfruits.in`,
        html: customerEmailHtml(order),
        attachments,
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
        html: ownerEmailHtml(order),
        attachments,
      })
      .catch((err) => console.error("Owner alert email failed:", err.message));
  }
}

/**
 * Sent when the admin confirms a UPI payment: the customer gets the order
 * confirmation they haven't received yet, and the shop gets its record of
 * the now-payable order to pack.
 */
export function sendPaymentConfirmedNotifications(order: OrderWithItems): void {
  void sendOrderNotifications({ ...order, paymentStatus: "PAID" });
}

/**
 * Fired when a customer submits their UPI transaction reference: alerts the
 * shop (actionable — verify and mark paid) and acknowledges the customer.
 * Fire-and-forget like all order mail.
 */
export function sendPaymentRefNotifications(order: OrderWithItems, utr: string): void {
  if (!transport) return;
  const from = `"Mehfuz Dry Fruits" <${SMTP_USER}>`;

  if (NOTIFY_EMAIL) {
    transport
      .sendMail({
        from,
        to: NOTIFY_EMAIL,
        subject: `Payment reference for ${order.orderNumber} — UTR ending ${utr} (${formatInr(order.totalInr)})`,
        text:
          `The customer for order ${order.orderNumber} submitted the last digits of their UPI transaction ID.\n\n` +
          `UTR: ${utr}\nAmount expected: ${formatInr(order.totalInr)}\n` +
          `Customer: ${order.customerName} (${order.phone})\n\n` +
          `Check PhonePe for this amount, then mark the order paid: https://mehfuzdryfruits.in/admin/orders`,
        html: paymentRefOwnerHtml(order, utr),
      })
      .catch((err) => console.error("Payment-ref owner email failed:", err.message));
  }

  if (order.email) {
    transport
      .sendMail({
        from,
        to: order.email,
        subject: `Payment reference received — ${order.orderNumber} | Mehfuz Dry Fruits`,
        text:
          `Dear ${order.customerName},\n\n` +
          `We've received your payment reference ${utr} for order ${order.orderNumber} (${formatInr(order.totalInr)}).\n` +
          `Our team is verifying the payment now — your order will be packed as soon as it's confirmed.\n\n` +
          `Track your order: https://mehfuzdryfruits.in/order-confirmed/${order.orderNumber}\n\n` +
          `Mehfuz — Premium Dry Fruits & Commodities`,
        html: paymentRefCustomerHtml(order, utr),
      })
      .catch((err) => console.error("Payment-ref customer email failed:", err.message));
  }
}
