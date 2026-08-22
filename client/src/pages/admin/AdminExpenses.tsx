import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { Expense } from "../../types";
import { formatInr } from "../../lib/format";

export function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<Expense[]>("/admin/expenses")
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/admin/expenses/${id}`);
    load();
  }

  const totalInr = expenses.reduce((sum, e) => sum + e.amountInr, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brown-950">Expenses</h1>
          <p className="mt-1 text-sm text-brown-500">
            Record business expenses — rent, packaging, transport, salaries. These are
            subtracted from profit on the dashboard.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brown-950 px-5 py-2 text-sm font-semibold text-gold-300 hover:bg-brown-900"
        >
          {showForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {showForm && (
        <AddExpenseForm
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-brown-500">Loading...</p>
      ) : expenses.length === 0 ? (
        <p className="text-brown-500">No expenses recorded yet.</p>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-gold-500/30 bg-white p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-brown-500">
              Total Expenses
            </span>
            <span className="font-display ml-3 text-xl font-bold text-brown-950">
              {formatInr(totalInr)}
            </span>
          </div>
          <div className="space-y-3">
            {expenses.map((e) => (
              <div key={e.id} className="rounded-xl border border-gold-500/30 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-display font-semibold text-brown-950">{e.title}</div>
                    <div className="text-sm text-brown-700">
                      {e.category ? `${e.category} • ` : ""}
                      {new Date(e.incurredAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {e.notes && <div className="mt-1 text-xs italic text-brown-500">{e.notes}</div>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wide text-brown-500">Amount</div>
                      <div className="font-display font-bold text-brown-950">
                        {formatInr(e.amountInr)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-sm font-semibold text-maroon-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CATEGORIES = ["Rent", "Packaging", "Transport", "Salaries", "Marketing", "Utilities", "Other"];

function AddExpenseForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amountInr, setAmountInr] = useState("");
  const [incurredAt, setIncurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/expenses", {
        title,
        category: category || undefined,
        notes: notes || undefined,
        amountInr: Number(amountInr || 0),
        incurredAt: new Date(incurredAt).toISOString(),
      });
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Failed to save expense."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-xl border border-gold-500/30 bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">What was this for?</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="e.g. Delivery boxes and tape"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Category (optional)</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Amount (₹)</span>
          <input
            required
            type="number"
            min={1}
            value={amountInr}
            onChange={(e) => setAmountInr(e.target.value)}
            className="input"
            placeholder="e.g. 1500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brown-800">Date</span>
          <input
            required
            type="date"
            value={incurredAt}
            onChange={(e) => setIncurredAt(e.target.value)}
            className="input"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-brown-800">Notes (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Anything worth remembering about this expense"
          />
        </label>
      </div>

      {error && <p className="text-sm text-maroon-700">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brown-950 px-6 py-2.5 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Expense"}
      </button>
    </form>
  );
}
