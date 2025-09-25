// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, setToken, ensureSession } from "../lib/api";

const LOGO_URL = "/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("next") || "/";

  const pickToken = (data) =>
    data?.token || data?.access_token || data?.jwt || data?.data?.token || "";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // 1) Login
      const { data } = await api.post("/auth/login", { email, password });

      // 2) Jika server kirim token di body → simpan
      const token = pickToken(data);
      const user = data?.user || data?.data?.user || null;

      if (token) {
        setToken(token, { remember });
        if (user?.id) localStorage.setItem("auth_user_id", String(user.id));
        navigate(redirectTo, { replace: true });
        return;
      }

      // 3) Jika tidak ada token → asumsi cookie-mode. Verifikasi sesi.
      try {
        const me = await ensureSession();
        if (me?.id) localStorage.setItem("auth_user_id", String(me.id));
        navigate(redirectTo, { replace: true });
        return;
      } catch {
        throw new Error("Login gagal: token tidak diterima dan sesi cookie tidak valid");
      }
    } catch (e2) {
      const msg =
        e2?.response?.data?.error ||
        e2?.response?.data?.message ||
        (typeof e2?.response?.data === "string" ? e2.response.data : "") ||
        e2?.message ||
        "Gagal login";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative grid place-items-center overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 px-4">
      {/* blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-400/40 blur-3xl" />

      {/* card */}
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white/95 shadow-xl ring-1 ring-slate-200 backdrop-blur p-6 md:p-8"
      >
        {/* logo + title */}
        <div className="text-center mb-6">
          {LOGO_URL ? (
            <img
              src={LOGO_URL}
              alt="Logo"
              className="mx-auto mb-3 h-14 w-14 rounded-xl object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-extrabold">
              IA
            </div>
          )}
          <h2 className="text-2xl font-extrabold text-indigo-900">Admin Login</h2>
          <p className="text-xs text-slate-500">Masuk untuk mengelola dashboard</p>
        </div>

        {err && (
          <p className="mb-4 rounded-lg bg-rose-100 px-3 py-2 text-center text-sm font-medium text-rose-700">
            {err}
          </p>
        )}

        {/* Email */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MailIcon />
            </span>
            <input
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <LockIcon />
            </span>
            <input
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Remember */}
        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 text-sm font-bold text-white shadow-md transition hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Login"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Tip: gunakan email &amp; password yang terdaftar di sistem.
        </p>
      </form>
    </div>
  );
}

/* ===== Icons ===== */
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-slate-500">
      <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" fill="none" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-slate-500">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M2.25 12s3.75-6.75 9.75-6.75c2.2 0 4.08.73 5.69 1.82M21.75 12s-3.75 6.75-9.75 6.75c-2.2 0-4.08-.73-5.69-1.82" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" fill="none" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-slate-400">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-slate-400">
      <rect x="4.5" y="10" width="15" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
