export default function Avatar({ name = "U", src }) {
  const initials = (name || "U")
    .split(" ").map(s => s?.[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb" }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "#0b63f3", color: "#fff", fontWeight: 700, display: "grid", placeItems: "center"
    }}>
      {initials}
    </div>
  );
}
