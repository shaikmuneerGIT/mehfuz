import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface ShippingConfig {
  enabled: boolean;
  warehousePincode: string;
  freeAbove: number;
  localFee: number;
  cityFee: number;
  regionFee: number;
  nationalFee: number;
}

const ZONES: { key: keyof ShippingConfig; label: string; hint: string }[] = [
  { key: "localFee", label: "Nearby (same locality)", hint: "first 4 digits of pincode match the warehouse" },
  { key: "cityFee", label: "Within the city", hint: "first 3 digits match — greater Hyderabad" },
  { key: "regionFee", label: "Within the region", hint: "first 2 digits match — Telangana belt" },
  { key: "nationalFee", label: "Rest of India", hint: "everywhere else" },
];

export function AdminShipping() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testPin, setTestPin] = useState("");

  useEffect(() => {
    api.get<ShippingConfig>("/admin/shipping").then((res) => setConfig(res.data));
  }, []);

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

  // Mirror of the server's prefix rule, for the live preview below.
  function preview(pin: string): { label: string; fee: number } | null {
    if (!config || !/^\d{6}$/.test(pin)) return null;
    let n = 0;
    while (n < 6 && pin[n] === config.warehousePincode[n]) n++;
    if (n >= 4) return { label: "Nearby", fee: config.localFee };
    if (n === 3) return { label: "Within the city", fee: config.cityFee };
    if (n === 2) return { label: "Within the region", fee: config.regionFee };
    return { label: "Rest of India", fee: config.nationalFee };
  }
  const testQuote = preview(testPin);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-brown-950">Shipping</h1>
        <p className="mt-1 text-sm text-brown-500">
          Delivery fees are worked out from how close the customer's pincode is to your
          warehouse — nearer pincodes pay less, like Blinkit or BigBasket.
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
            <span className="font-normal text-brown-500">(currently FREE for everyone)</span>
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
              Where orders ship from. Change this if the warehouse moves.
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
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-brown-800">Delivery fees by distance</div>
          <div className="space-y-2">
            {ZONES.map((z) => (
              <div key={z.key} className="flex items-center gap-3">
                <div className="w-56">
                  <div className="text-sm text-brown-900">{z.label}</div>
                  <div className="text-[11px] text-brown-500">{z.hint}</div>
                </div>
                <span className="text-sm text-brown-500">₹</span>
                <input
                  type="number"
                  min={0}
                  value={config[z.key] as number}
                  onChange={(e) => set(z.key, Number(e.target.value || 0) as never)}
                  className="input max-w-[110px]"
                  disabled={!config.enabled}
                />
              </div>
            ))}
          </div>
        </div>

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
            {testQuote && config.enabled && (
              <span className="text-sm text-brown-900">
                {testQuote.label} — <b>{formatInr(testQuote.fee)}</b>
                {config.freeAbove > 0 && (
                  <span className="text-brown-500">
                    {" "}
                    (free at {formatInr(config.freeAbove)}+)
                  </span>
                )}
              </span>
            )}
            {testPin.length === 6 && !config.enabled && (
              <span className="text-sm text-brown-900">FREE — charging is off</span>
            )}
          </div>
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
