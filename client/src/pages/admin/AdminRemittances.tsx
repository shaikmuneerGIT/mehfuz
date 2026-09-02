import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import { formatInr } from "../../lib/format";

interface Remittance {
  id: string;
  paidOn: string;
  amountInr: number;
  paidBy: string;
  paidTo: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
}

interface DayTotal {
  day: string;
  label: string;
  totalInr: number;
  count: number;
}

interface PersonTotal {
  paidBy: string;
  paidTo: string;
  totalInr: number;
  count: number;
}

interface RemittanceData {
  remittances: Remittance[];
  totalInr: number;
  days: DayTotal[];
  byPerson: PersonTotal[];
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const METHODS = ["Cash", "UPI", "Bank transfer", "Cheque"];

/**
 * Money handed between the people running the shop — the seller settling up
 * with whoever supplied and sent the goods. Kept on its own books: the goods
 * were already costed when their delivery was recorded, so counting this cash
 * against earnings too would subtract the same money twice.
 */
export function AdminRemittances() {
  const [data, setData] = useState<RemittanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidOn, setPaidOn] = useState(() => isoDay(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<RemittanceData>("/admin/remittances", {
        params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
      })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [from, to]);

  // Names already used are offered back, so the same two people are spelled
  // the same way every time and their totals actually group together.
  const knownPeople = [
    ...new Set(
      (data?.remittances ?? []).flatMap((r) => [r.paidBy, r.paidTo]).filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter the amount handed over.");
      return;
    }
    if (!paidBy.trim() || !paidTo.trim()) {
      setError("Say who gave the money and who received it.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/remittances", {
        amountInr: Math.round(value),
        paidBy: paidBy.trim(),
        paidTo: paidTo.trim(),
        method: method || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
        paidOn,
      });
      setAmount("");
      setReference("");
      setNotes("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Could not save this entry."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Remittance) {
    if (
      !confirm(
        `Delete the ${formatInr(r.amountInr)} ${r.paidBy} gave ${r.paidTo}?\n\nThis cannot be undone.`
      )
    )
      return;
    try {
      await api.delete(`/admin/remittances/${r.id}`);
      load();
    } catch {
      alert("Could not delete this entry.");
    }
  }

  const rows = data?.remittances ?? [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brown-950">Remittance</h1>
          <p className="mt-1 max-w-xl text-sm text-brown-500">
            Money handed between the team — the seller settling up with whoever supplied and
            sent the goods. It is kept separate from earnings on purpose: the goods were
            already costed when their delivery was recorded, so counting this cash again
            would subtract the same money twice.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900"
        >
          {showForm ? "Cancel" : "+ Add Entry"}
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gold-500/30 bg-white px-5 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-brown-500">
            Total handed over{from || to ? " in this range" : ""}
          </div>
          <div className="font-display text-2xl font-bold text-brown-950">
            {formatInr(data?.totalInr ?? 0)}
          </div>
          <div className="text-xs text-brown-500">
            {rows.length} entr{rows.length === 1 ? "y" : "ies"}
          </div>
        </div>
        <div className="rounded-xl border border-gold-500/30 bg-white px-5 py-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-brown-500">
            Who paid whom
          </div>
          {(data?.byPerson ?? []).length === 0 ? (
            <div className="text-sm text-brown-500">Nothing recorded yet.</div>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {data!.byPerson.map((p) => (
                <li key={`${p.paidBy}-${p.paidTo}`} className="flex justify-between gap-3">
                  <span className="truncate text-brown-800">
                    {p.paidBy} → {p.paidTo}
                  </span>
                  <span className="font-semibold text-brown-950">{formatInr(p.totalInr)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gold-500/30 bg-white px-4 py-3">
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-brown-600">From</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gold-500/40 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-brown-600">To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gold-500/40 px-2 py-1 text-sm"
          />
        </label>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="pb-1 text-xs font-semibold text-brown-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-xl border border-gold-500/30 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brown-800">Amount handed over (₹)</span>
              <input
                required
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                placeholder="e.g. 5000"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brown-800">Date</span>
              <input
                required
                type="date"
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
                className="input"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brown-800">Who gave the money</span>
              <input
                required
                list="remit-people"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="input"
                placeholder="e.g. Hyderabad — sales"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brown-800">Who received it</span>
              <input
                required
                list="remit-people"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="input"
                placeholder="e.g. Bangalore — supply"
              />
            </label>
            <datalist id="remit-people">
              {knownPeople.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brown-800">How</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="input"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brown-800">
                Reference (optional)
              </span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="input"
                placeholder="UPI / cheque number"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-brown-800">Note (optional)</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                placeholder="e.g. against August supply"
              />
            </label>
          </div>

          {error && <p className="text-sm text-maroon-700">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brown-950 px-6 py-2.5 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Entry"}
          </button>
        </form>
      )}

      {loading && !data ? (
        <p className="text-brown-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-gold-500/30 bg-white px-4 py-8 text-center text-sm text-brown-500">
          Nothing recorded{from || to ? " in this range" : " yet"}. Use <b>+ Add Entry</b> each
          time money changes hands.
        </p>
      ) : (
        <div className="space-y-5">
          {data!.days.map((day) => (
            <div key={day.day}>
              <div className="mb-1.5 flex items-baseline justify-between border-b border-gold-500/25 pb-1">
                <h2 className="font-display text-sm font-bold text-brown-950">{day.label}</h2>
                <span className="text-sm font-semibold text-brown-700">
                  {formatInr(day.totalInr)}
                  <span className="ml-2 text-xs font-normal text-brown-500">
                    {day.count} entr{day.count === 1 ? "y" : "ies"}
                  </span>
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gold-500/30 bg-white">
                <table className="w-full text-sm">
                  <tbody>
                    {rows
                      .filter((r) => r.paidOn.slice(0, 10) === day.day)
                      .map((r) => (
                        <tr key={r.id} className="border-b border-gold-500/15 last:border-0">
                          <td className="px-4 py-2 font-semibold text-brown-950">
                            {formatInr(r.amountInr)}
                          </td>
                          <td className="px-3 py-2 text-brown-800">
                            {r.paidBy} <span className="text-brown-400">→</span> {r.paidTo}
                          </td>
                          <td className="px-3 py-2 text-brown-600">{r.method ?? ""}</td>
                          <td className="px-3 py-2 font-mono text-xs text-brown-500">
                            {r.reference ?? ""}
                          </td>
                          <td className="px-3 py-2 text-xs italic text-brown-500">
                            {r.notes ?? ""}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => remove(r)}
                              className="text-xs font-semibold text-maroon-700 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
