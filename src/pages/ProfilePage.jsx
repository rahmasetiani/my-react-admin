// src/pages/ProfilePage.jsx
import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { SmallSwal, SmallToast } from "../lib/alerts";
import { isEmail } from "../lib/validator";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState(null);

  // === STATE FORM (mengikuti tbl_accounts) ===
  const [form, setForm] = useState({
    nik: "",
    nama_lengkap: "",
    no_hp: "",
    email: "",
    password: "",
    role: "",
    created_at: "",
    updated_at: "",
  });

  // Password opsional
  const [pwd, setPwd] = useState({ new_password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validasi
  const [touched, setTouched] = useState({ nama_lengkap: false, email: false });
  const mark = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const isEmpty = (v) => String(v ?? "").trim() === "";
  const errNama = touched.nama_lengkap && isEmpty(form.nama_lengkap);
  const errEmailEmpty = touched.email && isEmpty(form.email);
  const invalidEmail = touched.email && !isEmpty(form.email) && !isEmail(form.email);
  const errPwd = pwd.new_password && pwd.new_password !== pwd.confirm;

  const emailRef = useRef(null);

  // Styles
  const baseInput =
    "h-11 w-full rounded-xl border px-3 outline-none transition disabled:bg-slate-50";
  const ringOk = " border-slate-200 focus:ring-2 ring-primary-100";
  const ringErr = " border-rose-400 ring-1 ring-rose-200";

  // ==== SweetAlert helpers ====
  const showLoading = (title = "Memproses...") =>
    SmallSwal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => SmallSwal.showLoading(),
    });
  const alertError = (title, text) =>
    SmallSwal.fire({ icon: "error", title, text, confirmButtonText: "OK" });
  const alertWarn = (title, text) =>
    SmallSwal.fire({ icon: "warning", title, text, confirmButtonText: "OK" });
  const toast = (title, icon = "success") =>
    SmallToast.fire({ title, icon });

  // Normalisasi respons backend
  const normalizeAccount = (raw = {}) => {
    const nama_lengkap =
      raw.nama_lengkap ?? raw.name_lengkap ?? raw.nama ?? raw.name ?? "";
    return {
      id: raw.id ?? null,
      nik: raw.nik ?? raw.az_nik ?? "",
      nama_lengkap,
      no_hp: raw.no_hp ?? raw.phone ?? "",
      email: raw.email ?? "",
      role: raw.role ?? raw.az_role ?? "",
      created_at: raw.created_at ?? raw.createdAt ?? "",
      updated_at: raw.updated_at ?? raw.updatedAt ?? "",
    };
  };

  // Load akun aktif
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        showLoading("Memuat profil...");
        const uid = localStorage.getItem("auth_user_id");
        let data = null;
        if (uid) data = (await api.get(`/accounts/${uid}`))?.data || null;
        if (!data) {
          const r = await api.get("/accounts?limit=1&offset=0");
          const arr = Array.isArray(r.data) ? r.data : r?.data?.data || [];
          data = arr?.[0] || null;
        }
        if (!mounted) return;
        const n = normalizeAccount(data || {});
        setAccountId(n.id);
        setForm({
          nama_lengkap: n.nama_lengkap,
          email: n.email,
          nik: n.nik,
          no_hp: n.no_hp,
          role: n.role,
          created_at: n.created_at,
          updated_at: n.updated_at,
        });
        SmallSwal.close();
      } catch (e) {
        SmallSwal.close();
        await alertError("Gagal Memuat", e?.response?.data?.message || e?.message || "Tidak dapat memuat profil.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Bangun payload dengan alias field (untuk kompatibilitas backend)
  function buildPayload(form, pwd) {
    const p = {
      // Nama lengkap – kirim dua kemungkinan
      nama_lengkap: (form.nama_lengkap || "").trim(),
      name_lengkap: (form.nama_lengkap || "").trim(),

      // Email
      email: (form.email || "").trim(),

      // NIK & No HP – kirim alias juga
      nik: (form.nik || "").trim(),
      az_nik: (form.nik || "").trim(),
      no_hp: (form.no_hp || "").trim(),
      phone: (form.no_hp || "").trim(),
    };

    // Password: hanya bila diisi & konfirmasi cocok; kirim beberapa nama field umum
    if (pwd.new_password && pwd.new_password === pwd.confirm) {
      p.password = pwd.new_password;
      p.new_password = pwd.new_password;
      p.az_password = pwd.new_password;
    }

    // Tidak kirim role supaya tidak berubah
    return p;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!accountId) return;

    // Validasi kosong
    if (isEmpty(form.nama_lengkap) || isEmpty(form.email)) {
      setTouched({ nama_lengkap: true, email: true });
      await alertWarn("Form belum lengkap", "Nama lengkap dan Email wajib diisi.");
      return;
    }

    // Validasi email format
    if (!isEmail(String(form.email).trim())) {
      setTouched((t) => ({ ...t, email: true }));
      await alertWarn("Email tidak valid", "Contoh yang benar: nama@domain.com");
      emailRef.current?.focus();
      return;
    }

    // Validasi password mismatch
    if (errPwd) {
      await alertWarn("Konfirmasi tidak cocok", "Konfirmasi password harus sama dengan password baru.");
      return;
    }

    const payload = buildPayload(form, pwd);

    try {
      setSaving(true);
      showLoading("Menyimpan profil...");
      await api.put(`/accounts/${accountId}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      SmallSwal.close();
      await toast("Profil berhasil diperbarui");

      // Refresh updated_at dari server
      try {
        const r = await api.get(`/accounts/${accountId}`);
        const n = normalizeAccount(r?.data || {});
        setForm((f) => ({ ...f, updated_at: n.updated_at }));
      } catch {
        // jika gagal refresh, diamkan
      }
      setPwd({ new_password: "", confirm: "" });
      setShowPwd(false);
      setShowConfirm(false);
    } catch (e2) {
      SmallSwal.close();
      await alertError("Gagal Menyimpan", e2?.response?.data?.message || e2?.message || "Tidak dapat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-6">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Profil</h2>
      <p className="mt-1 text-slate-600">
        Data akun Anda dari <code className="font-semibold">tbl_accounts</code>.
      </p>

      {loading ? (
        <div className="mt-6 grid gap-4">
          <div className="h-12 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-12 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-md"
        >
          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Meta label="ID" value={accountId ?? "-"} />
            <Meta label="Role" value={form.role || "-"} />
            <Meta
              label="Terakhir diperbarui"
              value={formatDate(form.updated_at) || "-"}
            />
          </div>

          {/* Nama lengkap */}
          <div className="mt-6">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nama Lengkap
            </label>
            <input
              value={form.nama_lengkap}
              onChange={(e) =>
                setForm((f) => ({ ...f, nama_lengkap: e.target.value }))
              }
              onBlur={() => mark("nama_lengkap")}
              className={baseInput + (errNama ? ringErr : ringOk)}
              placeholder="Nama lengkap *"
            />
            {errNama && (
              <p className="mt-1 text-xs text-rose-600">Nama wajib diisi.</p>
            )}
          </div>

          {/* Email */}
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              ref={emailRef}
              type="text" // hindari tooltip native, validasi manual
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={() => mark("email")}
              className={baseInput + ((errEmailEmpty || invalidEmail) ? ringErr : ringOk)}
              placeholder="nama@domain.com *"
            />
            {errEmailEmpty && (
              <p className="mt-1 text-xs text-rose-600">Email wajib diisi.</p>
            )}
            {!errEmailEmpty && invalidEmail && (
              <p className="mt-1 text-xs text-rose-600">Email tidak valid. Contoh: nama@domain.com</p>
            )}
          </div>

          {/* NIK & No HP */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                NIK
              </label>
              <input
                value={form.nik}
                onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
                className={baseInput + ringOk}
                placeholder="NIK"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                No. HP
              </label>
              <input
                value={form.no_hp}
                onChange={(e) => setForm((f) => ({ ...f, no_hp: e.target.value }))}
                className={baseInput + ringOk}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          {/* Password opsional + ikon mata */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Password Baru (opsional)
              </label>
              <input
                type={showPwd ? "text" : "password"}
                value={pwd.new_password}
                onChange={(e) =>
                  setPwd((p) => ({ ...p, new_password: e.target.value }))
                }
                className={baseInput + ringOk + " pr-10"}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0 bg-transparent border-0 text-slate-600 hover:text-slate-800"
              >
                {showPwd ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Konfirmasi Password
              </label>
              <input
                type={showConfirm ? "text" : "password"}
                value={pwd.confirm}
                onChange={(e) =>
                  setPwd((p) => ({ ...p, confirm: e.target.value }))
                }
                className={baseInput + (errPwd ? ringErr : ringOk) + " pr-10"}
                placeholder="Ulangi password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Sembunyikan password" : "Tampilkan password"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0 bg-transparent border-0 text-slate-600 hover:text-slate-800"
              >
                {showConfirm ? <EyeOff /> : <Eye />}
              </button>
              {errPwd && (
                <p className="mt-1 text-xs text-rose-600">
                  Konfirmasi password tidak sama.
                </p>
              )}
            </div>
          </div>

          {/* Created at */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Meta label="Dibuat pada" value={formatDate(form.created_at) || "-"} full />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
            >
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ==== small components ==== */
function Meta({ label, value, full = false }) {
  return (
    <div
      className={
        "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 " +
        (full ? "sm:col-span-2" : "")
      }
    >
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-800 break-all">
        {String(value || "-")}
      </div>
    </div>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="pointer-events-none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="pointer-events-none">
      <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M9.88 5.09C10.57 5.03 11.27 5 12 5c6.5 0 10 7 10 7a18.3 18.3 0 0 1-4.06 4.73M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 7 10 7c1.43 0 2.76-.26 4-.72" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M9 9a3 3 0 0 1 4 4" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
  );
}

/* ==== utils ==== */
function formatDate(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}
