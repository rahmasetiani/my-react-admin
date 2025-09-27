import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SmallSwal, SmallToast } from "../../lib/alerts";
import { useMedia } from "../../hooks/useMedia";
import { useMe } from "../../hooks/useMe";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../App.css";

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mini, setMini] = useState(false);

  const isDesktop = useMedia("(min-width: 1025px)");
  const isMobile  = useMedia("(max-width: 640px)");
  const navigate  = useNavigate();

  const { me, loading, error } = useMe();

  const toast = (title, icon = "success") => SmallToast.fire({ title, icon });
  const alertError = (title, text) => SmallSwal.fire({ icon: "error", title, text, confirmButtonText: "OK" });
  const alertInfo  = (title, text) => SmallSwal.fire({ icon: "info",  title, text, confirmButtonText: "OK" });
  const confirmDialog = (title, text, confirmText = "OK") =>
    SmallSwal.fire({ icon: "question", title, text, showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: "Batal" });

  useEffect(() => {
    if (error) alertError("Gagal Memuat Data", error);
  }, [error]); // tampilkan error bila ada

  // Escape untuk menutup
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setDrawerOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Jika masuk desktop, matikan drawer (khusus mobile)
  useEffect(() => { if (isDesktop) setDrawerOpen(false); }, [isDesktop]);

  const layoutClass = useMemo(() => {
    if (!isDesktop) return "layout";
    return `layout ${mini ? "with-sidebar-collapsed" : "with-sidebar-expanded"}`;
  }, [isDesktop, mini]);

  const toggleSidebar = () => {
    if (isDesktop) setMini(v => !v);
    else setDrawerOpen(true);
  };

  const logout = async () => {
    const res = await confirmDialog("Keluar dari dashboard?", "Anda akan kembali ke halaman login.", "Logout");
    if (!res.isConfirmed) return;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user_id");
    await toast("Berhasil logout", "success");
    navigate("/login", { replace: true });
  };

  return (
    <div className={layoutClass}>
      {/* overlay drawer */}
      {!isDesktop && drawerOpen && <div className="dim" onClick={() => setDrawerOpen(false)} />}

      {/* Sidebar */}
      <Sidebar
        isDesktop={isDesktop}
        mini={mini}
        drawerOpen={drawerOpen}
        onToggleSidebar={toggleSidebar}
        onCloseDrawer={() => setDrawerOpen(false)}
        me={me}
        loading={loading}
        navigate={navigate}
        alertInfo={alertInfo}
        onLogout={logout}
      />

      {/* Main */}
      <div className="main">
        <Header
          isDesktop={isDesktop}
          isMobile={isMobile}
          me={me}
          loading={loading}
          onOpenDrawer={() => { setDrawerOpen(true); }}
          onToggleSidebar={() => { if (isDesktop) setMini(v => !v); }}
          onLogout={logout}
          navigate={navigate}
        />

        <main style={{ padding: isMobile ? 12 : 16 }}>
          {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
