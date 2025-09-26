// src/pages/DemoPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { SmallSwal, SmallToast } from "../lib/alerts"; // ⬅️ pakai swal kecil
import "./../index.css";
import { isEmail } from "../lib/validator"; // ⬅️ pakai validator email

const STATUSES = ["PENDING", "APPROVE", "RESCHEDULE", "CANCELLED", "DONE"];

const buildMessageByStatus = (status, { demo, reason, date, time, location }) => {
  const dateStr = date
    ? new Date(date).toISOString().slice(0, 10)
    : demo?.prefered_date
    ? new Date(demo.prefered_date).toISOString().slice(0, 10)
    : "-";
  const timeStr = time || demo?.prefered_time || "";
  const locStr = (location?.trim() || demo?.location || "https://meet.google.com/aup-zuzq-vwn/");

  switch (status) {
    case "PENDING":
      return `Halo ${demo?.nama || "User"},\n\nPermintaan demo Anda (#${demo?.id}) sedang PENDING.\n${reason ? "Catatan: " + reason + "\n" : ""}\nStatus: ${status}\nJadwal (sementara): ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nKami akan mengabari update selanjutnya.`;
    case "APPROVE":
      return `Halo ${demo?.nama || "User"},\n\nPermintaan demo Anda (#${demo?.id}) telah DISETUJUI.\n${reason ? "Catatan: " + reason + "\n" : ""}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nSalam,\nIronAsia`;
    case "RESCHEDULE":
      return `Halo ${demo?.nama || "User"},\n\nJadwal demo #${demo?.id} perlu DIJADWAL ULANG.\n${reason ? "Alasan: " + reason + "\n" : ""}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nTerima kasih.`;
    case "CANCELLED":
      return `Halo ${demo?.nama || "User"},\n\nDemo #${demo?.id} dibatalkan (CANCELLED).\n${reason ? "Alasan: " + reason + "\n" : ""}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}`;
    case "DONE":
      return `Halo ${demo?.nama || "User"},\n\nDemo #${demo?.id} telah SELESAI.\n${reason ? "Ringkasan: " + reason + "\n" : ""}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nTerima kasih telah menggunakan layanan kami.`;
    default:
      return "";
  }
};

const formatDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toISOString().slice(0, 10);
};

