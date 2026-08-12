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

export function SiteHeader() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/30 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display gold-gradient-text text-2xl font-bold tracking-wide sm:text-3xl">
            MEHFUZ
          </span>
          <span className="hidden font-display text-[10px] uppercase tracking-[0.2em] text-brown-500 sm:block">
            Premium Dry Fruits
            <br />& Commodities
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-brown-700 transition hover:text-gold-700"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-full border border-gold-500 bg-brown-950 px-4 py-2 text-sm font-semibold text-gold-300 shadow-sm transition hover:bg-brown-900"
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
