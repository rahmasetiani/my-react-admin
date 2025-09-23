export default function HealthPage() {
  return (
    <section>
      <h2>Health</h2>
      <HealthStatus />
      <p style={{opacity:.7}}>GET /health</p>
    </section>
  )
}

import { useEffect, useState } from 'react'
function HealthStatus() {
  const [txt, setTxt] = useState('...')
  const [err, setErr] = useState('')
  useEffect(() => {
    fetch('/health').then(r=>r.text()).then(setTxt).catch(e=>setErr(String(e)))
  }, [])
  return err ? <p style={{color:'crimson'}}>{err}</p> : <p>{txt}</p>
}
