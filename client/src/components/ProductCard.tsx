import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const cheapest = product.variants[0];

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gold-500/40 bg-cream-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg"
    >
      <div className="border-b border-gold-500/30">
        <ProductImage
          name={product.name}
          categorySlug={product.category.slug}
          imageUrl={product.imageUrl}
          badge={product.badge}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">
          {product.category.name}
        </span>
        <h3 className="font-display text-base font-semibold leading-snug text-brown-950">
          {product.name}
        </h3>
        {product.origin && <p className="text-xs text-brown-500">{product.origin}</p>}

        <div className="mt-auto pt-3">
          <span className="h-px w-full bg-gold-500/25" />
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className="text-xs text-brown-500">from</span>
            <span className="font-display text-lg font-bold text-brown-950">
              {formatInr(cheapest?.priceInr ?? 0)}
            </span>
          </div>
          <span className="mt-1 block text-xs font-medium text-gold-700 opacity-0 transition group-hover:opacity-100">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