export default function DemoPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // create
  const [form, setForm] = useState({
    nama: "",
    email: "",
    message: "",
    jenis_demo: "ONLINE",
    prefered_date: "",
    prefered_time: "",
  });
  const [touched, setTouched] = useState({
    nama: false,
    email: false,
    jenis_demo: false,
    prefered_date: false,
    prefered_time: false,
    message: false,
  });
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const [addOpen, setAddOpen] = useState(false);
  const emailRef = useRef(null);

  // detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // reply
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyFor, setReplyFor] = useState(null);
  const [replyForm, setReplyForm] = useState({
    template: "PENDING",
    reason: "",
    message: "",
    prefered_date: "",
    prefered_time: "",
    location: "",
    send_email: true,
  });

  // filters + search + pagination (client-side)
  const [q, setQ] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ==== SweetAlert helpers (kecil) ==== */
  const showLoading = (title = "Memproses...") =>
    SmallSwal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => SmallSwal.showLoading(),
    });

  const toast = (title, icon = "success") => SmallToast.fire({ title, icon });
  const alertWarn = (t, m = "") => SmallSwal.fire({ icon: "warning", title: t, text: m, confirmButtonText: "OK" });
  const alertError = (t, m = "") => SmallSwal.fire({ icon: "error", title: t, text: m, confirmButtonText: "OK" });
  const confirmDialog = (t, m, ok = "Ya, hapus") =>
    SmallSwal.fire({ icon: "question", title: t, text: m, showCancelButton: true, confirmButtonText: ok, cancelButtonText: "Batal" });

  /* ==== load data ==== */
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/demo?limit=200&offset=0");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gagal memuat data demo.";
      await alertError("Gagal Memuat", msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ====== VALIDASI CREATE ====== */
  const isEmpty = (v) => String(v ?? "").trim() === "";
  const baseInput = "h-10 w-full rounded-xl border px-3";
  const redIf = (cond) => (cond ? " border-rose-400 ring-1 ring-rose-200" : " border-slate-200");

  const errNama  = touched.nama          && isEmpty(form.nama);
  const errEmail = touched.email         && isEmpty(form.email);
  const errJenis = touched.jenis_demo    && isEmpty(form.jenis_demo);
  const errDate  = touched.prefered_date && isEmpty(form.prefered_date);
  const errTime  = touched.prefered_time && isEmpty(form.prefered_time);
  const errMsg   = touched.message       && isEmpty(form.message);

  const submitCreate = async (e) => {
    e.preventDefault();

    const missing =
      isEmpty(form.nama) ||
      isEmpty(form.email) ||
      isEmpty(form.jenis_demo) ||
      isEmpty(form.prefered_date) ||
      isEmpty(form.prefered_time) ||
      isEmpty(form.message);

    if (missing) {
      setTouched({
        nama: true, email: true, jenis_demo: true, prefered_date: true, prefered_time: true, message: true,
      });
      await alertWarn("Form belum lengkap", "Nama, Email, Jenis, Tanggal, Jam dan Message wajib diisi.");
      return;
    }
    if (!isEmail(form.email)) {
      await alertWarn("Email tidak valid", "Contoh: nama@domain.com");
      emailRef.current?.focus();
      return;
    }

    try {
      showLoading("Menyimpan data...");
      await api.post("/demo", {
        ...form,
        prefered_date: formatDate(form.prefered_date),
      });
      SmallSwal.close();
      setForm({ nama: "", email: "", message: "", jenis_demo: "ONLINE", prefered_date: "", prefered_time: "" });
      setTouched({ nama: false, email: false, jenis_demo: false, prefered_date: false, prefered_time: false, message: false });
      setAddOpen(false);
      await load();
      await toast("Demo berhasil dibuat");
    } catch (e2) {
      SmallSwal.close();
      const msg = e2?.response?.data?.message || e2?.message || "Gagal membuat demo.";
      await alertError("Gagal", msg);
    }
  };

  /* ===== detail ===== */
  const openDetail = async (id) => {
    try {
      showLoading("Memuat detail...");
      const { data } = await api.get(`/demo/${id}`);
      SmallSwal.close();
      setSelected(data || null);
      setDetailOpen(true);
    } catch (e) {
      SmallSwal.close();
      const msg = e?.response?.data?.message || e?.message || "Gagal membuka detail.";
      await alertError("Gagal", msg);
    }
  };

  /* ===== delete ===== */
  const remove = async (id) => {
    const r = await confirmDialog("Hapus demo ini?", "Tindakan ini tidak bisa dibatalkan.", "Ya, hapus");
    if (!r.isConfirmed) return;

    try {
      showLoading("Menghapus data...");
      await api.delete(`/demo/${id}`);
      SmallSwal.close();
      await load();
      if (selected?.id === id) { setDetailOpen(false); setSelected(null); }
      await toast("Data dihapus");
    } catch (e) {
      SmallSwal.close();
      const msg = e?.response?.data?.message || e?.message || "Gagal menghapus demo.";
      await alertError("Gagal", msg);
    }
  };

  /* ===== reply ===== */
  const openReply = (demo) => {
    const initial = "PENDING";
    const msg = buildMessageByStatus(initial, { demo, reason: "" });
    setReplyFor(demo);
    setReplyForm({
      template: initial,
      reason: "",
      message: msg,
      prefered_date: formatDate(demo.prefered_date) || "",
      prefered_time: demo.prefered_time || "",
      location: "",
      send_email: true,
    });
    setReplyOpen(true);
  };

  const updateReplyForm = (patch) => {
    setReplyForm((f) => {
      const next = { ...f, ...patch };
      return {
        ...next,
        message: buildMessageByStatus(next.template, {
          demo: replyFor,
          reason: next.reason,
          date: next.prefered_date,
          time: next.prefered_time,
          location: next.location,
        }),
      };
    });
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyFor) return;

    if (!replyForm.message.trim()) {
      await alertWarn("Validasi", "Reply message wajib diisi.");
      return;
    }
    try {
      setReplyBusy(true);
      showLoading("Mengirim reply...");
      await api.post(`/demo/${replyFor.id}/replies`, {
        message: replyForm.message.trim(),
        status: replyForm.template,
        prefered_date: formatDate(replyForm.prefered_date),
        prefered_time: replyForm.prefered_time,
        location: replyForm.location,
        send_email: !!replyForm.send_email,
      });
      SmallSwal.close();
      setReplyOpen(false);
      setReplyFor(null);
      await load();
      await toast("Reply terkirim");
    } catch (e2) {
      SmallSwal.close();
      const msg = e2?.response?.data?.message || e2?.message || "Gagal mengirim reply.";
      await alertError("Gagal", msg);
    } finally {
      setReplyBusy(false);
    }
  };

  // === client filter ===
  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    let list = items;

    if (filterJenis)  list = list.filter((i) => String(i.jenis_demo) === String(filterJenis));
    if (filterStatus) list = list.filter((i) => String(i.status) === String(filterStatus));
    if (dateFilter)   list = list.filter((i) => formatDate(i.prefered_date) === dateFilter);

    if (s) {
      list = list.filter(
        (i) =>
          String(i.id).toLowerCase().includes(s) ||
          (i.nama || "").toLowerCase().includes(s) ||
          (i.email || "").toLowerCase().includes(s) ||
          (i.jenis_demo || "").toLowerCase().includes(s) ||
          (i.status || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [items, q, filterJenis, filterStatus, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * pageSize;
  const displayRows = filtered.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [q, filterJenis, filterStatus, dateFilter, pageSize]);

  const badgeClass = (status) =>
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs border " +
    (status === "DONE"
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : status === "APPROVE"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : status === "CANCELLED"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "RESCHEDULE"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-slate-100 text-slate-700 border-slate-200");

  return (
    <section className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-4 lg:py-6">
      {/* Header + filters/actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight">Request Demo</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm md:text-base">
            <option value="">Semua Jenis</option>
            <option value="ONLINE">ONLINE</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm md:text-base">
            <option value="">Semua Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" title="Filter tanggal" />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80 md:w-96 lg:w-[420px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari id / nama / email / jenis / status…"
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm md:text-base outline-none focus:ring-2 ring-primary-100"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            </div>

            <button
              onClick={() => {
                setAddOpen(true);
                setForm({ nama: "", email: "", message: "", jenis_demo: "ONLINE", prefered_date: "", prefered_time: "" });
                setTouched({ nama: false, email: false, jenis_demo: false, prefered_date: false, prefered_time: false, message: false });
              }}
              className="h-10 rounded-xl bg-blue-600 px-4 text-white text-sm md:text-base shadow-sm transition hover:bg-blue-700 active:translate-y-px"
            >
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* ===== LIST (MOBILE CARD) ===== */}
      {!loading && (
        <div className="sm:hidden mt-4">
          <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1">
            {displayRows.map((i) => (
              <div key={i.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">ID: {i.id}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{i.nama}</p>
                    <p className="text-xs text-slate-600 truncate">{i.email}</p>
                    <div className="mt-1 text-xs text-slate-700">
                      <div><span className="text-slate-500">Jenis:</span> {i.jenis_demo}</div>
                      <div><span className="text-slate-500">Tanggal:</span> {formatDate(i.prefered_date) || "-"}</div>
                      <div><span className="text-slate-500">Jam:</span> {i.prefered_time || "-"}</div>
                    </div>
                    <span className={`mt-2 ${badgeClass(i.status)}`}>{i.status}</span>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openDetail(i.id)} className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] text-slate-800 hover:bg-slate-300">Detail</button>
                    <button onClick={() => openReply(i)} className="rounded-lg bg-amber-500 px-2 py-1 text-[11px] text-white hover:bg-amber-600">Reply</button>
                    <button onClick={() => remove(i.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] text-white hover:bg-rose-700">Hapus</button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-800 whitespace-pre-line">{i.message}</p>
              </div>
            ))}
            {!displayRows.length && (
              <p className="text-center text-slate-500 py-6">
                {items.length ? "Data tidak ditemukan." : "Belum ada data."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== TABLE (TABLET/DESKTOP) ===== */}
      <div className="hidden sm:block mt-5 overflow-hidden rounded-2xl border border-slate-200 shadow-sm relative z-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-[1]">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold w-16 md:w-20">ID</th>
                  <th className="px-4 py-3 font-semibold w-40 md:w-48">Nama</th>
                  <th className="px-4 py-3 font-semibold w-56 md:w-72">Email</th>
                  <th className="px-4 py-3 font-semibold w-28">Jenis</th>
                  <th className="px-4 py-3 font-semibold w-32 md:w-40">Tanggal</th>
                  <th className="px-4 py-3 font-semibold w-28">Jam</th>
                  <th className="px-4 py-3 font-semibold w-32 md:w-40">Status</th>
                  <th className="px-4 py-3 font-semibold w-72 lg:w-80">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRows.map((i, idx) => (
                  <tr key={i.id} className={`transition hover:bg-slate-50 ${idx % 2 ? "bg-white" : "bg-slate-50/30"}`}>
                    <td className="px-4 py-3 text-slate-700">{i.id}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">{i.nama}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">{i.email}</td>
                    <td className="px-4 py-3 text-slate-700">{i.jenis_demo}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(i.prefered_date) || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{i.prefered_time || "-"}</td>
                    <td className="px-4 py-3"><span className={badgeClass(i.status)}>{i.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => openDetail(i.id)} className="rounded-xl bg-slate-200 px-3 py-1.5 text-slate-800 hover:bg-slate-300">Detail</button>
                        <button onClick={() => openReply(i)} className="rounded-xl bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600">Reply</button>
                        <button onClick={() => remove(i.id)} className="rounded-xl bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!displayRows.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      {items.length ? "Data tidak ditemukan." : "Belum ada data."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-0 sm:px-1">
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-medium">{displayRows.length}</span> dari{" "}
          <span className="font-medium">{filtered.length}</span> data
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}/hal</option>)}
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

      {/* ===== MODAL TAMBAH ===== */}
      {addOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <form onSubmit={submitCreate} noValidate className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-5">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Tambah Demo</h3>
                <button type="button" onClick={() => setAddOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">×</button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <input
                    placeholder="Nama *"
                    value={form.nama}
                    onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                    onBlur={() => markTouched("nama")}
                    className={baseInput + redIf(errNama)}
                  />
                  {errNama && <p className="mt-1 text-xs text-rose-600">Nama wajib diisi.</p>}
                </div>

                <div className="sm:col-span-1">
                  <input
                    ref={emailRef}
                    type="text" // pakai text supaya tidak keluar tooltip native
                    placeholder="Email *"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    onBlur={() => markTouched("email")}
                    className={baseInput + redIf(errEmail)}
                  />
                  {errEmail && <p className="mt-1 text-xs text-rose-600">Email wajib diisi.</p>}
                </div>

                <div className="sm:col-span-1">
                  <select
                    value={form.jenis_demo}
                    onChange={(e) => setForm((f) => ({ ...f, jenis_demo: e.target.value }))}
                    onBlur={() => markTouched("jenis_demo")}
                    className={baseInput + redIf(errJenis)}
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                  {errJenis && <p className="mt-1 text-xs text-rose-600">Jenis wajib dipilih.</p>}
                </div>

                <div className="sm:col-span-1">
                  <input
                    type="date"
                    value={form.prefered_date}
                    onChange={(e) => setForm((f) => ({ ...f, prefered_date: e.target.value }))}
                    onBlur={() => markTouched("prefered_date")}
                    className={baseInput + redIf(errDate)}
                  />
                  {errDate && <p className="mt-1 text-xs text-rose-600">Tanggal wajib diisi.</p>}
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="time"
                    value={form.prefered_time}
                    onChange={(e) => setForm((f) => ({ ...f, prefered_time: e.target.value }))}
                    onBlur={() => markTouched("prefered_time")}
                    className={baseInput + redIf(errTime)}
                  />
                  {errTime && <p className="mt-1 text-xs text-rose-600">Jam wajib diisi.</p>}
                </div>

                <div className="sm:col-span-2">
                  <textarea
                    placeholder="Message *"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    onBlur={() => markTouched("message")}
                    className={
                      "min-h-[96px] w-full rounded-xl border px-3 py-2" +
                      (errMsg ? " border-rose-400 ring-1 ring-rose-200" : " border-slate-200")
                    }
                  />
                  {errMsg && <p className="mt-1 text-xs text-rose-600">Message wajib diisi.</p>}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">Batal</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Simpan</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===== MODAL DETAIL ===== */}
      {detailOpen && selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="max-h=[80vh] overflow-y-auto p-5">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Demo #{selected.id}</h3>
                <button onClick={() => { setDetailOpen(false); setSelected(null); }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">×</button>
              </div>

              <div className="space-y-2 text-sm">
                <div><span className="text-slate-500">Nama:</span> <b>{selected.nama}</b></div>
                <div><span className="text-slate-500">Email:</span> {selected.email}</div>
                <div><span className="text-slate-500">Jenis:</span> {selected.jenis_demo}</div>
                <div><span className="text-slate-500">Status:</span> <span className={badgeClass(selected.status)}>{selected.status}</span></div>
                <div><span className="text-slate-500">Tanggal:</span> {formatDate(selected.prefered_date) || "-"}</div>
                <div><span className="text-slate-500">Jam:</span> {selected.prefered_time || "-"}</div>
                <div>
                  <div className="text-slate-500">Message:</div>
                  <pre className="whitespace-pre-wrap text-slate-800 text-sm">{selected.message}</pre>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button onClick={() => { setDetailOpen(false); setSelected(null); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL REPLY ===== */}
      {replyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <form onSubmit={submitReply} className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-5">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Reply Demo #{replyFor?.id}</h3>
                <button type="button" onClick={() => { setReplyOpen(false); setReplyFor(null); }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">×</button>
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Template</label>
                  <select value={replyForm.template} onChange={(e) => updateReplyForm({ template: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Alasan / Catatan admin</label>
                  <textarea value={replyForm.reason} onChange={(e) => updateReplyForm({ reason: e.target.value })} className="min-h-[64px] w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Pesan (boleh edit)</label>
                  <textarea value={replyForm.message} onChange={(e) => setReplyForm((f) => ({ ...f, message: e.target.value }))} className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Tanggal</label>
                    <input type="date" value={replyForm.prefered_date} onChange={(e) => updateReplyForm({ prefered_date: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Jam</label>
                    <input type="time" value={replyForm.prefered_time} onChange={(e) => updateReplyForm({ prefered_time: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Lokasi / Link</label>
                    <input value={replyForm.location} onChange={(e) => updateReplyForm({ location: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3" />
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2 select-none">
                    <input type="checkbox" checked={replyForm.send_email} onChange={(e) => setReplyForm((f) => ({ ...f, send_email: e.target.checked }))} />
                    Kirim Email ke pemohon
                  </label>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => { setReplyOpen(false); setReplyFor(null); }} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">Batal</button>
                <button type="submit" disabled={replyBusy} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-40">
                  {replyBusy ? "Mengirim…" : "Kirim Reply"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
