import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Order } from "../../types";
import { formatInr } from "../../lib/format";

const STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PACKED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<Order[]>("/orders")
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function updateStatus(orderId: string, status: string) {
    await api.patch(`/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  async function markPaid(orderId: string) {
    if (!confirm("Confirm you checked your bank/UPI app and this payment arrived?")) return;
    await api.patch(`/orders/${orderId}/payment`, { paymentStatus: "PAID" });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "PAID" } : o))
    );
  }

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold text-brown-950">Orders</h1>

      {loading ? (
        <p className="text-brown-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-brown-500">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-gold-500/30 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setExpanded((prev) => (prev === o.id ? null : o.id))}
                  className="text-left"
                >
                  <div className="font-display font-semibold text-brown-950">
                    {o.orderNumber}{" "}
                    <span className="text-xs font-normal text-brown-500">
                      • {new Date(o.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-sm text-brown-700">
                    {o.customerName} • {o.phone} • {o.city}, {o.state}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-brown-950">{formatInr(o.totalInr)}</span>
                  {o.paymentMethod === "UPI" ? (
                    o.paymentStatus === "PAID" ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        UPI PAID
                      </span>
                    ) : (
                      <button
                        onClick={() => markPaid(o.id)}
                        title="Verify the payment arrived, then click to mark paid"
                        className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 hover:bg-green-100 hover:text-green-800"
                      >
                        UPI UNPAID — mark paid
                      </button>
                    )
                  ) : (
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-semibold text-brown-700">
                      COD
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status] ?? ""}`}
                  >
                    {o.status}
                  </span>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded-lg border border-gold-500/40 px-2 py-1 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {expanded === o.id && (
                <div className="mt-3 border-t border-gold-500/20 pt-3 text-sm text-brown-700">
                  <p className="mb-2">
                    {o.addressLine1}
                    {o.addressLine2 ? `, ${o.addressLine2}` : ""}, {o.city}, {o.state} {o.pincode}
                  </p>
                  {o.notes && <p className="mb-2 italic">Notes: {o.notes}</p>}
                  {o.paymentMethod === "UPI" && (
                    <p className="mb-2">
                      UPI reference (UTR):{" "}
                      {o.paymentRef ? (
                        <span className="font-mono font-semibold">{o.paymentRef}</span>
                      ) : (
                        <span className="italic text-brown-500">not submitted yet</span>
                      )}
                    </p>
                  )}
                  <a
                    href={`https://wa.me/${o.phone.replace(/\D/g, "").length === 10 ? "91" + o.phone.replace(/\D/g, "") : o.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hello ${o.customerName}, this is Mehfuz Dry Fruits about your order ${o.orderNumber} (${formatInr(o.totalInr)}). `
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 inline-block rounded-full bg-[#25D366] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1fb857]"
                  >
                    Message customer on WhatsApp
                  </a>
                  <ul className="space-y-1">
                    {o.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.nameSnapshot} ({item.labelSnapshot}) × {item.quantity}
                        </span>
                        <span>{formatInr(item.priceInr * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
