import { Link } from "react-router-dom";
import { SectionTitle } from "../art/Ornaments";
import { FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";

const BLOGS = [
  {
    id: 1,
    title: "The Secrets of Sun-Dried Afghan Anjeer in Kandahar",
    category: "Harvest Story",
    date: "Aug 18, 2026",
    readTime: "4 min read",
    excerpt: "Discover how ancestral alpine harvesting techniques yield the world's sweet, plump, fiber-rich dried figs.",
    image: "/images/hero_banner_1.jpg",
  },
  {
    id: 2,
    title: "Unlocking Pure Kashmiri Laila Saffron: Saffron Purity Guide",
    category: "Purity & Wellness",
    date: "Aug 12, 2026",
    readTime: "5 min read",
    excerpt: "Learn how Pampore dawn harvests create deep crimson stigmas with unmatched aroma and high crocin content.",
    image: "/images/hero_banner_2.jpg",
  },
  {
    id: 3,
    title: "How to Store Premium Dry Fruits & Nuts for Maximum Freshness",
    category: "Storage Tips",
    date: "Aug 05, 2026",
    readTime: "3 min read",
    excerpt: "Expert tips on preserving crunch, natural oils, and essential Omega-3 fatty acids in your luxury dry fruit collection.",
    image: "/images/hero_banner_3.jpg",
  },
];

export function LatestBlogsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 font-roboto">
      <SectionTitle eyebrow="Harvest Journal">Latest Blogs &amp; Articles</SectionTitle>
      <div className="mt-10 grid gap-6 sm:grid-cols-3 font-roboto">
        {BLOGS.map((b) => (
          <Link
            key={b.id}
            to="/blog"
            className="group overflow-hidden rounded-2xl border border-gold-500/30 bg-cream-50/90 shadow-sm transition-all hover:-translate-y-1 hover:border-gold-500 hover:shadow-xl font-roboto flex flex-col cursor-pointer"
          >
            <div className="relative h-48 w-full overflow-hidden bg-brown-950">
              <img
                src={b.image}
                alt={b.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 rounded-full bg-brown-950/80 px-3 py-1 text-[11px] font-bold text-gold-300 backdrop-blur-sm border border-gold-500/30 font-roboto">
                {b.category}
              </div>
            </div>
            <div className="p-6 flex flex-1 flex-col justify-between font-roboto">
              <div>
                <div className="flex items-center gap-3 text-xs text-brown-500 font-roboto mb-2">
                  <span className="flex items-center gap-1 font-roboto">
                    <FiCalendar className="h-3.5 w-3.5 text-gold-600" />
                    {b.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-roboto">
                    <FiClock className="h-3.5 w-3.5 text-gold-600" />
                    {b.readTime}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-brown-950 group-hover:text-forest-800 transition-colors leading-snug">
                  {b.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-brown-700 leading-relaxed font-roboto">
                  {b.excerpt}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-gold-500/20 font-roboto">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 group-hover:text-forest-800 transition-colors font-roboto">
                  <span>Read Article</span>
                  <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
