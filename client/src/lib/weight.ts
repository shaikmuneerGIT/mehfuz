/**
 * Parcel weight from pack labels — mirrors the server's parser exactly so the
 * fee shown at checkout matches the fee charged on the order.
 */
const DEFAULT_ITEM_KG = 0.25;

export function parseWeightKg(label: string): number {
  const m = label
    .toLowerCase()
    .replace(/[`'"]/g, "")
    .match(/([\d.]+)\s*(kgs?|kilograms?|kilos?|gms?|grams?|g)\b/);
  if (!m) return DEFAULT_ITEM_KG;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ITEM_KG;
  return m[2].startsWith("k") ? n : n / 1000;
}

export function cartWeightKg(lines: { variantLabel: string; quantity: number }[]): number {
  return lines.reduce((kg, l) => kg + parseWeightKg(l.variantLabel) * l.quantity, 0);
}

/** "750 g" under a kilo, "2.5 kg" above — for display next to the fee. */
export function formatWeight(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${Number(kg.toFixed(2))} kg`;
}
