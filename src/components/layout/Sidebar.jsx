import { useState } from "react";
import SideLink from "../ui/SideLink";
import Avatar from "../ui/Avatar";

const LOGO_URL = "/logo.png";

export default function Sidebar({
  isDesktop,
  mini,
  drawerOpen,
  onToggleSidebar,
  onCloseDrawer,
  me,
  loading,
  navigate,
  alertInfo,
  onLogout,
}) {
  const [sideProfileOpen, setSideProfileOpen] = useState(false);

  return (
    <>
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
            onClick={onToggleSidebar}
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
                <div
                  className="drop-item"
                  onClick={() => {
                    setSideProfileOpen(false);
                    onCloseDrawer();
                    navigate("/profile");
                  }}
                >
                  Profil
                </div>
                <div
                  className="drop-item"
                  onClick={() => alertInfo("Pengaturan", "Halaman pengaturan belum tersedia.")}
                >
                  Pengaturan
                </div>
                <hr className="drop-sep" />
                <div className="drop-item" style={{ color: "#ef4444" }} onClick={onLogout}>Logout</div>
              </div>
            )}
          </div>
        )}

        {/* NAV */}
        <nav className="side-nav">
          <SideLink to="/"       icon="🏠" label="Dashboard" end  mini={isDesktop && mini} onIconClick={onToggleSidebar} onNavigate={onCloseDrawer} />
          <SideLink to="/subjek" icon="🗂️" label="Subjek"         mini={isDesktop && mini} onIconClick={onToggleSidebar} onNavigate={onCloseDrawer} />
          <SideLink to="/help"   icon="💬" label="Help"           mini={isDesktop && mini} onIconClick={onToggleSidebar} onNavigate={onCloseDrawer} />
          <SideLink to="/demo"   icon="🎥" label="Demo"           mini={isDesktop && mini} onIconClick={onToggleSidebar} onNavigate={onCloseDrawer} />
        </nav>

        <div style={{ marginTop: "20px", marginBottom: "100px", display: "flex", justifyContent: "center" }}>
          <button
            className="chip"
            onClick={() => (isDesktop ? onToggleSidebar() : onCloseDrawer())}
            title={isDesktop ? (mini ? "Perbesar" : "Perkecil") : "Tutup"}
            aria-label={isDesktop ? (mini ? "Perbesar" : "Perkecil") : "Tutup"}
          >
            {isDesktop ? (mini ? "→" : "←") : "✕"}
          </button>
        </div>
      </aside>
    </>
  );
}
