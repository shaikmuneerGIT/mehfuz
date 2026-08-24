import { Link } from "react-router-dom";
import { CornerFlourish, Divider } from "./art/Ornaments";
import { Logo } from "./Logo";
import { FiPhoneCall } from "react-icons/fi";
import { FaInstagram, FaFacebookF, FaWhatsapp, FaYoutube } from "react-icons/fa";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-gold-500/40 bg-gradient-to-b from-black via-brown-950 to-brown-900 text-cream-100 font-roboto">
      {/* Filigree along top edge */}
      <CornerFlourish className="pointer-events-none absolute left-2 top-2 h-10 w-10 text-gold-400/40" />
      <CornerFlourish className="pointer-events-none absolute right-2 top-2 h-10 w-10 -scale-x-100 text-gold-400/40" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Link to="/" className="inline-block">
            <Logo variant="footer" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70 font-roboto">
            Handpicked and sourced directly from the finest growing regions —
            Afghanistan, Kashmir, Coorg, Chikmagalur and Guntur.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            Shop
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/80 font-roboto">
            <li><Link to="/shop" className="transition hover:text-gold-300">All products</Link></li>
            <li><Link to="/blog" className="transition hover:text-gold-300">Harvest Blog</Link></li>
            <li><Link to="/shop?category=figs-anjeer" className="transition hover:text-gold-300">Anjeer</Link></li>
            <li><Link to="/shop?category=dates" className="transition hover:text-gold-300">Dates</Link></li>
            <li><Link to="/shop?category=nuts" className="transition hover:text-gold-300">Nuts</Link></li>
            <li><Link to="/shop?category=saffron-kesar" className="transition hover:text-gold-300">Saffron</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            For Orders &amp; Enquiries
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/80 font-roboto">
            <li>
              <a href="tel:+919848918992" className="inline-flex items-center gap-2 transition hover:text-gold-300 font-roboto">
                <FiPhoneCall className="h-3.5 w-3.5 text-gold-400" />
                <span>+91 98489 18992</span>
              </a>
            </li>
            <li>
              <a href="tel:+919880833944" className="inline-flex items-center gap-2 transition hover:text-gold-300 font-roboto">
                <FiPhoneCall className="h-3.5 w-3.5 text-gold-400" />
                <span>+91 98808 33944</span>
              </a>
            </li>
          </ul>

          {/* Social Media Icons with 2026 AI Animations */}
          <div className="mt-6 flex items-center gap-3.5">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="ai-social-btn"
            >
              <FaInstagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="ai-social-btn"
            >
              <FaFacebookF className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/919848918992"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="ai-social-btn"
            >
              <FaWhatsapp className="h-4 w-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="ai-social-btn"
            >
              <FaYoutube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <Divider className="mx-auto max-w-md opacity-50" />

      <div className="py-5 text-center text-xs text-cream-100/50">
        <p>
          © {new Date().getFullYear()} Mehfuz Premium Dry Fruits &amp; Commodities. All rights reserved.
        </p>
        <p className="mt-1 tracking-wide">
          FSSAI Registration No: <span className="font-semibold text-cream-100/70">23626443000038</span>
        </p>
      </div>
    </footer>
  );
}
