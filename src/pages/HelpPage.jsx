// src/pages/HelpPage.jsx
import { useEffect, useMemo, useRef, useState } from "react"
import { api } from "../lib/api"
import "./../index.css"

const STATUSES = ["PENDING", "ON_PROGRESS", "SOLVED", "CANCELLED"]

const buildMessageByStatus = (status, { ticket, reason }) => {
  switch (status) {
    case "PENDING":
      return `Halo ${ticket?.nama || "User"},\n\nTiket Anda (#${
        ticket?.id
      }) sudah kami terima dan berada pada status PENDING.\n${
        reason ? "Catatan: " + reason + "\n\n" : ""
      }Tim kami akan menindaklanjuti secepatnya.\n\nSalam,\nSupport Team`
    case "ON_PROGRESS":
      return `Halo ${ticket?.nama || "User"},\n\nTiket #${
        ticket?.id
      } saat ini berstatus ON_PROGRESS.\n${
        reason ? "Detail: " + reason + "\n" : ""
      }\nKami akan mengabari lagi setelah ada perkembangan.\n\nSalam,\nSupport Team`
    case "SOLVED":
      return `Halo ${ticket?.nama || "User"},\n\nTiket #${ticket?.id} telah SOLVED.\n${
        reason ? "Ringkasan penyelesaian: " + reason + "\n" : ""
      }\nJika masih ada kendala, buat tiket baru pada website LandingPage IronAsia.\n\nSalam,\nSupport Team`
    case "CANCELLED":
      return `Halo ${ticket?.nama || "User"},\n\nTiket #${ticket?.id} berstatus CANCELLED.\n${
        reason ? "Alasan pembatalan: " + reason + "\n" : ""
      }\nSilakan ajukan kembali jika diperlukan.\n\nSalam,\nSupport Team`
    default:
      return ""
  }
}

