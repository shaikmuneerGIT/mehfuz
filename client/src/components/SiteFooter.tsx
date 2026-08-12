import { Link } from "react-router-dom";
import { CornerFlourish, Divider } from "./art/Ornaments";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-gold-500/40 bg-brown-950 text-cream-100">
      {/* filigree along the top edge, echoing the poster's border */}
      <CornerFlourish className="pointer-events-none absolute left-2 top-2 h-10 w-10 text-gold-500/40" />
      <CornerFlourish className="pointer-events-none absolute right-2 top-2 h-10 w-10 -scale-x-100 text-gold-500/40" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="font-display gold-gradient-text text-2xl font-bold tracking-[0.12em]">
            MEHFUZ
          </div>
          <div className="mt-1 font-display text-[9px] uppercase tracking-[0.2em] text-gold-400/80">
            Premium Dry Fruits &amp; Commodities
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70">
            Handpicked and sourced directly from the finest growing regions —
            Afghanistan, Kashmir, Coorg, Chikmagalur and Guntur.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            Shop
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/80">
            <li><Link to="/shop" className="transition hover:text-gold-300">All products</Link></li>
            <li><Link to="/shop?category=figs-anjeer" className="transition hover:text-gold-300">Anjeer</Link></li>
            <li><Link to="/shop?category=dates" className="transition hover:text-gold-300">Dates</Link></li>
            <li><Link to="/shop?category=nuts" className="transition hover:text-gold-300">Nuts</Link></li>
            <li><Link to="/shop?category=saffron-kesar" className="transition hover:text-gold-300">Saffron</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            For Orders &amp; Enquiries
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/80">
            <li>
              <a href="tel:+919848918992" className="transition hover:text-gold-300">
                +91 98489 18992
              </a>
            </li>
            <li>
              <a href="tel:+917013355940" className="transition hover:text-gold-300">
                +91 70133 55940
              </a>
            </li>
          </ul>
          <Link
            to="/admin/login"
            className="mt-6 inline-block text-xs text-cream-100/35 transition hover:text-gold-400"
          >
            Store admin
          </Link>
        </div>
      </div>

      <Divider className="mx-auto max-w-md opacity-50" />

      <div className="py-5 text-center text-xs text-cream-100/50">
        © {new Date().getFullYear()} Mehfuz Premium Dry Fruits &amp; Commodities. All rights reserved.
      </div>
    </footer>
  );
}
