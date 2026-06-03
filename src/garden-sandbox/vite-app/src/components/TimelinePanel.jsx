// Timeline panel — shows history of events
export default function TimelinePanel({ entries, onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 300, height: "100vh",
      background: "rgba(10,15,30,0.97)", borderLeft: "1px solid rgba(255,255,255,0.1)",
      zIndex: 150, overflowY: "auto", padding: 12, backdropFilter: "blur(10px)"
    }}>
      <h4 style={{ color: "#fff", fontSize: 13, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        \u65f6\u95f4\u7ebf\u8bb0\u5f55
        <button onClick={onClose} style={{ cursor: "pointer", color: "#e74c3c", fontSize: 16, background: "none", border: "none" }}>{'\u2715'}</button>
      </h4>
      {entries.length === 0 && (
        <div style={{ color: "#555", fontSize: 11 }}>\u8fd8\u6ca1\u6709\u8bb0\u5f55\uff0c\u7b49\u5f85\u89d2\u8272\u4e92\u52a8\u4e2d...</div>
      )}
      {entries.slice().reverse().map(e => (
        <div key={e.id} style={{
          padding: "4px 6px", marginBottom: 3, background: "rgba(255,255,255,0.02)",
          borderRadius: 3, fontSize: 10, color: "#bbb",
          borderLeft: `2px solid ${e.type === "feeling" ? "#e2b04a" : e.type === "dialogue" ? "#4ecdc4" : "#555"}`
        }}>
          <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>{e.time}</div>
          <b style={{ color: e.type === "feeling" ? "#e2b04a" : e.type === "dialogue" ? "#4ecdc4" : "#aaa" }}>{e.speaker}</b>
          <div>{e.text}</div>
        </div>
      ))}
    </div>
  )
}
