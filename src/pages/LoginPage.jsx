// src/pages/LoginPage.jsx
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SmallSwal, SmallToast } from "../lib/alerts";
import { api, setToken, ensureSession } from "../lib/api";

const LOGO_URL = "/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passRef  = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("next") || "/";

  const pickToken = (data) =>
    data?.token || data?.access_token || data?.jwt || data?.data?.token || "";

  // ===== SweetAlert (versi kecil via SmallSwal/SmallToast) =====
  const showLoading = (title = "Memproses...") =>
    SmallSwal.fire({
      title,
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => SmallSwal.showLoading(),
      showConfirmButton: false,
      backdrop: true,
    });

  const showSuccess = (title = "Berhasil masuk") =>
    SmallSwal.fire({
      icon: "success",
      title,
      timer: 1200,
      showConfirmButton: false,
    });

  const showError = (title = "Login gagal", text = "Terjadi kesalahan") =>
    SmallSwal.fire({
      icon: "error",
      title,
      text,
      confirmButtonText: "OK",
    });

  const showWarn = (title = "Periksa kembali", text = "") =>
    SmallSwal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonText: "OK",
    });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validasi kosong pakai SweetAlert kecil
    const emptyEmail = !email.trim();
    const emptyPass  = !password;

    if (emptyEmail || emptyPass) {
      await showWarn(
        "Form belum lengkap",
        `${emptyEmail ? "Email" : ""}${emptyEmail && emptyPass ? " dan " : ""}${emptyPass ? "password" : ""} wajib diisi.`
      );
      if (emptyEmail) emailRef.current?.focus();
      else passRef.current?.focus();
      return;
    }

    setLoading(true);
    showLoading("Masuk ke sistem...");

    try {
      // 1) Login
      const { data } = await api.post("/auth/login", { email, password });

      // 2) Ambil token dari berbagai kemungkinan key
      const token = pickToken(data);
      const user = data?.user || data?.data?.user || null;

      // 3) Jika server kirim token di body → simpan
      if (token) {
        setToken(token, { remember });
        if (user?.id) localStorage.setItem("auth_user_id", String(user.id));
        SmallSwal.close();
        await showSuccess();
        // atau pakai toast kecil:
        // await SmallToast.fire({ icon: "success", title: "Berhasil masuk" });
        navigate(redirectTo, { replace: true });
        return;
      }

      // 4) Cookie-mode fallback
      try {
        const me = await ensureSession();
        if (me?.id) localStorage.setItem("auth_user_id", String(me.id));
        SmallSwal.close();
        await showSuccess();
        navigate(redirectTo, { replace: true });
        return;
      } catch {
        throw new Error(
          "Token tidak diterima dan sesi (cookie) tidak valid. Pastikan server mengembalikan token atau mengatur cookie sesi."
        );
      }
    } catch (e2) {
      const msg =
        e2?.response?.data?.error ||
        e2?.response?.data?.message ||
        (typeof e2?.response?.data === "string" ? e2.response.data : "") ||
        e2?.message ||
        "Gagal login. Periksa kembali email/password atau coba lagi.";
      SmallSwal.close();
      await showError("Login gagal", msg);
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
        noValidate
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

        {/* Email */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MailIcon />
            </span>
            <input
              ref={emailRef}
              name="email"
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
              ref={passRef}
              name="password"
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

        {/* tombol */}
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
