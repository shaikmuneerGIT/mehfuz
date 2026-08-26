import type { Order, OrderItem } from "@prisma/client";
import { formatInr } from "./formatInr";

type OrderWithItems = Order & { items: OrderItem[] };

const SITE = "https://mehfuzdryfruits.in";
const GOLD = "#d4af37";
const BROWN = "#2b1a0f";
const CREAM = "#faf6e8";
const MUTED = "#8a7a66";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Branded email shell: black header with the Mehfuz logo, cream body, footer. */
function shell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 8px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${GOLD}66;border-radius:10px;overflow:hidden;">
  <tr><td align="center" style="background:#0d0d0d;padding:18px 20px;border-bottom:3px solid ${GOLD};">
    <img src="${SITE}/images/email_logo.png" width="180" alt="MEHFUZ — Premium Dry Fruits &amp; Commodities" style="display:block;max-width:180px;height:auto;" />
  </td></tr>
  <tr><td style="padding:26px 28px 8px;font-family:Georgia,'Times New Roman',serif;">
    <h1 style="margin:0;font-size:22px;color:${BROWN};">${title}</h1>
  </td></tr>
  <tr><td style="padding:0 28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3d2f22;line-height:1.6;">
    ${inner}
  </td></tr>
  <tr><td style="background:${CREAM};border-top:1px solid ${GOLD}55;padding:16px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};text-align:center;line-height:1.7;">
    Questions? Call or WhatsApp <a href="https://wa.me/919848918992" style="color:#1fa855;font-weight:bold;text-decoration:none;">+91 98489 18992</a><br/>
    <a href="${SITE}" style="color:${MUTED};">mehfuzdryfruits.in</a> &nbsp;•&nbsp; FSSAI Reg. No. 23626443000038<br/>
    © Mehfuz Premium Dry Fruits &amp; Commodities
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemsTable(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (i) => `<tr>
      <td style="padding:9px 10px;border-bottom:1px solid ${GOLD}33;">${esc(i.nameSnapshot)}</td>
      <td style="padding:9px 10px;border-bottom:1px solid ${GOLD}33;white-space:nowrap;">${esc(i.labelSnapshot)}</td>
      <td align="center" style="padding:9px 10px;border-bottom:1px solid ${GOLD}33;">${i.quantity}</td>
      <td align="right" style="padding:9px 10px;border-bottom:1px solid ${GOLD}33;white-space:nowrap;">${formatInr(i.priceInr * i.quantity)}</td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${GOLD}55;border-radius:8px;border-collapse:separate;overflow:hidden;font-size:13px;margin:14px 0 0;">
    <tr style="background:${CREAM};">
      <th align="left" style="padding:9px 10px;border-bottom:2px solid ${GOLD};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BROWN};">Item</th>
      <th align="left" style="padding:9px 10px;border-bottom:2px solid ${GOLD};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BROWN};">Pack</th>
      <th align="center" style="padding:9px 10px;border-bottom:2px solid ${GOLD};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BROWN};">Qty</th>
      <th align="right" style="padding:9px 10px;border-bottom:2px solid ${GOLD};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BROWN};">Amount</th>
    </tr>
    ${rows}
    <tr>
      <td colspan="3" align="right" style="padding:8px 10px 2px;color:${MUTED};">Subtotal</td>
      <td align="right" style="padding:8px 10px 2px;white-space:nowrap;">${formatInr(order.subtotalInr)}</td>
    </tr>
    <tr>
      <td colspan="3" align="right" style="padding:2px 10px;color:${MUTED};">Shipping</td>
      <td align="right" style="padding:2px 10px;white-space:nowrap;">${order.shippingInr === 0 ? "FREE" : formatInr(order.shippingInr)}</td>
    </tr>
    <tr>
      <td colspan="3" align="right" style="padding:6px 10px 12px;font-weight:bold;color:${BROWN};font-size:15px;">Total</td>
      <td align="right" style="padding:6px 10px 12px;font-weight:bold;color:${BROWN};font-size:15px;white-space:nowrap;">${formatInr(order.totalInr)}</td>
    </tr>
  </table>`;
}

function addressBlock(order: OrderWithItems): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${GOLD}44;border-radius:8px;font-size:13px;margin:14px 0 0;">
    <tr><td style="padding:12px 14px;line-height:1.6;">
      <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Delivery Address</span><br/>
      <b>${esc(order.customerName)}</b> • ${esc(order.phone)}<br/>
      ${order.email ? `${esc(order.email)}<br/>` : ""}
      ${esc(order.addressLine1)}${order.addressLine2 ? ", " + esc(order.addressLine2) : ""}<br/>
      ${esc(order.city)}, ${esc(order.state)} ${esc(order.pincode)}
      ${order.notes ? `<br/><i style="color:${MUTED};">Notes: ${esc(order.notes)}</i>` : ""}
    </td></tr>
  </table>`;
}

function goldButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px auto 4px;"><tr>
    <td align="center" style="background:${GOLD};border-radius:999px;">
      <a href="${href}" style="display:inline-block;padding:12px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1a1206;text-decoration:none;">${label}</a>
    </td>
  </tr></table>`;
}

