const CATEGORY_INITIAL_BG: Record<string, string> = {
  "figs-anjeer": "from-[#8a5a2c] to-[#4a2f14]",
  dates: "from-[#7a2418] to-[#3a1008]",
  nuts: "from-[#a9782a] to-[#5c3a1e]",
  raisins: "from-[#5c3a1e] to-[#2b1808]",
  seeds: "from-[#6b7a2c] to-[#3a4210]",
  "dried-fruits-berries": "from-[#93301f] to-[#4a1810]",
  "saffron-kesar": "from-[#cf9a3c] to-[#8a5e1f]",
  coffee: "from-[#4a2f14] to-[#2b1808]",
  spices: "from-[#93301f] to-[#5c1610]",
};

export function ProductTile({
  name,
  categorySlug,
  badge,
  className = "",
}: {
  name: string;
  categorySlug: string;
  badge?: string | null;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  const gradient = CATEGORY_INITIAL_BG[categorySlug] ?? "from-gold-600 to-brown-700";

  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gold-500/40 bg-gradient-to-br ${gradient} ${className}`}
    >
      <div className="pointer-events-none absolute inset-2 rounded-lg border border-gold-300/30" />
      <span className="font-display select-none text-5xl font-bold text-gold-200/90 drop-shadow-sm">
        {initial}
      </span>
      {badge && (
        <span className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brown-950 shadow">
          {badge}
        </span>
      )}
    </div>
  );
}
