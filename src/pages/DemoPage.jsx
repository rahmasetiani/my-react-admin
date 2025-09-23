// src/pages/DemoPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// ====== Status & Template ======
const STATUSES = ['APPROVE', 'RESCHEDULE', 'CANCELLED', 'DONE']

const buildMessageByStatus = (status, { demo, reason, date, time, location }) => {
  const dateStr = date
    ? new Date(date).toISOString().slice(0, 10)
    : (demo?.prefered_date ? new Date(demo.prefered_date).toISOString().slice(0, 10) : '-')
  const timeStr = time || demo?.prefered_time || ''
  const locStr = location?.trim() || demo?.location || 'https://meet.google.com/aup-zuzq-vwn/'

  switch (status) {
    case 'APPROVE':
      return `Halo ${demo?.nama || 'User'},\n\nPermintaan demo Anda (#${demo?.id}) telah DISETUJUI.\n${reason ? 'Catatan: ' + reason + '\n' : ''}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nSalam,\nIronAsia`
    case 'RESCHEDULE':
      return `Halo ${demo?.nama || 'User'},\n\nJadwal demo #${demo?.id} perlu DIJADWAL ULANG.\n${reason ? 'Alasan: ' + reason + '\n' : ''}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nTerima kasih.`
    case 'CANCELLED':
      return `Halo ${demo?.nama || 'User'},\n\nDemo #${demo?.id} dibatalkan (CANCELLED).\n${reason ? 'Alasan: ' + reason + '\n' : ''}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}`
    case 'DONE':
      return `Halo ${demo?.nama || 'User'},\n\nDemo #${demo?.id} telah SELESAI.\n${reason ? 'Ringkasan: ' + reason + '\n' : ''}\nStatus: ${status}\nJadwal: ${dateStr} ${timeStr}\nLokasi/Link: ${locStr}\n\nTerima kasih telah menggunakan layanan kami.`
    default:
      return ''
  }
}

// helper format date ke YYYY-MM-DD
const formatDate = (val) => {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d)) return val
  return d.toISOString().slice(0, 10)
}

