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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  async function removeOrder(orderId: string, orderNumber: string) {
    if (!confirm(`Permanently delete order ${orderNumber}? This cannot be undone.`)) return;
    await api.delete(`/orders/${orderId}`);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  async function markPaid(orderId: string) {
    if (!confirm("Confirm you checked your bank/UPI app and this payment arrived?")) return;
    await api.patch(`/orders/${orderId}/payment`, { paymentStatus: "PAID" });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "PAID" } : o))
    );
  }

  const visible =
    statusFilter === "ALL"
      ? orders
      : statusFilter === "UPI_UNPAID"
        ? orders.filter((o) => o.paymentMethod === "UPI" && o.paymentStatus !== "PAID")
        : orders.filter((o) => o.status === statusFilter);

  // Totals for whatever is on screen. Cancelled orders are counted separately
  // so the headline figure reflects money actually expected.
  const live = visible.filter((o) => o.status !== "CANCELLED");
  const totalInr = live.reduce((sum, o) => sum + o.totalInr, 0);
  const receivedInr = live
    .filter((o) => o.paymentMethod === "COD" || o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.totalInr, 0);
  const awaitingInr = totalInr - receivedInr;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brown-950">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gold-500/40 bg-white px-3 py-1.5 text-sm text-brown-800"
        >
          <option value="ALL">All orders ({orders.length})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s} ({orders.filter((o) => o.status === s).length})
            </option>
          ))}
          <option value="UPI_UNPAID">
            UPI unpaid (
            {orders.filter((o) => o.paymentMethod === "UPI" && o.paymentStatus !== "PAID").length})
          </option>
        </select>
      </div>

      {!loading && visible.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-gold-500/30 bg-white px-5 py-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Orders
            </div>
            <div className="font-display text-lg font-bold text-brown-950">{live.length}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Total amount
            </div>
            <div className="font-display text-lg font-bold text-brown-950">
              {formatInr(totalInr)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Payment received
            </div>
            <div className="font-display text-lg font-bold text-green-700">
              {formatInr(receivedInr)}
            </div>
          </div>
          {awaitingInr > 0 && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
                Awaiting payment
              </div>
              <div className="font-display text-lg font-bold text-maroon-700">
                {formatInr(awaitingInr)}
              </div>
            </div>
          )}
          {visible.length !== live.length && (
            <div className="text-xs text-brown-500">
              ({visible.length - live.length} cancelled, not counted)
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-brown-500">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="text-brown-500">
          {orders.length === 0 ? "No orders yet." : "No orders match this filter."}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => (
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
                  <button
                    onClick={() => removeOrder(o.id, o.orderNumber)}
                    className="mb-2 ml-3 text-xs font-semibold text-maroon-700 hover:underline"
                  >
                    Delete order
                  </button>
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