export default function HelpPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // subjek dropdown
  const [subjekOptions, setSubjekOptions] = useState([])

  // form create + touched
  const [form, setForm] = useState({ nama: "", email: "", subjek_id: "", message: "", picture: null })
  const [touched, setTouched] = useState({ nama: false, email: false, subjek_id: false, message: false })
  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }))
  const fileRef = useRef(null)

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // reply modal
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyFor, setReplyFor] = useState(null)
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyForm, setReplyForm] = useState({
    template: "PENDING",
    reason: "",
    message: "",
    picture: null,
    send_email: true, // NEW
  })
  const replyFileRef = useRef(null)

  // create modal
  const [addOpen, setAddOpen] = useState(false)

  // search + pagination + filter
  const [q, setQ] = useState("")
  const [filterSubjek, setFilterSubjek] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // subjek helper
  const subjekMap = useMemo(() => {
    const m = new Map()
    for (const s of subjekOptions) m.set(String(s.id), s)
    return m
  }, [subjekOptions])
  const subjekLabel = (id) => subjekMap.get(String(id))?.subjek ?? id ?? "-"

  // load data
  const load = async () => {
    setLoading(true)
    try {
      const [{ data: helps }, { data: subs }] = await Promise.all([
        api.get("/help"),
        api.get("/subjek"),
      ])
      setItems(Array.isArray(helps) ? helps : [])
      setSubjekOptions(Array.isArray(subs) ? subs : [])
    } catch (e) {
      console.error("load help failed:", e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // ===== CREATE =====
  const isEmpty = (v) => String(v ?? "").trim() === ""
  const errNama = touched.nama && isEmpty(form.nama)
  const errEmail = touched.email && isEmpty(form.email)
  const errSubjek = touched.subjek_id && isEmpty(form.subjek_id)
  const errMessage = touched.message && isEmpty(form.message)
  const baseInput = "h-10 w-full rounded-xl border px-3"
  const redIf = (cond) => (cond ? " border-rose-400 ring-1 ring-rose-200" : " border-slate-200")

  const submitCreate = async (e) => {
    e.preventDefault()
    const { nama, email, subjek_id, message, picture } = form

    const missing = isEmpty(nama) || isEmpty(email) || isEmpty(subjek_id) || isEmpty(message)
    if (missing) {
      setTouched({ nama: true, email: true, subjek_id: true, message: true })
      return
    }

    const fd = new FormData()
    fd.append("nama", nama.trim())
    fd.append("email", email.trim())
    fd.append("subjek_id", String(subjek_id))
    fd.append("message", message.trim())
    if (picture instanceof File) fd.append("picture", picture)

    try {
      await api.post("/help", fd, { headers: { "Content-Type": "multipart/form-data" } })
      setForm({ nama: "", email: "", subjek_id: "", message: "", picture: null })
      setTouched({ nama: false, email: false, subjek_id: false, message: false })
      if (fileRef.current) fileRef.current.value = ""
      setAddOpen(false)
      await load()
    } catch (e2) {
      console.error("create help failed:", e2)
    }
  }

  // ===== DETAIL =====
  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/help/${id}`)
      setSelected(data || null)
      setDetailOpen(true)
    } catch (e) {
      console.error("openDetail failed:", e)
    }
  }

  // ===== DELETE =====
  const remove = async (id) => {
    if (!confirm("Hapus tiket ini?")) return
    try {
      await api.delete(`/help/${id}`)
      await load()
      if (selected?.id === id) {
        setDetailOpen(false)
        setSelected(null)
      }
    } catch (e) {
      console.error("remove failed:", e)
    }
  }

  // ===== REPLY =====
  const openReply = (ticket) => {
    setReplyFor(ticket)
    const firstTemplate = ticket?.status || "PENDING"
    const msg = buildMessageByStatus(firstTemplate, { ticket, reason: "" })
    setReplyForm({
      template: firstTemplate,
      reason: "",
      message: msg,
      picture: null,
      send_email: true, // NEW
    })
    if (replyFileRef.current) replyFileRef.current.value = ""
    setReplyOpen(true)
  }
  const onTemplateChange = (val) => {
    setReplyForm((f) => ({
      ...f,
      template: val,
      message: buildMessageByStatus(val, { ticket: replyFor, reason: f.reason }),
    }))
  }
  const onReasonChange = (val) => {
    setReplyForm((f) => ({
      ...f,
      reason: val,
      message: buildMessageByStatus(f.template, { ticket: replyFor, reason: val }),
    }))
  }

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyFor) return
    if (!replyForm.message.trim()) {
      alert("Reply message wajib diisi")
      return
    }

    const fd = new FormData()
    fd.append("message", replyForm.message.trim())
    fd.append("template", replyForm.template)
    fd.append("reason", replyForm.reason)
    fd.append("next_status", replyForm.template)
    if (replyForm.picture instanceof File) fd.append("picture", replyForm.picture)
    fd.append("send_email", replyForm.send_email ? "true" : "false") // NEW

    try {
      setReplyBusy(true)
      await api.post(`/help/${replyFor.id}/replies`, fd, { headers: { "Content-Type": "multipart/form-data" } })
      await api.put(`/help/${replyFor.id}/status`, { status: replyForm.template })
      await load()
      if (selected?.id === replyFor.id) setSelected((s) => (s ? { ...s, status: replyForm.template } : s))
      setReplyOpen(false)
      setReplyFor(null)
      if (replyFileRef.current) replyFileRef.current.value = ""
      alert("Reply terkirim & status tiket diperbarui.")
    } catch (e2) {
      alert(e2?.message || "Gagal mengirim reply")
    } finally {
      setReplyBusy(false)
    }
  }

  // FILE URL util
  const FILE_BASE = (import.meta.env.VITE_FILE_BASE || "").replace(/\/+$/, "") + "/"
  const fileUrl = (p) => {
    if (!p) return ""
    if (/^https?:\/\//i.test(p)) return p
    const cleaned = String(p).replace(/\\/g, "/").replace(/^\/+/, "")
    const noOutput = cleaned.replace(/^output\//, "")
    return FILE_BASE + noOutput
  }

  // ===== SEARCH + FILTER + PAGINATION (client) =====
  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase()
    let list = items

    if (filterSubjek) list = list.filter((i) => String(i.subjek_id) === String(filterSubjek))
    if (filterStatus) list = list.filter((i) => String(i.status) === String(filterStatus))

    if (s) {
      list = list.filter(
        (i) =>
          String(i.id).toLowerCase().includes(s) ||
          (i.nama || "").toLowerCase().includes(s) ||
          (i.email || "").toLowerCase().includes(s) ||
          (subjekLabel(i.subjek_id) || "").toLowerCase().includes(s) ||
          (i.status || "").toLowerCase().includes(s)
      )
    }
    return list
  }, [items, q, filterSubjek, filterStatus, subjekOptions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const curPage = Math.min(page, totalPages)
  const start = (curPage - 1) * pageSize
  const displayRows = filtered.slice(start, start + pageSize)
  useEffect(() => {
    setPage(1)
  }, [q, pageSize, filterSubjek, filterStatus])

  const badgeClass = (status) =>
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs border " +
    (status === "SOLVED"
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : status === "ON_PROGRESS"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : status === "CANCELLED"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200")

  return (
    <section className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-4 lg:py-6">
      {/* Header + actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight">Need Help</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Filter Subjek */}
          <select
            value={filterSubjek}
            onChange={(e) => setFilterSubjek(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm md:text-base"
          >
            <option value="">Semua Subjek</option>
            {subjekOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjek}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm md:text-base"
          >
            <option value="">Semua Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Search + Tambah */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80 md:w-96 lg:w-[420px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari id / nama / email / subjek / status…"
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm md:text-base outline-none focus:ring-2 ring-primary-100"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            </div>

            <button
              onClick={() => {
                setAddOpen(true)
                setForm({ nama: "", email: "", subjek_id: "", message: "", picture: null })
                setTouched({ nama: false, email: false, subjek_id: false, message: false })
                if (fileRef.current) fileRef.current.value = ""
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
                    <p className="text-xs text-slate-700 mt-1">
                      <span className="text-slate-500">Subjek:</span> {subjekLabel(i.subjek_id)}
                    </p>
                    <span className={`mt-2 ${badgeClass(i.status)}`}>{i.status}</span>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openDetail(i.id)} className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] text-slate-800 hover:bg-slate-300">
                      Detail
                    </button>
                    <button onClick={() => openReply(i)} className="rounded-lg bg-amber-500 px-2 py-1 text-[11px] text-white hover:bg-amber-600">
                      Reply
                    </button>
                    <button onClick={() => remove(i.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] text-white hover:bg-rose-700">
                      Hapus
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-800 whitespace-pre-line">{i.message}</p>
              </div>
            ))}
            {!displayRows.length && (
              <p className="text-center text-slate-500 py-6">{items.length ? "Data tidak ditemukan." : "Belum ada data."}</p>
            )}
          </div>
        </div>
      )}

      {/* ===== TABLET/DESKTOP ===== */}
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
                  <th className="px-4 py-3 font-semibold min-w-[220px]">Subjek</th>
                  <th className="px-4 py-3 font-semibold w-32 md:w-40">Status</th>
                  <th className="px-4 py-3 font-semibold w-60 md:w-72 lg:w-80">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRows.map((i, idx) => (
                  <tr key={i.id} className={`transition hover:bg-slate-50 ${idx % 2 ? "bg-white" : "bg-slate-50/30"}`}>
                    <td className="px-4 py-3 text-slate-700">{i.id}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">{i.nama}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">{i.email}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <div className="truncate" title={subjekLabel(i.subjek_id)}>
                        {subjekLabel(i.subjek_id)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={badgeClass(i.status)}>{i.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => openDetail(i.id)} className="rounded-xl bg-slate-200 px-3 py-1.5 text-slate-800 hover:bg-slate-300">
                          Detail
                        </button>
                        <button onClick={() => openReply(i)} className="rounded-xl bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600">
                          Reply
                        </button>
                        <button onClick={() => remove(i.id)} className="rounded-xl bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!displayRows.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {items.length ? "Data tidak ditemukan." : "Belum ada data."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* footer: info & pagination */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-medium">{displayRows.length}</span> dari <span className="font-medium">{filtered.length}</span> data
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}/hal
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={curPage === 1} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40">
              «
            </button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={curPage === 1} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40">
              ‹
            </button>
            <span className="px-2 text-sm">
              Hal <span className="font-medium">{curPage}</span> / {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={curPage === totalPages} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40">
              ›
            </button>
            <button onClick={() => setPage(totalPages)} disabled={curPage === totalPages} className="h-9 min-w-9 rounded-lg border border-slate-200 px-2 text-sm disabled:opacity-40">
              »
            </button>
          </div>
        </div>
      </div>

      {/* ========= MODAL TAMBAH ========= */}
      {addOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <form onSubmit={submitCreate} className="w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-5">
              <div className="mb-3 sm:mb-4 flex items-start justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Tambah tiket</h3>
                <button type="button" onClick={() => setAddOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                  ×
                </button>
              </div>

              <label className="mb-1 block text-xs font-medium text-slate-600">Nama</label>
              <input
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                onBlur={() => markTouched("nama")}
                className={baseInput + redIf(errNama)}
                placeholder="Nama *"
              />
              {errNama && <p className="mt-1 text-xs text-rose-600">Nama wajib diisi.</p>}

              <label className="mt-3 mb-1 block text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={() => markTouched("email")}
                className={baseInput + redIf(errEmail)}
                placeholder="Email *"
              />
              {errEmail && <p className="mt-1 text-xs text-rose-600">Email wajib diisi.</p>}

              <label className="mt-3 mb-1 block text-xs font-medium text-slate-600">Subjek</label>
              <select
                value={form.subjek_id}
                onChange={(e) => setForm((f) => ({ ...f, subjek_id: e.target.value }))}
                onBlur={() => markTouched("subjek_id")}
                className={baseInput + redIf(errSubjek)}
              >
                <option value="">— Pilih subjek —</option>
                {subjekOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjek}
                  </option>
                ))}
              </select>
              {errSubjek && <p className="mt-1 text-xs text-rose-600">Subjek wajib dipilih.</p>}

              <label className="mt-3 mb-1 block text-xs font-medium text-slate-600">Lampiran (opsional)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setForm((f) => ({ ...f, picture: e.target.files?.[0] ?? null }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2"
              />

              <label className="mt-3 mb-1 block text-xs font-medium text-slate-600">Pesan</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                onBlur={() => markTouched("message")}
                className={
                  "min-h-[96px] w-full rounded-xl border px-3 py-2" +
                  (errMessage ? " border-rose-400 ring-1 ring-rose-200" : " border-slate-200")
                }
                placeholder="Message *"
              />
              {errMessage && <p className="mt-1 text-xs text-rose-600">Message wajib diisi.</p>}

              <div className="mt-4 sm:mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">
                  Batal
                </button>
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Simpan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========= MODAL DETAIL ========= */}
      {detailOpen && selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-5">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Ticket #{selected.id}</h3>
                <button onClick={() => { setDetailOpen(false); setSelected(null) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                  ×
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div><span className="text-slate-500">Nama:</span> <b>{selected.nama}</b></div>
                <div><span className="text-slate-500">Email:</span> {selected.email}</div>
                <div><span className="text-slate-500">Subjek:</span> {subjekLabel(selected.subjek_id)}</div>
                <div><span className="text-slate-500">Status:</span> <span className={badgeClass(selected.status)}>{selected.status}</span></div>
                <div>
                  <div className="text-slate-500">Message:</div>
                  <pre className="whitespace-pre-wrap text-slate-800 text-sm">{selected.message}</pre>
                </div>

                {selected.picture && (
                  <div className="mt-2">
                    <div className="text-slate-500">Picture:</div>
                    <a className="text-blue-600 underline break-all" href={fileUrl(selected.picture)} target="_blank" rel="noreferrer">
                      {fileUrl(selected.picture)}
                    </a>
                    <div className="mt-2">
                      <img src={fileUrl(selected.picture)} alt="attachment" className="max-w-[260px] rounded-lg border border-slate-200" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button onClick={() => { setDetailOpen(false); setSelected(null) }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========= MODAL REPLY ========= */}
      {replyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3 sm:p-4">
          <form onSubmit={submitReply} className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="max-h-[80vh] overflow-y-auto p-5">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Reply Ticket #{replyFor?.id}</h3>
                <button type="button" onClick={() => { setReplyOpen(false); setReplyFor(null) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                  ×
                </button>
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Template</label>
                  <select value={replyForm.template} onChange={(e) => onTemplateChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Alasan / Catatan admin</label>
                  <textarea value={replyForm.reason} onChange={(e) => onReasonChange(e.target.value)} className="min-h-[64px] w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Pesan (boleh edit)</label>
                  <textarea value={replyForm.message} onChange={(e) => setReplyForm((f) => ({ ...f, message: e.target.value }))} className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Lampiran (opsional)</label>
                  <input
                    ref={replyFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReplyForm((f) => ({ ...f, picture: e.target.files?.[0] ?? null }))}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2"
                  />
                </div>

                {/* NEW: ceklis kirim email */}
                <label className="flex items-center gap-2 text-sm select-none">
                  <input
                    type="checkbox"
                    className="accent-rose-600 h-4 w-4"
                    checked={replyForm.send_email}
                    onChange={(e) => setReplyForm((f) => ({ ...f, send_email: e.target.checked }))}
                  />
                  Kirim Email ke pemohon
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => { setReplyOpen(false); setReplyFor(null) }} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100">
                  Batal
                </button>
                <button type="submit" disabled={replyBusy} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-40">
                  {replyBusy ? "Mengirim…" : "Kirim Reply"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
