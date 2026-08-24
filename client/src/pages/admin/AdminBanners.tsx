import { useEffect, useState, type ChangeEvent } from "react";
import { api } from "../../api/client";
import { DEFAULT_SLIDES, type SlideItem } from "../../components/HeroSlideshow";

type SlideForm = Omit<SlideItem, "id">;

function stripId(s: SlideItem): SlideForm {
  const { id: _id, ...rest } = s;
  return rest;
}

export function AdminBanners() {
  const [slides, setSlides] = useState<SlideForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<{ slides: SlideForm[] | null }>("/config/hero-slides")
      .then((res) => setSlides(res.data.slides ?? DEFAULT_SLIDES.map(stripId)))
      .catch(() => setSlides(DEFAULT_SLIDES.map(stripId)))
      .finally(() => setLoading(false));
  }, []);

  function update(idx: number, field: keyof SlideForm, value: string) {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function move(idx: number, dir: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function remove(idx: number) {
    if (!confirm("Remove this banner?")) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
  }

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      {
        image: "",
        tag: "New Collection",
        title: "New Banner Title",
        subtitle: "Describe this banner...",
        ctaText: "Shop Now",
        ctaLink: "/shop",
        badge: "Mehfuz",
      },
    ]);
  }

  async function uploadImage(idx: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(idx);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post<{ url: string }>("/uploads", form);
      update(idx, "image", res.data.url);
    } catch {
      setError("Image upload failed — use a JPEG/PNG/WebP under 5MB.");
    } finally {
      setUploadingIdx(null);
      e.target.value = "";
    }
  }

  async function save() {
    if (slides.length === 0) {
      setError("Keep at least one banner.");
      return;
    }
    if (slides.some((s) => !s.image)) {
      setError("Every banner needs an image — upload one for each.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put("/admin/hero-slides", { slides });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Failed to save banners."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-brown-500">Loading...</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brown-950">Home Page Banners</h1>
          <p className="mt-1 text-sm text-brown-500">
            These are the big sliding banners at the top of the home page. Upload wide
            images (about 1400×770 works best).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addSlide}
            disabled={slides.length >= 8}
            className="rounded-full border border-gold-500/50 bg-white px-4 py-2 text-sm font-semibold text-brown-800 hover:bg-cream-100 disabled:opacity-50"
          >
            + Add Banner
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : savedAt ? "Saved ✓" : "Save & Publish"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-maroon-700/40 bg-maroon-700/5 p-3 text-sm text-maroon-700">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {slides.map((s, idx) => (
          <div key={idx} className="rounded-xl border border-gold-500/30 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-brown-950">
                Banner {idx + 1}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded border border-gold-500/40 px-2 py-1 text-brown-700 hover:bg-cream-100 disabled:opacity-40"
                >
                  ↑ Up
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === slides.length - 1}
                  className="rounded border border-gold-500/40 px-2 py-1 text-brown-700 hover:bg-cream-100 disabled:opacity-40"
                >
                  ↓ Down
                </button>
                <button
                  onClick={() => remove(idx)}
                  className="rounded border border-maroon-700/40 px-2 py-1 font-semibold text-maroon-700 hover:bg-maroon-700/10"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-gold-500/30 bg-cream-100">
                  {s.image ? (
                    <img src={s.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-brown-500">No image yet</span>
                  )}
                </div>
                <label className="mt-2 block">
                  <span className="inline-block cursor-pointer rounded-full border border-gold-500/50 bg-cream-50 px-4 py-1.5 text-xs font-semibold text-brown-800 hover:bg-cream-100">
                    {uploadingIdx === idx ? "Uploading..." : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => uploadImage(idx, e)}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-brown-800">Title</span>
                  <input value={s.title} onChange={(e) => update(idx, "title", e.target.value)} className="input" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-brown-800">Small tag (top line)</span>
                  <input value={s.tag} onChange={(e) => update(idx, "tag", e.target.value)} className="input" />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-brown-800">Subtitle</span>
                  <input value={s.subtitle} onChange={(e) => update(idx, "subtitle", e.target.value)} className="input" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-brown-800">Badge</span>
                  <input value={s.badge} onChange={(e) => update(idx, "badge", e.target.value)} className="input" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-brown-800">Button text</span>
                  <input value={s.ctaText} onChange={(e) => update(idx, "ctaText", e.target.value)} className="input" />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-brown-800">
                    Button link (e.g. /shop or /shop?category=dates)
                  </span>
                  <input value={s.ctaLink} onChange={(e) => update(idx, "ctaLink", e.target.value)} className="input" />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
