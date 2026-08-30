import { Fragment, useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { Product, StockReceipt } from "../../types";
import { formatInr } from "../../lib/format";

interface PackRow {
  variantId: string;
  productName: string;
  label: string;
  priceInr: number;
  packGrams: number;
  received: number;
  sold: number;
  available: number;
}

interface ProductRow {
  productId: string;
  productName: string;
  productActive: boolean;
  stockGrams: number;
  receivedGrams: number;
  soldGrams: number;
  openingGrams: number;
  stockValueInr: number;
  packs: PackRow[];
}

interface StockOverview {
  products: ProductRow[];
  totals: {
    productCount: number;
    gramsInStock: number;
    gramsSold: number;
    gramsReceived: number;
    stockValueInr: number;
    outOfStock: number;
    lowStock: number;
  };
}

/** "750 g" under a kilo, "2.5 kg" above. */
function grams(g: number): string {
  if (g === 0) return "0";
  return g < 1000 ? `${g} g` : `${Number((g / 1000).toFixed(3))} kg`;
}

interface SaleRow {
  orderNumber: string;
  customerName: string;
  phone: string;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
  label: string;
  quantity: number;
  grams: number;
  countsTowardsSold: boolean;
}

/** Which orders took a product's sold weight — loaded when a row is opened. */
function ProductSales({ productId, productName }: { productId: string; productName: string }) {
  const [sales, setSales] = useState<SaleRow[] | null>(null);

  useEffect(() => {
    let live = true;
    api
      .get<SaleRow[]>(`/admin/stock-sales/${productId}`)
      .then((res) => live && setSales(res.data))
      .catch(() => live && setSales([]));
    return () => {
      live = false;
    };
  }, [productId]);

  if (sales === null) {
    return <div className="mt-3 text-xs text-brown-500">Loading orders…</div>;
  }
  if (sales.length === 0) {
    return (
      <div className="mt-3 text-xs text-brown-500">
        No one has ordered {productName} yet.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brown-500">
        Who ordered it
      </div>
      <div className="overflow-x-auto rounded-lg border border-gold-500/25 bg-white">
        <table className="w-full text-xs">
          <tbody>
            {sales.map((sale, i) => (
              <tr
                key={`${sale.orderNumber}-${sale.label}-${i}`}
                className="border-b border-gold-500/15 last:border-0"
              >
                <td className="px-3 py-1.5 font-mono text-brown-700">{sale.orderNumber}</td>
                <td className="px-3 py-1.5 font-semibold text-brown-900">
                  {sale.customerName}
                </td>
                <td className="px-3 py-1.5 text-brown-500">{sale.phone}</td>
                <td className="px-3 py-1.5 text-brown-600">
                  {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-1.5 text-right text-brown-800">
                  {sale.label} × {sale.quantity}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-brown-950">
                  {sale.grams < 1000
                    ? `${sale.grams} g`
                    : `${Number((sale.grams / 1000).toFixed(3))} kg`}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {sale.countsTowardsSold ? (
                    <span className="text-brown-500">{sale.status}</span>
                  ) : (
                    <span
                      title="Cancelled orders do not count towards sold weight"
                      className="text-maroon-700"
                    >
                      CANCELLED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Stock is bulk weight; pack sizes are cut from it. So each product is one
 * line in kilos, and its pack sizes underneath show what that weight can
 * fill — 250 g left is one 250g pack and no 500g or 1kg at all.
 */
function StockOverviewTable({ data, onSaved }: { data: StockOverview; onSaved: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Record<string, "g" | "kg">>({});
  const [showUntouched, setShowUntouched] = useState(false);

  /** A product is being counted once its weight box has been typed into. */
  function isCounted(p: ProductRow): boolean {
    return edits[p.productId] !== undefined;
  }

  /**
   * A stock-take is stated as a weight, never as a count of each pack size.
   * 1 kg IS four 250g packs AND two 500g packs AND one 1kg pack at once, so
   * asking for all three and adding them up would treble the real stock.
   */
  function liveGrams(p: ProductRow): number {
    const typed = edits[p.productId];
    if (typed === undefined) return p.stockGrams;
    const n = Number(typed);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n * (units[p.productId] === "g" ? 1 : 1000));
  }

  const q = query.trim().toLowerCase();
  /**
   * A product with nothing received, nothing sold and nothing on hand has no
   * stock story to tell, so it only pads the table. It stays one click away,
   * since that is where you go to stock it for the first time.
   */
  function isUntouched(p: ProductRow): boolean {
    return p.receivedGrams === 0 && p.soldGrams === 0 && p.stockGrams === 0;
  }

  const untouched = data.products.filter(isUntouched);
  const matches = (p: ProductRow) =>
    !q ||
    p.productName.toLowerCase().includes(q) ||
    p.packs.some((v) => v.label.toLowerCase().includes(q));

  // A search always looks everywhere; otherwise the quiet ones stay folded away.
  const products = data.products.filter(
    (p) => matches(p) && (q !== "" || showUntouched || !isUntouched(p))
  );

  const dirty = data.products.filter(isCounted);

  const totals = {
    gramsInStock: data.products.reduce((g, p) => g + liveGrams(p), 0),
    outOfStock: data.products.filter((p) => liveGrams(p) === 0).length,
  };

  async function saveCounts() {
    if (dirty.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.put("/admin/stock-weights", {
        weights: dirty.map((p) => ({ productId: p.productId, grams: liveGrams(p) })),
      });
      setEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not save the stock."
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
            {grams(totals.gramsInStock)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Received
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {grams(data.totals.gramsReceived)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">Sold</div>
          <div className="font-display text-lg font-bold text-brown-950">
            {grams(data.totals.gramsSold)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Stock value
          </div>
          <div className="font-display text-lg font-bold text-brown-950">
            {formatInr(data.totals.stockValueInr)}
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
      </div>

      <div className="mb-3 rounded-xl border border-gold-500/30 bg-cream-50 px-4 py-3">
        <div className="text-sm font-semibold text-brown-900">
          Stock is counted by weight, and pack sizes come out of it.
        </div>
        <p className="mt-1 text-xs text-brown-600">
          If 250 g of a product is left, that is one 250g pack — the 500g and 1kg show{" "}
          <b>out of stock</b> to customers automatically. Click a product to count what is on
          the shelf, pack by pack, then press Save.
        </p>
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
              : `Save ${dirty.length} product${dirty.length > 1 ? "s" : ""}`}
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
              <th
                className="px-3 py-2 text-right font-medium"
                title="Deliveries recorded, plus any stock that was already on the shelf"
              >
                Received
              </th>
              <th className="px-3 py-2 text-right font-medium">− Sold</th>
              <th className="px-3 py-2 text-right font-medium">= Left in stock</th>
              <th className="px-3 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isOpen = expanded === p.productId;
              const left = liveGrams(p);
              const changed = isCounted(p);
              return (
                <Fragment key={p.productId}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : p.productId)}
                    className={`cursor-pointer border-b border-gold-500/15 hover:bg-cream-50 ${
                      changed ? "bg-gold-500/10" : isOpen ? "bg-cream-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-brown-900">
                      <span className="mr-2 inline-block w-3 text-gold-700">
                        {isOpen ? "▾" : "▸"}
                      </span>
                      {p.productName}
                      {!p.productActive && (
                        <span className="ml-2 text-xs text-brown-500">(hidden)</span>
                      )}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-brown-700"
                      title={
                        p.openingGrams === 0
                          ? undefined
                          : `${grams(p.receivedGrams)} from recorded deliveries, plus ${grams(
                              Math.abs(p.openingGrams)
                            )} that was already on the shelf`
                      }
                    >
                      {grams(p.receivedGrams + p.openingGrams)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-brown-700">
                      {grams(p.soldGrams)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          left === 0
                            ? "bg-maroon-700 text-white"
                            : left < 500
                              ? "bg-maroon-700/10 text-maroon-700"
                              : "bg-forest-950/10 text-forest-950"
                        }`}
                      >
                        {left === 0 ? "Out of stock" : grams(left)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-brown-900">
                      {formatInr(p.stockValueInr)}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="border-b border-gold-500/15 bg-cream-50/60">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex flex-wrap items-end gap-6">
                          <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brown-500">
                              How much do you actually have?
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={
                                  edits[p.productId] ??
                                  String(
                                    units[p.productId] === "g"
                                      ? p.stockGrams
                                      : Number((p.stockGrams / 1000).toFixed(3))
                                  )
                                }
                                onChange={(e) =>
                                  setEdits((prev) => ({ ...prev, [p.productId]: e.target.value }))
                                }
                                onFocus={(e) => e.target.select()}
                                aria-label={`Stock weight for ${p.productName}`}
                                className="w-28 rounded-md border border-gold-500/40 bg-white px-2 py-1 text-right text-sm font-semibold text-brown-950"
                              />
                              <select
                                value={units[p.productId] ?? "kg"}
                                onChange={(e) => {
                                  const unit = e.target.value as "g" | "kg";
                                  setUnits((prev) => ({ ...prev, [p.productId]: unit }));
                                  setEdits((prev) => {
                                    const next = { ...prev };
                                    delete next[p.productId];
                                    return next;
                                  });
                                }}
                                className="rounded-md border border-gold-500/40 bg-white px-2 py-1 text-sm"
                              >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                              </select>
                            </div>
                          </label>

                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brown-500">
                              {grams(left)} fills any of these
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {p.packs.map((v) => {
                                const fills = Math.floor(left / v.packGrams);
                                return (
                                  <span
                                    key={v.variantId}
                                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                                      fills === 0
                                        ? "border-maroon-700/40 bg-maroon-700/5 text-maroon-700"
                                        : "border-gold-500/30 bg-white text-brown-900"
                                    }`}
                                    title={`${v.received} packs received, ${v.sold} sold`}
                                  >
                                    <b>{v.label}</b>{" "}
                                    {fills === 0 ? "out of stock" : `× ${fills}`}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {p.soldGrams > 0 && (
                          <ProductSales productId={p.productId} productName={p.productName} />
                        )}
                        <p className="mt-2 text-[11px] text-brown-500">
                          Those pack sizes are alternatives, not separate piles — 1 kg is four
                          250g packs <i>or</i> two 500g <i>or</i> one 1kg, whichever customers
                          choose, until the kilo runs out.
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brown-500">
                  No product matches “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {untouched.length > 0 && !q && (
        <button
          onClick={() => setShowUntouched((v) => !v)}
          className="mt-2 text-xs font-semibold text-gold-700 hover:underline"
        >
          {showUntouched
            ? `Hide the ${untouched.length} product${untouched.length > 1 ? "s" : ""} with no stock history`
            : `Show ${untouched.length} product${untouched.length > 1 ? "s" : ""} you have not stocked yet`}
        </button>
      )}
      <p className="mt-2 text-xs text-brown-500">
        Received − Sold always equals Left, because all three are weights. Received counts
        your logged deliveries plus any stock that was already on the shelf before you
        started recording them.
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
