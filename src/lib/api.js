// src/lib/api.js
import axios from "axios";

/* ============== Config dasar ============== */
export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // penting bila pakai cookie HttpOnly
});

/* ============== Penyimpanan token ============== */
const LS_KEY = "auth_token";
const SS_KEY = "auth_token";

/** preferensi "remember me" (default: true / localStorage) */
let REMEMBER = true;
export function setRememberPreference(v) {
  REMEMBER = !!v;
}

export function getToken() {
  return (
    localStorage.getItem(LS_KEY) ||
    sessionStorage.getItem(SS_KEY) ||
    ""
  );
}

export function setToken(token, { remember = REMEMBER } = {}) {
  // bersihkan dulu agar tidak dobel
  localStorage.removeItem(LS_KEY);
  sessionStorage.removeItem(SS_KEY);

  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  if (remember) localStorage.setItem(LS_KEY, token);
  else sessionStorage.setItem(SS_KEY, token);

  api.defaults.headers.common.Authorization = ` ${token}`;
}

export function clearToken() {
  localStorage.removeItem(LS_KEY);
  sessionStorage.removeItem(SS_KEY);
  delete api.defaults.headers.common.Authorization;
}

/* Pasang Authorization default saat init (kalau ada) */
(() => {
  const t = getToken();
  if (t) api.defaults.headers.common.Authorization = ` ${t}`;
})();

/* ============== Interceptors ============== */
// Tambah header Authorization pada setiap request bila token ada
api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = ` ${t}`;
  return cfg;
});

/* Helper: ambil token dari beragam bentuk respons */
function pickTokenFromResponseData(data) {
  // dukung berbagai naming yang umum
  return (
    data?.token ||
    data?.access_token ||
    data?.jwt ||
    data?.data?.token ||
    ""
  );
}
function pickTokenFromHeaders(headers) {
  // mis. server balikin di X-Auth-Token atau Authorization header
  const fromX = headers?.["x-auth-token"] || headers?.["X-Auth-Token"];
  if (fromX) return fromX;

  const auth = headers?.authorization || headers?.Authorization;
  if (auth && /\s+/i.test(auth)) {
    return auth.replace(/\s+/i, "").trim();
  }
  return "";
}

/* Auto-simpan token saat login (dan tetap mengembalikan token ke pemanggil) */
api.interceptors.response.use(
  (res) => {
    try {
      const url = (res.config?.url || "").toLowerCase();
      const method = (res.config?.method || "").toLowerCase();

      // Hanya untuk call login
      if (method === "post" && (url.endsWith("/auth/login") || url.includes("/auth/login?"))) {
        // 1) coba token dari body
        let token = pickTokenFromResponseData(res.data);

        // 2) fallback: coba dari header
        if (!token) token = pickTokenFromHeaders(res.headers);

        // 3) simpan kalau ada
        if (token) setToken(token); // REMEMBER akan dipakai otomatis

        // 4) agar "login tidak pakai token" di UI, kita kembalikan data apa adanya.
        //    Kalau kamu tetap ingin 'token' selalu ada di respons ke UI:
        //    tambahkan ke objek res.data tanpa menimpa data asli pengguna.
        if (token && !res.data?.token && !res.data?.access_token && !res.data?.jwt) {
          res.data = { ...res.data, token }; // opsional, supaya UI tetap dapat token kalau butuh
        }
      }
    } catch {
      // diamkan: jangan sampe error interceptor menimpa respons utama
    }
    return res;
  },
  (err) => {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      (typeof err?.response?.data === "string" ? err.response.data : "") ||
      err?.message ||
      "Request error";

    if (status === 401) {
      // token invalid/expired → bersihkan & (opsional) redirect
      clearToken();
      // window.location.href = "/login"; // jika mau auto-redirect
    }

    return Promise.reject(new Error(msg));
  }
);

/* ============== Helper opsional lain ============== */
export async function ensureSession() {
  // untuk verifikasi sesi (baik token maupun cookie)
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logoutServerFirst() {
  // panggil endpoint logout server (hapus cookie, dsb), lalu clear token lokal
  // eslint-disable-next-line no-unused-vars
  try { await api.post("/auth/logout-simple"); } catch (e) { /* empty */ }
  clearToken();
}
