import path from "node:path";
import fs from "node:fs";
import { prisma } from "./prisma";

/**
 * Hyderabad-only delivery with Zomato-style distance fares: a base fee covers
 * the first few kilometres from the warehouse, then a per-km charge. The
 * straight-line distance comes from a bundled table of geocoded Hyderabad
 * pincodes; anything beyond the city radius (or outside the table and not a
 * Hyderabad-prefixed pin) is not serviceable.
 */
export interface ShippingConfig {
  enabled: boolean;
  warehousePincode: string;
  /** Order value at/above which delivery is free (0 disables free delivery). */
  freeAbove: number;
  /** Base fee covering the first `baseKm` kilometres. */
  baseFee: number;
  baseKm: number;
  /** Charge per started km beyond `baseKm`. */
  perKmFee: number;
  /** Beyond this straight-line distance the order is not serviceable. */
  cityRadiusKm: number;
}

export const DEFAULT_SHIPPING: ShippingConfig = {
  enabled: true,
  warehousePincode: "500061",
  freeAbove: 1499,
  baseFee: 30,
  baseKm: 4,
  perKmFee: 8,
  cityRadiusKm: 40,
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

// ---- Pincode coordinates (Hyderabad + surroundings, geocoded once) ----

let pinTable: Record<string, [number, number]> | null = null;

function loadPins(): Record<string, [number, number]> {
  if (pinTable) return pinTable;
  const candidates = [
    path.resolve(process.cwd(), "hyd-pincodes.json"),
    path.resolve(__dirname, "..", "..", "hyd-pincodes.json"),
  ];
  for (const p of candidates) {
    try {
      pinTable = JSON.parse(fs.readFileSync(p, "utf-8"));
      return pinTable!;
    } catch {
      /* try next */
    }
  }
  pinTable = {};
  return pinTable;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const [la1, lo1] = [rad(a[0]), rad(a[1])];
  const [la2, lo2] = [rad(b[0]), rad(b[1])];
  const h =
    Math.sin((la2 - la1) / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** A handful of Hyderabad pins aren't in the geocode table; price them as a mid-city trip. */
const FALLBACK_KM = 15;

export interface ShippingQuote {
  serviceable: boolean;
  feeInr: number;
  distanceKm: number | null;
  zone: "city" | "free" | "disabled" | "outside" | "unknown";
}

function kmFee(config: ShippingConfig, km: number): number {
  const extraKm = Math.max(0, Math.ceil(km - config.baseKm));
  return config.baseFee + extraKm * config.perKmFee;
}

export function quoteShipping(
  config: ShippingConfig,
  subtotalInr: number,
  pincode: string | undefined
): ShippingQuote {
  const pin = (pincode ?? "").replace(/\D/g, "");
  if (pin.length !== 6) {
    return { serviceable: false, feeInr: 0, distanceKm: null, zone: "unknown" };
  }

  const pins = loadPins();
  const warehouse = pins[config.warehousePincode];
  const customer = pins[pin];

  let distanceKm: number | null = null;
  if (warehouse && customer) {
    distanceKm = Math.round(haversineKm(warehouse, customer) * 10) / 10;
  } else if (/^500\d{3}$/.test(pin) || /^5015\d{2}$/.test(pin) || /^5011\d{2}$/.test(pin)) {
    // Hyderabad-prefixed pin missing from the table: assume a mid-city trip.
    distanceKm = FALLBACK_KM;
  }

  if (distanceKm === null || distanceKm > config.cityRadiusKm) {
    return { serviceable: false, feeInr: 0, distanceKm, zone: "outside" };
  }
  if (!config.enabled) {
    return { serviceable: true, feeInr: 0, distanceKm, zone: "disabled" };
  }
  if (config.freeAbove > 0 && subtotalInr >= config.freeAbove) {
    return { serviceable: true, feeInr: 0, distanceKm, zone: "free" };
  }
  return { serviceable: true, feeInr: kmFee(config, distanceKm), distanceKm, zone: "city" };
}
