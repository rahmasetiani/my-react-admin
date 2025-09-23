// src/pages/HelpPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'

const STATUSES = ['PENDING', 'ON_PROGRESS', 'SOLVED', 'CANCELLED']

// generator pesan per template/status
const buildMessageByStatus = (status, { ticket, reason }) => {
  switch (status) {
    case 'PENDING':
      return `Halo ${ticket?.nama || 'User'},\n\nTiket Anda (#${ticket?.id}) sudah kami terima dan berada pada status PENDING.\n${reason ? 'Catatan: ' + reason + '\n\n' : ''}Tim kami akan menindaklanjuti secepatnya.\n\nSalam,\nSupport Team`
    case 'ON_PROGRESS':
      return `Halo ${ticket?.nama || 'User'},\n\nTiket #${ticket?.id} saat ini berstatus ON_PROGRESS.\n${reason ? 'Detail: ' + reason + '\n' : ''}\nKami akan mengabari lagi setelah ada perkembangan.\nTerima kasih.`
    case 'SOLVED':
      return `Halo ${ticket?.nama || 'User'},\n\nTiket #${ticket?.id} telah SOLVED.\n${reason ? 'Ringkasan penyelesaian: ' + reason + '\n' : ''}\nJika masih ada kendala, balas email ini atau buat tiket baru.\nTerima kasih.`
    case 'CANCELLED':
      return `Halo ${ticket?.nama || 'User'},\n\nTiket #${ticket?.id} berstatus CANCELLED.\n${reason ? 'Alasan pembatalan: ' + reason + '\n' : ''}\nSilakan ajukan kembali jika diperlukan.`
    default:
      return ''
  }
}

