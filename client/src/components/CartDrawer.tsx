import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatInr } from "../lib/format";
import { api } from "../api/client";
import type { Product } from "../types";
import { resolveProductImagePath } from "./ProductImage";
import { CartThumb, cartLineImage } from "./CartThumb";
import { FiX, FiTrash2, FiShoppingBag, FiMinus, FiPlus, FiArrowRight } from "react-icons/fi";

interface ShopQuote {
  shippingEnabled: boolean;
  freeAbove: number;
}

/** Catalog tiles shown inside the drawer so shoppers can add more without leaving. */
function AddMoreSection({ products }: { products: Product[] }) {
  const { addLine, lines } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  function addSmallestPack(p: Product) {
    const variant = p.variants.find((v) => v.stock > 0);
    if (!variant) return;
    addLine({
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      categoryName: p.category.name,
      imageUrl: p.imageUrl,
      variantId: variant.id,
      variantLabel: variant.label,
      priceInr: variant.priceInr,
      quantity: 1,
      maxStock: variant.stock,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId((prev) => (prev === p.id ? null : prev)), 1500);
  }

  const inCartVariants = new Set(lines.map((l) => l.variantId));
  const available = products.filter((p) => p.variants.some((v) => v.stock > 0));
  if (available.length === 0) return null;

  return (
    <div className="border-t border-gold-500/30 px-5 py-4">
      <h3 className="font-serif mb-3 text-sm font-bold text-brown-950">Add more products</h3>
      <div className="grid grid-cols-3 gap-3">
        {available.map((p) => {
          const smallest = p.variants.find((v) => v.stock > 0)!;
          const alreadyIn = inCartVariants.has(smallest.id);
          return (
            <div
              key={p.id}
              className="flex flex-col items-center rounded-xl border border-gold-500/25 bg-white p-2 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center">
                <img
                  src={p.imageUrl || resolveProductImagePath(p.name, p.category.slug) || ""}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                />
              </div>
              <span className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight text-brown-900">
                {p.name}
              </span>
              <span className="text-[11px] text-brown-500">{formatInr(smallest.priceInr)}</span>
              <button
                onClick={() => addSmallestPack(p)}
                className={`mt-1.5 w-full rounded-full py-1 text-[11px] font-bold transition ${
                  addedId === p.id
                    ? "bg-forest-950 text-gold-300"
                    : "border border-gold-500/50 bg-cream-50 text-brown-800 hover:border-gold-500 hover:bg-cream-100"
                }`}
              >
                {addedId === p.id ? "Added ✓" : alreadyIn ? "+ 1 more" : "+ Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, updateQuantity, removeLine, subtotalInr, totalItems } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [shop, setShop] = useState<ShopQuote | null>(null);

  useEffect(() => {
    api
      .get<ShopQuote>("/config/shop", { params: { subtotal: subtotalInr } })
      .then((res) => setShop(res.data))
      .catch(() => {});
  }, [subtotalInr]);

  // The exact fee needs a pincode, so the drawer shows free-or-pending and
  // the checkout page shows the real number once the pincode is typed.
  const freeDelivery =
    !shop?.shippingEnabled || (shop.freeAbove > 0 && subtotalInr >= shop.freeAbove);
  const totalInr = subtotalInr;

  // Fetch the catalog the first time the drawer opens.
  useEffect(() => {
    if (!open || loaded) return;
    api
      .get<Product[]>("/catalog/products")
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [open, loaded]);

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
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gold-500/40 bg-white shadow-2xl transition-transform duration-300 ease-in-out font-roboto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Dark header band */}
        <div className="flex items-center justify-between bg-brown-950 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <FiShoppingBag className="h-5 w-5 text-gold-400" />
            <h2 className="font-serif text-base font-bold uppercase tracking-[0.15em] text-gold-300">
              Your Shopping Cart
            </h2>
            {totalItems > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold-400 px-1.5 text-xs font-bold text-brown-950">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="text-gold-300 transition hover:text-gold-400"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable middle: cart items + add-more catalog */}
        <div className="flex-1 overflow-y-auto bg-white">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <FiShoppingBag className="h-10 w-10 text-gold-500/60" />
              <p className="text-sm text-brown-700">
                Your cart is empty — add something delicious below.
              </p>
            </div>
          ) : (
            <ul className="space-y-3 px-4 py-4">
              {lines.map((l) => (
                <li
                  key={l.variantId}
                  className="flex gap-3 rounded-xl border border-gold-500/30 bg-white p-3 shadow-sm"
                >
                  <CartThumb src={cartLineImage(l)} alt={l.productName} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      to={`/product/${l.productSlug}`}
                      onClick={onClose}
                      className="font-serif truncate text-sm font-bold text-brown-950 hover:text-gold-700"
                    >
                      {l.productName}
                    </Link>
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-brown-500">
                      Pack: {l.variantLabel}
                    </span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-md border border-gold-500/50">
                        <button
                          onClick={() => updateQuantity(l.variantId, l.quantity - 1)}
                          aria-label="Decrease quantity"
                          disabled={l.quantity <= 1}
                          className="px-2.5 py-1 text-brown-800 transition hover:bg-cream-100 disabled:opacity-40"
                        >
                          <FiMinus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-brown-950">
                          {l.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(l.variantId, l.quantity + 1)}
                          aria-label="Increase quantity"
                          disabled={l.quantity >= l.maxStock}
                          className="px-2.5 py-1 text-brown-800 transition hover:bg-cream-100 disabled:opacity-40"
                        >
                          <FiPlus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-roboto text-sm font-bold text-brown-950">
                          {formatInr(l.priceInr * l.quantity)}
                        </span>
                        <button
                          onClick={() => removeLine(l.variantId)}
                          aria-label={`Remove ${l.productName}`}
                          className="text-brown-400 transition hover:text-maroon-700"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <AddMoreSection products={products} />
        </div>

        {lines.length > 0 && (
          <div className="border-t border-gold-500/30 bg-cream-100 px-5 py-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-brown-700">
              <span>Subtotal</span>
              <span className="text-sm font-bold normal-case text-brown-950">
                {formatInr(subtotalInr)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-brown-700">
              <span>Delivery Fee</span>
              <span className="text-sm font-bold text-brown-950">
                {freeDelivery ? "FREE" : "at checkout"}
              </span>
            </div>
            {!freeDelivery && shop && shop.freeAbove > 0 && (
              <p className="mt-1 text-[11px] text-brown-500">
                Hyderabad delivery only. Free over {formatInr(shop.freeAbove)} — exact fee shows
                at checkout from your pincode.
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-gold-500/30 pt-3">
              <span className="font-serif text-sm font-bold uppercase tracking-wider text-brown-950">
                Total
              </span>
              <span className="font-roboto text-xl font-bold text-brown-950">
                {formatInr(totalInr)}
              </span>
            </div>
            <button
              onClick={() => goTo("/checkout")}
              className="metallic-gold-btn mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold uppercase tracking-[0.15em] shadow-md"
            >
              Proceed to Checkout
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
