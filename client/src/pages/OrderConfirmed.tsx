import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api/client";
import type { Order } from "../types";
import { formatInr } from "../lib/format";
import { useCart } from "../context/CartContext";
import { PageBanner } from "../components/PageBanner";
import { FiCheckCircle } from "react-icons/fi";

interface UpiConfig {
  enabled: boolean;
  upiId: string | null;
  payeeName: string;
}

function UpiPaymentBox({ order }: { order: Order }) {
  const [config, setConfig] = useState<UpiConfig | null>(null);
  const [utr, setUtr] = useState("");
  const [submitted, setSubmitted] = useState(Boolean(order.paymentRef));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<UpiConfig>("/config/upi").then((res) => setConfig(res.data)).catch(() => {});
  }, []);

  if (!config?.enabled || !config.upiId) return null;

  const upiLink =
    `upi://pay?pa=${encodeURIComponent(config.upiId)}` +
    `&pn=${encodeURIComponent(config.payeeName)}` +
    `&am=${order.totalInr}&cu=INR` +
    `&tn=${encodeURIComponent(order.orderNumber)}`;

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(config!.upiId!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function submitUtr(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post(`/orders/${order.orderNumber}/payment-ref`, { utr });
      setSubmitted(true);
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not save the reference. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border-2 border-gold-500 bg-cream-50/90 p-6 text-left shadow-sm font-roboto">
      <h3 className="font-serif mb-1 text-lg font-bold text-brown-950">
        Complete Your Payment — {formatInr(order.totalInr)}
      </h3>
      <p className="mb-4 text-sm text-brown-700 font-roboto">
        Scan the QR code with any UPI app (GPay, PhonePe, Paytm…), or pay directly to our
        UPI ID. Please keep the order number{" "}
        <span className="font-semibold">{order.orderNumber}</span> in the payment note.
      </p>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="rounded-lg border border-gold-500/40 bg-white p-3">
          <QRCodeSVG value={upiLink} size={168} />
        </div>
        <div className="flex-1 space-y-3 text-sm font-roboto">
          <div>
            <div className="text-xs uppercase tracking-wide text-brown-500">UPI ID</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brown-950">{config.upiId}</span>
              <button
                onClick={copyUpiId}
                className="rounded-full border border-gold-500/40 px-3 py-0.5 text-xs font-semibold text-brown-800 hover:bg-cream-100"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <a
            href={upiLink}
            className="metallic-gold-btn inline-block rounded-full px-5 py-2 text-xs font-bold sm:hidden"
          >
            Open UPI App to Pay
          </a>

          {submitted ? (
            <p className="rounded-lg border border-green-600/30 bg-green-50 p-3 text-green-800">
              Thanks! We've received your payment reference. Your order will be packed as
              soon as the payment is confirmed.
            </p>
          ) : (
            <form onSubmit={submitUtr} className="space-y-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brown-800">
                  After paying, enter the <b>last 6 digits</b> of the transaction ID (UTR)
                  shown in your UPI app
                </span>
                <input
                  required
                  minLength={4}
                  maxLength={12}
                  inputMode="numeric"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="input"
                  placeholder="e.g. 731205"
                />
              </label>
              {error && <p className="text-xs text-maroon-700">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="metallic-gold-btn rounded-full px-5 py-2 text-xs font-bold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Submit Payment Reference"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderConfirmed() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const { clearCart } = useCart();

  const awaitingPayment =
    !!order && order.paymentMethod === "UPI" && order.paymentStatus !== "PAID";

  useEffect(() => {
    if (!orderNumber) return;
    api.get<Order>(`/orders/${orderNumber}`).then((res) => setOrder(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="parchment min-h-screen font-roboto">
      <PageBanner
        image="/images/hero_banner_4.webp?v=3"
        title="Order Confirmed!"
        subtitle={`Thank you for your order. Order #${orderNumber}`}
        breadcrumbs={[{ label: "Order Confirmed" }]}
      />

      <div
        className={`mx-auto px-4 py-12 text-center sm:px-6 font-roboto ${
          awaitingPayment ? "max-w-5xl" : "max-w-2xl"
        }`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/20 text-forest-700 shadow-md">
          <FiCheckCircle className="h-10 w-10 text-forest-700" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-brown-950">Thank You for Your Order!</h2>
        <p className="mt-2 text-sm text-brown-700 font-roboto">
          Your order number is <strong className="font-roboto text-gold-700">#{orderNumber}</strong>
        </p>

        {/* While payment is pending the QR sits beside the summary on desktop
            so the customer can check what they're paying for as they pay. */}
        <div className={awaitingPayment ? "grid gap-6 lg:grid-cols-2 lg:items-start" : ""}>
        {order && awaitingPayment && <UpiPaymentBox order={order} />}

        {order && (
          <div className="mt-8 rounded-xl border border-gold-500/30 bg-cream-50/90 p-6 text-left shadow-sm font-roboto lg:mt-8">
            <h3 className="font-serif mb-3 text-lg font-bold text-brown-950">Order Summary</h3>
            <div className="space-y-2 text-sm font-roboto">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-brown-700 font-roboto">
                  <span className="font-roboto">
                    {item.nameSnapshot} ({item.labelSnapshot}) × {item.quantity}
                  </span>
                  <span className="font-roboto font-semibold text-brown-950">
                    {formatInr(item.priceInr * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gold-500/20 pt-2 text-xs text-brown-600 font-roboto">
                <span>Shipping</span>
                <span className="font-roboto">{order.shippingInr === 0 ? "FREE" : formatInr(order.shippingInr)}</span>
              </div>
              <div className="flex justify-between border-t border-gold-500/30 pt-2 font-bold text-brown-950 font-roboto text-base">
                <span className="font-roboto">Total</span>
                <span className="font-roboto font-bold text-brown-950">{formatInr(order.totalInr)}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-gold-500/20 pt-4 text-xs text-brown-600 font-roboto">
              <p className="font-semibold text-brown-900 font-roboto">Shipping Address:</p>
              <p className="font-roboto">{order.customerName}</p>
              <p className="font-roboto">{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}</p>
              <p className="font-roboto">{order.city}, {order.state} - {order.pincode}</p>
              <p className="mt-1 font-roboto">Phone: {order.phone}</p>
              <p className="mt-2 font-roboto">
                Payment:{" "}
                {order.paymentMethod === "UPI"
                  ? order.paymentStatus === "PAID"
                    ? "Paid by UPI"
                    : "UPI (awaiting confirmation)"
                  : "Cash on Delivery"}
              </p>
            </div>
          </div>
        )}
        </div>

        {order && (
          <a
            href={`https://wa.me/919848918992?text=${encodeURIComponent(
              `Hello Mehfuz! I just placed order ${order.orderNumber} (${formatInr(order.totalInr)}, ${
                order.paymentMethod === "UPI" ? "paid by UPI" : "Cash on Delivery"
              }). Name: ${order.customerName}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1fb857] font-roboto"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Send Order on WhatsApp
          </a>
        )}

        <div className="mt-8 flex justify-center gap-4 font-roboto">
          <Link
            to="/shop"
            className="metallic-gold-btn rounded-full px-8 py-3 text-sm font-bold shadow-md font-roboto"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
