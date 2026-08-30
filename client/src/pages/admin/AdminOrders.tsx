import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Order, Product } from "../../types";
import { formatInr } from "../../lib/format";

interface DraftLine {
  variantId: string;
  name: string;
  label: string;
  priceInr: number;
  quantity: number;
}

/**
 * Change what an order contains: fix a quantity, drop a pack, add one the
 * customer asked for on the phone. Existing packs keep the price the customer
 * was charged; added packs are priced from the catalogue. Stock is corrected
 * by the difference when saved.
 */
function OrderItemsEditor({
  order,
  onSaved,
  onCancel,
}: {
  order: Order;
  onSaved: (updated: Order) => void;
  onCancel: () => void;
}) {
  const [lines, setLines] = useState<DraftLine[]>(() =>
    order.items.map((i) => ({
      variantId: i.variantId,
      name: i.nameSnapshot,
      label: i.labelSnapshot,
      priceInr: i.priceInr,
      quantity: i.quantity,
    }))
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [addProductId, setAddProductId] = useState("");
  const [addVariantId, setAddVariantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Product[]>("/admin/products")
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  const addProduct = products.find((p) => p.id === addProductId);

  function setQuantity(variantId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, quantity) } : l))
    );
  }

  function removeLine(variantId: string) {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  function addPack() {
    const variant = addProduct?.variants.find((v) => v.id === addVariantId);
    if (!addProduct || !variant) return;
    // Already on the order? Just bump it rather than creating a second line.
    if (lines.some((l) => l.variantId === variant.id)) {
      setQuantity(variant.id, (lines.find((l) => l.variantId === variant.id)?.quantity ?? 0) + 1);
    } else {
      setLines((prev) => [
        ...prev,
        {
          variantId: variant.id,
          name: addProduct.name,
          label: variant.label,
          priceInr: variant.priceInr,
          quantity: 1,
        },
      ]);
    }
    setAddVariantId("");
  }

  const subtotalInr = lines.reduce((s, l) => s + l.priceInr * l.quantity, 0);
  const totalInr = subtotalInr + order.shippingInr;

  async function save() {
    if (lines.length === 0) {
      setError("An order needs at least one pack. Delete the order instead.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<Order>(`/orders/${order.id}/items`, {
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      });
      onSaved(res.data);
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not save the changes."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-gold-500/40 bg-cream-50 p-4">
      <div className="mb-3 text-sm font-semibold text-brown-900">Edit items</div>

      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l.variantId} className="flex flex-wrap items-center gap-3">
            <span className="min-w-[190px] flex-1 text-sm text-brown-900">
              {l.name} <span className="text-brown-500">({l.label})</span>
            </span>
            <div className="inline-flex items-center rounded-md border border-gold-500/50 bg-white">
              <button
                onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                aria-label={`One less ${l.name}`}
                className="px-2.5 py-1 text-brown-800 hover:bg-cream-100"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={l.quantity}
                onChange={(e) => setQuantity(l.variantId, Number(e.target.value || 1))}
                aria-label={`Quantity of ${l.name} ${l.label}`}
                className="w-14 border-x border-gold-500/40 py-1 text-center text-sm font-semibold text-brown-950"
              />
              <button
                onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                aria-label={`One more ${l.name}`}
                className="px-2.5 py-1 text-brown-800 hover:bg-cream-100"
              >
                +
              </button>
            </div>
            <span className="w-24 text-right text-sm font-semibold text-brown-950">
              {formatInr(l.priceInr * l.quantity)}
            </span>
            <button
              onClick={() => removeLine(l.variantId)}
              className="text-xs font-semibold text-maroon-700 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
        {lines.length === 0 && (
          <li className="text-sm italic text-brown-500">No packs left — add one below.</li>
        )}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gold-500/25 pt-3">
        <select
          value={addProductId}
          onChange={(e) => {
            setAddProductId(e.target.value);
            setAddVariantId("");
          }}
          className="rounded-lg border border-gold-500/40 px-2 py-1 text-sm"
        >
          <option value="">Add a product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {addProduct && (
          <select
            value={addVariantId}
            onChange={(e) => setAddVariantId(e.target.value)}
            className="rounded-lg border border-gold-500/40 px-2 py-1 text-sm"
          >
            <option value="">Pack size…</option>
            {addProduct.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} — {formatInr(v.priceInr)}
              </option>
            ))}
          </select>
        )}
        {addVariantId && (
          <button
            onClick={addPack}
            className="rounded-full border border-gold-500/60 bg-white px-4 py-1 text-sm font-semibold text-brown-800 hover:bg-cream-100"
          >
            + Add
          </button>
        )}
      </div>

      <div className="mt-3 border-t border-gold-500/25 pt-3 text-sm">
        <div className="flex justify-between text-brown-700">
          <span>Items</span>
          <span>{formatInr(subtotalInr)}</span>
        </div>
        <div className="flex justify-between text-brown-700">
          <span>Delivery</span>
          <span>{order.shippingInr === 0 ? "Free" : formatInr(order.shippingInr)}</span>
        </div>
        <div className="mt-1 flex justify-between font-bold text-brown-950">
          <span>New total</span>
          <span>
            {formatInr(totalInr)}
            {totalInr !== order.totalInr && (
              <span className="ml-2 text-xs font-normal text-brown-500">
                was {formatInr(order.totalInr)}
              </span>
            )}
          </span>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-maroon-700">{error}</p>}

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          className="text-sm font-semibold text-brown-600 hover:underline"
        >
          Cancel
        </button>
        <span className="text-xs text-brown-500">
          Stock is adjusted by the difference when you save.
        </span>
      </div>
    </div>
  );
}

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
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [editingItems, setEditingItems] = useState<string | null>(null);

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

  async function saveAmount(orderId: string) {
    const value = Number(amountDraft);
    if (!Number.isFinite(value) || value < 0) return;
    const res = await api.patch<Order>(`/orders/${orderId}/amount`, { totalInr: value });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.data } : o)));
    setEditingAmount(null);
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
                  {editingAmount === o.id ? (
                    <span className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        value={amountDraft}
                        onChange={(e) => setAmountDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveAmount(o.id);
                          if (e.key === "Escape") setEditingAmount(null);
                        }}
                        className="w-24 rounded-lg border border-gold-500/50 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => saveAmount(o.id)}
                        className="rounded-full bg-brown-950 px-2.5 py-1 text-xs font-semibold text-gold-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAmount(null)}
                        className="text-xs text-brown-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingAmount(o.id);
                        setAmountDraft(String(o.totalInr));
                      }}
                      title="Click to change the amount (discount, corrected delivery fee…)"
                      className="font-semibold text-brown-950 underline decoration-gold-500/50 decoration-dotted underline-offset-4 hover:text-gold-700"
                    >
                      {formatInr(o.totalInr)}
                    </button>
                  )}
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
                    onClick={() => setEditingItems(editingItems === o.id ? null : o.id)}
                    className="mb-2 ml-3 text-xs font-semibold text-gold-700 hover:underline"
                  >
                    {editingItems === o.id ? "Close editor" : "Edit items"}
                  </button>
                  <button
                    onClick={() => removeOrder(o.id, o.orderNumber)}
                    className="mb-2 ml-3 text-xs font-semibold text-maroon-700 hover:underline"
                  >
                    Delete order
                  </button>
                  {editingItems === o.id ? (
                    <OrderItemsEditor
                      order={o}
                      onCancel={() => setEditingItems(null)}
                      onSaved={(updated) => {
                        setOrders((prev) =>
                          prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x))
                        );
                        setEditingItems(null);
                      }}
                    />
                  ) : (
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
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
