import { useRef, useEffect } from "react"

export default function MessageLog({ messages }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div style={{
      flex: 1, background: "#0f3460", borderRadius: 10, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)", minHeight: 0,
      display: "flex", flexDirection: "column"
    }}>
      <div ref={logRef} style={{
        flex: 1, overflowY: "auto", padding: "6px 8px",
        fontSize: 11, lineHeight: 1.5
      }}>
        {messages.length === 0 && (
          <div style={{ color: "#555", textAlign: "center", marginTop: 20 }}>
            等待 AI 角色开始观察与对话...
          </div>
        )}
        {messages.slice(-100).map(msg => (
          <div key={msg.id} style={{
            marginBottom: 4, padding: "5px 7px",
            background: "rgba(255,255,255,0.03)", borderRadius: 4,
            borderLeft: `3px solid ${
              msg.type === "feeling" ? "#e2b04a" :
              msg.type === "dialogue" ? "#4ecdc4" : "#555"
            }`
          }}>
            <div style={{
              fontWeight: "bold", marginBottom: 2, fontSize: 10,
              color: msg.type === "feeling" ? "#e2b04a" :
                     msg.type === "dialogue" ? "#4ecdc4" : "#aaa"
            }}>
              {msg.speaker}
              <span style={{ fontWeight: "normal", fontSize: 9, color: "#555" }}>
                {" "}{msg.time}
              </span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
