import { Divider } from "../art/Ornaments";

export function QuickContactSection() {
  return (
    <section className="py-16 text-center text-cream-100 font-roboto relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 font-roboto">
        <div className="relative rounded-3xl border border-gold-500/40 bg-brown-950 p-8 sm:p-12 shadow-2xl backdrop-blur-md font-roboto overflow-hidden">
          {/* Background Image inside Inner Section Box */}
          <div className="pointer-events-none absolute inset-0">
            <img
              src="/images/sourcing_team_bg.webp"
              alt="Mehfuz Sourcing Team Dry Fruits Background"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/75" />
          </div>

          <div className="relative z-10 font-roboto">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400 font-roboto">
              Direct Orders &amp; Inquiries
            </p>
            <h2 className="font-serif mt-2 text-2xl sm:text-4xl font-bold gold-gradient-text">
              Speak with Our Sourcing Team
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-cream-100/80 max-w-xl mx-auto font-roboto">
              Need assistance with retail orders, bulk wholesale pricing, or custom corporate hampers? Our harvest specialists are ready to help.
            </p>
            <Divider className="mx-auto mt-4 max-w-[200px]" />
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-base sm:text-xl font-bold text-cream-100 font-roboto">
              <a
                href="tel:+919848918992"
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-brown-950 px-6 py-3 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 shadow-md font-roboto"
              >
                <span>+91 98489 18992</span>
              </a>
              <a
                href="tel:+919880833944"
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-brown-950 px-6 py-3 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 shadow-md font-roboto"
              >
                <span>+91 98808 33944</span>
              </a>
            </div>
            <p className="mt-6 text-xs text-gold-300/80 font-roboto">
              Mehfuz Premium Dry Fruits &amp; Commodities • <a href="mailto:info@mehfuzdryfruits.in" className="underline hover:text-gold-300 font-roboto">info@mehfuzdryfruits.in</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
