import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { ProductTile } from "./ProductTile";

export function ProductCard({ product }: { product: Product }) {
  const cheapest = product.variants[0];

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gold-500/30 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <ProductTile
        name={product.name}
        categorySlug={product.category.slug}
        badge={product.badge}
        className="rounded-none rounded-t-xl border-x-0 border-t-0"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-gold-700">
          {product.category.name}
        </span>
        <h3 className="font-display text-lg font-semibold leading-tight text-brown-950">
          {product.name}
        </h3>
        {product.origin && (
          <p className="text-xs text-brown-500">{product.origin}</p>
        )}
        <div className="mt-auto flex items-baseline justify-between pt-3">
          <span className="text-sm text-brown-700">
            From <span className="font-semibold text-brown-950">{formatInr(cheapest?.priceInr ?? 0)}</span>
          </span>
          <span className="text-xs font-medium text-gold-700 group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
