import { HeroSlideshow } from "../components/HeroSlideshow";
import { PopularCategoriesSection } from "../components/home/PopularCategoriesSection";
import { FeaturedSelectionSection } from "../components/home/FeaturedSelectionSection";
import { TestimonialsSection } from "../components/home/TestimonialsSection";
import { LatestBlogsSection } from "../components/home/LatestBlogsSection";
import { FAQSection } from "../components/home/FAQSection";
import { QuickContactSection } from "../components/home/QuickContactSection";

export function Home() {
  return (
    <div className="parchment font-roboto">
      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* Popular Categories Marquee Scroller */}
      <PopularCategoriesSection />

      {/* Featured Selection (Single Row) */}
      <FeaturedSelectionSection />

      {/* Customer Reviews & Testimonials */}
      <TestimonialsSection />

      {/* Latest Blogs & Articles */}
      <LatestBlogsSection />

      {/* Frequently Asked Questions */}
      <FAQSection />

      {/* Speak with Our Sourcing Team */}
      <QuickContactSection />
    </div>
  );
}
