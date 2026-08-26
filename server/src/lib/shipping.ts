import { prisma } from "./prisma";

/**
 * Pincode-proximity delivery pricing, Blinkit/BigBasket style but using PIN
 * prefixes instead of live geo APIs: Indian pincodes are hierarchical, so the
 * longer the shared prefix with the warehouse pincode, the closer the buyer.
 */
export interface ShippingConfig {
  enabled: boolean;
  warehousePincode: string;
  /** Order value at/above which delivery is free (0 disables free delivery). */
  freeAbove: number;
  /** Fees by proximity; localFee applies to the warehouse's own PIN area. */
  localFee: number;      // first 4+ digits match — same locality cluster
  cityFee: number;       // first 3 digits match — same city/district
  regionFee: number;     // first 2 digits match — same region/state belt
  nationalFee: number;   // everything else in India
}

export const DEFAULT_SHIPPING: ShippingConfig = {
  enabled: true,
  warehousePincode: "500061",
  freeAbove: 999,
  localFee: 29,
  cityFee: 49,
  regionFee: 79,
  nationalFee: 129,
};

const KEY = "shippingConfig";
let cache: { config: ShippingConfig; at: number } | null = null;

export async function loadShippingConfig(): Promise<ShippingConfig> {
  if (cache && Date.now() - cache.at < 60_000) return cache.config;
  let config = DEFAULT_SHIPPING;
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    if (row) config = { ...DEFAULT_SHIPPING, ...JSON.parse(row.value) };
  } catch {
    /* table missing or bad JSON — fall back to defaults */
  }
  cache = { config, at: Date.now() };
  return config;
}

export async function saveShippingConfig(config: ShippingConfig): Promise<void> {
  const value = JSON.stringify(config);
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value },
    create: { key: KEY, value },
  });
  cache = { config, at: Date.now() };
}

function sharedPrefixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

export interface ShippingQuote {
  feeInr: number;
  zone: "local" | "city" | "region" | "national" | "free" | "disabled";
}

export function quoteShipping(
  config: ShippingConfig,
  subtotalInr: number,
  pincode: string | undefined
): ShippingQuote {
  if (!config.enabled) return { feeInr: 0, zone: "disabled" };
  if (config.freeAbove > 0 && subtotalInr >= config.freeAbove) {
    return { feeInr: 0, zone: "free" };
  }
  const pin = (pincode ?? "").replace(/\D/g, "");
  // No/invalid pincode yet: quote the worst case so checkout never undercharges.
  if (pin.length !== 6) return { feeInr: config.nationalFee, zone: "national" };

  const shared = sharedPrefixLen(pin, config.warehousePincode);
  if (shared >= 4) return { feeInr: config.localFee, zone: "local" };
  if (shared === 3) return { feeInr: config.cityFee, zone: "city" };
  if (shared === 2) return { feeInr: config.regionFee, zone: "region" };
  return { feeInr: config.nationalFee, zone: "national" };
}
