import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";

const NAV_LINKS = [
  { to: "/shop", label: "Shop All" },
  { to: "/shop?category=figs-anjeer", label: "Anjeer" },
  { to: "/shop?category=dates", label: "Dates" },
  { to: "/shop?category=nuts", label: "Nuts" },
  { to: "/shop?category=saffron-kesar", label: "Saffron" },
];

/** Stacked wordmark + rule + tagline, as the name is set on the poster. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span
        className={`font-display gold-gradient-text font-bold tracking-[0.12em] ${
          compact ? "text-xl" : "text-2xl sm:text-[28px]"
        }`}
      >
        MEHFUZ
      </span>
      <span className="mt-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-gold-500/50" />
        <span className="h-1 w-1 rotate-45 bg-gold-500/70" />
        <span className="h-px flex-1 bg-gold-500/50" />
      </span>
      <span
        className={`font-display mt-1 whitespace-nowrap uppercase tracking-[0.18em] text-brown-500 ${
          compact ? "text-[7px]" : "text-[8px] sm:text-[9px]"
        }`}
      >
        Premium Dry Fruits &amp; Commodities
      </span>
    </span>
  );
}

export function SiteHeader() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/40 bg-cream-50/95 shadow-[0_1px_0_rgba(207,154,60,0.25)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Mehfuz home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="group relative text-sm font-medium text-brown-700 transition hover:text-gold-700"
            >
              {link.label}
              <span className="absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-gold-600 transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-full border border-gold-500/70 bg-brown-950 px-4 py-2 text-sm font-semibold text-gold-300 shadow-sm transition hover:bg-brown-900"
          >
            Cart
            {totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-xs font-bold text-brown-950">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            className="rounded-md border border-gold-500/50 p-2 text-brown-700 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gold-500/30 bg-cream-50 px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="rounded px-2 py-2 text-sm font-medium text-brown-700 hover:bg-cream-200"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
