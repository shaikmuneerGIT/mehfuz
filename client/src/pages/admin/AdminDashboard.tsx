import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface LowStockItem {
  variantId: string;
  productName: string;
  label: string;
  stock: number;
}

interface Summary {
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  totalRevenueInr: number;
  totalStockCostInr: number;
  totalExpensesInr: number;
  totalRemittedInr: number;
  profitInr: number;
  lowStock?: LowStockItem[];
}

export function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    api.get<Summary>("/admin/summary").then((res) => setSummary(res.data));
  }, []);

  async function downloadBackup() {
    setBackingUp(true);
    try {
      const res = await api.get("/admin/backup", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mehfuz-backup-${new Date().toISOString().slice(0, 10)}.db`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Backup download failed. Please try again.");
    } finally {
      setBackingUp(false);
    }
  }

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
      label: "Business Expenses",
      value: summary ? formatInr(summary.totalExpensesInr) : "—",
    },
    {
      label: "Remitted to Team",
      value: summary ? formatInr(summary.totalRemittedInr) : "—",
    },
    {
      label: "Profit",
      value: summary ? formatInr(summary.profitInr) : "—",
      highlight: (summary?.profitInr ?? 0) >= 0 ? "positive" : "negative",
    },
  ];

  const lowStock = summary?.lowStock ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brown-950">Dashboard</h1>
        <button
          onClick={downloadBackup}
          disabled={backingUp}
          title="Downloads a copy of the entire shop database (products, orders, expenses). Keep one safe every week."
          className="rounded-full border border-gold-500/50 bg-white px-4 py-2 text-xs font-semibold text-brown-800 shadow-sm hover:border-gold-500 hover:bg-cream-100 disabled:opacity-60"
        >
          {backingUp ? "Preparing backup..." : "⬇ Download Backup"}
        </button>
      </div>
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
        Profit = total order revenue − stock cost (Stock page) − business expenses (Expenses
        page). Keep both updated to see real profit. Money remitted between the team is
        shown for reference only — it is a transfer, not a cost, so it is not subtracted
        again here. For earnings measured against what actually sold, see the Earnings page.
      </p>

      {lowStock.length > 0 && (
        <div className="mt-8 rounded-xl border border-maroon-700/30 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-maroon-700">
              ⚠ Low Stock — restock soon
            </h2>
            <Link
              to="/admin/stock"
              className="text-xs font-semibold text-gold-700 hover:underline"
            >
              Record a delivery →
            </Link>
          </div>
          <ul className="divide-y divide-gold-500/20 text-sm">
            {lowStock.map((item) => (
              <li key={item.variantId} className="flex items-center justify-between py-2">
                <span className="text-brown-800">
                  {item.productName}{" "}
                  <span className="text-brown-500">({item.label})</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    item.stock === 0
                      ? "bg-maroon-700 text-white"
                      : "bg-maroon-700/10 text-maroon-700"
                  }`}
                >
                  {item.stock === 0 ? "OUT OF STOCK" : `${item.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
