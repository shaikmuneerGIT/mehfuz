import { Link, NavLink, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <aside className="w-48 flex-shrink-0">
        <div className="mb-6">
          <Link to="/" className="font-display gold-gradient-text text-xl font-bold">
            MEHFUZ
          </Link>
          <p className="text-xs text-brown-500">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brown-950 text-gold-300"
                    : "text-brown-700 hover:bg-cream-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-gold-500/30 pt-4 text-xs text-brown-500">
          <p className="mb-2 truncate">{admin?.email}</p>
          <button onClick={logout} className="font-semibold text-maroon-700 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
