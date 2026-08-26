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

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-11 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div>
          <Link to="/" className="inline-block">
            <Logo variant="footer" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream-100/70 font-roboto">
            Handpicked and sourced directly from the finest growing regions —
            Afghanistan, Kashmir, Coorg, Chikmagalur and Guntur.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            Quick Links
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-cream-100/80 font-roboto">
            <li><Link to="/terms" className="transition hover:text-gold-300">Terms and Conditions</Link></li>
            <li><Link to="/privacy" className="transition hover:text-gold-300">Privacy Policy</Link></li>
            <li><Link to="/shipping" className="transition hover:text-gold-300">Shipping &amp; Tracking</Link></li>
            <li><Link to="/returns" className="transition hover:text-gold-300">Return, Exchange &amp; Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            Shop
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-cream-100/80 font-roboto">
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
          <ul className="mt-3 space-y-1.5 text-sm text-cream-100/80 font-roboto">
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
          <div className="mt-5 flex items-center gap-3.5">
            <a
              href="https://www.instagram.com/mehfuzdryfruits"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="ai-social-btn"
            >
              <FaInstagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/mehfuzpremiumdryfruits"
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
              href="https://www.youtube.com/@mehfuzdryfruits"
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

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-4 text-center text-xs text-cream-100/50">
        <p>
          © {new Date().getFullYear()} Mehfuz Premium Dry Fruits &amp; Commodities. All rights reserved.
        </p>
        <p className="flex items-center gap-2 tracking-wide">
          {/* fssai wordmark */}
          <span className="inline-flex items-center rounded bg-cream-50 px-1.5 py-0.5">
            <svg viewBox="0 0 74 30" className="h-4 w-auto" aria-label="FSSAI" role="img">
              <text
                x="1"
                y="21"
                fontFamily="Verdana, Arial, sans-serif"
                fontSize="19"
                fontWeight="bold"
                letterSpacing="0.5"
              >
                <tspan fill="#2d3192">fssa</tspan>
                <tspan fill="#f58220">i</tspan>
              </text>
              {/* leaf dot over the i */}
              <ellipse cx="63" cy="5.4" rx="4.4" ry="2.5" fill="#8dc63f" transform="rotate(-38 63 5.4)" />
              {/* underline swoosh */}
              <path d="M2 25.5 Q37 29.5 72 25.5 L72 27.5 Q37 31.5 2 27.5 Z" fill="#f58220" />
            </svg>
          </span>
          <span>
            Registration No: <span className="font-semibold text-cream-100/70">23626443000038</span>
          </span>
        </p>
      </div>
    </footer>
  );
}
