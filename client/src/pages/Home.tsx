import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Category, Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { ProductTile } from "../components/ProductTile";

const BENEFITS = [
  { title: "Rich in Dietary Fiber", desc: "Aids digestion and supports gut health." },
  { title: "Heart Health", desc: "High in potassium, helping to regulate blood pressure." },
  { title: "Bone Strength", desc: "Contains calcium and magnesium for strong bones." },
  { title: "Powerful Antioxidants", desc: "Fights cell damage and inflammation." },
  { title: "Boosts Energy", desc: "Provides sustained natural energy and vitality." },
  { title: "Iron Boost", desc: "Helps prevent anemia and increases oxygen flow." },
  { title: "Aids Weight Management", desc: "Promotes fullness and satiety." },
];

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Product[]>("/catalog/products?featured=true").then((res) => setFeatured(res.data));
    api.get<Category[]>("/catalog/categories").then((res) => setCategories(res.data));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold-500/30 bg-gradient-to-b from-cream-100 to-cream-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-gold-700">
              Premium Afghanistan Anjeer &amp; More
            </p>
            <h1 className="font-display gold-gradient-text text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              MEHFUZ
            </h1>
            <p className="font-display mt-1 text-lg text-brown-700 sm:text-xl">
              Premium Dry Fruits &amp; Commodities
            </p>
            <p className="mt-5 max-w-md text-brown-700">
              Handpicked Jumbo Anjeer from Afghanistan, snow-white Kashmiri walnuts, hand-picked
              Kashmiri saffron, and estate-roasted Chikmagalur coffee — sourced at the origin,
              delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-full bg-brown-950 px-6 py-3 text-sm font-semibold text-gold-300 shadow transition hover:bg-brown-900"
              >
                Shop All Products
              </Link>
              <Link
                to="/shop?category=figs-anjeer"
                className="rounded-full border border-gold-600 px-6 py-3 text-sm font-semibold text-gold-700 transition hover:bg-gold-50"
              >
                Shop Anjeer
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-full bg-gold-400/20 blur-2xl" />
            <ProductTile
              name="Anjeer"
              categorySlug="figs-anjeer"
              badge="Bestseller"
              className="relative aspect-square w-full rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-700">
                Handpicked
              </p>
              <h2 className="font-display text-2xl font-bold text-brown-950 sm:text-3xl">
                Featured Selection
              </h2>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-gold-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="border-y border-gold-500/30 bg-cream-100/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="font-display mb-8 text-2xl font-bold text-brown-950 sm:text-3xl">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/shop?category=${c.slug}`}
                className="group rounded-xl border border-gold-500/30 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <ProductTile name={c.name} categorySlug={c.slug} className="mx-auto mb-3 w-16 rounded-full" />
                <div className="font-display text-sm font-semibold text-brown-950 group-hover:text-gold-700">
                  {c.name}
                </div>
                <div className="text-xs text-brown-500">{c._count?.products ?? 0} products</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Health benefits */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display mb-10 text-center text-2xl font-bold text-brown-950 sm:text-3xl">
          Health Benefits of Anjeer
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-lg border border-gold-500/30 bg-white p-4"
            >
              <span className="mt-0.5 text-gold-600">✦</span>
              <div>
                <div className="font-semibold text-brown-950">{b.title}</div>
                <div className="text-sm text-brown-700">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-brown-950 py-14 text-center text-cream-100">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">For orders &amp; enquiries</h2>
        <p className="mt-3 text-lg">
          <a href="tel:+919848918992" className="text-gold-300 hover:underline">
            +91 98489 18992
          </a>
          {" / "}
          <a href="tel:+917013355940" className="text-gold-300 hover:underline">
            +91 70133 55940
          </a>
        </p>
      </section>
    </div>
  );
}
