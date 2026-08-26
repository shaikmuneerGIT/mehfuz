import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { Category, Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { PageBanner } from "../components/PageBanner";
import { FiSearch } from "react-icons/fi";

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

  const currentCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name ?? "Shop Catalog"
    : "Shop All Products";

  return (
    <div className="parchment min-h-screen font-roboto">
      {/* 200px Height Full-Width Header Banner */}
      <PageBanner
        title={currentCategoryName}
        subtitle="Handpicked premium dry fruits, Afghan anjeer, Kashmiri saffron, nuts & spices sourced directly at origin."
        breadcrumbs={[
          { label: "Shop", href: "/shop" },
          ...(activeCategory ? [{ label: currentCategoryName }] : []),
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-roboto">
        {/* Search & Category Filter Header Bar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between font-roboto">
          <form onSubmit={submitSearch} className="flex gap-2 w-full md:max-w-md font-roboto">
            <div className="relative w-full font-roboto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anjeer, saffron, almonds, coffee..."
                className="w-full rounded-full border border-gold-500/40 bg-white/90 pl-10 pr-4 py-2.5 text-sm text-brown-900 focus:border-gold-600 focus:outline-none font-roboto shadow-sm"
              />
              <FiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-brown-400" />
            </div>
            <button
              type="submit"
              className="rounded-full bg-forest-950 px-6 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-forest-900 font-roboto shrink-0 shadow-sm"
            >
              Search
            </button>
          </form>

          <p className="text-xs text-brown-600 font-roboto">
            Showing <strong className="text-brown-950 font-roboto">{products.length}</strong> products
          </p>
        </div>

        {/* Category Pill Filters */}
        <div className="mb-8 flex flex-wrap gap-2 font-roboto">
          <button
            onClick={() => selectCategory("")}
            className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition font-roboto cursor-pointer ${
              !activeCategory
                ? "border-forest-950 bg-forest-950 text-gold-300 shadow-sm"
                : "border-gold-500/40 bg-cream-50/90 text-brown-800 hover:bg-cream-100 hover:text-forest-800"
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCategory(c.slug)}
              className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition font-roboto cursor-pointer ${
                activeCategory === c.slug
                  ? "border-forest-950 bg-forest-950 text-gold-300 shadow-sm"
                  : "border-gold-500/40 bg-cream-50/90 text-brown-800 hover:bg-cream-100 hover:text-forest-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 text-center font-roboto">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold-600 border-t-transparent mb-3" />
            <p className="font-roboto text-brown-700 text-sm">Loading catalogue...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center font-roboto bg-cream-50/70 rounded-2xl border border-gold-500/20 p-8">
            <p className="font-roboto text-brown-800 font-semibold text-lg">No matching products found</p>
            <p className="font-roboto text-brown-600 text-xs mt-1">Try resetting your search filter or selecting another category.</p>
            <button
              onClick={() => {
                setQuery("");
                selectCategory("");
              }}
              className="mt-4 rounded-full bg-brown-950 px-5 py-2 text-xs font-bold text-gold-300 font-roboto"
            >
              View All Products
            </button>
          </div>
        ) : (
          {/* Flex rather than grid so a partial last row — or a category with
              a single product — stays centred instead of hugging the left. */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-roboto">
            {products.map((p) => (
              <div
                key={p.id}
                className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] md:w-[calc(25%-1.125rem)]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
