import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "./lib/api";
import HealthPage from "./pages/HealthPage.jsx";
import SubjekPage from "./pages/SubjekPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import DemoPage from "./pages/DemoPage.jsx";

const LOGO_URL = "/logo.png"; // /public/logo.png

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile/tablet drawer
  const [mini, setMini] = useState(false);             // desktop mini sidebar
  const [profileOpen, setProfileOpen] = useState(false);      // header dropdown
  const [sideProfileOpen, setSideProfileOpen] = useState(false); // sidebar dropdown (mobile)
  const navigate = useNavigate();

  const isDesktop = useMedia("(min-width: 1025px)");
  const isMobile  = useMedia("(max-width: 640px)");

  /* ---------- Global CSS ---------- */
  useEffect(() => {
    const id = "app-global-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.innerHTML = `
        :root{
          --header:#0b63f3; --sidebar:#0b63f3; --ring:#93c5fd;
          --text:#0b1220; --muted:#4b5563; --bg:#f6f8fc;
        }
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        .layout{display:grid;min-height:100vh;background:var(--bg);grid-template-columns:72px 1fr;font-family:Inter, system-ui, sans-serif}
        .main{display:grid;grid-template-rows:auto 1fr;min-width:0}
        .header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--header);position:sticky;top:0;z-index:10}

        .sidebar{background:var(--sidebar);color:#eaf2ff;position:sticky;top:0;align-self:start;height:100dvh;display:flex;flex-direction:column}
        .sidebar.expanded{width:260px}
        .sidebar.collapsed{width:72px}

        .side-brand{display:flex;align-items:center;gap:10px;padding:14px 12px;border-bottom:1px solid rgba(255,255,255,.15)}
        .brand-title{color:#fff;font-weight:800;letter-spacing:.2px;font-size:16px;line-height:1}
        .logo{width:36px;height:36px;border-radius:10px;object-fit:cover;display:block}

        .side-ctrl{padding:8px;border-bottom:1px solid rgba(255,255,255,.15);display:flex;gap:8px}
        .chip{display:grid;place-items:center;min-width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.25);color:#fff;cursor:pointer}
        .chip:focus-visible{outline:2px solid var(--ring);outline-offset:2px}

        .side-nav{padding:8px;flex:1;overflow:auto}
        .side-nav .link{font-size:15px} /* font sidebar dibesarkan */

        .hamburger{width:38px;height:38px;border-radius:12px;background:#fff;border:1px solid #dbeafe;color:#0b63f3;font-weight:800;cursor:pointer}
        .profile-btn{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:6px 8px;cursor:pointer}
        .profile-dd{position:absolute;right:0;margin-top:8px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);min-width:200px;padding:6px;z-index:20}
        .drop-item{padding:8px 10px;border-radius:8px;cursor:pointer;font-size:14px;color:#111827}
        .drop-sep{border:0;border-top:1px solid #e5e7eb;margin:6px 0}
        .skeleton{width:220px;height:44px;border-radius:12px;background:linear-gradient(90deg,#ffffff55 25%,#ffffff99 37%,#ffffff55 63%);background-size:400% 100%;animation:shimmer 1.2s infinite}

        .dim{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:30}
        .focusable:focus-visible{outline:2px solid var(--ring);outline-offset:2px}

        /* Drawer (<=1024px) */
        @media (max-width:1024px){
          .layout{grid-template-columns:1fr}
          .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:40;transform:translateX(-100%);transition:transform .2s ease-out;width:260px}
          .sidebar.drawer-open{transform:translateX(0)}
        }
        /* Desktop columns */
        @media (min-width:1025px){
          .layout.with-sidebar-expanded{grid-template-columns:260px 1fr}
          .layout.with-sidebar-collapsed{grid-template-columns:72px 1fr}
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  /* ---------- Load profil ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const uid = localStorage.getItem("auth_user_id");
        let data = null;
        if (uid) data = (await api.get(`/accounts/${uid}`))?.data || null;
        if (!data) {
          const r = await api.get("/accounts?limit=1&offset=0");
          data = Array.isArray(r.data) && r.data.length ? r.data[0] : null;
        }
        if (mounted) setMe(data);
      } catch (e) {
        if (mounted) setError(e.message || "Gagal memuat profil");
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  /* ---------- Shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setDrawerOpen(false); setProfileOpen(false); setSideProfileOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (isDesktop) setDrawerOpen(false); }, [isDesktop]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user_id");
    navigate("/login", { replace: true });
  };

  /* ---------- Layout state ---------- */
  const layoutClass = useMemo(() => {
    if (!isDesktop) return "layout";
    return `layout ${mini ? "with-sidebar-collapsed" : "with-sidebar-expanded"}`;
  }, [isDesktop, mini]);

  // Buka/tutup via logo atau ikon menu
  const toggleByIcon = () => {
    if (isDesktop) setMini(v => !v);
    else setDrawerOpen(true);
  };

  return (
    <div className={layoutClass}>
      {/* overlay drawer */}
      {!isDesktop && drawerOpen && <div className="dim" onClick={() => { setDrawerOpen(false); setSideProfileOpen(false); }} />}

      {/* SIDEBAR */}
      <aside
        className={[
          "sidebar",
          isDesktop ? (mini ? "collapsed" : "expanded") : drawerOpen ? "drawer-open" : ""
        ].join(" ")}
        role="navigation"
        aria-label="Sisi navigasi"
      >
        {/* Brand (logo toggle) */}
        <div className="side-brand">
          <button
            onClick={toggleByIcon}
            title="Toggle Sidebar"
            className="focusable"
            style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
            <img src={LOGO_URL} alt="IronAsia" className="logo" />
            {isDesktop && !mini && <span className="brand-title">IronAsia Admin</span>}
          </button>
        </div>

        {/* (Mobile) Profil + dropdown DI SIDEBAR */}
        {!isDesktop && (
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,.15)", position:"relative" }}>
            {loading ? (
              <div className="skeleton" style={{ width: "100%", height: 44 }} />
            ) : (
              <button
                onClick={() => setSideProfileOpen(v => !v)}
                className="focusable"
                style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:8, width:"100%", display:"flex", alignItems:"center", gap:10, color:"#0b1220" }}
                title="Akun"
              >
                <Avatar name={me?.nama || me?.name || "User"} src={me?.avatar || me?.photo} />
                <div style={{ minWidth: 0, textAlign:"left" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{me?.nama || me?.name || "Administrator"}</div>
                  <div style={{ fontSize: 12, color:"#4b5563" }}>{me?.email || "-"}</div>
                </div>
                <span style={{ marginLeft: "auto", opacity: .75 }}>▾</span>
              </button>
            )}

            {sideProfileOpen && (
              <div
                className="profile-dd"
                role="menu"
                style={{ left: 12, right: 12, position: "absolute", marginTop: 8 }}
              >
                <div className="drop-item" onClick={() => setSideProfileOpen(false)}>Profil</div>
                <div className="drop-item" onClick={() => setSideProfileOpen(false)}>Pengaturan</div>
                <hr className="drop-sep" />
                <div className="drop-item" style={{ color: "#ef4444" }} onClick={logout}>Logout</div>
              </div>
            )}
          </div>
        )}

        {/* ====== CONTROL BAR DI ATAS NAV (⇠ pindahan dari bawah) ====== */}
        {/* NAV */}
        <nav className="side-nav">
          <SideLink to="/"      icon="🏠" label="Dashboard" end  mini={isDesktop && mini} onIconClick={toggleByIcon} onNavigate={() => { setDrawerOpen(false); setSideProfileOpen(false); }} />
          <SideLink to="/subjek" icon="🗂️" label="Subjek"         mini={isDesktop && mini} onIconClick={toggleByIcon} onNavigate={() => { setDrawerOpen(false); setSideProfileOpen(false); }} />
          <SideLink to="/help"   icon="💬" label="Help"           mini={isDesktop && mini} onIconClick={toggleByIcon} onNavigate={() => { setDrawerOpen(false); setSideProfileOpen(false); }} />
          <SideLink to="/demo"   icon="🎥" label="Demo"           mini={isDesktop && mini} onIconClick={toggleByIcon} onNavigate={() => { setDrawerOpen(false); setSideProfileOpen(false); }} />
        </nav> 
<div
  style={{
    marginTop: "20px",        // jarak dari menu terakhir ke tombol
    marginBottom: "500px",     // jarak dari bawah layar (biar ga nempel banget)
    display: "flex",
    justifyContent: "center",
  }}
>
  <button
    className="chip"
    onClick={() => (isDesktop ? setMini(v => !v) : setDrawerOpen(false))}
    title={isDesktop ? (mini ? "Perbesar" : "Perkecil") : "Tutup"}
    aria-label={isDesktop ? (mini ? "Perbesar" : "Perkecil") : "Tutup"}
  >
    {isDesktop ? (mini ? "→" : "←") : "✕"}
  </button>
</div>

   
      </aside>
      {/* MAIN */}
      <div className="main">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isDesktop && (
              <button
                onClick={() => { setDrawerOpen(true); setSideProfileOpen(false); }}
                className="hamburger focusable"
                title="Buka Menu"
                aria-label="Buka Menu"
              >
                ☰
              </button>
            )}
            <button
              onClick={toggleByIcon}
              title="Beranda"
              aria-label="Beranda"
              className="focusable"
              style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
            >
            </button>
          </div>

          {/* (Desktop) Profil di header; (Mobile) pindah ke sidebar */}
          {isDesktop && (
            <div style={{ position: "relative" }}>
              {loading ? (
                <div className="skeleton" />
              ) : (
                <button onClick={() => setProfileOpen(p => !p)} className="profile-btn focusable" title="Akun">
                  <Avatar name={me?.nama || me?.name || "User"} src={me?.avatar || me?.photo} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>
                      {me?.nama || me?.name || "Administrator"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{me?.email || "-"}</div>
                  </div>
                  <span style={{ marginLeft: 6, opacity: .75 }}>▾</span>
                </button>
              )}

              {profileOpen && (
                <div className="profile-dd" role="menu">
                  <div className="drop-item" onClick={() => setProfileOpen(false)}>Profil</div>
                  <div className="drop-item" onClick={() => setProfileOpen(false)}>Pengaturan</div>
                  <hr className="drop-sep" />
                  <div className="drop-item" style={{ color: "#ef4444" }} onClick={logout}>Logout</div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* CONTENT */}
        <main style={{ padding: isMobile ? 12 : 16 }}>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <Routes>
            <Route path="/" element={<HealthPage />} />
            <Route path="/subjek" element={<SubjekPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/demo" element={<DemoPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */
function SideLink({ to, icon, label, end, mini, onNavigate, onIconClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <NavLink
        to={to}
        end={end}
        onClick={onNavigate}
        className="focusable link"
        style={({ isActive }) => ({
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", margin: "6px 8px",
          textDecoration: "none", borderRadius: 12,
          color: "#eaf2ff",
          background: isActive ? "rgba(255,255,255,.14)" : "transparent",
          border: "1px solid rgba(255,255,255,.18)",
          justifyContent: mini ? "center" : "flex-start",
          fontWeight: 600
        })}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={mini ? label : undefined}
      >
        {/* Klik ikon juga toggle mini/expand atau buka drawer */}
        <span
          style={{ width: 20, textAlign: "center", cursor: "pointer" }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIconClick?.(); }}
          aria-label={`Toggle ${label}`}
          title={`Toggle ${label}`}
        >
          {icon}
        </span>
        {!mini && <span>{label}</span>}
      </NavLink>
      {mini && hover && (
        <div
          role="tooltip"
          style={{
            position: "absolute", left: 72 + 8, top: "50%", transform: "translateY(-50%)",
            background: "#111827", color: "#fff", padding: "6px 8px", fontSize: 12,
            borderRadius: 8, whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,.18)", zIndex: 10
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function Avatar({ name = "U", src }) {
  const initials = name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);
  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb" }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  ) : (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "#0b63f3", color: "#fff", fontWeight: 700, display: "grid", placeItems: "center"
    }}>{initials}</div>
  );
}

/* ---------- Hooks ---------- */
function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatch(m.matches);
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);
  return match;
}
