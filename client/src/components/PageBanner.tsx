import { Link } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBannerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageBanner({ title, subtitle, breadcrumbs }: PageBannerProps) {
  return (
    <div className="relative h-[200px] w-full overflow-hidden border-b border-gold-500/40 bg-gradient-to-r from-cream-100 via-gold-100/90 to-cream-100 px-4 sm:px-6 flex flex-col justify-center shadow-sm select-none">
      {/* Realistic Dry Fruits Flatlay Photography Background Overlay */}
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply">
        <img
          src="/images/realistic_dry_fruits_banner_2.jpg"
          alt="Assortment of Premium Dry Fruits"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Cream scrim so the dark serif title stays legible over the photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream-50/80 via-cream-50/65 to-cream-50/80" />

      <div className="relative z-10 mx-auto w-full max-w-7xl text-center font-roboto">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center justify-center gap-1 text-xs text-brown-700">
            <Link to="/" className="flex items-center gap-1 hover:text-gold-700">
              <FiHome className="h-3 w-3" />
              <span>Home</span>
            </Link>
            {breadcrumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <FiChevronRight className="h-3 w-3 text-gold-700" />
                {c.href ? (
                  <Link to={c.href} className="hover:text-gold-700">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-brown-900">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-serif text-3xl font-bold text-brown-950 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-brown-700">{subtitle}</p>}
      </div>

      {/* Bottom Metallic Gold Line Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/20 via-gold-500 to-gold-500/20" />
    </div>
  );
}
