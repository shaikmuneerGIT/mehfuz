import { useState } from "react";
import { PRODUCT_ART, resolveArtKey } from "./art/ProductArt";
import { CornerFlourish } from "./art/Ornaments";

export function resolveProductImagePath(name: string, categorySlug?: string): string | null {
  const n = (name + " " + (categorySlug || "")).toLowerCase();

  // Dates
  if (n.includes("khudri")) return "/products/khudri_dates.webp";
  if (n.includes("mabroom")) return "/products/mabroom_dates.webp";
  if (n.includes("mashooq")) return "/products/mashooq_dates.webp";
  if (n.includes("medjool") || n.includes("medjol")) return "/products/medjol_dates.webp";
  if (n.includes("safawi")) return "/products/safawi_dates.webp";
  if (n.includes("tunisian")) return "/products/tunisian_dates.webp";
  if (n.includes("date")) return "/products/medjol_dates.webp";

  // Figs / Anjeer
  if (n.includes("anjeer") || n.includes("fig")) return "/products/anjeer.webp";

  // Nuts
  if (n.includes("almond") || n.includes("badam")) return "/products/almonds.webp";
  if (n.includes("walnut") || n.includes("akhrot")) return "/products/walnut.webp";
  if (n.includes("cashew") || n.includes("kaju")) return "/products/cashews.webp";
  if (n.includes("pista") || n.includes("pistachio")) return "/products/pistachios.webp";

  // Raisins
  if (n.includes("black raisin") || n.includes("black-raisin")) return "/products/raisins_black.webp";
  if (n.includes("raisin") || n.includes("kishmish")) return "/products/raisins_yellow.webp";

  // Fruits & Berries & Makhana
  if (n.includes("apricot")) return "/products/apricot.webp";
  if (n.includes("black berry") || n.includes("blackberry") || n.includes("plum")) return "/products/blackberry_plum.webp";
  if (n.includes("blueberry")) return "/products/blueberry.webp";
  if (n.includes("kiwi")) return "/products/dry_kiwi_green.webp";
  if (n.includes("amla")) return "/products/dry_sweet_amla.webp";
  if (n.includes("makhana")) return "/products/phool_makhana.webp";

  // Seeds
  if (n.includes("pumpkin")) return "/products/pumpkin_seeds.webp";
  if (n.includes("watermelon")) return "/products/watermelon_seeds.webp";
  if (n.includes("seed")) return "/products/pumpkin_seeds.webp";

  // Saffron
  if (n.includes("saffron") || n.includes("kesar")) return "/products/saffron.webp";

  // Category Fallbacks
  if (categorySlug === "dates") return "/products/medjol_dates.webp";
  if (categorySlug === "figs-anjeer") return "/products/anjeer.webp";
  if (categorySlug === "nuts") return "/products/almonds.webp";
  if (categorySlug === "raisins") return "/products/raisins_yellow.webp";
  if (categorySlug === "dried-fruits-berries") return "/products/apricot.webp";
  if (categorySlug === "seeds") return "/products/pumpkin_seeds.webp";
  if (categorySlug === "saffron-kesar") return "/products/saffron.webp";

  return null;
}

/**
 * Renders a product's photograph from public/products (or provided imageUrl),
 * falling back to hand-drawn illustrations if image loading fails.
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

  const photoSrc = imageUrl || resolveProductImagePath(name, categorySlug);
  const showPhoto = photoSrc && !failed;

  const bgClass = className.includes("bg-")
    ? className
    : `bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200 ${className}`;

  return (
    <div className={`relative aspect-square overflow-hidden flex items-center justify-center ${bgClass}`}>
      {showPhoto ? (
        <img
          src={photoSrc}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain filter drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
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
        <span className="absolute left-2 top-2 rounded-full border border-gold-400/60 bg-forest-950/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold-300 shadow-md">
          {badge}
        </span>
      )}
    </div>
  );
}
