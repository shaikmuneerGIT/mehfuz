import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { ProductImage } from "./ProductImage";
import { FiChevronDown } from "react-icons/fi";

export function ProductCard({ product }: { product: Product }) {
  // Variants arrive sorted by price ascending, so the first one is the
  // smallest pack (250g for most products) — the default selection.
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const selected = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col items-center text-center font-roboto transition-transform duration-300 hover:-translate-y-1 py-3"
    >
      {/* Product Image (Larger, Seamless without Card Box) */}
      <div className="relative w-full aspect-square flex items-center justify-center p-2">
        <ProductImage
          name={product.name}
          categorySlug={product.category.slug}
          imageUrl={product.imageUrl}
          badge={product.badge}
          corners={false}
          className="bg-transparent border-none shadow-none p-0"
        />
      </div>

      {/* Product Details (Larger, Clean Typography) */}
      <div className="mt-3 flex w-full flex-col items-center gap-1.5 font-roboto">
        <span className="text-xs font-bold uppercase tracking-widest text-forest-800 font-roboto">
          {product.category.name}
        </span>
        <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-brown-950 group-hover:text-gold-700 transition-colors">
          {product.name}
        </h3>
        {product.variants.length > 1 && (
          <span
            className="relative mt-1 inline-block w-36"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <select
              value={variantId}
              onChange={(e) => {
                e.stopPropagation();
                setVariantId(e.target.value);
              }}
              className="w-full cursor-pointer appearance-none rounded-full border border-gold-500/50 bg-cream-50/90 py-1.5 pl-4 pr-8 text-center text-xs font-semibold tracking-wide text-brown-900 shadow-sm transition hover:border-gold-500 focus:border-gold-500 focus:outline-none font-roboto"
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.stock === 0}>
                  {v.label}
                  {v.stock === 0 ? " — out of stock" : ""}
                </option>
              ))}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold-700" />
          </span>
        )}
        {selected && (
          <p className="mt-1 font-roboto text-base sm:text-lg font-extrabold text-brown-950">
            {formatInr(selected.priceInr)}
          </p>
        )}
      </div>
    </Link>
  );
}
