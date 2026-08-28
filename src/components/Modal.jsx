export default function Modal({ title, note, fields, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 28, width: 320,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#111", marginBottom: 18, letterSpacing: "-0.3px" }}>{title}</div>
        {fields.map((f, i) => (
          <input key={i} type={f.type} placeholder={f.placeholder} style={{
            display: "block", width: "100%", padding: "12px 14px", marginBottom: 10,
            border: "1.5px solid #F0F0F0", borderRadius: 12, fontSize: 14,
            background: "#FAFAFA", color: "#111",
          }} />
        ))}
        {note && <div style={{ fontSize: 12, color: "#bbb", marginBottom: 14 }}>{note}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, border: "none", borderRadius: 12,
            background: "#F4F4F4", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer",
          }}>취소</button>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, border: "none", borderRadius: 12,
            background: "#3182F6", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
          }}>확인</button>
        </div>
      </div>
    </div>
  );
}
