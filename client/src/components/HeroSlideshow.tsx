import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiGrid, FiStar } from "react-icons/fi";

export interface SlideItem {
  id: string;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
}

const SLIDES: SlideItem[] = [
  {
    id: "anjeer",
    image: "/images/hero_banner_1.jpg",
    tag: "Natural Harvest 2026",
    title: "Handpicked Afghan Premium Anjeer",
    subtitle:
      "Sun-dried in Kandahar & Herat orchards — naturally rich in dietary fiber, iron, and vitality.",
    ctaText: "Shop Anjeer & Nuts",
    ctaLink: "/shop?category=figs-anjeer",
    badge: "100% Pure Origin",
  },
  {
    id: "saffron",
    image: "/images/hero_banner_2.jpg",
    tag: "Kashmiri Valley Reserve",
    title: "Pure Crimson Saffron & Snow Walnuts",
    subtitle:
      "Directly harvested from Pampore saffron fields — supreme aroma, deep crimson strands, and snow-white walnut kernels.",
    ctaText: "Explore Pure Saffron",
    ctaLink: "/shop?category=saffron-kesar",
    badge: "Grade-1 Laila Saffron",
  },
  {
    id: "dates",
    image: "/images/hero_banner_3.jpg",
    tag: "Royal Collection",
    title: "Premium Medjool Dates & Roasted Pistachios",
    subtitle:
      "Succulent Medjool & Safawi dates paired with California roasted green pistachios & macadamia nuts.",
    ctaText: "Discover Royal Dates",
    ctaLink: "/shop?category=dates",
    badge: "Harvest Fresh",
  },
  {
    id: "gifting",
    image: "/images/hero_banner_4.jpg",
    tag: "Artisanal Luxury Gifting",
    title: "Exclusive Dry Fruit & Spice Hampers",
    subtitle:
      "Handcrafted wooden boxes packed with estate-roasted Chikmagalur coffee, Coorg black pepper & premium nuts.",
    ctaText: "Explore All Hampers",
    ctaLink: "/shop",
    badge: "Signature Hampers",
  },
];

const AUTOPLAY_INTERVAL = 6000; // 6 seconds per slide

export function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Continuous auto-play timer (never stops)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const activeSlide = SLIDES[currentIndex];

  return (
    <section
      aria-label="Hero Showcase Slideshow"
      className="relative overflow-hidden bg-brown-950 border-b border-gold-500/30 text-cream-100 min-h-[460px] sm:min-h-[540px] md:min-h-[580px] flex items-center select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images with Alternating Zoom-In & Zoom-Out Animations */}
      {SLIDES.map((slide, index) => {
        const isActive = index === currentIndex;
        const zoomAnimationClass = index % 2 === 0 ? "animate-zoom-in" : "animate-zoom-out";

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
          >
            {/* Image with alternating smooth zoom-in / zoom-out animation */}
            <img
              src={slide.image}
              alt={slide.title}
              className={`h-full w-full object-cover object-center ${isActive ? zoomAnimationClass : "scale-100"
                }`}
            />
            {/* Multi-stage Gradient Overlays for readable text & luxury atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-r from-brown-950/40 via-brown-950/60 to-transparent md:w-3/4" />
            <div className="absolute inset-0 bg-gradient-to-t from-brown-950/10 via-transparent to-brown-950/10" />
          </div>
        );
      })}

      {/* Slide Content Container */}
      <div className="relative z-20 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 w-full">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-brown-900/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300 shadow-md backdrop-blur-md transition-all duration-500 transform translate-y-0">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
            {activeSlide.tag}
            <span className="text-gold-400/60">•</span>
            <div className="flex items-center gap-1 text-cream-100/90">
              <FiStar className="h-3 w-3 text-gold-400 fill-gold-400" />
              <span>{activeSlide.badge}</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15] drop-shadow-md">
            {activeSlide.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-cream-100/85 leading-relaxed max-w-xl font-light">
            {activeSlide.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={activeSlide.ctaLink}
              className="metallic-gold-btn inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold tracking-wide transition-all transform hover:scale-105 shadow-xl"
            >
              <span>{activeSlide.ctaText}</span>
              <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-gold-400/50 bg-brown-900/60 px-6 py-3.5 text-sm font-semibold text-gold-200 transition hover:bg-gold-500/20 hover:border-gold-400 hover:text-white backdrop-blur-sm"
            >
              <FiGrid className="h-4 w-4" />
              <span>View Catalogue</span>
            </Link>
          </div>
        </div>
      </div>


      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/30 bg-brown-950/60 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 hover:border-gold-400 backdrop-blur-md shadow-lg"
      >
        <FiChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/30 bg-brown-950/60 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 hover:border-gold-400 backdrop-blur-md shadow-lg"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Indicators & Progress Bar */}
      <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 flex items-center gap-3">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              className={`group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all duration-300 ${isActive
                ? "bg-gold-500 text-brown-950 font-bold shadow-md"
                : "bg-brown-900/80 text-gold-300/80 hover:bg-brown-800 hover:text-gold-200 border border-gold-500/20"
                }`}
            >
              <span>0{index + 1}</span>
              {isActive && <span className="hidden sm:inline text-[11px] truncate max-w-[120px]">{slide.tag}</span>}
              {/* Progress bar inside active pill */}
              {isActive && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-brown-950/40 rounded-full overflow-hidden">
                  <span className="block h-full bg-brown-950 animate-[progress_6s_linear_infinite]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
