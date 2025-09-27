import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const msg = e?.response?.data?.message || e?.message || "Gagal memuat profil.";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { me, loading, error };
}
