import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { ProductImage } from "./ProductImage";

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
            className="mt-1 w-40 rounded-lg border border-gold-500/40 bg-white px-2 py-1.5 text-center text-xs font-medium text-brown-800 font-roboto"
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.label}
                {v.stock === 0 ? " — out of stock" : ""}
              </option>
            ))}
          </select>
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
