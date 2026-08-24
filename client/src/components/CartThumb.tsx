import { useState } from "react";
import type { CartLine } from "../types";
import { resolveProductImagePath } from "./ProductImage";
import { FiShoppingBag } from "react-icons/fi";

export function cartLineImage(l: CartLine): string | null {
  return l.imageUrl || resolveProductImagePath(l.productName);
}

export function CartThumb({
  src,
  alt,
  size = "md",
}: {
  src: string | null;
  alt: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const box = size === "sm" ? "h-12 w-12" : "h-20 w-20";
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold-500/30 bg-cream-50`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <FiShoppingBag className="h-5 w-5 text-gold-500/60" />
      )}
    </div>
  );
}
