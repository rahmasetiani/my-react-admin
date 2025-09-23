import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./../index.css"  // optional, untuk font Inter via @import
import { api } from "../lib/api"   // <-- pastikan impor api


// (opsional) ganti path ini ke logo kamu sendiri, mis: "/logo.png" atau import img
const LOGO_URL = "/logo.png"   // taruh file di public/logo.png

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [err, setErr] = useState("")
  const navigate = useNavigate()

 const onSubmit = async (e) => {
    e.preventDefault()
    setErr("")

    try {
      // NOTE: ganti validasi sesuai backend auth kamu.
      // Di contoh ini, password masih dummy, tapi profil diambil dari /accounts
      if (password !== "admin123") {
        setErr("Email atau password salah")
        return
      }

      // 1) ambil semua akun, cari yang email-nya cocok (case-insensitive)
      const { data: accounts } = await api.get("/accounts?limit=200&offset=0")
      const me =
        (Array.isArray(accounts) ? accounts : []).find(
          (a) => String(a.email || "").toLowerCase() === email.toLowerCase()
        ) || null

      if (!me) {
        setErr("Akun tidak ditemukan di /accounts")
        return
      }

      // 2) simpan token & user id
      localStorage.setItem("auth_token", "dummy-token")
      localStorage.setItem("auth_user_id", String(me.id))

      // 3) masuk dashboard
      navigate("/", { replace: true })
    } catch (e2) {
      setErr(e2.message || "Gagal login")
    }
  }

  return (
    <div style={wrap}>
      {/* blobs */}
      <div style={blobA} /><div style={blobB} />

      {/* CARD */}
      <form onSubmit={onSubmit} style={card}>
        {/* inner: biar input nggak kepanjangan */}
        <div style={cardInner}>
          {/* logo */}
          <div style={{ textAlign:"center", marginBottom: 18 }}>
            {LOGO_URL ? (
              <img
                src={LOGO_URL}
                onError={(e)=>{ e.currentTarget.style.display="none" }}
                alt="Logo"
                style={logoImg}
              />
            ) : <div style={logoFallback}>IA</div>}
            <h2 style={title}>Admin Login</h2>
            <p style={subtitle}>Masuk untuk mengelola dashboard</p>
          </div>

          {err && <p style={errorBox}>{err}</p>}

          {/* EMAIL */}
          <div style={row}>
            <label style={lbl}>Email</label>
            <div style={fieldWrap}>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                style={input}
                required
              />
              <span style={leftIcon}><MailIcon/></span>
            </div>
          </div>

          {/* PASSWORD */}
          <div style={row}>
            <label style={lbl}>Password</label>
            <div style={fieldWrap}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                style={input}
                required
              />
              <span style={leftIcon}><LockIcon/></span>
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={rightIconBtn}>
                {showPass ? <EyeOffIcon/> : <EyeIcon/>}
              </button>
            </div>
          </div>

          <div style={rowBetween}>
            <label style={rememberLbl}>
              <input type="checkbox" style={{ marginRight:6 }}/> Remember me
            </label>
            
          </div>

          <button type="submit" style={btnPrimary}>Login</button>

          <p style={{ fontSize:12, color:"#64748b", textAlign:"center", marginTop:12 }}>
            Tip: <code> Masuk dengan account yang telah dibuat IT !</code>
          </p>
        </div>
      </form>
    </div>
  )
}

/* ===== Icons (SVG) ===== */
const EyeIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" stroke="#64748b" strokeWidth="1.7"/>
  <circle cx="12" cy="12" r="3.25" stroke="#64748b" strokeWidth="1.7"/>
</svg>)
const EyeOffIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M3 3l18 18" stroke="#64748b" strokeWidth="1.7"/>
  <path d="M2.25 12s3.75-6.75 9.75-6.75c2.2 0 4.08.73 5.69 1.82M21.75 12s-3.75 6.75-9.75 6.75c-2.2 0-4.08-.73-5.69-1.82" stroke="#64748b" strokeWidth="1.7"/>
  <circle cx="12" cy="12" r="3.25" stroke="#64748b" strokeWidth="1.7"/>
</svg>)
const MailIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M4 6h16v12H4z" stroke="#94a3b8" strokeWidth="1.6"/>
  <path d="M4 7l8 6 8-6" stroke="#94a3b8" strokeWidth="1.6"/>
</svg>)
const LockIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <rect x="4.5" y="10" width="15" height="9.5" rx="2" stroke="#94a3b8" strokeWidth="1.6"/>
  <path d="M8 10V8a4 4 0 118 0v2" stroke="#94a3b8" strokeWidth="1.6"/>
</svg>)

/* ===== Styles ===== */
const wrap = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
  position: "relative",
  overflow: "hidden",
  padding: 16,
}
const card = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: 16,
  boxShadow: "0 20px 45px rgba(0,0,0,.18)",
  backdropFilter: "blur(6px)",
  // batasi lebar card, tapi biarkan responsif
  width: "min(96vw, 540px)",
}
const cardInner = {
  // INI KUNCI: input tidak kepanjangan
  width: "min(100%, 420px)",
  margin: "0 auto",
  padding: "34px 24px",
  boxSizing: "border-box",
}
const title = { margin: "8px 0 2px", fontSize: 22, fontWeight: 800, color: "#1e3a8a", textAlign:"center" }
const subtitle = { margin: 0, fontSize: 12, color: "#6b7280", textAlign:"center" }

const logoImg = {
  width: 56, height: 56, objectFit: "contain",
  display: "inline-block", marginBottom: 8, borderRadius: 12,
//   boxShadow: "0 6px 16px rgba(37,99,235,.25)",
}
const logoFallback = {
  display:"inline-grid", placeItems:"center",
  width:56, height:56, borderRadius:"50%",
  background:"linear-gradient(135deg,#3b82f6,#2563eb)",
  color:"#fff", fontWeight:800, letterSpacing:1, marginBottom:8
}

const row = { marginBottom: 12 }
const lbl = { display:"block", fontSize:13, fontWeight:600, marginBottom:6, color:"#334155" }

const fieldWrap = { position:"relative", width:"100%" }

const input = {
  boxSizing: "border-box",        // biar width bener
  width: "100%",
  padding: "12px 44px 12px 40px", // ruang ikon
  border: "1px solid #d1d5db",
  borderRadius: 12,
  fontSize: 14,
  outline: "none",
  background: "#f8fafc",
}
const leftIcon = { position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }
const rightIconBtn = {
  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
  background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:8
}

const rowBetween = { display:"flex", justifyContent:"space-between", alignItems:"center", margin:"6px 0 12px" }
const rememberLbl = { display:"flex", alignItems:"center", fontSize:12, color:"#475569" }
// const linkBlue = { fontSize:12, color:"#2563eb", textDecoration:"none" }

const btnPrimary = {
  width:"100%", padding:"12px", borderRadius:12,
  background:"linear-gradient(180deg,#3b82f6,#2563eb)",
  color:"#fff", border:"none", fontSize:15, fontWeight:700,
  boxShadow:"0 10px 25px rgba(59,130,246,.35)", cursor:"pointer",
}

const errorBox = {
  background:"#fee2e2", color:"#b91c1c",
  padding:"10px 12px", borderRadius:10, fontSize:13, marginBottom:14, textAlign:"center",
}

const blobA = { position:"absolute", width:360, height:360, borderRadius:"50%", background:"rgba(59,130,246,0.55)", top:-120, left:-120, filter:"blur(100px)" }
const blobB = { position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(37,99,235,0.45)", bottom:-120, right:-100, filter:"blur(120px)" }
