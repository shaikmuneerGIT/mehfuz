import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Category, Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { Divider, Fleuron, OrnateFrame, SectionTitle } from "../components/art/Ornaments";
import { PRODUCT_ART, resolveArtKey } from "../components/art/ProductArt";

const BENEFITS = [
  { title: "Rich in Dietary Fiber", desc: "Aids digestion and supports gut health." },
  { title: "Heart Health", desc: "High in potassium, helping to regulate blood pressure." },
  { title: "Bone Strength", desc: "Contains calcium and magnesium for strong bones." },
  { title: "Powerful Antioxidants", desc: "Fights cell damage and inflammation." },
  { title: "Boosts Energy", desc: "Provides sustained natural energy and vitality." },
  { title: "Iron Boost", desc: "Helps prevent anemia and increases oxygen flow." },
  { title: "Aids Weight Management", desc: "Promotes fullness and satiety." },
];

const PROVENANCE = [
  { title: "Anjeer", desc: "Premium jumbo figs, handpicked in Afghanistan." },
  { title: "Saffron", desc: "Cultivated and crafted in the Kashmiri valleys." },
  { title: "Walnut", desc: "Snow-white kernels from the Kashmir valley." },
  { title: "Coffee", desc: "Grown and roasted in the Chikmagalur hills." },
  { title: "Black Pepper", desc: "Sun-dried in Coorg, Karnataka." },
  { title: "Red Chilli", desc: "Handpicked Guntur Teja, no added colour." },
];

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Product[]>("/catalog/products?featured=true").then((res) => setFeatured(res.data));
    api.get<Category[]>("/catalog/categories").then((res) => setCategories(res.data));
  }, []);

  return (
    <div className="parchment">
      {/* ------------------------------- Hero ------------------------------ */}
      <section className="relative overflow-hidden border-b border-gold-500/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <OrnateFrame className="bg-cream-50/70 shadow-[0_2px_24px_rgba(138,94,31,0.10)]">
            <div className="grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-12 md:grid-cols-2">
              <div className="text-center md:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-700">
                  Premium Afghanistan Anjeer
                </p>
                <h1 className="font-display gold-gradient-text mt-3 text-5xl font-bold tracking-[0.06em] sm:text-6xl">
                  MEHFUZ
                </h1>
                <p className="font-display mt-2 text-lg text-brown-700 sm:text-xl">
                  Premium Dry Fruits &amp; Commodities
                </p>
                <Divider className="mx-auto mt-5 max-w-[240px] md:mx-0" />
                <p className="mt-5 text-brown-700">
                  Handpicked jumbo anjeer from Afghanistan, snow-white Kashmiri walnuts,
                  hand-picked Kashmiri saffron, and estate-roasted Chikmagalur coffee —
                  sourced at the origin, delivered to your door.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                  <Link
                    to="/shop"
                    className="rounded-full bg-brown-950 px-7 py-3 text-sm font-semibold tracking-wide text-gold-300 shadow-md transition hover:bg-brown-900"
                  >
                    Shop All Products
                  </Link>
                  <Link
                    to="/shop?category=figs-anjeer"
                    className="rounded-full border border-gold-600 px-7 py-3 text-sm font-semibold tracking-wide text-gold-700 transition hover:bg-gold-400/10"
                  >
                    Shop Anjeer
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
                <div className="absolute -inset-6 rounded-full bg-gold-400/25 blur-3xl" />
                <OrnateFrame className="relative bg-cream-50">
                  <ProductImage
                    name="Anjeer"
                    categorySlug="figs-anjeer"
                    badge="Bestseller"
                    corners={false}
                    className="rounded-[6px]"
                  />
                </OrnateFrame>
              </div>
            </div>
          </OrnateFrame>
        </div>
      </section>

      {/* --------------------------- Featured ------------------------------ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="Handpicked">Featured Selection</SectionTitle>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/shop"
              className="text-sm font-semibold tracking-wide text-gold-700 hover:underline"
            >
              View the full catalog →
            </Link>
          </div>
        </section>
      )}

      {/* -------------------------- Categories ----------------------------- */}
      <section className="border-y border-gold-500/40 bg-cream-100/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="Our Range">Shop by Category</SectionTitle>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((c) => {
              const Art = PRODUCT_ART[resolveArtKey(c.name, c.slug)];
              return (
                <Link
                  key={c.id}
                  to={`/shop?category=${c.slug}`}
                  className="group rounded-lg border border-gold-500/40 bg-cream-50 p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-md"
                >
                  <div className="mx-auto mb-3 h-16 w-16 rounded-full border border-gold-500/40 bg-gradient-to-br from-cream-100 to-cream-200 p-2">
                    <Art className="h-full w-full" />
                  </div>
                  <div className="font-display text-sm font-semibold text-brown-950 group-hover:text-gold-700">
                    {c.name}
                  </div>
                  <div className="mt-0.5 text-xs text-brown-500">
                    {c._count?.products ?? 0} products
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------- Provenance ----------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionTitle eyebrow="Sourced at the Origin">Where Our Goods Come From</SectionTitle>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {PROVENANCE.map((p) => (
            <div
              key={p.title}
              className="rounded-lg border border-gold-500/35 bg-cream-50 p-5 text-center"
            >
              <Fleuron className="mx-auto mb-2 h-3 w-3 text-gold-600" />
              <div className="font-display text-base font-semibold text-brown-950">{p.title}</div>
              <p className="mt-1 text-sm text-brown-700">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------- Health benefits --------------------------- */}
      <section className="border-t border-gold-500/40 bg-cream-100/50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="Wellness">Health Benefits of Anjeer</SectionTitle>
          <OrnateFrame className="mt-10 bg-cream-50">
            <ul className="divide-y divide-gold-500/20 px-6 py-4 sm:px-10">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-start gap-3 py-3.5">
                  <Fleuron className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-600" />
                  <p className="text-sm text-brown-700 sm:text-base">
                    <span className="font-semibold uppercase tracking-wide text-brown-950">
                      {b.title}:
                    </span>{" "}
                    {b.desc}
                  </p>
                </li>
              ))}
            </ul>
          </OrnateFrame>
        </div>
      </section>

      {/* ---------------------------- Contact ------------------------------ */}
      <section className="relative bg-brown-950 py-16 text-center text-cream-100">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">
            Get in touch
          </p>
          <h2 className="font-display mt-3 text-2xl font-bold sm:text-3xl">
            For Orders &amp; Enquiries
          </h2>
          <Divider className="mx-auto mt-4 max-w-[220px] opacity-80" />
          <p className="mt-5 font-display text-xl sm:text-2xl">
            <a href="tel:+919848918992" className="text-gold-300 hover:underline">
              +91 98489 18992
            </a>
            <span className="mx-2 text-cream-100/40">/</span>
            <a href="tel:+917013355940" className="text-gold-300 hover:underline">
              +91 70133 55940
            </a>
          </p>
          <p className="mt-4 text-sm text-cream-100/60">
            Available at Mehfuz Premium Dry Fruits &amp; Commodities
          </p>
        </div>
      </section>
    </div>
  );
}
