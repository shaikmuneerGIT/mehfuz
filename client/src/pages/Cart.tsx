import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatInr } from "../lib/format";
import { ProductTile } from "../components/ProductTile";

export function Cart() {
  const { lines, updateQuantity, removeLine, subtotalInr } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-brown-950">Your cart is empty</h1>
        <p className="mt-2 text-brown-500">Add a few of our premium picks to get started.</p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-brown-950 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-brown-900"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display mb-6 text-3xl font-bold text-brown-950">Your Cart</h1>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {lines.map((line) => (
            <div
              key={line.variantId}
              className="flex items-center gap-4 rounded-xl border border-gold-500/30 bg-white p-4"
            >
              <ProductTile
                name={line.productName}
                categorySlug=""
                className="h-16 w-16 flex-shrink-0 rounded-lg"
              />
              <div className="flex-1">
                <Link
                  to={`/product/${line.productSlug}`}
                  className="font-display font-semibold text-brown-950 hover:text-gold-700"
                >
                  {line.productName}
                </Link>
                <div className="text-sm text-brown-500">
                  {line.categoryName} • {line.variantLabel}
                </div>
                <div className="mt-1 text-sm font-medium text-brown-800">
                  {formatInr(line.priceInr)} each
                </div>
              </div>
              <div className="flex items-center rounded-lg border border-gold-500/50">
                <button
                  onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                  className="px-2 py-1 text-brown-700 hover:bg-cream-100"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                <button
                  onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                  className="px-2 py-1 text-brown-700 hover:bg-cream-100"
                >
                  +
                </button>
              </div>
              <div className="w-20 text-right font-semibold text-brown-950">
                {formatInr(line.priceInr * line.quantity)}
              </div>
              <button
                onClick={() => removeLine(line.variantId)}
                className="text-brown-400 hover:text-maroon-700"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-gold-500/30 bg-cream-100/60 p-6">
          <h2 className="font-display mb-4 text-lg font-bold text-brown-950">Order Summary</h2>
          <div className="flex justify-between text-sm text-brown-700">
            <span>Subtotal</span>
            <span className="font-medium">{formatInr(subtotalInr)}</span>
          </div>
          <p className="mt-1 text-xs text-brown-500">
            Free shipping over ₹999 — shipping calculated at checkout.
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="mt-5 w-full rounded-full bg-brown-950 py-3 text-sm font-semibold text-gold-300 shadow hover:bg-brown-900"
          >
            Proceed to Checkout
          </button>
          <Link
            to="/shop"
            className="mt-3 block text-center text-sm font-medium text-gold-700 hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
