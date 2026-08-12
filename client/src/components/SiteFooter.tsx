import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-gold-500/30 bg-brown-950 text-cream-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="font-display gold-gradient-text text-2xl font-bold">MEHFUZ</div>
          <p className="mt-2 max-w-xs text-sm text-cream-100/70">
            Premium dry fruits &amp; commodities — handpicked and sourced directly from India's
            finest growing regions and beyond.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
            Shop
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-cream-100/80">
            <li><Link to="/shop" className="hover:text-gold-300">All products</Link></li>
            <li><Link to="/shop?category=figs-anjeer" className="hover:text-gold-300">Anjeer</Link></li>
            <li><Link to="/shop?category=dates" className="hover:text-gold-300">Dates</Link></li>
            <li><Link to="/shop?category=saffron-kesar" className="hover:text-gold-300">Saffron</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
            For orders &amp; enquiries
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-cream-100/80">
            <li>
              <a href="tel:+919848918992" className="hover:text-gold-300">
                +91 98489 18992
              </a>
            </li>
            <li>
              <a href="tel:+917013355940" className="hover:text-gold-300">
                +91 70133 55940
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-100/10 py-4 text-center text-xs text-cream-100/50">
        © {new Date().getFullYear()} Mehfuz Premium Dry Fruits &amp; Commodities. All rights reserved.
      </div>
    </footer>
  );
}
