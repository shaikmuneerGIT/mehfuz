import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { Category } from "../../types";
import { SectionTitle } from "../art/Ornaments";

export function PopularCategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Category[]>("/catalog/categories").then((res) => setCategories(res.data));
  }, []);

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
          {[...categories, ...categories].map((c, index) => {
            const s = (c.slug + " " + c.name).toLowerCase();
            let photoUrl = "/images/realistic_dry_fruits_banner_1.jpg";
            if (s.includes("fig") || s.includes("anjeer")) photoUrl = "/images/hero_banner_1.jpg";
            else if (s.includes("saffron") || s.includes("kesar")) photoUrl = "/images/hero_banner_2.jpg";
            else if (s.includes("nut") || s.includes("walnut") || s.includes("almond") || s.includes("pista")) photoUrl = "/images/hero_banner_3.jpg";
            else if (s.includes("date")) photoUrl = "/images/hero_banner_4.jpg";
            else if (s.includes("coffee") || s.includes("spice")) photoUrl = "/images/realistic_dry_fruits_banner_2.jpg";

            return (
              <Link
                key={`${c.id}-${index}`}
                to={`/shop?category=${c.slug}`}
                className="ai-category-card group flex shrink-0 flex-col items-center justify-center rounded-2xl border border-gold-500/40 bg-cream-50/95 p-4 shadow-sm min-w-[160px] sm:min-w-[180px] text-center font-roboto"
              >
                {/* Top Original Realistic Picture */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-gold-500/60 p-0.5 shadow-md bg-white overflow-hidden group-hover:border-gold-600 transition-colors">
                  <img
                    src={photoUrl}
                    alt={c.name}
                    className="h-full w-full object-cover rounded-xl transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Bottom Category Name Only */}
                <div className="mt-3 font-serif text-sm sm:text-base font-bold text-brown-950 group-hover:text-forest-800 transition-colors leading-snug">
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
