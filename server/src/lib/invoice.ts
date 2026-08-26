import path from "node:path";
import fs from "node:fs";
import type { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

const GOLD = "#b8912f";
const BROWN = "#2b1a0f";
const MUTED = "#8a7a66";
const LINE = "#e0d5bd";

// ₹ needs a font that has the glyph; PDFKit's built-in Helvetica does not.
const RS = "Rs.";

function money(n: number): string {
  return `${RS} ${n.toLocaleString("en-IN")}`;
}

function logoPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "client-dist", "images", "email_logo.png"),
    path.resolve(process.cwd(), "..", "client", "dist", "images", "email_logo.png"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/** Renders a one-page A4 invoice for the order and resolves to a PDF buffer. */
export async function generateInvoicePdf(order: OrderWithItems): Promise<Buffer> {
  // Loaded lazily so a missing/partial pdfkit install can only ever skip the
  // attachment (caught by the caller) — never crash the app at boot.
  const { default: PDFDocument } = await import("pdfkit");
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 46 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const width = right - left;

      // ---- Header band ----
      doc.rect(0, 0, doc.page.width, 96).fill("#0d0d0d");
      const logo = logoPath();
      if (logo) {
        try {
          doc.image(logo, left, 26, { height: 44 });
        } catch {
          /* fall through to the wordmark below */
        }
      }
      if (!logo) {
        doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(24).text("MEHFUZ", left, 34);
      }
      doc
        .fillColor("#f5e6b8")
        .font("Helvetica")
        .fontSize(9)
        .text("Premium Dry Fruits & Commodities", right - 200, 38, { width: 200, align: "right" })
        .fontSize(8)
        .fillColor("#c9b992")
        .text("mehfuzdryfruits.in  |  +91 98489 18992", right - 200, 54, {
          width: 200,
          align: "right",
        })
        .text("FSSAI Reg. No. 23626443000038", right - 200, 66, { width: 200, align: "right" });

      doc.rect(0, 96, doc.page.width, 3).fill(GOLD);

      // ---- Title + meta ----
      let y = 126;
      doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(20).text("INVOICE", left, y);
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(MUTED)
        .text("Invoice No.", right - 210, y + 2, { width: 100, align: "right" })
        .fillColor(BROWN)
        .font("Helvetica-Bold")
        .text(order.orderNumber, right - 105, y + 2, { width: 105, align: "right" })
        .font("Helvetica")
        .fillColor(MUTED)
        .text("Date", right - 210, y + 17, { width: 100, align: "right" })
        .fillColor(BROWN)
        .text(
          new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          right - 105,
          y + 17,
          { width: 105, align: "right" }
        );

      // ---- Bill to ----
      y += 46;
      doc
        .fillColor(MUTED)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("BILL TO / DELIVER TO", left, y);
      y += 14;
      doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(11).text(order.customerName, left, y);
      y += 15;
      const address = [
        order.addressLine1 + (order.addressLine2 ? `, ${order.addressLine2}` : ""),
        `${order.city}, ${order.state} - ${order.pincode}`,
        `Phone: ${order.phone}`,
        order.email ? `Email: ${order.email}` : "",
      ].filter(Boolean);
      doc.font("Helvetica").fontSize(9.5).fillColor("#4a3a2a");
      for (const line of address) {
        doc.text(line, left, y, { width: width * 0.6 });
        y += 13;
      }

      // ---- Items table ----
      y += 14;
      const cols = {
        item: left,
        pack: left + width * 0.46,
        qty: left + width * 0.62,
        rate: left + width * 0.72,
        amount: right - 80,
      };
      doc.rect(left, y - 4, width, 22).fill("#faf6e8");
      doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(8.5);
      doc.text("ITEM", cols.item + 6, y + 3);
      doc.text("PACK", cols.pack, y + 3);
      doc.text("QTY", cols.qty, y + 3, { width: 40, align: "center" });
      doc.text("RATE", cols.rate, y + 3, { width: 60, align: "right" });
      doc.text("AMOUNT", cols.amount, y + 3, { width: 80, align: "right" });
      y += 24;
      doc.moveTo(left, y).lineTo(right, y).strokeColor(GOLD).lineWidth(1).stroke();
      y += 8;

      doc.font("Helvetica").fontSize(9.5).fillColor("#33261a");
      for (const item of order.items) {
        const amount = item.priceInr * item.quantity;
        doc.text(item.nameSnapshot, cols.item + 6, y, { width: width * 0.42 });
        doc.text(item.labelSnapshot, cols.pack, y, { width: width * 0.14 });
        doc.text(String(item.quantity), cols.qty, y, { width: 40, align: "center" });
        doc.text(money(item.priceInr), cols.rate, y, { width: 60, align: "right" });
        doc.text(money(amount), cols.amount, y, { width: 80, align: "right" });
        y += 20;
        doc.moveTo(left, y - 5).lineTo(right, y - 5).strokeColor(LINE).lineWidth(0.5).stroke();
      }

      // ---- Totals ----
      y += 6;
      const labelX = right - 220;
      const valueX = right - 80;
      doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
      doc.text("Subtotal", labelX, y, { width: 130, align: "right" });
      doc.fillColor("#33261a").text(money(order.subtotalInr), valueX, y, { width: 80, align: "right" });
      y += 16;
      doc.fillColor(MUTED).text("Shipping", labelX, y, { width: 130, align: "right" });
      doc
        .fillColor("#33261a")
        .text(order.shippingInr === 0 ? "FREE" : money(order.shippingInr), valueX, y, {
          width: 80,
          align: "right",
        });
      y += 20;
      doc.rect(labelX - 10, y - 5, right - labelX + 10, 26).fill("#faf6e8");
      doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(12);
      doc.text("TOTAL", labelX, y + 2, { width: 130, align: "right" });
      doc.text(money(order.totalInr), valueX, y + 2, { width: 80, align: "right" });

      // ---- Payment ----
      y += 44;
      const paid = order.paymentStatus === "PAID";
      doc
        .fillColor(MUTED)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("PAYMENT", left, y);
      y += 13;
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(paid ? "#14663a" : "#8a5a00")
        .text(
          order.paymentMethod === "UPI"
            ? paid
              ? `Paid by UPI${order.paymentRef ? ` (ref. ${order.paymentRef})` : ""} - payment received, thank you.`
              : "UPI - awaiting payment confirmation."
            : "Cash on Delivery.",
          left,
          y,
          { width }
        );

      // ---- Footer ----
      const footY = doc.page.height - doc.page.margins.bottom - 42;
      doc.moveTo(left, footY).lineTo(right, footY).strokeColor(LINE).lineWidth(0.5).stroke();
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          "Thank you for shopping with Mehfuz. Prices are inclusive of applicable taxes. " +
            "For any query about this invoice, call or WhatsApp +91 98489 18992.",
          left,
          footY + 10,
          { width, align: "center" }
        )
        .text(
          "Mehfuz Premium Dry Fruits & Commodities, Hyderabad, Telangana, India.",
          left,
          footY + 24,
          { width, align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
