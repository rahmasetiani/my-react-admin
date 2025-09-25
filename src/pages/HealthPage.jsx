// src/pages/HealthPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ensureSession } from "../lib/api";

export default function HealthPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ subjek: 0, help: 0, demo: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    const safeLen = (resp) => {
      const d = resp?.data;
      if (typeof d?.count === "number") return d.count;      // { count: N }
      if (typeof d?.total === "number") return d.total;      // { total: N }
      if (Array.isArray(d)) return d.length;                 // [ ... ]
      if (d && Array.isArray(d.data)) return d.data.length;  // { data: [ ... ] }
      return 0;
    };

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Pastikan sesi valid (token Bearer / cookie HttpOnly):
        // - Kalau valid → lanjut load data
        // - Kalau invalid → lempar error → ditangkap di catch → redirect ke login
        await ensureSession();

        const [rSubjek, rHelp, rDemo] = await Promise.all([
          api.get("/subjek"),
          api.get("/help"),
          api.get("/demo"),
        ]);

        if (!mounted) return;
        setCounts({
          subjek: safeLen(rSubjek),
          help: safeLen(rHelp),
          demo: safeLen(rDemo),
        });
      } catch (e) {
        if (!mounted) return;

        const message = e?.message || "Gagal memuat dashboard";
        setErr(message);

        // Jika unauthorized, arahkan ke login sambil bawa query `next=/`
        // (Akan balik ke dashboard setelah login)
        if (message.toLowerCase().includes("unauthorized") || message.includes("401")) {
          navigate(`/login?next=/`, { replace: true });
          return;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [navigate]);

  const items = useMemo(
    () => [
      {
        key: "subjek",
        title: "Master Subjek",
        desc: "Total data subjek tersimpan",
        to: "/subjek",
        icon: "📁",
        tone: {
          bg: "#dbeafe",
          fg: "#1d4ed8",
          pillBg: "#eff6ff",
          pillFg: "#1d4ed8",
        },
        value: counts.subjek,
      },
      {
        key: "help",
        title: "Need Help",
        desc: "Total tiket bantuan",
        to: "/help",
        icon: "💬",
        tone: {
          bg: "#fee2e2",
          fg: "#b91c1c",
          pillBg: "#fef2f2",
          pillFg: "#b91c1c",
        },
        value: counts.help,
      },
      {
        key: "demo",
        title: "Request Demo",
        desc: "Total permintaan demo",
        to: "/demo",
        icon: "🎥",
        tone: {
          bg: "#fde68a",
          fg: "#b45309",
          pillBg: "#fffbeb",
          pillFg: "#b45309",
        },
        value: counts.demo,
      },
    ],
    [counts]
  );

  return (
    <section className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-4 lg:py-6">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900">Dashboard Admin</h2>
      <p className="mt-1 text-slate-600">Ringkasan cepat aktivitas dan master data.</p>

      {err && !loading && (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-rose-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => navigate(it.to)}
              aria-label={`${it.title} (${it.value})`}
              className="relative group text-left"
            >
              <div
                className="rounded-2xl p-[1px] transition-transform duration-200 group-hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(15,23,42,.10), rgba(15,23,42,0) 30%, rgba(59,130,246,.25))",
                }}
              >
                <div className="flex items-center gap-4 rounded-2xl bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-4 shadow-sm transition-shadow group-hover:shadow-lg">
                  <span
                    aria-hidden
                    className="grid h-14 w-14 place-items-center rounded-xl text-2xl"
                    style={{
                      background: it.tone.bg,
                      color: it.tone.fg,
                      boxShadow: `0 6px 18px ${alpha(it.tone.fg, 0.18)}`,
                    }}
                  >
                    {it.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-900">{it.title}</h3>
                        <p className="mt-0.5 truncate text-sm text-slate-600">{it.desc}</p>
                      </div>

                      <span
                        className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                        style={{
                          background: it.tone.pillBg,
                          color: it.tone.pillFg,
                          boxShadow: `0 2px 10px ${alpha(it.tone.pillFg, 0.15)}`,
                          borderColor: alpha(it.tone.pillFg, 0.25),
                        }}
                      >
                        {formatNumber(it.value)}
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: clampPercent(it.value),
                          background: `linear-gradient(90deg, ${it.tone.fg} 0%, ${alpha(it.tone.fg, 0.6)} 100%)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-40"
                style={{ background: alpha("#60a5fa", 0.08) }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ===== Utils ===== */
function alpha(hexOrRgb, a = 0.25) {
  if (hexOrRgb?.startsWith("#") && hexOrRgb.length === 7) {
    const r = parseInt(hexOrRgb.slice(1, 3), 16);
    const g = parseInt(hexOrRgb.slice(3, 5), 16);
    const b = parseInt(hexOrRgb.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return "rgba(0,0,0,.12)";
}
function formatNumber(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return String(n ?? 0);
  }
}
/* width progress bar skala log agar proporsional */
function clampPercent(val) {
  const v = Math.max(0, Number(val) || 0);
  const pct = Math.min(100, Math.round((Math.log10(1 + v) / Math.log10(101)) * 100));
  return `${pct}%`;
}
