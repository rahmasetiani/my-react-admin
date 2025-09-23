import { NavLink, Route, Routes } from 'react-router-dom'
import HealthPage from './pages/HealthPage.jsx'
import SubjekPage from './pages/SubjekPage.jsx'
import HelpPage from './pages/HelpPage.jsx'
import DemoPage from './pages/DemoPage.jsx'

const linkStyle = ({ isActive }) => ({
  padding: '8px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  color: isActive ? 'white' : '#111827',
  background: isActive ? '#2563eb' : 'transparent',
  border: '1px solid #e5e7eb',
})

export default function App() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 16 }}>
      <header style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ marginRight: 16 }}>Echo Admin</h1>
        <NavLink to="/" style={linkStyle} end>Health</NavLink>
        <NavLink to="/subjek" style={linkStyle}>Subjek</NavLink>
        <NavLink to="/help" style={linkStyle}>Help</NavLink>
        <NavLink to="/demo" style={linkStyle}>Demo</NavLink>
      </header>
      <Routes>
        <Route path="/" element={<HealthPage />} />
        <Route path="/subjek" element={<SubjekPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
    </div>
  )
}
