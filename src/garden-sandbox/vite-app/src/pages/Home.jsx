import { Link, useNavigate } from "react-router-dom"

const styles = {
  body: {
    background: "#0a0f1e", fontFamily: "\"Microsoft YaHei\",\"PingFang SC\",sans-serif",
    display: "flex", justifyContent: "center", alignItems: "center", height: "100vh",
    overflow: "hidden", margin: 0, flexDirection: "column"
  },
  title: { fontSize: 36, color: "#e2b04a", marginBottom: 6, textShadow: "0 0 30px rgba(226,176,74,0.3)" },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 40 },
  cards: { display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" },
  card: {
    width: 240, padding: "36px 28px", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
    cursor: "pointer", transition: "all .3s", textDecoration: "none",
    color: "#ccc", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
  },
  icon: { fontSize: 52, marginBottom: 16 },
  h2: { fontSize: 20, marginBottom: 8 },
  p: { fontSize: 12, color: "#777", lineHeight: 1.6 },
  footer: { position: "fixed", bottom: 16, color: "#444", fontSize: 11 }
}

export default function Home() {
  const nav = useNavigate()

  return (
    <div style={styles.body}>
      <h1 style={styles.title}>苏州园林 AI 沙箱</h1>
      <p style={styles.subtitle}>艺术与科技 · 香山帮营造技艺</p>

      <div style={styles.cards}>
        {/* Sandbox card — goes to map selector */}
        <div
          onClick={() => nav("/sandbox")}
          style={styles.card}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#4ecdc4"
            e.currentTarget.style.background = "rgba(78,205,196,0.06)"
            e.currentTarget.querySelector("h2").style.color = "#4ecdc4"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
            e.currentTarget.style.background = "rgba(255,255,255,0.03)"
            e.currentTarget.querySelector("h2").style.color = "#ccc"
          }}
        >
          <div style={styles.icon}>🏯</div>
          <h2 style={styles.h2}>进入沙箱</h2>
          <p style={styles.p}>观察 AI 匠人在园林中漫步对话，选择预设地图或加载自定义场景</p>
        </div>

        {/* Editor card */}
        <div
          onClick={() => nav("/editor")}
          style={styles.card}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#e2b04a"
            e.currentTarget.style.background = "rgba(226,176,74,0.06)"
            e.currentTarget.querySelector("h2").style.color = "#e2b04a"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
            e.currentTarget.style.background = "rgba(255,255,255,0.03)"
            e.currentTarget.querySelector("h2").style.color = "#ccc"
          }}
        >
          <div style={styles.icon}>🗺️</div>
          <h2 style={styles.h2}>场景编辑器</h2>
          <p style={styles.p}>绘制道路、亭台、水域，编辑完成后可一键进入沙箱体验</p>
        </div>
      </div>

      <div style={styles.footer}>全国第八届大学生艺术展演 · 艺术实践工作坊</div>
    </div>
  )
}
