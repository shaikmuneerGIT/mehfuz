import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatInr } from "../lib/format";
import { api } from "../api/client";
import { PageBanner } from "../components/PageBanner";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 79;

interface UpiConfig {
  enabled: boolean;
  upiId: string | null;
  payeeName: string;
}

interface FormState {
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

const initialForm: FormState = {
  customerName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  notes: "",
};

export function Checkout() {
  const { lines, subtotalInr } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upiConfig, setUpiConfig] = useState<UpiConfig | null>(null);

  useEffect(() => {
    api.get<UpiConfig>("/config/upi").then((res) => setUpiConfig(res.data)).catch(() => {});
  }, []);

  // UPI (QR + transaction reference) is the payment method; COD only
  // remains as a fallback while UPI is not yet configured on the server.
  const paymentMethod: "COD" | "UPI" = upiConfig?.enabled ? "UPI" : "COD";

  if (lines.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const shippingInr = subtotalInr >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalInr = subtotalInr + shippingInr;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/orders", {
        ...form,
        paymentMethod,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      });
      navigate(`/order-confirmed/${res.data.orderNumber}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Something went wrong placing your order. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="parchment min-h-screen font-roboto">
      <PageBanner
        image="/images/hero_banner_4.jpg"
        title="Checkout"
        subtitle="Complete your shipping details to place your harvest order."
        breadcrumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 font-roboto">

        <div className="grid gap-8 md:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-4 md:col-span-2">
            <div className="rounded-xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm">
              <h2 className="font-serif mb-4 text-lg font-bold text-brown-950">
                Delivery Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Phone Number" required>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Email (optional)" className="sm:col-span-2">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Address Line 1" required className="sm:col-span-2">
                  <input
                    required
                    value={form.addressLine1}
                    onChange={(e) => updateField("addressLine1", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Address Line 2 (optional)" className="sm:col-span-2">
                  <input
                    value={form.addressLine2}
                    onChange={(e) => updateField("addressLine2", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="City" required>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="State" required>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Pincode" required>
                  <input
                    required
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Order Notes (optional)" className="sm:col-span-2">
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="input min-h-20"
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm">
              <h2 className="font-serif mb-3 text-lg font-bold text-brown-950">Payment</h2>
              {paymentMethod === "UPI" ? (
                <div className="flex items-start gap-3 rounded-lg border border-gold-500 bg-cream-100/60 p-3">
                  <span className="text-sm font-roboto">
                    <span className="block font-semibold text-brown-950">Pay by UPI (QR code)</span>
                    <span className="text-brown-700">
                      After placing the order you'll see a QR code — scan it with any UPI app
                      (GPay, PhonePe, Paytm), pay, and enter the transaction reference. We pack
                      your order once the payment is confirmed.
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-gold-500/30 p-3">
                  <span className="text-sm font-roboto">
                    <span className="block font-semibold text-brown-950">Cash on Delivery</span>
                    <span className="text-brown-700">
                      Pay when your order arrives. Our team may call to confirm.
                    </span>
                  </span>
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-maroon-700/40 bg-maroon-700/5 p-3 text-sm text-maroon-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="metallic-gold-btn w-full rounded-full py-3.5 text-sm font-bold shadow-md disabled:opacity-60 sm:w-auto sm:px-8"
            >
              {submitting ? "Placing order..." : `Place Order — ${formatInr(totalInr)}`}
            </button>
          </form>

          <div className="h-fit space-y-4 rounded-xl border border-gold-500/40 bg-cream-100/80 p-6 shadow-md">
            <h2 className="font-serif text-lg font-bold text-brown-950">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {lines.map((l) => (
                <div key={l.variantId} className="flex justify-between text-brown-700">
                  <span>
                    {l.productName} ({l.variantLabel}) × {l.quantity}
                  </span>
                  <span className="font-medium text-brown-900">{formatInr(l.priceInr * l.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gold-500/30 pt-3 text-sm">
              <div className="flex justify-between text-brown-700">
                <span>Subtotal</span>
                <span>{formatInr(subtotalInr)}</span>
              </div>
              <div className="flex justify-between text-brown-700">
                <span>Shipping</span>
                <span>{shippingInr === 0 ? "Free" : formatInr(shippingInr)}</span>
              </div>
              <div className="mt-2 flex justify-between font-serif text-base font-bold text-brown-950">
                <span>Total</span>
                <span>{formatInr(totalInr)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  className = "",
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-brown-800">
        {label} {required && <span className="text-maroon-700">*</span>}
      </span>
      {children}
    </label>
  );
}
