import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Logo } from "./Logo";
import { CartDrawer } from "./CartDrawer";
import { FiShoppingBag, FiMenu, FiX } from "react-icons/fi";
import { FaInstagram, FaFacebookF, FaWhatsapp, FaYoutube } from "react-icons/fa";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/shop", label: "Shop" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

/** Stacked logo / wordmark */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return <Logo compact={compact} variant="header" />;
}

export function SiteHeader() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    {/* NOTE: no backdrop-blur here — backdrop-filter creates a CSS containing
        block that would clip the fixed-position cart/menu drawers to the
        header's box (and bg-black is opaque, so blur showed nothing anyway). */}
    <header className="sticky top-0 z-50 border-b border-gold-500/40 bg-black shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link to="/" aria-label="Mehfuz home" className="shrink-0">
          <Wordmark />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-5 lg:gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `group relative text-md font-semibold transition-all duration-300 ${
                  isActive ? "text-gold-300 font-bold" : "text-cream-100/90 hover:text-gold-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{link.label}</span>
                  <span
                    className={`absolute -bottom-1.5 left-0 h-[2px] rounded-full bg-gold-400 transition-all duration-300 ${
                      isActive ? "w-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" : "w-0 group-hover:w-full"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Action Buttons & Social Icons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Social Media Icons in Top Header Right Corner */}
          <div className="hidden sm:flex items-center gap-1.5 border-r border-gold-500/30 pr-3 mr-1 font-roboto">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 hover:scale-110 shadow-sm"
            >
              <FaInstagram className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 hover:scale-110 shadow-sm"
            >
              <FaFacebookF className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://wa.me/919848918992"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 hover:scale-110 shadow-sm"
            >
              <FaWhatsapp className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-300 transition hover:bg-gold-500 hover:text-brown-950 hover:scale-110 shadow-sm"
            >
              <FaYoutube className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            className="relative flex items-center gap-2 rounded-full border border-gold-500/70 bg-gold-500/10 px-4 py-2 text-sm font-semibold text-gold-300 shadow-sm transition hover:bg-gold-500/20 hover:shadow-md font-roboto"
          >
            <FiShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-xs font-bold text-brown-950">
                {totalItems}
              </span>
            )}
          </button>
          <button
            className="rounded-md border border-gold-500/50 p-2 text-gold-300 md:hidden hover:bg-brown-900"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — slides in from the right */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-brown-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          aria-label="Mobile navigation"
          className={`absolute right-0 top-0 flex h-full w-72 flex-col border-l border-gold-500/40 bg-brown-950 shadow-2xl transition-transform duration-300 ease-in-out font-roboto ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gold-500/30 px-4 py-3">
            <Wordmark compact />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="rounded-full border border-gold-500/50 p-1.5 text-gold-300 hover:bg-brown-900"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-gold-500/20 text-gold-300 font-bold border-l-2 border-gold-400"
                      : "text-cream-100 hover:bg-brown-900 hover:text-gold-300"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          {/* Mobile Social Links */}
          <div className="flex items-center justify-center gap-4 border-t border-gold-500/30 px-4 py-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gold-300 hover:text-gold-400 p-2"><FaInstagram className="h-4 w-4" /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gold-300 hover:text-gold-400 p-2"><FaFacebookF className="h-4 w-4" /></a>
            <a href="https://wa.me/919848918992" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-gold-300 hover:text-gold-400 p-2"><FaWhatsapp className="h-4 w-4" /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gold-300 hover:text-gold-400 p-2"><FaYoutube className="h-4 w-4" /></a>
          </div>
        </nav>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
