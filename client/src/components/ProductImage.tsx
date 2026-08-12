import { useState } from "react";
import { PRODUCT_ART, resolveArtKey } from "./art/ProductArt";
import { CornerFlourish } from "./art/Ornaments";

/**
 * Renders a product's photograph when it has one, and a hand-drawn
 * illustration on a warm parchment ground when it doesn't. A photo that
 * fails to load falls back to the illustration rather than a broken image.
 */
export function ProductImage({
  name,
  categorySlug,
  imageUrl,
  badge,
  className = "",
  corners = true,
}: {
  name: string;
  categorySlug?: string;
  imageUrl?: string | null;
  badge?: string | null;
  className?: string;
  corners?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const Art = PRODUCT_ART[resolveArtKey(name, categorySlug)];
  const showPhoto = imageUrl && !failed;

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200 ${className}`}
    >
      {showPhoto ? (
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          {/* soft radial glow behind the illustration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(232,189,94,0.28),transparent_65%)]" />
          <Art className="relative h-full w-full p-[12%]" />
          {corners && (
            <>
              <CornerFlourish className="pointer-events-none absolute left-1 top-1 h-6 w-6 text-gold-600/45" />
              <CornerFlourish className="pointer-events-none absolute right-1 top-1 h-6 w-6 -scale-x-100 text-gold-600/45" />
              <CornerFlourish className="pointer-events-none absolute bottom-1 left-1 h-6 w-6 -scale-y-100 text-gold-600/45" />
              <CornerFlourish className="pointer-events-none absolute bottom-1 right-1 h-6 w-6 -scale-100 text-gold-600/45" />
            </>
          )}
        </>
      )}

      {badge && (
        <span className="absolute left-2 top-2 rounded-full border border-gold-300/60 bg-brown-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-300 shadow-sm">
          {badge}
        </span>
      )}
    </div>
  );
}
