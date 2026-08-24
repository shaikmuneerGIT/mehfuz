import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatInr } from "../lib/format";
import { ProductImage } from "../components/ProductImage";
import { PageBanner } from "../components/PageBanner";

export function Cart() {
  const { lines, updateQuantity, removeLine, subtotalInr } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="parchment min-h-screen font-roboto">
        <PageBanner
        image="/images/hero_banner_2.jpg"
          title="Your Shopping Cart"
          subtitle="Your cart is currently empty. Explore our premium selection of dry fruits, saffron, and nuts."
          breadcrumbs={[{ label: "Cart" }]}
        />
        <div className="mx-auto max-w-xl px-4 py-20 text-center font-roboto">
          <p className="font-roboto text-brown-700 text-base">Add a few of our premium picks to get started.</p>
          <Link
            to="/shop"
            className="metallic-gold-btn mt-6 inline-block rounded-full px-8 py-3.5 text-sm font-bold shadow-md font-roboto"
          >
            Browse the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="parchment min-h-screen font-roboto">
      <PageBanner
        image="/images/hero_banner_2.jpg"
        title="Your Shopping Cart"
        subtitle="Review your handpicked items and proceed to secure checkout."
        breadcrumbs={[{ label: "Cart" }]}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 font-roboto">
        <div className="grid gap-8 md:grid-cols-3 font-roboto">
          <div className="space-y-4 md:col-span-2 font-roboto">
            {lines.map((line) => (
              <div
                key={line.variantId}
                className="flex items-center gap-4 rounded-xl border border-gold-500/30 bg-cream-50/90 p-4 shadow-sm font-roboto"
              >
                <ProductImage
                  name={line.productName}
                  corners={false}
                  className="h-16 w-16 flex-shrink-0 rounded-lg border border-gold-500/30"
                />
                <div className="flex-1 font-roboto">
                  <Link
                    to={`/product/${line.productSlug}`}
                    className="font-serif font-semibold text-brown-950 hover:text-forest-800"
                  >
                    {line.productName}
                  </Link>
                  <div className="text-xs text-brown-500 font-roboto">
                    {line.categoryName} • {line.variantLabel}
                  </div>
                  <div className="mt-1 text-sm font-medium text-brown-800 font-roboto">
                    {formatInr(line.priceInr)} each
                  </div>
                </div>
                <div className="flex items-center rounded-lg border border-gold-500/50 bg-white font-roboto">
                  <button
                    onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                    className="px-2.5 py-1 text-brown-700 hover:bg-cream-100 font-roboto"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold font-roboto">{line.quantity}</span>
                  <button
                    onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                    className="px-2.5 py-1 text-brown-700 hover:bg-cream-100 font-roboto"
                  >
                    +
                  </button>
                </div>
                <div className="w-20 text-right font-serif font-bold text-brown-950">
                  {formatInr(line.priceInr * line.quantity)}
                </div>
                <button
                  onClick={() => removeLine(line.variantId)}
                  className="text-brown-400 hover:text-maroon-700 p-1 font-roboto"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-gold-500/40 bg-cream-100/90 p-6 shadow-md font-roboto">
            <h2 className="font-serif mb-4 text-lg font-bold text-brown-950">Order Summary</h2>
            <div className="flex justify-between text-sm text-brown-700 font-roboto">
              <span className="font-roboto">Subtotal</span>
              <span className="font-serif font-bold text-brown-950">{formatInr(subtotalInr)}</span>
            </div>
            <p className="mt-2 text-xs text-brown-600 leading-relaxed font-roboto">
              Free shipping over ₹999 — shipping calculated at checkout.
            </p>
            <button
              onClick={() => navigate("/checkout")}
              className="metallic-gold-btn mt-6 w-full rounded-full py-3.5 text-sm font-bold shadow-md font-roboto cursor-pointer"
            >
              Proceed to Checkout
            </button>
            <Link
              to="/shop"
              className="mt-3 block text-center text-xs font-semibold text-forest-800 hover:underline font-roboto"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
