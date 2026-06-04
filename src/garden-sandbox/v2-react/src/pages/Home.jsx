import { useNavigate } from "react-router-dom"

const styles = {
  body: {
    background: "#0a0f1e", fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
    display: "flex", justifyContent: "center", alignItems: "center", height: "100vh",
    overflow: "hidden", margin: 0, flexDirection: "column"
  },
  title: { fontSize: 36, color: "#e2b04a", marginBottom: 6, textShadow: "0 0 30px rgba(226,176,74,0.3)" },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 40 },
  cards: { display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" },
  card: {
    width: 200, padding: "32px 22px", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
    cursor: "pointer", transition: "all .3s",
    color: "#ccc", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
  },
  icon: { fontSize: 46, marginBottom: 14 },
  h2: { fontSize: 18, margin: "0 0 6px 0", transition: "color .3s" },
  p: { fontSize: 11, color: "#777", lineHeight: 1.5, margin: 0 },
  footer: { position: "fixed", bottom: 16, color: "#444", fontSize: 11 }
}

function generateRandomTiles() {
  const tiles = {}
  const px = Math.floor(Math.random() * 30 - 15)
  const pz = Math.floor(Math.random() * 30 - 15)
  for (let dx = -5; dx <= 5; dx++)
    for (let dz = -5; dz <= 5; dz++)
      if (dx*dx + dz*dz < 20) tiles[(px+dx)+","+(pz+dz)] = 3
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * 50 - 25)
    const z = Math.floor(Math.random() * 50 - 25)
    if (!tiles[x+","+z]) tiles[x+","+z] = 1
  }
  const pavX = Math.floor(Math.random() * 20 - 10)
  const pavZ = Math.floor(Math.random() * 20 - 10)
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!tiles[(pavX+dx)+","+(pavZ+dz)] || tiles[(pavX+dx)+","+(pavZ+dz)] === 1)
        tiles[(pavX+dx)+","+(pavZ+dz)] = 4
  const mgX = Math.floor(Math.random() * 20 - 10)
  const mgZ = Math.floor(Math.random() * 20 - 10)
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (!tiles[(mgX+dx)+","+(mgZ+dz)] || tiles[(mgX+dx)+","+(mgZ+dz)] === 1)
        tiles[(mgX+dx)+","+(mgZ+dz)] = 5
  return tiles
}

export default function Home() {
  const nav = useNavigate()

  const enterRandom = () => {
    const tiles = generateRandomTiles()
    localStorage.setItem("garden-custom-tilemap", JSON.stringify(tiles))
    nav("/sandbox?map=custom")
  }

  return (
    <div style={styles.body}>
      <h1 style={styles.title}>苏州园林 AI 沙箱</h1>
      <p style={styles.subtitle}>艺术与科技 + 香山帮营造技艺</p>

      <div style={styles.cards}>
        <div onClick={() => nav("/sandbox")} style={styles.card}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4ecdc4"; e.currentTarget.style.background = "rgba(78,205,196,0.06)"; e.currentTarget.querySelector("h2").style.color = "#4ecdc4" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.querySelector("h2").style.color = "#ccc" }}>
          <div style={styles.icon}>🏯</div>
          <h2 style={styles.h2}>预设场景</h2>
          <p style={styles.p}>经典苏州园林布局</p>
        </div>

        <div onClick={enterRandom} style={styles.card}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#e2b04a"; e.currentTarget.style.background = "rgba(226,176,74,0.06)"; e.currentTarget.querySelector("h2").style.color = "#e2b04a" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.querySelector("h2").style.color = "#ccc" }}>
          <div style={styles.icon}>🎲</div>
          <h2 style={styles.h2}>随机场景</h2>
          <p style={styles.p}>随机生成园林布局</p>
        </div>

        <div onClick={() => nav("/editor")} style={styles.card}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff6b9d"; e.currentTarget.style.background = "rgba(255,107,157,0.06)"; e.currentTarget.querySelector("h2").style.color = "#ff6b9d" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.querySelector("h2").style.color = "#ccc" }}>
          <div style={styles.icon}>🗺️</div>
          <h2 style={styles.h2}>场景编辑器</h2>
          <p style={styles.p}>自由绘制+实时3D预览</p>
        </div>
      </div>

      <div style={styles.footer}>全国第八届大学生艺术展演 - 艺术实践工作坊</div>
    </div>
  )
}

