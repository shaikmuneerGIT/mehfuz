import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { Category } from "../../types";
import { SectionTitle } from "../art/Ornaments";
import { PRODUCT_ART, resolveArtKey } from "../art/ProductArt";

export function PopularCategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Category[]>("/catalog/categories").then((res) => setCategories(res.data));
  }, []);

  // Categories the admin has hidden from the home page drop out here; the
  // API already returns them in the admin-set order.
  const shown = categories.filter((c) => c.showOnHome !== false);
  if (shown.length === 0) return null;

  return (
    <section className="border-b border-gold-500/30 bg-cream-100/60 py-12 sm:py-16 font-roboto overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 font-roboto mb-8 text-center">
        <SectionTitle eyebrow="Curated Selection">Popular Categories</SectionTitle>
        <p className="mt-2 text-xs sm:text-sm text-brown-700 font-roboto">
          Hover over any category to pause &amp; explore our harvest catalogue
        </p>
      </div>

      {/* Infinite Continuous Marquee Track Container */}
      <div className="relative w-full overflow-hidden py-4 before:pointer-events-none before:absolute before:left-0 before:top-0 before:bottom-0 before:w-20 before:bg-gradient-to-r before:from-cream-100 before:to-transparent before:z-10 after:pointer-events-none after:absolute after:right-0 after:top-0 after:bottom-0 after:w-20 after:bg-gradient-to-l after:from-cream-100 after:to-transparent after:z-10">
        <div className="ai-marquee-track flex gap-5 px-4">
          {[...shown, ...shown].map((c, index) => {
            const s = (c.slug + " " + c.name).toLowerCase();
            // An admin-uploaded photo always wins; otherwise fall back to the
            // built-in product photo that matches the category.
            let photoUrl: string | null = c.imageUrl || null;

            if (photoUrl) {
              /* admin-managed */
            } else if (s.includes("coffee")) photoUrl = "/products/coffee.webp?v=4";
            else if (s.includes("spice") || s.includes("chilli") || s.includes("pepper"))
              photoUrl = "/products/red_chilli_powder.webp?v=3";
            else if (s.includes("date")) photoUrl = "/products/medjol_dates.webp?v=3";
            else if (s.includes("fig") || s.includes("anjeer")) photoUrl = "/products/anjeer.webp?v=3";
            else if (s.includes("walnut")) photoUrl = "/products/walnut.webp?v=3";
            else if (s.includes("almond") || s.includes("badam")) photoUrl = "/products/almonds.webp?v=3";
            else if (s.includes("cashew") || s.includes("pista") || (s.includes("nut") && !s.includes("date") && !s.includes("seed"))) photoUrl = "/products/almonds.webp?v=3";
            else if (s.includes("black") || s.includes("berry")) photoUrl = "/products/raisins_black.webp?v=3";
            else if (s.includes("raisin") || s.includes("kishmish")) photoUrl = "/products/raisins_yellow.webp?v=3";
            else if (s.includes("dried-fruit") || s.includes("apricot")) photoUrl = "/products/apricot.webp?v=3";
            else if (s.includes("seed")) photoUrl = "/products/pumpkin_seeds.webp?v=3";
            else if (s.includes("saffron") || s.includes("kesar")) photoUrl = "/products/saffron.webp?v=3";

            const Art = PRODUCT_ART[resolveArtKey("", c.slug)];

            return (
              <Link
                key={`${c.id}-${index}`}
                to={`/shop?category=${c.slug}`}
                className="group flex shrink-0 flex-col items-center justify-center p-3 min-w-[180px] sm:min-w-[210px] text-center font-roboto transition-transform duration-300"
              >
                {/* Large Clean Category Product Image without Card Box */}
                <div className="relative h-32 w-32 sm:h-40 sm:w-40 flex items-center justify-center overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={c.name}
                      className="h-full w-full object-contain filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <Art className="h-full w-full p-1.5 transform group-hover:scale-110 transition-transform duration-500" />
                  )}
                </div>

                {/* Larger Category Name */}
                <div className="mt-3 font-serif text-base sm:text-lg font-bold text-brown-950 group-hover:text-gold-700 transition-colors leading-snug">
                  {c.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
