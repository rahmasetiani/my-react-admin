import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const DEFAULT_NAMA = 'admin'

export default function SubjekPage() {
  const [rows, setRows] = useState([])
  const [subjekBaru, setSubjekBaru] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // state untuk edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editNama, setEditNama] = useState('')
  const [editSubjek, setEditSubjek] = useState('')
  // helper di atas component returns:
const norm = (s) => s?.trim().toLowerCase() || '';
const isDup = (s, ignoreId = null) =>
  rows.some(r => norm(r.subjek) === norm(s) && r.id !== ignoreId);

  const load = async () => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await api.get('/subjek')
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // CREATE
const add = async (e) => {
  e.preventDefault();
  const s = subjekBaru.trim();
  if (!s) return;
  if (isDup(s)) { setErr('Subjek sudah ada. Gunakan nama lain.'); return; }
  try {
    await api.post('/subjek', { nama: DEFAULT_NAMA, subjek: s });
    setSubjekBaru('');
    await load();
  } catch (e) { setErr(e.message); }
};

  // buka modal edit
  const openEdit = (r) => {
    setEditId(r.id)
    setEditNama(r.nama ?? '')
    setEditSubjek(r.subjek ?? '')
    setEditOpen(true)
  }

  // submit edit
const submitEdit = async (e) => {
  e?.preventDefault?.();
  if (!editNama.trim() || !editSubjek.trim()) {
    setErr('nama & subjek wajib diisi');
    return;
  }
  if (isDup(editSubjek, editId)) {
    setErr('Subjek sudah ada. Gunakan nama lain.');
    return;
  }
  try {
    await api.put(`/subjek/${editId}`, {
      nama: editNama.trim(),
      subjek: editSubjek.trim(),
    });
    setEditOpen(false);
    await load();
  } catch (e) { setErr(e.message); }
};

  // DELETE
  const del = async (id) => {
    if (!confirm('Hapus data ini?')) return
    try {
      await api.delete(`/subjek/${id}`)
      await load()
    } catch (e) { setErr(e.message) }
  }
  
  const dupNow = isDup(subjekBaru);
<input
  value={subjekBaru}
  onChange={e=>{ setSubjekBaru(e.target.value); if(err) setErr(''); }}
/>
{dupNow && <small style={{color:'crimson'}}>Subjek sudah ada</small>}


  return (
    <section>
      <h2>Subjek</h2>

      <form onSubmit={add} style={{ display:'flex', gap:8, margin:'12px 0', alignItems:'center', flexWrap:'wrap' }}>
        <input
          value={DEFAULT_NAMA}
          readOnly
          title="Nama default"
          style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:8, width:140, background:'#f8fafc' }}
        />
        <input
          value={subjekBaru}
          onChange={e=>setSubjekBaru(e.target.value)}
          placeholder="Tulis subjek baru…"
          style={{ padding:8, border:'1px solid #e5e7eb', borderRadius:8, minWidth:300, flex:1 }}
        />
        <button type="submit" style={btnPrimary}>Tambah</button>
      </form>

      {err && <p style={{ color:'crimson' }}>Error: {err}</p>}

      {loading ? <p>Loading...</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Nama</th>
              <th style={th}>Subjek</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}>{r.id}</td>
                <td style={td}>{r.nama}</td>
                <td style={{ ...td, maxWidth: 520, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {r.subjek}
                </td>
                <td style={td}>
                  <button onClick={()=>openEdit(r)} style={btnInfo}>Edit</button>
                  <button onClick={()=>del(r.id)} style={btnDanger}>Hapus</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign:'center', opacity:.7 }}>Belum ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <p style={{ opacity:.7, marginTop:6 }}>
        Endpoints: GET/POST/PUT/DELETE <code>/api/v1/subjek</code> — create mengirim <code>{`{ nama: "admin", subjek: "..." }`}</code>
      </p>

      {/* Modal edit */}
      {editOpen && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.25)',
          display:'grid', placeItems:'center', zIndex:50
        }}>
          <form onSubmit={submitEdit}
            style={{ background:'#fff', width:420, maxWidth:'90vw',
                     padding:16, borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.1)' }}>
            <h3 style={{margin:'4px 0 12px', fontWeight:700}}>Ubah data</h3>

            <label style={{display:'block', fontSize:12, color:'#475569'}}>Nama</label>
            <input value={editNama} onChange={e=>setEditNama(e.target.value)}
                   style={{width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8, marginBottom:10}} />

            <label style={{display:'block', fontSize:12, color:'#475569'}}>Subjek</label>
            <input value={editSubjek} onChange={e=>setEditSubjek(e.target.value)}
                   style={{width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8}} />

            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:14}}>
              <button type="button" onClick={()=>setEditOpen(false)}
                      style={{padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff'}}>Batal</button>
              <button type="submit" style={btnPrimary}>Simpan</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

const th = { textAlign:'left', padding:'10px 8px', borderBottom:'1px solid #e5e7eb' }
const td = { padding:'10px 8px', borderBottom:'1px solid #f1f5f9', verticalAlign:'top' }
const btnPrimary = { padding:'8px 12px', borderRadius:8, background:'#2563eb', color:'#fff', border:'none' }
const btnInfo    = { marginRight:8, padding:'6px 10px', borderRadius:8, background:'#0ea5e9', color:'#fff', border:'none' }
const btnDanger  = { padding:'6px 10px', borderRadius:8, background:'#ef4444', color:'#fff', border:'none' }
