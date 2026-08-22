import { Divider } from "../art/Ornaments";
import { FiStar } from "react-icons/fi";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Amina Khan",
    location: "Hyderabad",
    rating: 5,
    review: "The Afghan Anjeer and Kashmiri Walnuts are of exceptional quality. Unmatched crunch, soft plump texture, and fast delivery to Hyderabad.",
  },
  {
    id: 2,
    name: "Vikram Malhotra",
    location: "Bangalore",
    rating: 5,
    review: "Ordered Kashmiri Laila Saffron and Estate Coffee. The celestial aroma of saffron as soon as you open the sealed pouch is heavenly!",
  },
  {
    id: 3,
    name: "Sunil Mehta",
    location: "Mumbai",
    rating: 5,
    review: "Their corporate gift hampers were a massive hit with our corporate clients. Handpicked purity and pristine wooden packaging.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-y border-gold-500/40 bg-brown-950 py-20 text-cream-100 font-roboto relative overflow-hidden">
      {/* Realistic Dry Fruits Background Image Overlay */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/images/realistic_dry_fruits_banner_2.jpg"
          alt="Dry Fruits Background"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 font-roboto">
        <div className="text-center max-w-2xl mx-auto font-roboto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-400 font-roboto">
            Customer Reviews
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold gold-gradient-text mt-1">
            What Our Connoisseurs Say
          </h2>
          <Divider className="mx-auto mt-3 max-w-[180px]" />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 font-roboto">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-gold-500/35 bg-brown-950/80 p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col justify-between font-roboto transition hover:border-gold-400 hover:scale-[1.02]"
            >
              <div className="font-roboto">
                <div className="flex items-center gap-1 text-gold-400 mb-3 font-roboto">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <FiStar key={i} className="h-4 w-4 fill-gold-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-cream-100/90 leading-relaxed font-roboto italic">
                  "{t.review}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gold-500/20 font-roboto">
                <p className="font-serif font-bold text-cream-100 text-sm">{t.name}</p>
                <p className="text-[11px] text-gold-300/80 font-roboto">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
