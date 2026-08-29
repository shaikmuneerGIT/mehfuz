import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { useCart } from "../context/CartContext";
import { ProductImage } from "./ProductImage";
import { FiChevronDown, FiCheck, FiShoppingBag } from "react-icons/fi";

export function ProductCard({ product }: { product: Product }) {
  // Variants arrive sorted by price ascending, so the first one is the
  // smallest pack (250g for most products) — the default selection.
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const dropdownRef = useRef<HTMLSpanElement>(null);
  const { addLine } = useCart();
  const selected = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  // Close the pack-size dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const soldOut = product.variants.every((v) => v.stock === 0);

  /** Adds the selected pack straight from the card — no page visit needed. */
  function addSelectedToCart() {
    if (!selected || selected.stock === 0) return;
    addLine({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
      imageUrl: product.imageUrl,
      variantId: selected.id,
      variantLabel: selected.label,
      priceInr: selected.priceInr,
      quantity: 1,
      maxStock: selected.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      // The card lifts above its siblings while the pack dropdown is open —
      // the hover transform creates a stacking context, so without this the
      // open panel is painted under the next card in the grid.
      className={`group relative flex flex-col items-center text-center font-roboto transition-transform duration-300 hover:-translate-y-1 py-3 ${
        open ? "z-30" : ""
      }`}
    >
      {/* Product Image (Larger, Seamless without Card Box) */}
      <div className={`relative w-full aspect-square flex items-center justify-center p-2 ${soldOut ? "opacity-55 grayscale-[35%]" : ""}`}>
        <ProductImage
          name={product.name}
          categorySlug={product.category.slug}
          imageUrl={product.imageUrl}
          badge={product.badge}
          corners={false}
          className="bg-transparent border-none shadow-none p-0"
        />
        {soldOut && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brown-950/85 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cream-100 shadow-md">
            Out of Stock
          </span>
        )}
      </div>

      {/* Product Details (Larger, Clean Typography) */}
      <div className="mt-3 flex w-full flex-col items-center gap-1.5 font-roboto">
        <span className="text-xs font-bold uppercase tracking-widest text-forest-800 font-roboto">
          {product.category.name}
        </span>
        <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-brown-950 group-hover:text-gold-700 transition-colors">
          {product.name}
        </h3>
        {product.variants.length > 1 && selected && (
          <span
            ref={dropdownRef}
            className="relative mt-1 inline-block w-36"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-gold-500/50 bg-cream-50/90 py-1.5 pl-4 pr-3 text-xs font-semibold tracking-wide text-brown-900 shadow-sm transition hover:border-gold-500 focus:border-gold-500 focus:outline-none font-roboto"
            >
              <span>{selected.label}</span>
              <FiChevronDown
                className={`h-3.5 w-3.5 text-gold-700 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Options panel — fades and slides open */}
            <ul
              role="listbox"
              className={`absolute left-0 right-0 top-full z-20 mt-1.5 origin-top overflow-hidden rounded-xl border border-gold-500/40 bg-cream-50 shadow-lg transition-all duration-200 ease-out ${
                open
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-1 scale-95 opacity-0"
              }`}
            >
              {product.variants.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={v.id === variantId}
                    disabled={v.stock === 0}
                    onClick={() => {
                      setVariantId(v.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-xs font-medium transition font-roboto ${
                      v.stock === 0
                        ? "cursor-not-allowed text-brown-400"
                        : v.id === variantId
                          ? "bg-gold-500/15 font-semibold text-brown-950"
                          : "text-brown-800 hover:bg-cream-100"
                    }`}
                  >
                    <span>
                      {v.label}
                      {v.stock === 0 ? " — out of stock" : ""}
                    </span>
                    {v.id === variantId ? (
                      <FiCheck className="h-3.5 w-3.5 text-gold-700" />
                    ) : (
                      <span className="text-brown-500">{formatInr(v.priceInr)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </span>
        )}
        {selected && (
          <p className="mt-1 font-roboto text-base sm:text-lg font-extrabold text-brown-950">
            {formatInr(selected.priceInr)}
          </p>
        )}

        {/* Buy straight from the card; the surrounding Link must not fire. */}
        <button
          type="button"
          disabled={!selected || selected.stock === 0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addSelectedToCart();
          }}
          className={`mt-2 inline-flex w-36 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
            added
              ? "bg-forest-950 text-gold-300"
              : "metallic-gold-btn hover:brightness-105"
          }`}
        >
          {added ? (
            <>
              <FiCheck className="h-3.5 w-3.5" />
              Added
            </>
          ) : selected && selected.stock === 0 ? (
            "Out of stock"
          ) : (
            <>
              <FiShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
