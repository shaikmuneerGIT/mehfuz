import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { Product, StockReceipt } from "../../types";
import { formatInr } from "../../lib/format";

export function AdminStock() {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.get<StockReceipt[]>("/admin/stock-receipts"),
      api.get<Product[]>("/admin/products"),
    ])
      .then(([receiptsRes, productsRes]) => {
        setReceipts(receiptsRes.data);
        setProducts(productsRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brown-950">Stock Received</h1>
          <p className="mt-1 text-sm text-brown-500">
            Record deliveries from suppliers — this adds straight to sellable stock and tracks
            what you paid, so the dashboard can show real profit.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900"
        >
          {showForm ? "Cancel" : "+ Add Stock Received"}
        </button>
      </div>

      {showForm && (
        <AddReceiptForm
          products={products}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-brown-500">Loading...</p>
      ) : receipts.length === 0 ? (
        <p className="text-brown-500">No stock received yet.</p>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <div key={r.id} className="rounded-xl border border-gold-500/30 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display font-semibold text-brown-950">{r.productName}</div>
                  <div className="text-sm text-brown-700">
                    {r.supplierName ? `From ${r.supplierName} • ` : ""}
                    {new Date(r.receivedAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {r.notes && <div className="mt-1 text-xs italic text-brown-500">{r.notes}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-brown-500">Paid</div>
                  <div className="font-display font-bold text-brown-950">
                    {formatInr(r.totalCostInr)}
                  </div>
                </div>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2 border-t border-gold-500/20 pt-3 text-sm">
                {r.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-full bg-cream-100 px-3 py-1 text-brown-800"
                  >
                    +{item.quantity} × {item.labelSnapshot}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddReceiptForm({
  products,
  onSaved,
}: {
  products: Product[];
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [totalCostInr, setTotalCostInr] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) {
      setError("Select a product first.");
      return;
    }
    const items = product.variants
      .map((v) => ({ variantId: v.id, quantity: Number(quantities[v.id] || 0) }))
      .filter((i) => i.quantity > 0);

    if (items.length === 0) {
      setError("Enter a received quantity for at least one pack size.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/stock-receipts", {
        productId,
        supplierName: supplierName || undefined,
        notes: notes || undefined,
        totalCostInr: Number(totalCostInr || 0),
        receivedAt: new Date(receivedAt).toISOString(),
        items,
      });
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Failed to save stock receipt."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-xl border border-gold-500/30 bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Product</span>
          <select
            required
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setQuantities({});
            }}
            className="input"
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Supplier (optional)</span>
          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="input"
            placeholder="e.g. Kashmir Dry Fruits Wholesale"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Date received</span>
          <input
            required
            type="date"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
            className="input"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">
            Total paid to supplier (₹)
          </span>
          <input
            required
            type="number"
            min={0}
            value={totalCostInr}
            onChange={(e) => setTotalCostInr(e.target.value)}
            className="input"
            placeholder="e.g. 5000"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-brown-800">Notes (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="e.g. 10kg box, portioned into these pack sizes"
          />
        </label>
      </div>

      {product && (
        <div>
          <div className="mb-2 text-sm font-semibold text-brown-800">
            How many of each pack size did this delivery make?
          </div>
          <div className="space-y-2">
            {product.variants.map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="w-24 text-sm text-brown-700">{v.label}</span>
                <input
                  type="number"
                  min={0}
                  value={quantities[v.id] ?? ""}
                  onChange={(e) =>
                    setQuantities((q) => ({ ...q, [v.id]: e.target.value }))
                  }
                  placeholder="0"
                  className="input max-w-[140px]"
                />
                <span className="text-xs text-brown-500">
                  units — current stock: {v.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-maroon-700">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brown-950 px-6 py-2.5 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Stock Received"}
      </button>
    </form>
  );
}
