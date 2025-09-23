import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function DemoPage() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(()=> {
    api.get('/demo').then(r=>setData(r.data)).catch(e=>setErr(e.message))
  }, [])
  return (
    <section>
      <h2>Demo</h2>
      {err && <p style={{color:'crimson'}}>{err}</p>}
      <pre style={{background:'#f8fafc',padding:12,borderRadius:8}}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <p style={{opacity:.7}}>GET /api/v1/demo</p>
    </section>
  )
}
