import { Link } from "react-router-dom";
import { PageBanner } from "../components/PageBanner";
import { OrnateFrame, SectionTitle } from "../components/art/Ornaments";
import { FiCheckCircle, FiShield, FiTruck, FiAward, FiArrowRight } from "react-icons/fi";
import { PRODUCT_ART } from "../components/art/ProductArt";

export function About() {
  const FigArt = PRODUCT_ART.fig;
  const WalnutArt = PRODUCT_ART.walnut;
  const SaffronArt = PRODUCT_ART.saffron;
  const CoffeeArt = PRODUCT_ART.coffee;

  return (
    <div className="parchment min-h-screen font-roboto">
      {/* 200px Height Full-Width Header Banner */}
      <PageBanner
        image="/images/sourcing_team_bg.webp?v=3"
        title="About Us"
        subtitle="Sourced at the origin, delivered to your door."
        breadcrumbs={[{ label: "About" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 font-roboto">
        {/* Brand Promise Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 font-roboto">
          <div className="rounded-2xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm text-center transition-all hover:shadow-lg hover:-translate-y-1 font-roboto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
              <FiShield className="h-6 w-6" />
            </div>
            <h3 className="font-serif mt-4 text-base font-bold text-brown-950">100% Direct Origin</h3>
            <p className="mt-2 text-xs text-brown-700 leading-relaxed font-roboto">
              Harvested directly from ancestral orchards in Afghanistan, Kashmir, Coorg, and Chikmagalur.
            </p>
          </div>

          <div className="rounded-2xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm text-center transition-all hover:shadow-lg hover:-translate-y-1 font-roboto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
              <FiAward className="h-6 w-6" />
            </div>
            <h3 className="font-serif mt-4 text-base font-bold text-brown-950">Artisan Purity</h3>
            <p className="mt-2 text-xs text-brown-700 leading-relaxed font-roboto">
              Zero chemical processing, no added sugars or artificial coloring. Uncompromised raw perfection.
            </p>
          </div>

          <div className="rounded-2xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm text-center transition-all hover:shadow-lg hover:-translate-y-1 font-roboto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
              <FiCheckCircle className="h-6 w-6" />
            </div>
            <h3 className="font-serif mt-4 text-base font-bold text-brown-950">Hand-Graded Harvest</h3>
            <p className="mt-2 text-xs text-brown-700 leading-relaxed font-roboto">
              Every batch undergoes strict grading for size, moisture content, crunch, and aroma.
            </p>
          </div>

          <div className="rounded-2xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm text-center transition-all hover:shadow-lg hover:-translate-y-1 font-roboto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
              <FiTruck className="h-6 w-6" />
            </div>
            <h3 className="font-serif mt-4 text-base font-bold text-brown-950">Sealed Freshness</h3>
            <p className="mt-2 text-xs text-brown-700 leading-relaxed font-roboto">
              Packaged in airtight, moisture-resistant luxury pouches and wooden gift hampers.
            </p>
          </div>
        </div>

        {/* Provenance Feature Grid */}
        <div className="mt-20 font-roboto">
          <SectionTitle eyebrow="Roots & Origin">Our Harvest Provenance</SectionTitle>

          <div className="mt-10 grid gap-8 md:grid-cols-2 font-roboto">
            <OrnateFrame className="bg-cream-50/90 p-6 sm:p-8">
              <div className="flex items-start gap-4 font-roboto">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-gold-500/10 p-2 flex items-center justify-center">
                  <FigArt className="h-12 w-12 drop-shadow-md" />
                </div>
                <div className="font-roboto">
                  <h3 className="font-serif text-xl font-bold text-brown-950">Afghan Anjeer (Dried Figs)</h3>
                  <p className="text-xs font-semibold text-gold-700 uppercase tracking-wider mt-0.5 font-roboto">Kandahar &amp; Herat Orchards</p>
                  <p className="mt-3 text-sm text-brown-700 leading-relaxed font-roboto">
                    Nurtured in dry alpine sunshine, our Afghan figs are sun-dried naturally on the branch, resulting in naturally sweet, soft, plump, fiber-rich fruits.
                  </p>
                </div>
              </div>
            </OrnateFrame>

            <OrnateFrame className="bg-cream-50/90 p-6 sm:p-8">
              <div className="flex items-start gap-4 font-roboto">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-gold-500/10 p-2 flex items-center justify-center">
                  <SaffronArt className="h-12 w-12 drop-shadow-md" />
                </div>
                <div className="font-roboto">
                  <h3 className="font-serif text-xl font-bold text-brown-950">Kashmiri Laila Saffron</h3>
                  <p className="text-xs font-semibold text-gold-700 uppercase tracking-wider mt-0.5 font-roboto">Pampore Valleys, Kashmir</p>
                  <p className="mt-3 text-sm text-brown-700 leading-relaxed font-roboto">
                    Hand-harvested at dawn in Pampore, Kashmir. Known globally for its deep crimson stigma, unmatched crocin content, and celestial aroma.
                  </p>
                </div>
              </div>
            </OrnateFrame>

            <OrnateFrame className="bg-cream-50/90 p-6 sm:p-8">
              <div className="flex items-start gap-4 font-roboto">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-gold-500/10 p-2 flex items-center justify-center">
                  <WalnutArt className="h-12 w-12 drop-shadow-md" />
                </div>
                <div className="font-roboto">
                  <h3 className="font-serif text-xl font-bold text-brown-950">Snow-White Kashmiri Walnuts</h3>
                  <p className="text-xs font-semibold text-gold-700 uppercase tracking-wider mt-0.5 font-roboto">Kashmir Orchards</p>
                  <p className="mt-3 text-sm text-brown-700 leading-relaxed font-roboto">
                    Organic, shell-cracked snow-white kernels packed with essential Omega-3 fatty acids, crunchy texture, and rich buttery flavor.
                  </p>
                </div>
              </div>
            </OrnateFrame>

            <OrnateFrame className="bg-cream-50/90 p-6 sm:p-8">
              <div className="flex items-start gap-4 font-roboto">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-gold-500/10 p-2 flex items-center justify-center">
                  <CoffeeArt className="h-12 w-12 drop-shadow-md" />
                </div>
                <div className="font-roboto">
                  <h3 className="font-serif text-xl font-bold text-brown-950">Estate Coffee &amp; Coorg Spices</h3>
                  <p className="text-xs font-semibold text-gold-700 uppercase tracking-wider mt-0.5 font-roboto">Chikmagalur &amp; Coorg, Karnataka</p>
                  <p className="mt-3 text-sm text-brown-700 leading-relaxed font-roboto">
                    Shade-grown Arabica coffee beans roasted to perfection, paired with bold sun-dried black pepper from the misty hills of Coorg.
                  </p>
                </div>
              </div>
            </OrnateFrame>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 rounded-3xl border border-gold-500/40 bg-brown-950 p-8 sm:p-12 text-center text-cream-100 shadow-2xl relative overflow-hidden font-roboto">
          <div className="relative z-10 max-w-2xl mx-auto font-roboto">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold gold-gradient-text">
              Taste the True Origin Difference
            </h2>
            <p className="mt-3 text-sm sm:text-base text-cream-100/80 leading-relaxed font-roboto">
              Explore our full collection of premium dry fruits, dates, nuts, saffron, and artisanal gift hampers.
            </p>
            <div className="mt-8 flex justify-center font-roboto">
              <Link
                to="/shop"
                className="metallic-gold-btn inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold tracking-wide transition-all transform hover:scale-105 shadow-xl font-roboto"
              >
                <span className="font-roboto">Shop All Products</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
