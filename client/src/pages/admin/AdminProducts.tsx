import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { Product } from "../../types";
import { formatInr } from "../../lib/format";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<Product[]>("/admin/products")
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function setVisibility(id: string, isActive: boolean) {
    setError(null);
    await api.patch(`/admin/products/${id}/visibility`, { isActive });
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.delete(`/admin/products/${id}`);
      load();
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: { error?: string } } }).response;
      // A product with order history can't be deleted without destroying
      // those orders — offer to hide it from the shop instead.
      if (res?.status === 409) {
        if (confirm(`${res.data?.error ?? "This product cannot be deleted."}\n\nHide it from the shop instead?`)) {
          await setVisibility(id, false);
        }
        return;
      }
      setError(res?.data?.error ?? "Failed to delete product.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brown-950">Products</h1>
        <Link
          to="/admin/products/new"
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900"
        >
          + Add Product
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-maroon-700/40 bg-maroon-700/5 p-3 text-sm text-maroon-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-brown-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gold-500/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase tracking-wide text-brown-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price range</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const prices = p.variants.map((v) => v.priceInr);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return (
                  <tr key={p.id} className="border-t border-gold-500/20">
                    <td className="px-4 py-3 font-medium text-brown-950">{p.name}</td>
                    <td className="px-4 py-3 text-brown-700">{p.category.name}</td>
                    <td className="px-4 py-3 text-brown-700">
                      {prices.length === 0
                        ? "—"
                        : min === max
                          ? formatInr(min)
                          : `${formatInr(min)} – ${formatInr(max)}`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setVisibility(p.id, !p.isActive)}
                        title={p.isActive ? "Hide from shop" : "Show in shop"}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                          p.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {p.isActive ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="mr-3 font-medium text-gold-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="font-medium text-maroon-700 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
