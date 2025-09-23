// src/pages/HealthPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function HealthPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ subjek: 0, help: 0, demo: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // inject style lokal untuk kartu
  useEffect(() => {
    const id = "health-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.innerHTML = `
        .cards{ display:grid; gap:14px; grid-template-columns: repeat(1, minmax(0,1fr)); }
        @media (min-width:640px){ .cards{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (min-width:1024px){ .cards{ grid-template-columns: repeat(3, minmax(0,1fr)); } }
        .card{ display:flex; gap:12px; align-items:center; padding:14px; border-radius:16px;
               background:#fff; border:1px solid #e5e7eb; transition: transform .12s ease, box-shadow .12s ease;
               cursor:pointer; }
        .card:hover{ transform: translateY(-2px); box-shadow:0 8px 24px rgba(2,6,23,.08); }
        .badge{ font-size:12px; font-weight:700; padding:4px 8px; border-radius:999px; }
        .skel{ height:84px; border-radius:16px; background:linear-gradient(90deg,#f3f4f6 25%,#f8fafc 37%,#f3f4f6 63%);
               background-size:400% 100%; animation:health-shimmer 1.2s infinite; border:1px solid #e5e7eb; }
        @keyframes health-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const safeLen = (r) => {
      // dukung berbagai bentuk payload: array langsung atau {data:[...]}
      const d = r?.data;
      if (Array.isArray(d)) return d.length;
      if (d && Array.isArray(d.data)) return d.data.length;
      // fallback: 0
      return 0;
    };

    (async () => {
      try {
        setLoading(true);
        setErr("");
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
        setErr(e.message || "Gagal memuat dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const items = useMemo(() => ([
    {
      key: "subjek",
      title: "Master Subjek",
      desc: "Total data subjek tersimpan",
      to: "/subjek",
      icon: "📁",
      tone: { bg: "#dbeafe", fg: "#1d4ed8", pillBg: "#eff6ff", pillFg: "#1d4ed8" },
      value: counts.subjek,
    },
    {
      key: "help",
      title: "Need Help",
      desc: "Total tiket bantuan",
      to: "/help",
      icon: "💬",
      tone: { bg: "#fee2e2", fg: "#b91c1c", pillBg: "#fef2f2", pillFg: "#b91c1c" },
      value: counts.help,
    },
    {
      key: "demo",
      title: "Request Demo",
      desc: "Total permintaan demo",
      to: "/demo",
      icon: "🎥",
      tone: { bg: "#fde68a", fg: "#b45309", pillBg: "#fffbeb", pillFg: "#b45309" },
      value: counts.demo,
    },
  ]), [counts]);

  return (
    <section>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0b1220", marginBottom: 12 }}>Dashboard Admin</h2>
      <p style={{ color: "#4b5563", marginBottom: 16 }}>Ringkasan cepat aktivitas dan master data.</p>

      {err && (
        <div style={{
          background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b",
          padding:"10px 12px", borderRadius:12, marginBottom:12
        }}>
          {err}
        </div>
      )}

      {loading ? (
        <div className="cards">
          <div className="skel" />
          <div className="skel" />
          <div className="skel" />
        </div>
      ) : (
        <div className="cards">
          {items.map((it) => (
            <button
              key={it.key}
              className="card"
              onClick={() => navigate(it.to)}
              aria-label={`${it.title} (${it.value})`}
            >
              <div
                aria-hidden
                style={{
                  width: 46, height: 46, borderRadius: 12,
                  display: "grid", placeItems: "center",
                  background: it.tone.bg, color: it.tone.fg, fontSize: 22, fontWeight: 700,
                }}
              >
                {it.icon}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:8, justifyContent:"space-between" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color:"#0b1220", margin:0 }}>{it.title}</h3>
                  <span
                    className="badge"
                    style={{ background: it.tone.pillBg, color: it.tone.pillFg, border:`1px solid ${alpha(it.tone.pillFg, .25)}` }}
                  >
                    {it.value}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0 0", color:"#6b7280", fontSize: 13 }}>{it.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* util kecil buat border pill */
function alpha(hexOrRgb, a = .25) {
  // hanya untuk warna #rrggbb sederhana
  if (hexOrRgb?.startsWith("#") && (hexOrRgb.length === 7)) {
    const r = parseInt(hexOrRgb.slice(1,3),16);
    const g = parseInt(hexOrRgb.slice(3,5),16);
    const b = parseInt(hexOrRgb.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return "rgba(0,0,0,.12)";
}
