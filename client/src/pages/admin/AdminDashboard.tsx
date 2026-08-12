import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface Summary {
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  totalRevenueInr: number;
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
            <div className="font-display mt-1 text-2xl font-bold text-brown-950">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
