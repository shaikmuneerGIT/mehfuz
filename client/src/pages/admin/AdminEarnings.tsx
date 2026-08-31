import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface ProductEarning {
  productId: string;
  productName: string;
  gramsSold: number;
  revenueInr: number;
  costInr: number;
  earningsInr: number;
  marginPct: number;
}

interface Earnings {
  paidOnly: boolean;
  orderCount: number;
  goodsRevenueInr: number;
  discountsInr: number;
  netGoodsRevenueInr: number;
  shippingCollectedInr: number;
  costOfSalesInr: number;
  grossEarningsInr: number;
  expensesInr: number;
  netEarningsInr: number;
  stockAtCostInr: number;
  marginPct: number;
  unpricedGramsSold: number;
  products: ProductEarning[];
}

function weight(g: number): string {
  if (g === 0) return "0";
  return g < 1000 ? `${g} g` : `${Number((g / 1000).toFixed(3))} kg`;
}

/** One line of the sum, so the arithmetic can be followed down the page. */
function Line({
  label,
  value,
  note,
  sign,
  strong,
  rule,
}: {
  label: string;
  value: number;
  note?: string;
  sign?: "plus" | "minus";
  strong?: boolean;
  rule?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2 ${
        rule ? "border-t border-gold-500/30" : ""
      }`}
    >
      <div>
        <span className={strong ? "font-semibold text-brown-950" : "text-brown-800"}>
          {sign === "minus" ? "− " : sign === "plus" ? "+ " : ""}
          {label}
        </span>
        {note && <div className="text-xs text-brown-500">{note}</div>}
      </div>
      <span
        className={`font-roboto whitespace-nowrap ${
          strong ? "text-lg font-bold text-brown-950" : "text-brown-900"
        }`}
      >
        {sign === "minus" ? `− ${formatInr(value)}` : formatInr(value)}
      </span>
    </div>
  );
}

export function AdminEarnings() {
  const [data, setData] = useState<Earnings | null>(null);
  const [paidOnly, setPaidOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<Earnings>("/admin/earnings", { params: { paidOnly } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [paidOnly]);

  if (loading && !data) return <p className="text-brown-500">Loading…</p>;
  if (!data) return <p className="text-brown-500">Could not load earnings.</p>;

  const positive = data.netEarningsInr >= 0;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-brown-950">Earnings</h1>
        <p className="mt-1 text-sm text-brown-500">
          What the shop kept after paying for the goods it sold. Delivery is left out
          entirely — the fee a customer pays is collected for DTDC and handed straight over,
          so counting it as income would flatter every figure here.
        </p>
      </div>

      <div className="mb-4 inline-flex rounded-full border border-gold-500/40 bg-white p-1 text-sm">
        <button
          onClick={() => setPaidOnly(true)}
          className={`rounded-full px-4 py-1.5 font-semibold transition ${
            paidOnly ? "bg-brown-950 text-gold-300" : "text-brown-700 hover:bg-cream-100"
          }`}
        >
          Money received
        </button>
        <button
          onClick={() => setPaidOnly(false)}
          className={`rounded-full px-4 py-1.5 font-semibold transition ${
            !paidOnly ? "bg-brown-950 text-gold-300" : "text-brown-700 hover:bg-cream-100"
          }`}
        >
          Including unpaid orders
        </button>
      </div>

      <div
        className={`mb-6 rounded-xl border p-6 ${
          positive ? "border-forest-950/25 bg-forest-950/5" : "border-maroon-700/30 bg-maroon-700/5"
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-brown-500">
          You earned
        </div>
        <div
          className={`font-display text-4xl font-bold ${
            positive ? "text-forest-950" : "text-maroon-700"
          }`}
        >
          {formatInr(data.netEarningsInr)}
        </div>
        <div className="mt-1 text-sm text-brown-700">
          from {data.orderCount} {paidOnly ? "paid" : ""} order
          {data.orderCount === 1 ? "" : "s"} · {data.marginPct}% margin on goods
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gold-500/30 bg-white p-6">
        <h2 className="font-display mb-2 text-lg font-bold text-brown-950">How it adds up</h2>
        <Line
          label="Customers paid for goods"
          value={data.goodsRevenueInr}
          note="Every pack sold, at the price on the order"
        />
        {data.discountsInr !== 0 && (
          <Line
            label="Discounts given"
            value={data.discountsInr}
            sign="minus"
            note="Where an order's total was edited below its items"
          />
        )}
        <Line
          label="What those goods cost you"
          value={data.costOfSalesInr}
          sign="minus"
          note="Weight sold × what you paid per kilo for it"
        />
        <Line label="Earned on goods" value={data.grossEarningsInr} strong rule />
        {data.expensesInr > 0 && (
          <Line
            label="Business expenses"
            value={data.expensesInr}
            sign="minus"
            note="From the Expenses page"
          />
        )}
        <Line label="You earned" value={data.netEarningsInr} strong rule />

        <div className="mt-4 space-y-1 border-t border-gold-500/20 pt-3 text-xs text-brown-500">
          <div className="flex justify-between">
            <span>
              Delivery collected and paid to DTDC <i>(not income)</i>
            </span>
            <span>{formatInr(data.shippingCollectedInr)}</span>
          </div>
          <div className="flex justify-between">
            <span>
              Still on your shelves, at what it cost you <i>(not yet earned)</i>
            </span>
            <span>{formatInr(data.stockAtCostInr)}</span>
          </div>
        </div>
      </div>

      {data.unpricedGramsSold > 0 && (
        <div className="mb-6 rounded-xl border border-maroon-700/30 bg-maroon-700/5 p-4">
          <div className="text-sm font-semibold text-maroon-700">
            {weight(data.unpricedGramsSold)} was sold with no purchase price behind it
          </div>
          <p className="mt-1 text-xs text-brown-700">
            Those products have no recorded delivery, so their cost counts as zero and the
            earnings above are flattered by it. Record what you paid under{" "}
            <b>Stock → Add Stock Received</b> and this figure becomes real.
          </p>
        </div>
      )}

      <h2 className="font-display mb-2 text-lg font-bold text-brown-950">
        Which products earned it
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gold-500/30 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-500/30 bg-cream-50 text-xs uppercase tracking-wide text-brown-500">
              <th className="px-4 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-right font-medium">Sold</th>
              <th className="px-3 py-2 text-right font-medium">Customers paid</th>
              <th className="px-3 py-2 text-right font-medium">Cost</th>
              <th className="px-3 py-2 text-right font-medium">Earned</th>
              <th className="px-3 py-2 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.productId} className="border-b border-gold-500/15 last:border-0">
                <td className="px-4 py-2 font-medium text-brown-900">{p.productName}</td>
                <td className="px-3 py-2 text-right text-brown-700">{weight(p.gramsSold)}</td>
                <td className="px-3 py-2 text-right text-brown-700">
                  {formatInr(p.revenueInr)}
                </td>
                <td className="px-3 py-2 text-right text-brown-700">
                  {p.costInr === 0 ? (
                    <span title="No recorded delivery, so no known cost" className="text-maroon-700">
                      not known
                    </span>
                  ) : (
                    formatInr(p.costInr)
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-brown-950">
                  {formatInr(p.earningsInr)}
                </td>
                <td className="px-3 py-2 text-right text-brown-600">{p.marginPct}%</td>
              </tr>
            ))}
            {data.products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-brown-500">
                  Nothing sold yet{paidOnly ? " that has been paid for" : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