export default function HelpPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // subjek dropdown
  const [subjekOptions, setSubjekOptions] = useState([])

  // form create
  const [form, setForm] = useState({
    nama: '', email: '', subjek_id: '', message: '', picture: null,
  })
  const fileRef = useRef(null)

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // reply modal (status only via reply)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyFor, setReplyFor] = useState(null) // ticket object
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyForm, setReplyForm] = useState({
    template: 'PENDING', // same as statuses
    reason: '',
    message: '',
    picture: null,
  })
  const replyFileRef = useRef(null)

  const subjekMap = useMemo(() => {
    const m = new Map()
    for (const s of subjekOptions) m.set(String(s.id), s)
    return m
  }, [subjekOptions])
  const subjekLabel = (id) => subjekMap.get(String(id))?.subjek ?? id ?? '-'

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const [{ data: helps }, { data: subs }] = await Promise.all([
        api.get('/help'),
        api.get('/subjek'),
      ])
      setItems(Array.isArray(helps) ? helps : [])
      setSubjekOptions(Array.isArray(subs) ? subs : [])
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // CREATE (multipart)
  const submitCreate = async (e) => {
    e.preventDefault()
    const { nama, email, subjek_id, message, picture } = form
    if (!nama.trim() || !email.trim() || !String(subjek_id).trim() || !message.trim()) {
      setErr('nama, email, subjek, message wajib diisi'); return
    }
    const fd = new FormData()
    fd.append('nama', nama.trim())
    fd.append('email', email.trim())
    fd.append('subjek_id', String(subjek_id))
    fd.append('message', message.trim())
    if (picture instanceof File) fd.append('picture', picture)

    try {
      await api.post('/help', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ nama:'', email:'', subjek_id:'', message:'', picture:null })
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (e) { setErr(e.message) }
  }

  // READ detail
  const openDetail = async (id) => {
    setErr('')
    try {
      const { data } = await api.get(`/help/${id}`)
      setSelected(data || null)
      setDetailOpen(true)
    } catch (e) { setErr(e.message) }
  }

  // DELETE
  const remove = async (id) => {
    if (!confirm('Hapus tiket ini?')) return
    try {
      await api.delete(`/help/${id}`)
      await load()
      if (selected?.id === id) { setDetailOpen(false); setSelected(null) }
    } catch (e) { setErr(e.message) }
  }

  // ===== Reply (also change status) =====
  const openReply = (ticket) => {
    setReplyFor(ticket)
    const firstTemplate = ticket?.status || 'PENDING' // default pilih status saat ini
    const msg = buildMessageByStatus(firstTemplate, { ticket, reason: '' })
    setReplyForm({ template: firstTemplate, reason: '', message: msg, picture: null })

    if (replyFileRef.current) replyFileRef.current.value = ''
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
  if (!replyForm.message.trim()) { setErr('Reply message wajib diisi'); return }

  const fd = new FormData()
  fd.append('message', replyForm.message.trim())
  fd.append('template', replyForm.template)
  fd.append('reason', replyForm.reason)
  // boleh tetap kirim next_status ke backend reply (aman diabaikan jika tidak dipakai)
  fd.append('next_status', replyForm.template)
  if (replyForm.picture instanceof File) fd.append('picture', replyForm.picture)

  try {
    setReplyBusy(true)

    // 1) kirim reply
    await api.post(`/help/${replyFor.id}/replies`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // 2) pastikan status help ikut berubah
    await api.put(`/help/${replyFor.id}/status`, { status: replyForm.template })

    // 3) refresh list & detail, tutup modal
    await load()
    if (selected?.id === replyFor.id) {
      setSelected((s) => s ? { ...s, status: replyForm.template } : s)
    }
    setReplyOpen(false)
    setReplyFor(null)
    if (replyFileRef.current) replyFileRef.current.value = ''
    alert('Reply terkirim & status tiket diperbarui.')
  } catch (e2) {
    setErr(e2.message || 'Gagal mengirim reply')
  } finally {
    setReplyBusy(false)
  }
}

const FILE_BASE = (import.meta.env.VITE_FILE_BASE || '').replace(/\/+$/, '') + '/';

const fileUrl = (p) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const cleaned = String(p).replace(/\\/g, '/').replace(/^\/+/, '');
  const noOutput = cleaned.replace(/^output\//, '');
  return FILE_BASE + noOutput;
};


  return (
    <section>
      <h2>Help</h2>

      {err && <p style={{ color:'crimson' }}>{err}</p>}

      {/* CREATE */}
      <form onSubmit={submitCreate}
            style={{display:'grid', gap:8, gridTemplateColumns:'repeat(12,1fr)', alignItems:'center', margin:'12px 0'}}>
        <input placeholder="Nama *" value={form.nama}
               onChange={e=>setForm(f=>({ ...f, nama:e.target.value }))} style={input} className="col-span-3"/>
        <input type="email" placeholder="Email *" value={form.email}
               onChange={e=>setForm(f=>({ ...f, email:e.target.value }))} style={input} className="col-span-3"/>
        <select value={form.subjek_id}
                onChange={e=>setForm(f=>({ ...f, subjek_id:e.target.value }))} style={input} className="col-span-3">
          <option value="">— Pilih subjek —</option>
          {subjekOptions.map(s => <option key={s.id} value={s.id}>{s.subjek}</option>)}
        </select>
        <input ref={fileRef} type="file" accept="image/*"
               onChange={e=>setForm(f=>({ ...f, picture: e.target.files?.[0] ?? null }))} style={input} className="col-span-3"/>
        <textarea placeholder="Message *" value={form.message}
                  onChange={e=>setForm(f=>({ ...f, message:e.target.value }))}
                  style={{...input, gridColumn:'1 / span 10', minHeight:60}} />
        <button type="submit" style={{...btnPrimary, gridColumn:'11 / span 2'}}>Tambah</button>
      </form>

      {/* LIST */}
      {loading ? <p>Loading...</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Nama</th>
              <th style={th}>Email</th>
              <th style={th}>Subjek</th>
              <th style={th}>Status</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i=>(
              <tr key={i.id}>
                <td style={td}>{i.id}</td>
                <td style={td}>{i.nama}</td>
                <td style={td}>{i.email}</td>
                <td style={td}>{subjekLabel(i.subjek_id)}</td>
                {/* Status: read-only, tidak bisa diubah di sini */}
                <td style={td}><span style={badge(i.status)}>{i.status}</span></td>
                <td style={td}>
                  <button onClick={()=>openDetail(i.id)} style={btnInfo}>Detail</button>
                  <button onClick={()=>openReply(i)} style={btnWarn}>Reply</button>
                  <button onClick={()=>remove(i.id)} style={btnDanger}>Hapus</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={6} style={{...td, textAlign:'center', opacity:.7}}>Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* DETAIL */}
      {detailOpen && selected && (
        <div style={backdrop}>
          <div style={modal}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <h3 style={{margin:0}}>Ticket #{selected.id}</h3>
              <button onClick={()=>{ setDetailOpen(false); setSelected(null) }} style={btnLight}>Tutup</button>
            </div>
            <div style={{display:'grid', gap:8}}>
              <div><b>Nama:</b> {selected.nama}</div>
              <div><b>Email:</b> {selected.email}</div>
              <div><b>Subjek:</b> {subjekLabel(selected.subjek_id)}</div>
              <div><b>Status:</b> <span style={badge(selected.status)}>{selected.status}</span></div>
              <div><b>Message:</b><br/>{selected.message}</div>
              {selected.picture && (
                <div>
                  <b>Picture:</b>{' '}
                  <a href={fileUrl(selected.picture)} target="_blank" rel="noreferrer">
                    {fileUrl(selected.picture)}
                  </a>
                  <div style={{ marginTop: 6 }}>
                    <img
                      src={fileUrl(selected.picture)}
                      alt="attachment"
                      style={{ maxWidth: 240, borderRadius: 8, border: '1px solid #eee' }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* REPLY (status change happens here) */}
      {replyOpen && (
        <div style={backdrop}>
          <form onSubmit={submitReply} style={modal}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <h3 style={{margin:0}}>Reply Ticket #{replyFor?.id}</h3>
              <button type="button" onClick={()=>{ setReplyOpen(false); setReplyFor(null) }} style={btnLight}>Tutup</button>
            </div>

            <div style={{display:'grid', gap:10}}>
              {/* hanya “Template” dan isinya sama dengan status */}
              <div>
                <label style={lbl}>Template</label>
                <select
                  value={replyForm.template}
                  onChange={(e)=>onTemplateChange(e.target.value)}
                  style={input}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Alasan / Catatan admin (ikut di email)</label>
                <textarea
                  value={replyForm.reason}
                  onChange={(e)=>onReasonChange(e.target.value)}
                  style={{...input, minHeight:60}}
                />
              </div>

              <div>
                <label style={lbl}>Pesan (boleh edit)</label>
                <textarea
                  value={replyForm.message}
                  onChange={(e)=>setReplyForm(f=>({ ...f, message: e.target.value }))}
                  style={{...input, minHeight:120}}
                />
              </div>

              <div>
                <label style={lbl}>Lampiran (opsional)</label>
                <input
                  ref={replyFileRef}
                  type="file"
                  accept="image/*"
                  onChange={e=>setReplyForm(f=>({ ...f, picture: e.target.files?.[0] ?? null }))}
                  style={input}
                />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button type="button"
                onClick={()=>{ setReplyOpen(false); setReplyFor(null) }}
                style={btnLight}>Batal</button>
              <button type="submit" disabled={replyBusy} style={btnPrimary}>
                {replyBusy ? 'Mengirim…' : 'Kirim Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

/* styles */
const th = { textAlign:'left', padding:'10px 8px', borderBottom:'1px solid #e5e7eb' }
const td = { padding:'10px 8px', borderBottom:'1px solid #f1f5f9', verticalAlign:'top' }
const input = { padding:8, border:'1px solid #e5e7eb', borderRadius:8, width:'100%', background:'#fff' }
const lbl = { display:'block', fontSize:12, color:'#475569', marginBottom:4 }
const btnPrimary = { padding:'8px 12px', borderRadius:8, background:'#2563eb', color:'#fff', border:'none' }
const btnInfo    = { padding:'6px 10px', borderRadius:8, background:'#0ea5e9', color:'#fff', border:'none', marginRight:8 }
const btnWarn    = { padding:'6px 10px', borderRadius:8, background:'#f59e0b', color:'#fff', border:'none', marginRight:8 }
const btnDanger  = { padding:'6px 10px', borderRadius:8, background:'#ef4444', color:'#fff', border:'none' }
const btnLight   = { padding:'6px 10px', borderRadius:8, background:'#fff', border:'1px solid #e5e7eb' }
const backdrop   = { position:'fixed', inset:0, background:'rgba(0,0,0,.25)', display:'grid', placeItems:'center', zIndex:50 }
const modal      = { background:'#fff', width:720, maxWidth:'92vw', padding:16, borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.1)' }
const badge = (status) => ({
  padding:'2px 8px',
  borderRadius:999,
  border:'1px solid #e5e7eb',
  fontSize:12,
  background:
    status === 'SOLVED' ? '#e6fffa' :
    status === 'ON_PROGRESS' ? '#eef2ff' :
    status === 'CANCELLED' ? '#fff7ed' : '#f1f5f9'
})
