import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatInr } from "../lib/format";
import { FiX, FiTrash2, FiShoppingBag, FiMinus, FiPlus } from "react-icons/fi";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, updateQuantity, removeLine, subtotalInr, totalItems } = useCart();
  const navigate = useNavigate();

  // Lock page scroll while the drawer is open; close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function goTo(path: string) {
    onClose();
    navigate(path);
  }

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-brown-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel — slides in from the right */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gold-500/40 bg-cream-50 shadow-2xl transition-transform duration-300 ease-in-out font-roboto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gold-500/30 bg-white px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brown-950">
            Your Cart{totalItems > 0 ? ` (${totalItems})` : ""}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-full border border-gold-500/40 p-1.5 text-brown-700 transition hover:bg-cream-100 hover:text-brown-950"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <FiShoppingBag className="h-10 w-10 text-gold-500/60" />
            <p className="text-sm text-brown-700">Your cart is empty.</p>
            <button
              onClick={() => goTo("/shop")}
              className="metallic-gold-btn mt-2 rounded-full px-6 py-2.5 text-sm font-bold"
            >
              Browse the Shop
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-gold-500/20 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.variantId} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${l.productSlug}`}
                      onClick={onClose}
                      className="block truncate text-sm font-semibold text-brown-950 hover:text-gold-700"
                    >
                      {l.productName}
                    </Link>
                    <div className="text-xs text-brown-500">
                      {l.variantLabel} • {formatInr(l.priceInr)} each
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(l.variantId, l.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-500/50 text-brown-800 transition hover:bg-cream-100 disabled:opacity-40"
                        disabled={l.quantity <= 1}
                      >
                        <FiMinus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-brown-950">
                        {l.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(l.variantId, l.quantity + 1)}
                        aria-label="Increase quantity"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-500/50 text-brown-800 transition hover:bg-cream-100 disabled:opacity-40"
                        disabled={l.quantity >= l.maxStock}
                      >
                        <FiPlus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-serif text-sm font-bold text-brown-950">
                      {formatInr(l.priceInr * l.quantity)}
                    </span>
                    <button
                      onClick={() => removeLine(l.variantId)}
                      aria-label={`Remove ${l.productName}`}
                      className="text-maroon-700/70 transition hover:text-maroon-700"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gold-500/30 bg-white px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-brown-700">Subtotal</span>
                <span className="font-serif text-lg font-bold text-brown-950">
                  {formatInr(subtotalInr)}
                </span>
              </div>
              <p className="mb-3 text-xs text-brown-500">
                {subtotalInr >= 999
                  ? "You've unlocked free shipping!"
                  : `Free shipping on orders over ${formatInr(999)}.`}
              </p>
              <button
                onClick={() => goTo("/checkout")}
                className="metallic-gold-btn w-full rounded-full py-3 text-sm font-bold shadow-md"
              >
                Checkout — {formatInr(subtotalInr)}
              </button>
              <button
                onClick={() => goTo("/cart")}
                className="mt-2 w-full rounded-full border border-gold-500/50 bg-cream-50 py-2.5 text-sm font-semibold text-brown-800 transition hover:border-gold-500 hover:bg-cream-100"
              >
                View Full Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
