import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Product } from "../types";
import { formatInr } from "../lib/format";
import { ProductImage } from "../components/ProductImage";
import { OrnateFrame, Divider, Fleuron } from "../components/art/Ornaments";
import { useCart } from "../context/CartContext";

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addLine } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setNotFound(false);
    api
      .get<Product>(`/catalog/products/${slug}`)
      .then((res) => {
        setProduct(res.data);
        setVariantId(res.data.variants[0]?.id ?? "");
        setQuantity(1);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-brown-700">Product not found.</p>
        <Link to="/shop" className="mt-4 inline-block text-gold-700 hover:underline">
          ← Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-brown-500">Loading...</div>;
  }

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  function handleAddToCart() {
    if (!product || !variant) return;
    addLine({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
      variantId: variant.id,
      variantLabel: variant.label,
      priceInr: variant.priceInr,
      quantity,
      maxStock: variant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    handleAddToCart();
    navigate("/checkout");
  }

  return (
    <div className="parchment">
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 text-sm text-brown-500">
        <Link to="/shop" className="hover:text-gold-700">Shop</Link>
        {" / "}
        <Link to={`/shop?category=${product.category.slug}`} className="hover:text-gold-700">
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-brown-800">{product.name}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <OrnateFrame className="h-fit bg-cream-50 shadow-md">
          <ProductImage
            name={product.name}
            categorySlug={product.category.slug}
            imageUrl={product.imageUrl}
            badge={product.badge}
            corners={false}
            className="rounded-[6px]"
          />
        </OrnateFrame>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
            {product.category.name}
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-brown-950">{product.name}</h1>
          {product.origin && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-brown-500">
              <Fleuron className="h-3 w-3 text-gold-600" />
              Origin: {product.origin}
            </p>
          )}
          <Divider className="mt-4 max-w-[220px]" />
          <p className="mt-4 text-brown-700">{product.description}</p>

          <div className="mt-6">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-800">
              Select pack size
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  disabled={v.stock === 0}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    variantId === v.id
                      ? "border-brown-950 bg-brown-950 text-gold-300"
                      : "border-gold-500/50 text-brown-700 hover:bg-cream-100"
                  }`}
                >
                  {v.label} — {formatInr(v.priceInr)}
                  {v.stock === 0 && " (out of stock)"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gold-500/50">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-lg text-brown-700 hover:bg-cream-100"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(variant?.stock ?? 1, q + 1))}
                className="px-3 py-2 text-lg text-brown-700 hover:bg-cream-100"
              >
                +
              </button>
            </div>
            <span className="text-2xl font-bold text-brown-950">
              {formatInr((variant?.priceInr ?? 0) * quantity)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!variant || variant.stock === 0}
              className="rounded-full border-2 border-brown-950 px-6 py-3 text-sm font-semibold text-brown-950 transition hover:bg-brown-950 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? "Added ✓" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!variant || variant.stock === 0}
              className="rounded-full bg-brown-950 px-6 py-3 text-sm font-semibold text-gold-300 shadow transition hover:bg-brown-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>

          <p className="mt-6 text-xs text-brown-500">
            Free delivery on orders above ₹999 · Cash on Delivery available
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
