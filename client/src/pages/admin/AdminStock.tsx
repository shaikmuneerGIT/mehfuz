import { Fragment, useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { Product, StockReceipt } from "../../types";
import { formatInr } from "../../lib/format";
import { formatWeight } from "../../lib/weight";

interface StockRow {
  variantId: string;
  productName: string;
  productActive: boolean;
  label: string;
  priceInr: number;
  stock: number;
  received: number;
  sold: number;
  adjusted: number;
  expected: number;
  reconciles: boolean;
  stockValueInr: number;
  packKg: number;
}

interface StockOverview {
  rows: StockRow[];
  totals: {
    packs: number;
    unitsInStock: number;
    unitsSold: number;
    unitsReceived: number;
    unitsAdjusted: number;
    kgInStock: number;
    kgSold: number;
    kgReceived: number;
    stockValueInr: number;
    outOfStock: number;
    lowStock: number;
    notReconciled: number;
  };
}

/**
 * Current stock for every pack. The count is editable: deliveries and sales
 * move it automatically, but a physical stock-take always wins, so the owner
 * can type what is really on the shelf and save.
 */
function StockOverviewTable({ data, onSaved }: { data: StockOverview; onSaved: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillScope, setFillScope] = useState("ZEROS");
  const [fillValue, setFillValue] = useState("");
  const [reconciling, setReconciling] = useState(false);

  async function reconcile() {
    setReconciling(true);
    setError(null);
    try {
      await api.post("/admin/stock-reconcile");
      onSaved();
    } catch {
      setError("Could not balance the stock figures.");
    } finally {
      setReconciling(false);
    }
  }

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
  const rows = matching;

  /**
   * One line per product rather than per pack: the owner thinks in products
   * ("how much cashew is left"), not in 250g/500g/1kg rows. Each product's
   * pack sizes are still there, one click away, because that is where a count
   * actually gets corrected.
   */
  const groups = [...new Set(rows.map((r) => r.productName))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const groupRows = rows
        .filter((r) => r.productName === name)
        .sort((a, b) => a.priceInr - b.priceInr);
      return {
        name,
        rows: groupRows,
        productActive: groupRows[0]?.productActive ?? true,
        receivedKg: groupRows.reduce((s, r) => s + r.received * r.packKg, 0),
        soldKg: groupRows.reduce((s, r) => s + r.sold * r.packKg, 0),
        adjustedKg: groupRows.reduce((s, r) => s + r.adjusted * r.packKg, 0),
        leftKg: groupRows.reduce((s, r) => s + liveStock(r) * r.packKg, 0),
        left: groupRows.reduce((s, r) => s + liveStock(r), 0),
        value: groupRows.reduce((s, r) => s + liveStock(r) * r.priceInr, 0),
      };
    });

  // Totals follow what's on screen, so an edit's effect is visible before
  // saving. Out-of-stock counts whole products, matching the table's rows —
  // a product with a sold-out 250g but stock in 1kg is not out of stock.
  const stockByProduct = new Map<string, number>();
  for (const r of data.rows) {
    stockByProduct.set(r.productName, (stockByProduct.get(r.productName) ?? 0) + liveStock(r));
  }
  const productStocks = [...stockByProduct.values()];
  const totals = {
    unitsInStock: data.rows.reduce((s, r) => s + liveStock(r), 0),
    kgInStock: data.rows.reduce((s, r) => s + liveStock(r) * r.packKg, 0),
    stockValueInr: data.rows.reduce((s, r) => s + liveStock(r) * r.priceInr, 0),
    outOfStock: productStocks.filter((n) => n === 0).length,
    lowStock: productStocks.filter((n) => n > 0 && n <= 5).length,
  };

  const dirty = data.rows.filter((r) => liveStock(r) !== r.stock);

  const productNames = [...new Set(data.rows.map((r) => r.productName))].sort((a, b) =>
    a.localeCompare(b)
  );

  /** Type a number once and drop it into a whole group of boxes. */
  function applyFill() {
    const n = Number(fillValue);
    if (!Number.isFinite(n) || n < 0) return;
    const target = data.rows.filter((r) => {
      if (fillScope === "ZEROS") return liveStock(r) === 0;
      if (fillScope === "SHOWN") return rows.some((x) => x.variantId === r.variantId);
      return r.productName === fillScope.slice(2);
    });
    setEdits((prev) => {
      const next = { ...prev };
      for (const r of target) next[r.variantId] = String(Math.floor(n));
      return next;
    });
  }

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
            Stock on hand
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {formatWeight(totals.kgInStock)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Sold
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {formatWeight(data.totals.kgSold)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Received
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {formatWeight(data.totals.kgReceived)}
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
              Products out of stock
            </div>
            <div className="font-display text-lg font-bold text-maroon-700">
              {totals.outOfStock}
            </div>
          </div>
        )}
        {totals.lowStock > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Products low on stock
            </div>
            <div className="font-display text-lg font-bold text-gold-700">
              {totals.lowStock}
            </div>
          </div>
        )}
      </div>

      {data.totals.notReconciled > 0 ? (
        <div className="mb-3 rounded-xl border border-maroon-700/40 bg-maroon-700/5 px-4 py-3">
          <div className="text-sm font-semibold text-maroon-700">
            {data.totals.notReconciled} pack
            {data.totals.notReconciled > 1 ? "s don’t" : " doesn’t"} add up
          </div>
          <p className="mt-1 text-xs text-brown-700">
            Stock should always equal <b>received + adjusted − sold</b>. These packs hold
            stock that no delivery, sale or correction explains — usually stock that was
            already on the shelf before you started recording deliveries.
          </p>
          <button
            onClick={reconcile}
            disabled={reconciling}
            className="mt-2 rounded-full bg-brown-950 px-4 py-1.5 text-xs font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
          >
            {reconciling ? "Balancing…" : "Record it as opening stock and balance"}
          </button>
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-forest-950/25 bg-forest-950/5 px-4 py-2 text-sm font-semibold text-forest-950">
          ✓ Every pack adds up — stock matches received + adjusted − sold, on all{" "}
          {data.totals.packs} packs.
        </div>
      )}

      <div className="mb-3 rounded-xl border border-gold-500/30 bg-cream-50 px-4 py-3">
        <div className="text-sm font-semibold text-brown-900">
          Showing zero? Type the real number in the “In stock” box.
        </div>
        <p className="mt-1 text-xs text-brown-600">
          What you type replaces the count the system worked out from deliveries and orders.
          Change as many rows as you like, then press Save — nothing changes until you do.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gold-500/25 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-brown-500">
            Fill many at once
          </span>
          <select
            value={fillScope}
            onChange={(e) => setFillScope(e.target.value)}
            className="rounded-lg border border-gold-500/40 bg-white px-2 py-1 text-sm"
          >
            <option value="ZEROS">every pack showing 0</option>
            <option value="SHOWN">every pack listed below</option>
            {productNames.map((name) => (
              <option key={name} value={`P:${name}`}>
                every pack of {name}
              </option>
            ))}
          </select>
          <span className="text-sm text-brown-700">to</span>
          <input
            type="number"
            min={0}
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            placeholder="e.g. 10"
            className="w-24 rounded-lg border border-gold-500/40 bg-white px-2 py-1 text-sm"
          />
          <span className="text-sm text-brown-700">units</span>
          <button
            onClick={applyFill}
            disabled={fillValue.trim() === ""}
            className="rounded-full border border-gold-500/60 bg-white px-4 py-1 text-sm font-semibold text-brown-800 hover:bg-cream-100 disabled:opacity-50"
          >
            Fill
          </button>
          <span className="text-xs text-brown-500">
            Fills the boxes only — press Save to make it real.
          </span>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product or pack…"
          className="input max-w-[260px]"
        />
        <button
          onClick={saveCounts}
          disabled={saving || dirty.length === 0}
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-40"
        >
          {saving
            ? "Saving…"
            : dirty.length === 0
              ? "Save stock"
              : `Save ${dirty.length} change${dirty.length > 1 ? "s" : ""}`}
        </button>
        {dirty.length > 0 && (
          <button
            onClick={() => setEdits({})}
            className="text-sm font-semibold text-brown-600 hover:underline"
          >
            Undo changes
          </button>
        )}
        {saved && <span className="text-sm font-semibold text-forest-950">Saved ✓</span>}
        {error && <span className="text-sm text-maroon-700">{error}</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gold-500/30 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-500/30 bg-cream-50 text-xs uppercase tracking-wide text-brown-500">
              <th className="px-4 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-right font-medium">Received</th>
              <th
                className="px-3 py-2 text-right font-medium"
                title="Stock already on the shelf plus any hand corrections"
              >
                + Opening
              </th>
              <th className="px-3 py-2 text-right font-medium">− Sold</th>
              <th className="px-3 py-2 text-right font-medium">= Left in stock</th>
              <th className="px-3 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const isOpen = expanded === g.name;
              return (
                <Fragment key={g.name}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : g.name)}
                    className={`cursor-pointer border-b border-gold-500/15 last:border-0 hover:bg-cream-50 ${
                      isOpen ? "bg-cream-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-brown-900">
                      <span className="mr-2 inline-block w-3 text-gold-700">
                        {isOpen ? "▾" : "▸"}
                      </span>
                      {g.name}
                      {!g.productActive && (
                        <span className="ml-2 text-xs text-brown-500">(hidden)</span>
                      )}
                      <span className="ml-2 text-xs text-brown-500">
                        {g.rows.length} pack{g.rows.length > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-brown-700">
                      {formatWeight(g.receivedKg)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-brown-700">
                      {g.adjustedKg === 0 ? "—" : formatWeight(Math.abs(g.adjustedKg))}
                    </td>
                    <td className="px-3 py-2.5 text-right text-brown-700">
                      {formatWeight(g.soldKg)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          g.left === 0
                            ? "bg-maroon-700 text-white"
                            : g.left <= 5
                              ? "bg-maroon-700/10 text-maroon-700"
                              : "bg-forest-950/10 text-forest-950"
                        }`}
                      >
                        {g.left === 0 ? "Out of stock" : formatWeight(g.leftKg)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-brown-900">
                      {formatInr(g.value)}
                    </td>
                  </tr>

                  {isOpen &&
                    g.rows.map((r) => {
                      const value = liveStock(r);
                      const changed = value !== r.stock;
                      return (
                        <tr
                          key={r.variantId}
                          className={`border-b border-gold-500/15 text-xs ${
                            changed ? "bg-gold-500/10" : "bg-cream-50/60"
                          }`}
                        >
                          <td className="py-2 pl-12 pr-4 text-brown-700">
                            {r.label}
                            {!r.reconciles && (
                              <span
                                title={`Doesn't add up: ${r.received} received ${
                                  r.adjusted >= 0 ? "+" : "−"
                                } ${Math.abs(r.adjusted)} adjusted − ${r.sold} sold = ${
                                  r.expected
                                }, but stock says ${r.stock}`}
                                className="ml-2 font-bold text-maroon-700"
                              >
                                !
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-brown-600">
                            {r.received} {r.received === 1 ? "pack" : "packs"}
                          </td>
                          <td className="px-3 py-2 text-right text-brown-600">
                            {r.adjusted === 0
                              ? "—"
                              : `${r.adjusted > 0 ? "+" : ""}${r.adjusted}`}
                          </td>
                          <td className="px-3 py-2 text-right text-brown-600">
                            {r.sold} {r.sold === 1 ? "pack" : "packs"}
                          </td>
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
                          <td className="px-3 py-2 text-right text-brown-700">
                            {formatInr(value * r.priceInr)}
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
            {groups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-brown-500">
                  No product matches “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-brown-500">
        Product rows are in <b>weight</b>, because pack sizes can't be added together — two
        1kg packs and one 250g pack is 2.25 kg, not "three". Received + Opening − Sold always
        equals Left. Click a product to see its pack sizes, counted in packs, and type what
        you actually have.
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
