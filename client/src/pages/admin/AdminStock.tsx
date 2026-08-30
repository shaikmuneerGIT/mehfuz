import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { Product, StockReceipt } from "../../types";
import { formatInr } from "../../lib/format";

interface StockRow {
  variantId: string;
  productName: string;
  productActive: boolean;
  label: string;
  priceInr: number;
  stock: number;
  received: number;
  sold: number;
  opening: number;
  stockValueInr: number;
}

interface StockOverview {
  rows: StockRow[];
  totals: {
    packs: number;
    unitsInStock: number;
    unitsSold: number;
    unitsReceived: number;
    stockValueInr: number;
    outOfStock: number;
    lowStock: number;
  };
}

/**
 * Current stock for every pack. The count is editable: deliveries and sales
 * move it automatically, but a physical stock-take always wins, so the owner
 * can type what is really on the shelf and save.
 */
function StockOverviewTable({ data, onSaved }: { data: StockOverview; onSaved: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A row's live value is whatever is typed, falling back to the saved count.
  function liveStock(r: StockRow): number {
    const typed = edits[r.variantId];
    if (typed === undefined) return r.stock;
    const n = Number(typed);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  const q = query.trim().toLowerCase();
  const matching = q
    ? data.rows.filter(
        (r) => r.productName.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
      )
    : data.rows;
  const rows = showAll || q ? matching : matching.slice(0, 12);

  // Totals follow what's on screen, so an edit's effect is visible before saving.
  const totals = {
    unitsInStock: data.rows.reduce((s, r) => s + liveStock(r), 0),
    stockValueInr: data.rows.reduce((s, r) => s + liveStock(r) * r.priceInr, 0),
    outOfStock: data.rows.filter((r) => liveStock(r) === 0).length,
    lowStock: data.rows.filter((r) => liveStock(r) > 0 && liveStock(r) <= 5).length,
  };

  const dirty = data.rows.filter((r) => liveStock(r) !== r.stock);

  async function saveCounts() {
    if (dirty.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.put("/admin/stock-counts", {
        counts: dirty.map((r) => ({ variantId: r.variantId, stock: liveStock(r) })),
      });
      setEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not save the stock counts."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-gold-500/30 bg-white px-5 py-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Units in stock
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {totals.unitsInStock}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Units sold
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {data.totals.unitsSold}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Units received
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {data.totals.unitsReceived}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Stock value
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {formatInr(totals.stockValueInr)}
          </div>
        </div>
        {totals.outOfStock > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Out of stock
            </div>
            <div className="font-display text-lg font-bold text-maroon-700">
              {totals.outOfStock}
            </div>
          </div>
        )}
        {totals.lowStock > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Low stock
            </div>
            <div className="font-display text-lg font-bold text-gold-700">
              {totals.lowStock}
            </div>
          </div>
        )}
      </div>

      <div className="mb-3 rounded-xl border border-gold-500/30 bg-cream-50 px-4 py-3">
        <div className="text-sm font-semibold text-brown-900">
          Showing zero? Type the real number in the “In stock” box.
        </div>
        <p className="mt-1 text-xs text-brown-600">
          What you type replaces the count the system worked out from deliveries and orders.
          Change as many rows as you like, then press Save — nothing changes until you do.
        </p>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product or pack…"
          className="input max-w-[260px]"
        />
        {dirty.length > 0 && (
          <>
            <button
              onClick={saveCounts}
              disabled={saving}
              className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
            >
              {saving ? "Saving…" : `Save ${dirty.length} change${dirty.length > 1 ? "s" : ""}`}
            </button>
            <button
              onClick={() => setEdits({})}
              className="text-sm font-semibold text-brown-600 hover:underline"
            >
              Undo changes
            </button>
          </>
        )}
        {saved && <span className="text-sm font-semibold text-forest-950">Saved ✓</span>}
        {error && <span className="text-sm text-maroon-700">{error}</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gold-500/30 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-500/30 bg-cream-50 text-xs uppercase tracking-wide text-brown-500">
              <th className="px-4 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-left font-medium">Pack</th>
              <th className="px-3 py-2 text-right font-medium">In stock</th>
              <th className="px-3 py-2 text-right font-medium">Sold</th>
              <th className="px-3 py-2 text-right font-medium">Received</th>
              <th className="px-3 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const value = liveStock(r);
              const changed = value !== r.stock;
              return (
                <tr
                  key={r.variantId}
                  className={`border-b border-gold-500/15 last:border-0 ${
                    changed ? "bg-gold-500/10" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-brown-900">
                    {r.productName}
                    {!r.productActive && (
                      <span className="ml-2 text-xs text-brown-500">(hidden)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-brown-700">{r.label}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={edits[r.variantId] ?? String(r.stock)}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [r.variantId]: e.target.value }))
                      }
                      onFocus={(e) => e.target.select()}
                      aria-label={`Stock for ${r.productName} ${r.label}`}
                      className={`w-20 rounded-md border px-2 py-1 text-right text-sm font-semibold ${
                        value === 0
                          ? "border-maroon-700/50 bg-maroon-700/5 text-maroon-700"
                          : "border-gold-500/40 bg-white text-brown-950"
                      }`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-brown-700">{r.sold}</td>
                  <td className="px-3 py-2 text-right text-brown-700">{r.received}</td>
                  <td className="px-3 py-2 text-right text-brown-900">
                    {formatInr(value * r.priceInr)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-brown-500">
                  No pack matches “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!q && matching.length > 12 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs font-semibold text-gold-700 hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${matching.length} packs`}
        </button>
      )}
      <p className="mt-2 text-xs text-brown-500">
        Sold counts every pack in non-cancelled orders. Received counts deliveries entered
        below. Stock drops automatically on each sale and rises on each delivery — edit it
        here whenever the shelf says something different.
      </p>
    </div>
  );
}

export function AdminStock() {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [overview, setOverview] = useState<StockOverview | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.get<StockReceipt[]>("/admin/stock-receipts"),
      api.get<Product[]>("/admin/products"),
      api.get<StockOverview>("/admin/stock-overview"),
    ])
      .then(([receiptsRes, productsRes, overviewRes]) => {
        setReceipts(receiptsRes.data);
        setProducts(productsRes.data);
        setOverview(overviewRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function removeReceipt(id: string, productName: string) {
    if (
      !confirm(
        `Delete this stock entry for ${productName}?

The units it added will be removed from stock again, and its cost will no longer count towards profit.`
      )
    )
      return;
    try {
      await api.delete(`/admin/stock-receipts/${id}`);
      load();
    } catch {
      alert("Could not delete this stock entry.");
    }
  }

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-bold text-brown-950">Stock</h1>

      {overview && <StockOverviewTable data={overview} onSaved={load} />}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-brown-950">Stock Received</h2>
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
                  <button
                    onClick={() => removeReceipt(r.id, r.productName)}
                    className="mt-1 text-xs font-semibold text-maroon-700 hover:underline"
                  >
                    Delete
                  </button>
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
