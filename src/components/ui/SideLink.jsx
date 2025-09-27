import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function SideLink({ to, icon, label, end, mini, onNavigate, onIconClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <NavLink
        to={to}
        end={end}
        onClick={onNavigate}
        className="focusable link"
        style={({ isActive }) => ({
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", margin: "6px 8px",
          textDecoration: "none", borderRadius: 12,
          color: "#eaf2ff",
          background: isActive ? "rgba(255,255,255,.14)" : "transparent",
          border: "1px solid rgba(255,255,255,.18)",
          justifyContent: mini ? "center" : "flex-start",
          fontWeight: 600
        })}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={mini ? label : undefined}
      >
        <span
          style={{ width: 20, textAlign: "center", cursor: "pointer" }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIconClick?.(); }}
          aria-label={`Toggle ${label}`}
          title={`Toggle ${label}`}
        >
          {icon}
        </span>
        {!mini && <span>{label}</span>}
      </NavLink>

      {mini && hover && (
        <div
          role="tooltip"
          style={{
            position: "absolute", left: 72 + 8, top: "50%", transform: "translateY(-50%)",
            background: "#111827", color: "#fff", padding: "6px 8px", fontSize: 12,
            borderRadius: 8, whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,.18)", zIndex: 10
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
