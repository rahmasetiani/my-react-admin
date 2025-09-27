import { useState } from "react";
import Avatar from "../ui/Avatar";

export default function Header({ isDesktop, me, loading, onOpenDrawer, onToggleSidebar, onLogout, navigate }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {!isDesktop && (
          <button
            onClick={() => { onOpenDrawer(); }}
            className="hamburger focusable"
            title="Buka Menu"
            aria-label="Buka Menu"
          >
            ☰
          </button>
        )}

        {/* Tombol kecil untuk toggle di desktop (opsional bisa dihapus) */}
        {isDesktop && (
          <button
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
            className="focusable"
            style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", color: "#fff", fontSize: 18 }}
          >
            {/** ikon sederhana */}≡
          </button>
        )}
      </div>

      {/* Profil di header (desktop) */}
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
              <div
                className="drop-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
              >
                Profil
              </div>
              <hr className="drop-sep" />
              <div className="drop-item" style={{ color: "#ef4444" }} onClick={onLogout}>Logout</div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
