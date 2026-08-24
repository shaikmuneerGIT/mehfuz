import { PageBanner } from "../components/PageBanner";
import { FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";

const BLOG_POSTS = [
  {
    id: 1,
    title: "The Secrets of Sun-Dried Afghan Anjeer in Kandahar",
    category: "Harvest Story",
    date: "Aug 18, 2026",
    readTime: "4 min read",
    excerpt: "Discover how ancestral alpine harvesting techniques in Kandahar yield the world's sweet, plump, fiber-rich dried figs.",
    image: "/images/hero_banner_1.webp?v=3",
  },
  {
    id: 2,
    title: "Unlocking Pure Kashmiri Laila Saffron: Saffron Purity Guide",
    category: "Purity & Wellness",
    date: "Aug 12, 2026",
    readTime: "5 min read",
    excerpt: "Learn how Pampore dawn harvests create deep crimson stigmas with unmatched aroma and high crocin testing.",
    image: "/images/hero_banner_2.webp?v=3",
  },
  {
    id: 3,
    title: "How to Store Premium Dry Fruits & Nuts for Maximum Freshness",
    category: "Storage Tips",
    date: "Aug 05, 2026",
    readTime: "3 min read",
    excerpt: "Expert tips on preserving crunch, natural oils, and essential Omega-3 fatty acids in your luxury dry fruit collection.",
    image: "/images/hero_banner_3.webp?v=3",
  },
  {
    id: 4,
    title: "Chikmagalur Coffee & Coorg Black Pepper: Estate Harvest Tradition",
    category: "Origin Provenance",
    date: "Jul 28, 2026",
    readTime: "4 min read",
    excerpt: "Explore shade-grown Arabica coffee and bold sun-dried black peppercorns harvested in the misty Western Ghats.",
    image: "/images/realistic_dry_fruits_banner_2.webp?v=3",
  },
  {
    id: 5,
    title: "The Nutritional Power of Snow-White Kashmiri Walnuts",
    category: "Health & Nutrition",
    date: "Jul 20, 2026",
    readTime: "3 min read",
    excerpt: "Why organic shell-cracked Kashmiri walnut kernels are essential for brain health, heart vitality, and daily energy.",
    image: "/images/realistic_dry_fruits_banner_1.webp?v=3",
  },
  {
    id: 6,
    title: "Corporate & Wedding Hampers: The Art of Gifting Purity",
    category: "Luxury Gifting",
    date: "Jul 15, 2026",
    readTime: "4 min read",
    excerpt: "A guide to crafting personalized wooden gift hampers with premium dry fruits, dates, and saffron for festive occasions.",
    image: "/images/hero_banner_4.webp?v=3",
  },
];

export function Blog() {
  return (
    <div className="parchment min-h-screen font-roboto">
      {/* 200px Height Full-Width Header Banner */}
      <PageBanner
        image="/images/hero_banner_3.webp?v=3"
        title="Harvest Journal & Articles"
        subtitle="Insights into direct origin sourcing, purity testing, healthy living & luxury gift hampers."
        breadcrumbs={[{ label: "Blog" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 font-roboto">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 font-roboto">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gold-500/30 bg-cream-50/90 shadow-sm transition-all hover:-translate-y-1 hover:border-gold-500 hover:shadow-xl font-roboto"
            >
              <div className="relative h-52 w-full overflow-hidden bg-brown-950">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 rounded-full bg-brown-950/80 px-3 py-1 text-[11px] font-bold text-gold-300 backdrop-blur-sm border border-gold-500/30">
                  {post.category}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6 font-roboto">
                <div>
                  <div className="flex items-center gap-3 text-xs text-brown-500 font-roboto mb-2">
                    <span className="flex items-center gap-1 font-roboto">
                      <FiCalendar className="h-3.5 w-3.5 text-gold-600" />
                      {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-roboto">
                      <FiClock className="h-3.5 w-3.5 text-gold-600" />
                      {post.readTime}
                    </span>
                  </div>

                  <h2 className="font-serif text-lg font-bold text-brown-950 group-hover:text-forest-800 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-brown-700 leading-relaxed font-roboto">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-gold-500/20 font-roboto">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 group-hover:text-forest-800 transition-colors font-roboto">
                    <span>Read Full Article</span>
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
