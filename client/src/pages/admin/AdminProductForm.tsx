import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Category, Product } from "../../types";

interface VariantForm {
  id?: string;
  label: string;
  priceInr: string;
  stock: string;
}

const emptyVariant: VariantForm = { label: "", priceInr: "", stock: "100" };

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [badge, setBadge] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<VariantForm[]>([{ ...emptyVariant }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Category[]>("/catalog/categories").then((res) => {
      setCategories(res.data);
      if (!categoryId && res.data[0]) setCategoryId(res.data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNew) return;
    api.get<Product[]>(`/admin/products`).then((res) => {
      const p = res.data.find((prod) => prod.id === id);
      if (!p) return;
      setName(p.name);
      setDescription(p.description ?? "");
      setOrigin(p.origin ?? "");
      setBadge(p.badge ?? "");
      setCategoryId(p.categoryId);
      setIsFeatured(p.isFeatured);
      setIsActive(p.isActive);
      setVariants(
        p.variants.map((v) => ({
          id: v.id,
          label: v.label,
          priceInr: String(v.priceInr),
          stock: String(v.stock),
        }))
      );
    });
  }, [id, isNew]);

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        origin,
        badge: badge || undefined,
        categoryId,
        isFeatured,
        isActive,
        variants: variants.map((v) => ({
          id: v.id,
          label: v.label,
          priceInr: Number(v.priceInr),
          stock: Number(v.stock),
        })),
      };
      if (isNew) {
        await api.post("/admin/products", payload);
      } else {
        await api.put(`/admin/products/${id}`, payload);
      }
      navigate("/admin/products");
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Failed to save product.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold text-brown-950">
        {isNew ? "Add Product" : "Edit Product"}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-brown-800">Product Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-brown-800">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Origin</span>
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="input" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Badge (optional)</span>
            <input value={badge} onChange={(e) => setBadge(e.target.value)} className="input" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-brown-800">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-brown-800">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-brown-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Visible in shop
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-brown-800">Pack sizes &amp; pricing</span>
            <button
              type="button"
              onClick={addVariant}
              className="text-sm font-medium text-gold-700 hover:underline"
            >
              + Add pack size
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={v.id ?? i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input
                  required
                  placeholder="Label e.g. 250g"
                  value={v.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                  className="input"
                />
                <input
                  required
                  type="number"
                  min={1}
                  placeholder="Price (₹)"
                  value={v.priceInr}
                  onChange={(e) => updateVariant(i, { priceInr: e.target.value })}
                  className="input"
                />
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: e.target.value })}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  disabled={variants.length === 1}
                  className="rounded-lg border border-gold-500/40 px-3 text-brown-500 hover:text-maroon-700 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-maroon-700">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brown-950 px-6 py-2.5 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-full border border-gold-500/50 px-6 py-2.5 text-sm font-semibold text-brown-700 hover:bg-cream-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
