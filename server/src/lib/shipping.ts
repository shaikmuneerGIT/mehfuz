import path from "node:path";
import fs from "node:fs";
import { prisma } from "./prisma";

/**
 * Delivery across Telangana, Andhra Pradesh and Karnataka, priced by parcel
 * weight on our DTDC slabs — the same rate everywhere, with no distance
 * component. Serviceability is decided by the pincode's state, since India
 * allocates pincodes in contiguous blocks per state; the bundled table of
 * geocoded Hyderabad pincodes is now only used to show a distance in the
 * admin, never to accept or refuse an order.
 */

export interface ServiceableState {
  code: string;
  name: string;
  /** Inclusive range of the pincode's first three digits. */
  from: number;
  to: number;
}

export const STATE_PIN_RANGES: ServiceableState[] = [
  { code: "TG", name: "Telangana", from: 500, to: 509 },
  { code: "AP", name: "Andhra Pradesh", from: 515, to: 535 },
  { code: "KA", name: "Karnataka", from: 560, to: 591 },
];

/** The state a pincode belongs to, or null if it is outside all of them. */
export function stateForPin(pin: string): ServiceableState | null {
  if (!/^\d{6}$/.test(pin)) return null;
  const prefix = Number(pin.slice(0, 3));
  return STATE_PIN_RANGES.find((s) => prefix >= s.from && prefix <= s.to) ?? null;
}
export interface ShippingConfig {
  enabled: boolean;
  warehousePincode: string;
  /** Order value at/above which delivery is free (0 disables free delivery). */
  freeAbove: number;
  /** Flat fee up to half a kilo. */
  upto500gFee: number;
  /** Flat fee above 500 g and up to 1 kg. */
  upto1kgFee: number;
  /** Per (rounded-up) kg above 1 kg and up to 3 kg. */
  midPerKgFee: number;
  /** Per (rounded-up) kg above 3 kg. */
  bulkPerKgFee: number;
  /** Beyond this straight-line distance the order is not serviceable. */
  cityRadiusKm: number;
  /** State codes we deliver to; a pincode outside all of them is refused. */
  serviceableStates: string[];
}

export const DEFAULT_SHIPPING: ShippingConfig = {
  enabled: true,
  warehousePincode: "500061",
  freeAbove: 1499,
  upto500gFee: 60,
  upto1kgFee: 100,
  midPerKgFee: 80,
  bulkPerKgFee: 60,
  cityRadiusKm: 40,
  serviceableStates: ["TG", "AP", "KA"],
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

// ---- Parcel weight ----

/** Pack labels that carry no weight ("1 unit") bill as a quarter kilo. */
const DEFAULT_ITEM_KG = 0.25;

/** "250g" → 0.25, "1kg" → 1, "1 gram" → 0.001. */
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

export function cartWeightKg(items: { label: string; quantity: number }[]): number {
  return items.reduce((kg, i) => kg + parseWeightKg(i.label) * i.quantity, 0);
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

/** A handful of Hyderabad pins aren't in the geocode table; treat as in-city. */
const FALLBACK_KM = 15;

export interface ShippingQuote {
  serviceable: boolean;
  feeInr: number;
  weightKg: number;
  distanceKm: number | null;
  /** A state code (TG/AP/KA) when deliverable, otherwise why not. */
  zone: string;
  /** Human-readable state name, for the admin pincode check. */
  stateName: string | null;
}

/** DTDC slabs: ≤500 g flat, ≤1 kg flat, then per rounded-up kg. */
export function weightFee(config: ShippingConfig, weightKg: number): number {
  if (weightKg <= 0.5) return config.upto500gFee;
  if (weightKg <= 1) return config.upto1kgFee;
  const billedKg = Math.ceil(weightKg);
  return weightKg <= 3 ? billedKg * config.midPerKgFee : billedKg * config.bulkPerKgFee;
}

export function quoteShipping(
  config: ShippingConfig,
  subtotalInr: number,
  pincode: string | undefined,
  weightKg = 0
): ShippingQuote {
  const pin = (pincode ?? "").replace(/\D/g, "");
  if (pin.length !== 6) {
    return {
      serviceable: false,
      feeInr: 0,
      weightKg,
      distanceKm: null,
      zone: "unknown",
      stateName: null,
    };
  }

  // Distance is informational only now — DTDC charges the same by weight
  // whether the parcel goes across Hyderabad or to Bangalore.
  const pins = loadPins();
  const warehouse = pins[config.warehousePincode];
  const customer = pins[pin];
  const distanceKm =
    warehouse && customer ? Math.round(haversineKm(warehouse, customer) * 10) / 10 : null;

  const state = stateForPin(pin);
  const allowed = config.serviceableStates ?? DEFAULT_SHIPPING.serviceableStates;
  if (!state || !allowed.includes(state.code)) {
    return {
      serviceable: false,
      feeInr: 0,
      weightKg,
      distanceKm,
      zone: "outside",
      stateName: state ? state.name : null,
    };
  }
  if (!config.enabled) {
    return {
      serviceable: true,
      feeInr: 0,
      weightKg,
      distanceKm,
      zone: "disabled",
      stateName: state.name,
    };
  }
  if (config.freeAbove > 0 && subtotalInr >= config.freeAbove) {
    return {
      serviceable: true,
      feeInr: 0,
      weightKg,
      distanceKm,
      zone: "free",
      stateName: state.name,
    };
  }
  return {
    serviceable: true,
    feeInr: weightFee(config, weightKg),
    weightKg,
    distanceKm,
    zone: state.code,
    stateName: state.name,
  };
}
