import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Logo } from "../../components/Logo";

export function AdminLogin() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (admin) {
    const dest = (location.state as { from?: string } | null)?.from ?? "/admin";
    return <Navigate to={dest} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/admin");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-gold-500/30 bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center">
          <Logo variant="admin" />
          <p className="mt-2 text-center text-sm font-semibold text-brown-800">Admin Portal</p>
        </div>
        <p className="mt-1 text-center text-xs text-brown-500">Sign in to manage your store</p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-brown-800">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-maroon-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-brown-950 py-2.5 text-sm font-semibold text-gold-300 hover:bg-brown-900 disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
