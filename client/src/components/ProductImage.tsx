import { useState } from "react";
import { PRODUCT_ART, resolveArtKey } from "./art/ProductArt";
import { CornerFlourish } from "./art/Ornaments";

export function resolveProductImagePath(name: string, categorySlug?: string): string | null {
  const n = (name + " " + (categorySlug || "")).toLowerCase();

  // Dates
  if (n.includes("khudri")) return "/products/khudri_dates.png";
  if (n.includes("mabroom")) return "/products/mabroom_dates.png";
  if (n.includes("mashooq")) return "/products/mashooq_dates.png";
  if (n.includes("medjool") || n.includes("medjol")) return "/products/medjol_dates.png";
  if (n.includes("safawi")) return "/products/safawi_dates.png";
  if (n.includes("tunisian")) return "/products/tunisian_dates.png";
  if (n.includes("date")) return "/products/medjol_dates.png";

  // Figs / Anjeer
  if (n.includes("anjeer") || n.includes("fig")) return "/products/anjeer.png";

  // Nuts
  if (n.includes("almond") || n.includes("badam")) return "/products/almonds.png";
  if (n.includes("walnut") || n.includes("akhrot")) return "/products/walnut.png";
  if (n.includes("cashew") || n.includes("kaju")) return "/products/cashews.png";
  if (n.includes("pista") || n.includes("pistachio")) return "/products/pistachios.png";

  // Raisins
  if (n.includes("black raisin") || n.includes("black-raisin")) return "/products/raisins_black.png";
  if (n.includes("raisin") || n.includes("kishmish")) return "/products/raisins_yellow.png";

  // Fruits & Berries & Makhana
  if (n.includes("apricot")) return "/products/apricot.png";
  if (n.includes("black berry") || n.includes("blackberry") || n.includes("plum")) return "/products/blackberry_plum.png";
  if (n.includes("blueberry")) return "/products/blueberry.png";
  if (n.includes("kiwi")) return "/products/dry_kiwi_green.png";
  if (n.includes("amla")) return "/products/dry_sweet_amla.png";
  if (n.includes("makhana")) return "/products/phool_makhana.png";

  // Seeds
  if (n.includes("pumpkin")) return "/products/pumpkin_seeds.png";
  if (n.includes("watermelon")) return "/products/watermelon_seeds.png";
  if (n.includes("seed")) return "/products/pumpkin_seeds.png";

  // Saffron
  if (n.includes("saffron") || n.includes("kesar")) return "/products/saffron.png";

  // Category Fallbacks
  if (categorySlug === "dates") return "/products/medjol_dates.png";
  if (categorySlug === "figs-anjeer") return "/products/anjeer.png";
  if (categorySlug === "nuts") return "/products/almonds.png";
  if (categorySlug === "raisins") return "/products/raisins_yellow.png";
  if (categorySlug === "dried-fruits-berries") return "/products/apricot.png";
  if (categorySlug === "seeds") return "/products/pumpkin_seeds.png";
  if (categorySlug === "saffron-kesar") return "/products/saffron.png";

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
