// src/pages/SubjekPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { SmallSwal, SmallToast } from "../lib/alerts";
import { api } from "../lib/api";
import "./../index.css";

const DEFAULT_NAMA = "admin";

export default function SubjekPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // search + pagination
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ====== Swal helpers (pakai mixin kecil) ======
  const toast = (title, icon = "success") =>
    SmallToast.fire({ title, icon });

  const alertError = (title, text) =>
    SmallSwal.fire({ icon: "error", title, text, confirmButtonText: "OK" });

  const alertWarn = (title, text) =>
    SmallSwal.fire({ icon: "warning", title, text, confirmButtonText: "OK" });

  const confirmDialog = (title, text, confirmText = "Ya, hapus") =>
    SmallSwal.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: "Batal",
    });

  const showLoading = (title = "Memproses...") =>
    SmallSwal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => SmallSwal.showLoading(),
      showConfirmButton: false,
      backdrop: true,
    });

  // ====== helpers ======
  const norm = (s) => s?.trim().toLowerCase() || "";
  const isDup = (s, ignoreId = null) =>
    rows.some((r) => norm(r.subjek) === norm(s) && r.id !== ignoreId);
  const isEmpty = (v) => !String(v ?? "").trim();

  // ====== fetch ======
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/subjek");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gagal memuat data subjek.";
      await alertError("Gagal Memuat", msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // ====== TAMBAH ======
  const [addOpen, setAddOpen] = useState(false);
  const [subjekBaru, setSubjekBaru] = useState("");
  const [touchedAdd, setTouchedAdd] = useState({ subjek: false });
  const addInputRef = useRef(null);
  const markTouchedAdd = () => setTouchedAdd({ subjek: true });

  const addErrSubjek =
    touchedAdd.subjek && (isEmpty(subjekBaru) || isDup(subjekBaru));

  const add = async (e) => {
    e.preventDefault();
    const s = subjekBaru.trim();

    if (!s || isDup(s)) {
      setTouchedAdd({ subjek: true });
      await alertWarn("Form belum lengkap", !s ? "Subjek wajib diisi." : "Subjek sudah ada.");
      addInputRef.current?.focus();
      return;
    }

    try {
      showLoading("Menyimpan data...");
      await api.post("/subjek", { nama: DEFAULT_NAMA, subjek: s });
      SmallSwal.close();
      setSubjekBaru("");
      setTouchedAdd({ subjek: false });
      setAddOpen(false);
      await load();
      await toast("Berhasil menambahkan subjek");
    } catch (e2) {
      SmallSwal.close();
      const msg = e2?.response?.data?.message || e2?.message || "Gagal menambahkan subjek.";
      await alertError("Gagal", msg);
    }
  };

  // ====== EDIT ======
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editSubjek, setEditSubjek] = useState("");
  const [touchedEdit, setTouchedEdit] = useState({ nama: false, subjek: false });
  const editNamaRef = useRef(null);
  const editSubjekRef = useRef(null);

  const editErrNama = touchedEdit.nama && isEmpty(editNama);
  const editErrSubjek =
    touchedEdit.subjek && (isEmpty(editSubjek) || isDup(editSubjek, editId));

  const openEdit = (r) => {
    setEditId(r.id);
    setEditNama(r.nama ?? "");
    setEditSubjek(r.subjek ?? "");
    setTouchedEdit({ nama: false, subjek: false });
    setEditOpen(true);
    setTimeout(() => editNamaRef.current?.focus(), 50);
  };

  const submitEdit = async (e) => {
    e?.preventDefault?.();
    const invalid = isEmpty(editNama) || isEmpty(editSubjek) || isDup(editSubjek, editId);
    if (invalid) {
      setTouchedEdit({ nama: true, subjek: true });
      await alertWarn(
        "Form belum lengkap",
        isEmpty(editNama)
          ? "Nama wajib diisi."
          : isEmpty(editSubjek)
          ? "Subjek wajib diisi."
          : "Subjek sudah ada."
      );
      if (isEmpty(editNama)) editNamaRef.current?.focus();
      else editSubjekRef.current?.focus();
      return;
    }

    try {
      showLoading("Menyimpan perubahan...");
      await api.put(`/subjek/${editId}`, {
        nama: editNama.trim(),
        subjek: editSubjek.trim(),
      });
      SmallSwal.close();
      setEditOpen(false);
      await load();
      await toast("Perubahan disimpan");
    } catch (e2) {
      SmallSwal.close();
      const msg = e2?.response?.data?.message || e2?.message || "Gagal mengubah data.";
      await alertError("Gagal", msg);
    }
  };

  // ====== HAPUS ======
  const del = async (id) => {
    const ok = await confirmDialog("Hapus data ini?", "Tindakan ini tidak bisa dibatalkan.");
    if (!ok.isConfirmed) return;

    try {
      showLoading("Menghapus data...");
      await api.delete(`/subjek/${id}`);
      SmallSwal.close();
      await load();
      await toast("Data dihapus", "success");
    } catch (e) {
      SmallSwal.close();
      const msg = e?.response?.data?.message || e?.message || "Gagal menghapus data.";
      await alertError("Gagal", msg);
    }
  };

  // ====== filter + paginate (client) ======
  const filtered = useMemo(() => {
    const s = norm(q);
    if (!s) return rows;
    return rows.filter(
      (r) =>
        norm(String(r.id)).includes(s) ||
        norm(r.nama).includes(s) ||
        norm(r.subjek).includes(s)
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * pageSize;
  const displayRows = filtered.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [q, pageSize]);

  return (
    <section className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-4 lg:py-6">
      {/* Header + Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight">
          Master Subjek
        </h2>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80 md:w-96 lg:w-[420px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari id / nama / subjek…"
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm md:text-base outline-none focus:ring-2 ring-primary-100"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-slate-400">
              🔎
            </span>
          </div>
          <button
            onClick={() => {
              setAddOpen(true);
              setSubjekBaru("");
              setTouchedAdd({ subjek: false });
              setTimeout(() => addInputRef.current?.focus(), 50);
            }}
            className="h-10 rounded-xl bg-blue-600 px-4 text-white text-sm md:text-base shadow-sm transition hover:bg-blue-700 active:translate-y-px"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* --------- LIST (MOBILE) --------- */}
      {!loading && (
        <div className="sm:hidden mt-4">
          <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1">
            {displayRows.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">ID: {r.id}</p>
                    <p className="text-sm font-medium text-slate-700">{r.nama}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">Edit</button>
                    <button onClick={() => del(r.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700">Hapus</button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-800">{r.subjek}</p>
              </div>
            ))}
            {!displayRows.length && (
              <p className="text-center text-slate-500 py-6">
                {rows.length ? "Data tidak ditemukan." : "Belum ada data."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* --------- TABLE (TABLET/ DESKTOP) --------- */}
      <div className="hidden sm:block mt-5 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <div className="max-h-[65vh] overflow-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold w-[90px]">ID</th>
                  <th className="px-4 py-3 font-semibold w-[180px]">Nama</th>
                  <th className="px-4 py-3 font-semibold w-auto">Subjek</th>
                  <th className="px-4 py-3 font-semibold w-[200px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`transition hover:bg-slate-50 ${idx % 2 === 1 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    <td className="px-4 py-3 text-slate-700">{r.id}</td>
                    <td className="px-4 py-3 text-slate-700">{r.nama}</td>
                    <td className="px-4 py-3 text-slate-800 lg:whitespace-normal lg:overflow-visible">
                      <div className="truncate lg:truncate-none" title={r.subjek}>{r.subjek}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-xl bg-blue-600 px-3 py-1.5 text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(r.id)}
                          className="rounded-xl bg-rose-600 px-3 py-1.5 text-white shadow-sm transition hover:bg-rose-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!displayRows.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      {rows.length ? "Data tidak ditemukan." : "Belum ada data."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* footer: info & pagination */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-0 sm:px-1">
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-medium">{displayRows.length}</span> dari <span className="font-medium">{filtered.length}</span> data
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}/hal</option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => setPage(1)} disabled={curPage === 1} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40" title="Halaman pertama">«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={curPage === 1} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40" title="Sebelumnya">‹</button>
            <span className="px-2 text-sm">Hal <span className="font-medium">{curPage}</span> / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={curPage === totalPages} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40" title="Berikutnya">›</button>
            <button onClick={() => setPage(totalPages)} disabled={curPage === totalPages} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40" title="Halaman terakhir">»</button>
          </div>
        </div>
      </div>

      {/* ---------- Modal Tambah ---------- */}
      {addOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <form onSubmit={add} className="w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-5">
              <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold">Tambah subjek</h3>
                <button type="button" onClick={() => setAddOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close">×</button>
              </div>

              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-slate-600">Nama (default)</label>
              <input
                value={DEFAULT_NAMA}
                readOnly
                className="mb-3 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-700"
                title="Nama default"
              />

              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-slate-600">Subjek</label>
              <input
                ref={addInputRef}
                value={subjekBaru}
                onChange={(e) => setSubjekBaru(e.target.value)}
                onBlur={markTouchedAdd}
                placeholder="Tulis subjek baru…"
                className={`h-10 w-full rounded-xl border px-3 outline-none transition ${addErrSubjek ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-200"}`}
              />
              {addErrSubjek && (
                <small className="mt-1 block text-xs text-rose-600">
                  {isEmpty(subjekBaru) ? "Subjek wajib diisi." : "Subjek sudah ada."}
                </small>
              )}

              <div className="mt-4 sm:mt-5 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2 text-red-700 hover:bg-red-100">Batal</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-white hover:bg-blue-700">Simpan</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Modal Edit ---------- */}
      {editOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <form onSubmit={submitEdit} className="w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-5">
              <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold">Ubah data</h3>
                <button type="button" onClick={() => setEditOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close">×</button>
              </div>

              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-slate-600">Nama</label>
              <input
                ref={editNamaRef}
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                onBlur={() => setTouchedEdit((t) => ({ ...t, nama: true }))}
                className={`mb-3 h-10 w-full rounded-xl border px-3 outline-none ${editErrNama ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-200"}`}
              />
              {editErrNama && <small className="mt-[-6px] mb-2 block text-xs text-rose-600">Nama wajib diisi.</small>}

              <label className="mb-1 block text-[11px] sm:text-xs font-medium text-slate-600">Subjek</label>
              <input
                ref={editSubjekRef}
                value={editSubjek}
                onChange={(e) => setEditSubjek(e.target.value)}
                onBlur={() => setTouchedEdit((t) => ({ ...t, subjek: true }))}
                className={`h-10 w-full rounded-xl border px-3 outline-none ${editErrSubjek ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-200"}`}
              />
              {editErrSubjek && (
                <small className="mt-1 block text-xs text-rose-600">
                  {isEmpty(editSubjek) ? "Subjek wajib diisi." : "Subjek sudah ada."}
                </small>
              )}

              <div className="mt-4 sm:mt-5 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2 text-red-700 hover:bg-red-100">Batal</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-white hover:bg-blue-700">Simpan</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
