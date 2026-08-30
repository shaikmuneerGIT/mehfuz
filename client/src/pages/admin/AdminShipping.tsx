import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface ShippingConfig {
  enabled: boolean;
  warehousePincode: string;
  freeAbove: number;
  upto500gFee: number;
  upto1kgFee: number;
  midPerKgFee: number;
  bulkPerKgFee: number;
  cityRadiusKm: number;
}

interface Quote {
  serviceable: boolean;
  feeInr: number;
  weightKg: number;
  distanceKm: number | null;
  zone: string;
}

export function AdminShipping() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testPin, setTestPin] = useState("");
  const [testQuote, setTestQuote] = useState<Quote | null>(null);

  useEffect(() => {
    api.get<ShippingConfig>("/admin/shipping").then((res) => setConfig(res.data));
  }, []);

  // Live-quote the test pincode against the server (same math as checkout).
  useEffect(() => {
    if (testPin.length !== 6) {
      setTestQuote(null);
      return;
    }
    api
      .get<{ quote: Quote }>("/config/shop", { params: { subtotal: 500, pincode: testPin } })
      .then((res) => setTestQuote(res.data.quote))
      .catch(() => setTestQuote(null));
  }, [testPin]);

  if (!config) return <p className="text-brown-500">Loading...</p>;

  function set<K extends keyof ShippingConfig>(key: K, value: ShippingConfig[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      await api.put("/admin/shipping", config);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-brown-950">Shipping</h1>
        <p className="mt-1 text-sm text-brown-500">
          Delivery is <b>within Hyderabad only</b>, shipped by DTDC and charged by parcel
          weight — the same slabs for the whole city, no distance component. Pincodes beyond
          the delivery radius cannot place an order.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-gold-500/30 bg-white p-6">
        <label className="flex items-center gap-3 text-sm font-semibold text-brown-950">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />
          Charge for delivery
          {!config.enabled && (
            <span className="font-normal text-brown-500">
              (currently FREE for every Hyderabad order)
            </span>
          )}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Warehouse pincode</span>
            <input
              value={config.warehousePincode}
              maxLength={6}
              inputMode="numeric"
              onChange={(e) => set("warehousePincode", e.target.value.replace(/\D/g, ""))}
              className="input"
              placeholder="500061"
            />
            <span className="mt-1 block text-xs text-brown-500">
              Distances are measured from here. Change it if the warehouse moves.
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Free delivery above (₹)</span>
            <input
              type="number"
              min={0}
              value={config.freeAbove}
              onChange={(e) => set("freeAbove", Number(e.target.value || 0))}
              className="input"
            />
            <span className="mt-1 block text-xs text-brown-500">0 = never free.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Up to 500 g (₹)</span>
            <input
              type="number"
              min={0}
              value={config.upto500gFee}
              onChange={(e) => set("upto500gFee", Number(e.target.value || 0))}
              className="input"
              disabled={!config.enabled}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Up to 1 kg (₹)</span>
            <input
              type="number"
              min={0}
              value={config.upto1kgFee}
              onChange={(e) => set("upto1kgFee", Number(e.target.value || 0))}
              className="input"
              disabled={!config.enabled}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">2–3 kg — per kg (₹)</span>
            <input
              type="number"
              min={0}
              value={config.midPerKgFee}
              onChange={(e) => set("midPerKgFee", Number(e.target.value || 0))}
              className="input"
              disabled={!config.enabled}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Above 3 kg — per kg (₹)</span>
            <input
              type="number"
              min={0}
              value={config.bulkPerKgFee}
              onChange={(e) => set("bulkPerKgFee", Number(e.target.value || 0))}
              className="input"
              disabled={!config.enabled}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Delivery radius (km)</span>
            <input
              type="number"
              min={1}
              value={config.cityRadiusKm}
              onChange={(e) => set("cityRadiusKm", Number(e.target.value || 1))}
              className="input"
            />
            <span className="mt-1 block text-xs text-brown-500">
              Pincodes farther than this can't order.
            </span>
          </label>
        </div>

        <p className="rounded-lg bg-cream-50 p-3 text-xs text-brown-600">
          With these settings: 250 g = <b>{formatInr(config.upto500gFee)}</b>
          {" • "}1 kg = <b>{formatInr(config.upto1kgFee)}</b>
          {" • "}2 kg = <b>{formatInr(2 * config.midPerKgFee)}</b>
          {" • "}3 kg = <b>{formatInr(3 * config.midPerKgFee)}</b>
          {" • "}5 kg = <b>{formatInr(5 * config.bulkPerKgFee)}</b>
          {config.freeAbove > 0 && <> • orders of {formatInr(config.freeAbove)}+ ship free</>}
        </p>

        <div className="rounded-lg border border-gold-500/30 bg-cream-50 p-4">
          <div className="mb-1 text-sm font-semibold text-brown-800">Try a pincode</div>
          <div className="flex items-center gap-3">
            <input
              value={testPin}
              maxLength={6}
              inputMode="numeric"
              onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ""))}
              className="input max-w-[140px]"
              placeholder="e.g. 500030"
            />
            {testQuote &&
              (testQuote.serviceable ? (
                <span className="text-sm text-brown-900">
                  Deliverable
                  {testQuote.distanceKm !== null && (
                    <span className="text-brown-500"> (≈{testQuote.distanceKm} km away)</span>
                  )}
                </span>
              ) : (
                <span className="text-sm font-semibold text-maroon-700">
                  Outside the delivery area — order would be blocked
                </span>
              ))}
          </div>
          <p className="mt-2 text-[11px] text-brown-500">
            Checks whether a pincode is inside the delivery area. The fee itself depends on the
            parcel weight, using the slabs above.
          </p>
        </div>

        {error && <p className="text-sm text-maroon-700">{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brown-950 px-6 py-2.5 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Shipping Settings"}
        </button>
      </div>
    </div>
  );
}
