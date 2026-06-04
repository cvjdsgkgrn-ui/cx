import { PRESET_IDS } from "../store/gameData"

export default function CharacterBar({ charList, selectedId, onSelect, onDelete }) {
  return (
    <div style={{
      display: "flex", gap: 4, padding: "4px 8px",
      background: "rgba(0,0,0,0.2)", borderRadius: 8, flexShrink: 0,
      flexWrap: "wrap", alignItems: "center"
    }}>
      {charList.map(c => (
        <button key={c.id} onClick={() => onSelect(c.id)}
          style={{
            padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer",
            background: c.id === selectedId ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
            color: c.id === selectedId ? "#fff" : "#aaa", fontSize: 11,
            display: "flex", alignItems: "center", gap: 5
          }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: c.color, display: "inline-block"
          }} />
          {c.name}
          {!PRESET_IDS.has(c.id) && c.id === selectedId && (
            <span onClick={e => { e.stopPropagation(); onDelete(c.id) }}
              style={{
                marginLeft: 2, color: "#e74c3c", cursor: "pointer",
                fontSize: 14, lineHeight: 1
              }}>
              ×
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
