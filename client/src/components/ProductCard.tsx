import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { ProductImage } from "./ProductImage";
import { FiArrowRight } from "react-icons/fi";

export function ProductCard({ product }: { product: Product }) {
  // Variants arrive sorted by price ascending, so the first one is the
  // smallest pack (250g for most products) — the default selection.
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const selected = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gold-500/40 bg-cream-50/90 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-500 hover:shadow-xl font-roboto"
    >
      <div className="border-b border-gold-500/30">
        <ProductImage
          name={product.name}
          categorySlug={product.category.slug}
          imageUrl={product.imageUrl}
          badge={product.badge}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4 text-center font-roboto">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-700 font-roboto">
          {product.category.name}
        </span>
        <h3 className="font-roboto text-base font-bold leading-snug text-brown-950 group-hover:text-forest-800 transition-colors">
          {product.name}
        </h3>
        {product.origin && <p className="text-xs text-brown-500 font-roboto">{product.origin}</p>}

        <div className="mt-auto pt-3">
          <span className="h-px w-full bg-gold-500/25 block" />
          {product.variants.length > 1 && (
            <select
              value={variantId}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onChange={(e) => {
                e.stopPropagation();
                setVariantId(e.target.value);
              }}
              className="mt-3 w-full rounded-lg border border-gold-500/40 bg-white px-2 py-1.5 text-center text-xs font-medium text-brown-800 font-roboto"
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.stock === 0}>
                  {v.label}
                  {v.stock === 0 ? " — out of stock" : ""}
                </option>
              ))}
            </select>
          )}
          <div className="mt-3 flex items-baseline justify-center gap-1.5 font-roboto">
            <span className="font-roboto text-lg font-bold text-brown-950">
              {formatInr(selected?.priceInr ?? 0)}
            </span>
          </div>
          <span className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-gold-700 opacity-0 transition-opacity group-hover:opacity-100 font-roboto">
            <span>View details</span>
            <FiArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
