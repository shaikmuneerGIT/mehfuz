import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface Summary {
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  totalRevenueInr: number;
  totalStockCostInr: number;
  profitInr: number;
}

export function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get<Summary>("/admin/summary").then((res) => setSummary(res.data));
  }, []);

  const cards = [
    { label: "Total Products", value: summary?.productCount ?? "—" },
    { label: "Total Orders", value: summary?.orderCount ?? "—" },
    { label: "Pending Orders", value: summary?.pendingOrders ?? "—" },
    {
      label: "Total Revenue",
      value: summary ? formatInr(summary.totalRevenueInr) : "—",
    },
    {
      label: "Stock Cost (Paid to Suppliers)",
      value: summary ? formatInr(summary.totalStockCostInr) : "—",
    },
    {
      label: "Profit",
      value: summary ? formatInr(summary.profitInr) : "—",
      highlight: (summary?.profitInr ?? 0) >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold text-brown-950">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gold-500/30 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
              {c.label}
            </div>
            <div
              className={`font-display mt-1 text-2xl font-bold ${
                c.highlight === "negative" ? "text-maroon-700" : "text-brown-950"
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-brown-500">
        Profit = total order revenue − total stock cost recorded on the Stock page. Add supplier
        deliveries there to keep this accurate.
      </p>
    </div>
  );
}