export default function DemoPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // form create
  const [form, setForm] = useState({
    nama: '', email: '', message: '',
    jenis_demo: 'ONLINE',
    prefered_date: '', prefered_time: ''
  })

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // reply modal
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyFor, setReplyFor] = useState(null)
  const [replyForm, setReplyForm] = useState({
    template: 'APPROVE',
    reason: '',
    message: '',
    prefered_date: '',
    prefered_time: '',
    location: '',
    send_email: true
  })

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const { data } = await api.get('/demo?limit=50&offset=0')
      setItems(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // ====== CREATE ======
  const submitCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/demo', {
        ...form,
        prefered_date: formatDate(form.prefered_date)
      })
      setForm({ nama:'', email:'', message:'', jenis_demo:'ONLINE', prefered_date:'', prefered_time:'' })
      await load()
    } catch (e) { setErr(e.message) }
  }

  // ====== DETAIL ======
  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/demo/${id}`)
      setSelected(data || null)
      setDetailOpen(true)
    } catch (e) { setErr(e.message) }
  }

  // ====== DELETE ======
  const remove = async (id) => {
    if (!confirm('Hapus demo ini?')) return
    try {
      await api.delete(`/demo/${id}`)
      await load()
      if (selected?.id === id) { setDetailOpen(false); setSelected(null) }
    } catch (e) { setErr(e.message) }
  }

  // ====== REPLY ======
  const openReply = (demo) => {
    setReplyFor(demo)
    const initial = 'APPROVE'
    const msg = buildMessageByStatus(initial, { demo, reason: '' })
    setReplyForm({
      template: initial,
      reason: '',
      message: msg,
      prefered_date: formatDate(demo.prefered_date) || '',
      prefered_time: demo.prefered_time || '',
      location: '',
      send_email: true
    })
    setReplyOpen(true)
  }

  const updateReplyForm = (patch) => {
    setReplyForm(f => {
      const next = { ...f, ...patch }
      return {
        ...next,
        message: buildMessageByStatus(next.template, {
          demo: replyFor,
          reason: next.reason,
          date: next.prefered_date,
          time: next.prefered_time,
          location: next.location
        })
      }
    })
  }

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyFor) return
    if (!replyForm.message.trim()) { setErr('Reply message wajib diisi'); return }

    try {
      setReplyBusy(true)
      await api.post(`/demo/${replyFor.id}/replies`, {
        message: replyForm.message.trim(),
        status: replyForm.template,
        prefered_date: formatDate(replyForm.prefered_date),
        prefered_time: replyForm.prefered_time,
        location: replyForm.location,
        send_email: !!replyForm.send_email
      })
      setReplyOpen(false)
      setReplyFor(null)
      await load()
      alert('Reply terkirim.')
    } catch (e2) { setErr(e2.message || 'Gagal mengirim reply') }
    finally { setReplyBusy(false) }
  }

  // ====== UI ======
  return (
    <section style={{padding:'20px'}}>
      <h2 style={{fontSize:'20px',fontWeight:'bold',marginBottom:'12px'}}>Demo</h2>
      {err && <p style={{color:'crimson',marginBottom:10}}>{err}</p>}

      {/* CREATE */}
      <form onSubmit={submitCreate} style={card}>
        <h3 style={h3}>Tambah Demo</h3>
        <div style={grid}>
          <input placeholder="Nama *" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} style={input}/>
          <input placeholder="Email *" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={input}/>
          <select value={form.jenis_demo} onChange={e=>setForm(f=>({...f,jenis_demo:e.target.value}))} style={input}>
            <option value="ONLINE">ONLINE</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
          <input type="date" value={form.prefered_date} onChange={e=>setForm(f=>({...f,prefered_date:e.target.value}))} style={input}/>
          <input type="time" value={form.prefered_time} onChange={e=>setForm(f=>({...f,prefered_time:e.target.value}))} style={input}/>
        </div>
        <textarea placeholder="Message *" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} style={{...input,minHeight:80}}/>
        <button type="submit" style={btnPrimary}>Tambah</button>
      </form>

      {/* LIST */}
      <div style={{marginTop:20}}>
        {loading ? <p>Loading…</p> : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>ID</th><th style={th}>Nama</th><th style={th}>Email</th>
                <th style={th}>Jenis</th><th style={th}>Status</th><th style={th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i=>(
                <tr key={i.id}>
                  <td style={td}>{i.id}</td>
                  <td style={td}>{i.nama}</td>
                  <td style={td}>{i.email}</td>
                  <td style={td}>{i.jenis_demo}</td>
                  <td style={td}><span style={badge(i.status)}>{i.status}</span></td>
                  <td style={td}>
                    <button onClick={()=>openDetail(i.id)} style={btnInfo}>Detail</button>
                    <button onClick={()=>openReply(i)} style={btnWarn}>Reply</button>
                    <button onClick={()=>remove(i.id)} style={btnDanger}>Hapus</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={6} style={{textAlign:'center',opacity:.7}}>Belum ada data.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL MODAL */}
      {detailOpen && selected && (
        <div style={backdrop}>
          <div style={modal}>
            <h3 style={h3}>Demo #{selected.id}</h3>
            <div style={{display:'grid', gap:8}}>
              <div><b>Nama:</b> {selected.nama}</div>
              <div><b>Email:</b> {selected.email}</div>
              <div><b>Jenis:</b> {selected.jenis_demo}</div>
              <div><b>Status:</b> <span style={badge(selected.status)}>{selected.status}</span></div>
              <div><b>Tanggal:</b> {formatDate(selected.prefered_date)}</div>
              <div><b>Jam:</b> {selected.prefered_time}</div>
              <div><b>Message:</b><br/>{selected.message}</div>
            </div>
            <div style={{marginTop:12,textAlign:'right'}}>
              <button onClick={()=>setDetailOpen(false)} style={btnLight}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* REPLY MODAL */}
      {replyOpen && (
        <div style={backdrop}>
          <form onSubmit={submitReply} style={modal}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <h3 style={h3}>Reply Demo #{replyFor?.id}</h3>
              <button type="button" onClick={()=>{ setReplyOpen(false); setReplyFor(null) }} style={btnLight}>Tutup</button>
            </div>

            <div style={{display:'grid', gap:10}}>
              <div>
                <label style={lbl}>Template</label>
                <select value={replyForm.template} onChange={e=>updateReplyForm({ template: e.target.value })} style={input}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Alasan / Catatan admin</label>
                <textarea value={replyForm.reason} onChange={e=>updateReplyForm({ reason: e.target.value })} style={{...input, minHeight:60}}/>
              </div>

              <div>
                <label style={lbl}>Pesan (boleh edit)</label>
                <textarea value={replyForm.message} onChange={e=>setReplyForm(f=>({...f, message:e.target.value}))} style={{...input, minHeight:120}}/>
              </div>

              <div style={{display:'grid', gap:8}}>
                <div>
                  <label style={lbl}>Tanggal</label>
                  <input type="date" value={replyForm.prefered_date} onChange={e=>updateReplyForm({ prefered_date: e.target.value })} style={input}/>
                </div>
                <div>
                  <label style={lbl}>Jam</label>
                  <input type="time" value={replyForm.prefered_time} onChange={e=>updateReplyForm({ prefered_time: e.target.value })} style={input}/>
                </div>
                <div>
                  <label style={lbl}>Lokasi / Link</label>
                  <input value={replyForm.location} onChange={e=>updateReplyForm({ location: e.target.value })} style={input}/>
                </div>
                <label style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="checkbox" checked={replyForm.send_email} onChange={e=>setReplyForm(f=>({...f, send_email:e.target.checked}))}/>
                  Kirim Email ke pemohon
                </label>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button type="button" onClick={()=>{ setReplyOpen(false); setReplyFor(null) }} style={btnLight}>Batal</button>
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
const card = {background:'#fff',padding:16,border:'1px solid #e5e7eb',borderRadius:8,marginBottom:16,display:'grid',gap:10}
const h3 = {margin:'0 0 8px 0',fontSize:16,fontWeight:'600'}
const grid = {display:'grid',gap:8,gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}
const input = {padding:8,border:'1px solid #d1d5db',borderRadius:6,width:'100%'}
const lbl = { display:'block', fontSize:12, color:'#475569', marginBottom:4 }
const table = {width:'100%',borderCollapse:'collapse',background:'#fff'}
const th = {textAlign:'left',padding:'8px',borderBottom:'1px solid #e5e7eb'}
const td = {padding:'8px',borderBottom:'1px solid #f1f5f9',verticalAlign:'top'}
const btnPrimary = {padding:'6px 12px',borderRadius:6,background:'#2563eb',color:'#fff',border:'none'}
const btnInfo = {...btnPrimary,background:'#0ea5e9',marginRight:6}
const btnWarn = {...btnPrimary,background:'#f59e0b',marginRight:6}
const btnDanger = {...btnPrimary,background:'#ef4444'}
const btnLight = {padding:'6px 12px',borderRadius:6,background:'#fff',border:'1px solid #d1d5db'}
const backdrop = {position:'fixed',inset:0,background:'rgba(0,0,0,.25)',display:'grid',placeItems:'center',zIndex:50}
const modal = {background:'#fff',padding:20,borderRadius:12,width:720,maxWidth:'92vw',boxShadow:'0 10px 25px rgba(0,0,0,.15)'}
const badge = (status) => ({
  padding:'2px 8px',
  borderRadius:999,
  border:'1px solid #e5e7eb',
  fontSize:12,
  background:
    status === 'DONE' ? '#e6fffa' :
    status === 'APPROVE' ? '#eef2ff' :
    status === 'CANCELLED' ? '#fff7ed' :
    status === 'RESCHEDULE' ? '#fef9c3' : '#f1f5f9'
})
