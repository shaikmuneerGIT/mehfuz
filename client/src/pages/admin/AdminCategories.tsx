import { useEffect, useState, type ChangeEvent } from "react";
import { api } from "../../api/client";
import type { Category } from "../../types";
import { resolveProductImagePath } from "../../components/ProductImage";

/** Row editor for one category's home-page presentation. */
function CategoryRow({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const [imageUrl, setImageUrl] = useState(category.imageUrl ?? "");
  const [showOnHome, setShowOnHome] = useState(category.showOnHome ?? true);
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What the storefront will actually render: the admin photo if set,
  // otherwise the built-in photo matched from the category slug.
  const preview = imageUrl || resolveProductImagePath("", category.slug) || "";

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post<{ url: string }>("/uploads", form);
      setImageUrl(res.data.url);
    } catch {
      setError("Upload failed — try a JPG/PNG/WebP under 5 MB.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/categories/${category.id}`, {
        name: category.name,
        imageUrl: imageUrl || "",
        showOnHome,
        sortOrder: Number(sortOrder || 0),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not save."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gold-500/30 bg-white p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold-500/30 bg-cream-50">
        {preview ? (
          <img src={preview} alt={category.name} className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-[10px] text-brown-500">no photo</span>
        )}
      </div>

      <div className="min-w-[140px] flex-1">
        <div className="font-display font-semibold text-brown-950">{category.name}</div>
        <div className="text-xs text-brown-500">
          {category._count?.products ?? 0} product(s)
          {!imageUrl && <span> • using built-in photo</span>}
        </div>
      </div>

      <label className="text-xs">
        <span className="mb-1 block font-medium text-brown-800">Photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="w-52 text-xs text-brown-700 file:mr-2 file:rounded-full file:border-0 file:bg-brown-950 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-gold-300"
        />
        {uploading && <span className="text-[11px] text-brown-500">Uploading…</span>}
        {imageUrl && (
          <button
            onClick={() => setImageUrl("")}
            className="mt-1 block text-[11px] font-semibold text-maroon-700 hover:underline"
          >
            Remove photo
          </button>
        )}
      </label>

      <label className="text-xs">
        <span className="mb-1 block font-medium text-brown-800">Order</span>
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-20 rounded-lg border border-gold-500/40 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-medium text-brown-800">
        <input
          type="checkbox"
          checked={showOnHome}
          onChange={(e) => setShowOnHome(e.target.checked)}
        />
        Show on home
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-full bg-brown-950 px-5 py-2 text-xs font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>

      {error && <p className="w-full text-xs text-maroon-700">{error}</p>}
    </div>
  );
}

function AddCategoryForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (name.trim().length < 2) {
      setError("Enter a category name (at least 2 letters).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/categories", {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onCreated();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not create the category — the name may already exist."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-gold-500/30 bg-white p-4">
      <div className="mb-2 text-sm font-semibold text-brown-950">Add a new category</div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-56"
            placeholder="e.g. Honey"
          />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block font-medium text-brown-800">Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="Shown on the shop page for this category"
          />
        </label>
        <button
          onClick={create}
          disabled={saving}
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
        >
          {saving ? "Adding…" : "+ Add Category"}
        </button>
      </div>
      <p className="mt-2 text-xs text-brown-500">
        New categories appear in Popular Categories and in the product form's category list —
        then add products to it from the Products page.
      </p>
      {error && <p className="mt-2 text-xs text-maroon-700">{error}</p>}
    </div>
  );
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get<Category[]>("/admin/categories")
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove(c: Category) {
    if (!confirm(`Delete the empty category "${c.name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      load();
    } catch (err) {
      alert(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not delete this category."
      );
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-brown-950">Categories</h1>
        <p className="mt-1 text-sm text-brown-500">
          Controls the “Popular Categories” strip on the home page — upload a photo, set the
          order, or hide a category. Leave the photo empty to use the built-in image.
        </p>
      </div>

      <AddCategoryForm onCreated={load} />

      {loading ? (
        <p className="text-brown-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.id}>
              <CategoryRow category={c} onSaved={load} />
              {(c._count?.products ?? 0) === 0 && (
                <button
                  onClick={() => remove(c)}
                  className="mt-1 text-xs font-semibold text-maroon-700 hover:underline"
                >
                  Delete empty category
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
