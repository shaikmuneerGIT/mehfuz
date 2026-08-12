import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { Category, Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { Divider } from "../components/art/Ornaments";

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Category[]>("/catalog/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    api
      .get<Product[]>(`/catalog/products?${params.toString()}`)
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [activeCategory, searchParams]);

  function selectCategory(slug: string) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next);
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (query) next.set("q", query);
    else next.delete("q");
    setSearchParams(next);
  }

  return (
    <div className="parchment min-h-screen">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-700">Catalog</p>
          <h1 className="font-display mt-1 text-3xl font-bold text-brown-950">
            {activeCategory
              ? (categories.find((c) => c.slug === activeCategory)?.name ?? "Shop")
              : "Shop All Products"}
          </h1>
          <Divider className="mt-3 max-w-[200px]" />
        </div>
        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full min-w-[200px] rounded-full border border-gold-500/50 bg-white px-4 py-2 text-sm focus:border-gold-600 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-brown-950 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => selectCategory("")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            !activeCategory
              ? "border-brown-950 bg-brown-950 text-gold-300"
              : "border-gold-500/50 text-brown-700 hover:bg-cream-100"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.slug)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === c.slug
                ? "border-brown-950 bg-brown-950 text-gold-300"
                : "border-gold-500/50 text-brown-700 hover:bg-cream-100"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-brown-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-brown-500">No products found.</p>
      ) : (
        <>
          <p className="mb-4 text-xs text-brown-500">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  );
}
