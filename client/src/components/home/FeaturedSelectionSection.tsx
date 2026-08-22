import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { Product } from "../../types";
import { ProductCard } from "../ProductCard";
import { SectionTitle } from "../art/Ornaments";
import { FiArrowRight } from "react-icons/fi";

export function FeaturedSelectionSection() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    api.get<Product[]>("/catalog/products?featured=true").then((res) => setFeatured(res.data));
  }, []);

  const featuredOneRow = featured.slice(0, 4);

  if (featuredOneRow.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 font-roboto">
      <SectionTitle eyebrow="Handpicked Harvest">Featured Selection</SectionTitle>
      {/* Exactly 1 Row Grid (4 items max) */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 font-roboto">
        {featuredOneRow.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-10 text-center font-roboto">
        <Link
          to="/shop"
          className="metallic-gold-btn inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold tracking-wide transition-all transform hover:scale-105 shadow-md font-roboto"
        >
          <span>View Full Catalog</span>
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
