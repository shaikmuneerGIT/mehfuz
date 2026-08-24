import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Product, Variant } from "../types";
import { formatInr } from "../lib/format";
import { useCart } from "../context/CartContext";
import { ProductImage } from "../components/ProductImage";
import { Divider, Fleuron, OrnateFrame } from "../components/art/Ornaments";
import { PageBanner } from "../components/PageBanner";

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addLine } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Product>(`/catalog/products/${slug}`)
      .then((res) => {
        setProduct(res.data);
        if (res.data.variants.length > 0) {
          const inStock = res.data.variants.find((v) => v.stock > 0);
          setVariantId((inStock ?? res.data.variants[0]).id);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="parchment flex min-h-[60vh] items-center justify-center font-roboto">
        <p className="font-roboto text-brown-700">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="parchment flex min-h-[60vh] items-center justify-center font-roboto">
        <p className="font-roboto text-brown-700">Product not found.</p>
      </div>
    );
  }

  const variant: Variant | undefined = product.variants.find((v) => v.id === variantId);

  function handleAddToCart() {
    if (!product || !variant) return;
    addLine({
      variantId: variant.id,
      variantLabel: variant.label,
      priceInr: variant.priceInr,
      maxStock: variant.stock,
      quantity,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!product || !variant) return;
    addLine({
      variantId: variant.id,
      variantLabel: variant.label,
      priceInr: variant.priceInr,
      maxStock: variant.stock,
      quantity,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
    });
    navigate("/cart");
  }

  return (
    <div className="parchment min-h-screen font-roboto">
      <PageBanner
        image="/images/realistic_dry_fruits_banner_1.jpg"
        title={product.name}
        subtitle={product.origin ? `Direct Origin: ${product.origin}` : `Premium ${product.category.name}`}
        breadcrumbs={[
          { label: "Shop", href: "/shop" },
          { label: product.category.name, href: `/shop?category=${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 font-roboto">
        <div className="grid gap-10 md:grid-cols-2">
          <OrnateFrame className="bg-cream-50/90 shadow-md">
            <ProductImage
              name={product.name}
              categorySlug={product.category.slug}
              imageUrl={product.imageUrl}
              badge={product.badge}
              corners={false}
              className="rounded-[6px]"
            />
          </OrnateFrame>

          <div className="font-roboto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700 font-roboto">
              {product.category.name}
            </p>
            <h1 className="font-roboto mt-2 text-3xl font-bold text-brown-950 sm:text-4xl">{product.name}</h1>
            {product.origin && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-brown-700 font-roboto">
                <Fleuron className="h-3 w-3 text-forest-700" />
                <span className="font-medium text-brown-900 font-roboto">Origin:</span> {product.origin}
              </p>
            )}
            <Divider className="mt-4 max-w-[220px]" />
            <p className="mt-4 text-brown-700 leading-relaxed font-roboto">{product.description}</p>

            <div className="mt-6 font-roboto">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-800 font-roboto">
                Select pack size
              </div>
              <div className="flex flex-wrap gap-2 font-roboto">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock === 0}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 font-roboto ${
                      variantId === v.id
                        ? "border-forest-950 bg-forest-950 text-gold-300 shadow-sm"
                        : "border-gold-500/50 bg-cream-50/90 text-brown-800 hover:bg-cream-100 hover:text-forest-800"
                    }`}
                  >
                    {v.label} — {formatInr(v.priceInr)}
                    {v.stock === 0 && " (out of stock)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 font-roboto">
              <div className="flex items-center rounded-lg border border-gold-500/50 bg-cream-50 font-roboto">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-lg text-brown-700 hover:bg-cream-100 font-roboto"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold text-brown-950 font-roboto">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(variant?.stock ?? 1, q + 1))}
                  className="px-3 py-2 text-lg text-brown-700 hover:bg-cream-100 font-roboto"
                >
                  +
                </button>
              </div>
              <span className="font-roboto text-2xl font-bold text-brown-950">
                {formatInr((variant?.priceInr ?? 0) * quantity)}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <button
                onClick={handleAddToCart}
                disabled={!variant || variant.stock === 0}
                className="rounded-full border-2 border-forest-950 bg-forest-950 px-7 py-3 text-sm font-semibold text-gold-300 transition hover:bg-forest-900 shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                {added ? "Added ✓" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!variant || variant.stock === 0}
                className="metallic-gold-btn rounded-full px-8 py-3 text-sm font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>

            <p className="mt-6 text-xs text-brown-600">
              Free delivery on orders above ₹999 · Cash on Delivery available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