export function customerEmailHtml(order: OrderWithItems): string {
  const isUnpaidUpi = order.paymentMethod === "UPI" && order.paymentStatus !== "PAID";
  const payUrl = `${SITE}/order-confirmed/${order.orderNumber}`;
  const shortUrl = `${SITE}/o/${order.orderNumber}`;
  const upiId = process.env.UPI_ID;
  const upiIdMasked = upiId
    ? upiId.replace(/^(.*)(.{3})@/, (_m, head, tail) => "X".repeat(head.length) + tail + "@")
    : null;

  const paymentSection = isUnpaidUpi
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${GOLD};border-radius:8px;margin:16px 0 0;background:#fffdf5;">
        <tr><td style="padding:14px 16px;font-size:13px;line-height:1.7;">
          <b style="color:${BROWN};">Complete your payment of ${formatInr(order.totalInr)}</b><br/>
          Open the button below to see your UPI QR code — scan it with GPay, PhonePe, or Paytm${
            upiId ? `, or pay directly to our UPI ID <b>${esc(upiIdMasked ?? "")}</b> (shown in full on your order page)` : ""
          }. Please keep <b>${order.orderNumber}</b> in the payment note, then enter the transaction ID (UTR) on the same page.
          ${goldButton(payUrl, `Complete Payment — ${formatInr(order.totalInr)}`)}
        </td></tr>
      </table>`
    : order.paymentMethod === "UPI"
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1fa85566;border-radius:8px;margin:16px 0 0;background:#f2fbf5;">
           <tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#14663a;">
             <b>Payment received ✅</b> — we've confirmed ${formatInr(order.totalInr)} against your order. It's now being packed, and we'll share dispatch details on WhatsApp.
           </td></tr>
         </table>`
      : `<p style="margin:14px 0 0;">Payment: <b>Cash on Delivery</b> — please keep the amount ready when your order arrives.</p>`;

  return shell(
    isUnpaidUpi ? "Complete Your Payment" : "Order Confirmed!",
    `<p style="margin:0 0 4px;">Dear <b>${esc(order.customerName)}</b>,</p>
     <p style="margin:0;">Thank you for shopping with Mehfuz! Your order <b style="color:${BROWN};">${order.orderNumber}</b> has been placed.</p>
     ${itemsTable(order)}
     ${paymentSection}
     ${addressBlock(order)}
     <p style="margin:18px 0 0;font-size:14px;color:${BROWN};"><b>Thanks for choosing Mehfuz!</b> View your order anytime: <a href="${shortUrl}" style="color:${GOLD};font-weight:bold;">${shortUrl.replace("https://", "")}</a></p>`
  );
}

export function paymentRefOwnerHtml(order: OrderWithItems, utr: string): string {
  return shell(
    "Payment Reference Received",
    `<p style="margin:0;">The customer for order <b>${order.orderNumber}</b> says they've paid and submitted a transaction reference:</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:2px solid ${GOLD};border-radius:8px;font-size:14px;margin:14px 0 0;">
       <tr><td style="padding:14px 16px;line-height:1.8;">
         <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Transaction ID (last digits)</span><br/>
         <b style="font-size:17px;color:${BROWN};letter-spacing:1px;">${esc(utr)}</b><br/>
         Amount expected: <b>${formatInr(order.totalInr)}</b> • Customer: ${esc(order.customerName)} (${esc(order.phone)})
       </td></tr>
     </table>
     <p style="margin:14px 0 0;">Check PhonePe for this amount, then mark the order paid so it gets packed.</p>
     ${goldButton(`${SITE}/admin/orders`, "Verify & Mark Paid")}`
  );
}

export function paymentRefCustomerHtml(order: OrderWithItems, utr: string): string {
  return shell(
    "Payment Reference Received",
    `<p style="margin:0 0 4px;">Dear <b>${esc(order.customerName)}</b>,</p>
     <p style="margin:0;">We've received your transaction reference ending <b style="letter-spacing:1px;">${esc(utr)}</b> for order <b>${order.orderNumber}</b> (${formatInr(order.totalInr)}).</p>
     <p style="margin:12px 0 0;">Our team is verifying the payment now — your order will be packed as soon as it's confirmed. You'll hear from us on WhatsApp or by call if anything else is needed.</p>
     <p style="margin:14px 0 0;font-size:12px;color:${MUTED};">Track your order: <a href="${SITE}/order-confirmed/${order.orderNumber}" style="color:${GOLD};font-weight:bold;">${SITE}/order-confirmed/${order.orderNumber}</a></p>`
  );
}

export function ownerEmailHtml(order: OrderWithItems): string {
  return shell(
    "New Order Received",
    `<p style="margin:0;">A new order just came in on mehfuzdryfruits.in:</p>
     <p style="margin:8px 0 0;font-size:15px;"><b>${order.orderNumber}</b> — ${formatInr(order.totalInr)} •
       ${order.paymentMethod === "UPI" ? `UPI (${order.paymentStatus === "PAID" ? "paid" : "awaiting payment"})` : "Cash on Delivery"}</p>
     ${itemsTable(order)}
     ${addressBlock(order)}
     ${order.email ? `<p style="margin:12px 0 0;font-size:13px;">Customer email: <a href="mailto:${esc(order.email)}">${esc(order.email)}</a></p>` : ""}
     ${goldButton(`${SITE}/admin/orders`, "Open Admin Panel")}`
  );
}
