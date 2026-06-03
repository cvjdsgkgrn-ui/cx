import { useRef, useEffect, useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"

const GRID = 30
const BRUSH_COLORS = { 1: "#777", 2: "#c44", 3: "#48c", 4: "#e2b04a", 5: "#c8a" }
const BRUSH_NAMES = { 0: "擦除", 1: "道路", 2: "墙壁", 3: "水域", 4: "亭子", 5: "月洞门" }
const BRUSH_RADIUS = { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 }

export default function Editor() {
  const nav = useNavigate()
  const cv = useRef(null)
  const [brush, setBrush] = useState(1)
  const [tiles, setTiles] = useState({})
  const [zoom, setZoom] = useState(1)
  const [px, setPx] = useState(0)
  const [py, setPy] = useState(0)
  const [info, setInfo] = useState("按住左键绘制 | 滚轮缩放 中键拖拽 | 当前: 道路")
  const [hoverTile, setHoverTile] = useState(null)
  const down = useRef(false)
  const panning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  // Pre-generate rock colors (used for pond edge aesthetics, not critical)
  const rockColors = useMemo(() =>
    Array.from({ length: 24 }, () => `hsl(0,0%,${40 + Math.random() * 15}%)`),
    []
  )

  function screenToWorld(sx, sy) {
    const c = cv.current
    if (!c) return { x: 0, y: 0 }
    const s = zoom * Math.min(c.width, c.height) / (GRID * 2.2)
    return {
      x: Math.round((sx - c.width / 2) / s + px),
      y: Math.round((sy - c.height / 2) / s + py)
    }
  }

  function paintAt(e) {
    if (!down.current) return
    const p = screenToWorld(e.clientX, e.clientY)
    const r = BRUSH_RADIUS[brush] || 0
    const newTiles = { ...tiles }
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const k = (p.x + dx) + "," + (p.y + dy)
        if (brush === 0) delete newTiles[k]
        else newTiles[k] = brush
      }
    }
    setTiles(newTiles)
  }

  function draw(ctx, cw, ch) {
    const s = zoom * Math.min(cw, ch) / (GRID * 2.2)
    const ox = cw / 2 - px * s
    const oy = ch / 2 - py * s

    ctx.fillStyle = "#16213e"
    ctx.fillRect(0, 0, cw, ch)

    // Pond indicator at (5,-4)
    ctx.strokeStyle = "rgba(72,136,204,0.3)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(ox + 5 * s, oy + (-4) * s, 4.5 * s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Pavilion indicator at (-8,-6)
    ctx.strokeStyle = "rgba(226,176,74,0.3)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(ox + (-8) * s, oy + (-6) * s, 3 * s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw tiles
    for (const k in tiles) {
      const [sx, sy] = k.split(",")
      const x = +sx, y = +sy
      const col = BRUSH_COLORS[tiles[k]]
      if (col) {
        ctx.fillStyle = col
        ctx.globalAlpha = 0.7
        ctx.fillRect(ox + x * s - s / 2, oy + y * s - s / 2, s, s)
        ctx.globalAlpha = 1
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)"
    ctx.lineWidth = 0.5
    for (let x = -GRID - 2; x <= GRID + 2; x++) {
      ctx.beginPath()
      ctx.moveTo(ox + x * s, oy + (-GRID - 2) * s)
      ctx.lineTo(ox + x * s, oy + (GRID + 2) * s)
      ctx.stroke()
    }
    for (let y = -GRID - 2; y <= GRID + 2; y++) {
      ctx.beginPath()
      ctx.moveTo(ox + (-GRID - 2) * s, oy + y * s)
      ctx.lineTo(ox + (GRID + 2) * s, oy + y * s)
      ctx.stroke()
    }

    // Boundary
    ctx.strokeStyle = "rgba(78,205,196,0.3)"
    ctx.lineWidth = 2
    ctx.strokeRect(ox - GRID * s, oy - GRID * s, GRID * 2 * s, GRID * 2 * s)

    // Hover
    if (hoverTile && !down.current) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)"
      ctx.lineWidth = 2
      const [hx, hy] = hoverTile
      ctx.strokeRect(ox + hx * s - s / 2, oy + hy * s - s / 2, s, s)
    }
  }

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext("2d")
    c.width = c.parentElement.clientWidth
    c.height = c.parentElement.clientHeight

    draw(ctx, c.width, c.height)
    const id = setInterval(() => draw(ctx, c.width, c.height), 50)
    return () => clearInterval(id)
  }, [tiles, zoom, px, py, hoverTile])

  const handleMouse = (e) => {
    const c = cv.current
    if (!c) return
    if (e.type === "mousedown" && e.button === 0) {
      down.current = true; paintAt(e)
    } else if (e.type === "mousemove") {
      if (down.current) paintAt(e)
      else { const p = screenToWorld(e.clientX, e.clientY); setHoverTile([p.x, p.y]) }
      if (panning.current) {
        const s = zoom * Math.min(c.width, c.height) / (GRID * 2.2)
        setPx(pv => pv - (e.clientX - lastMouse.current.x) / s)
        setPy(pv => pv - (e.clientY - lastMouse.current.y) / s)
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    } else if (e.type === "mouseup") {
      down.current = false
      if (e.button === 1) panning.current = false
    } else if (e.type === "mouseleave") {
      down.current = false; panning.current = false
    }
  }

  const handleMidDown = (e) => {
    if (e.button === 1) { panning.current = true; lastMouse.current = { x: e.clientX, y: e.clientY } }
  }

  const handleWheel = (e) => {
    e.preventDefault()
    setZoom(z => Math.max(0.2, Math.min(5, z * (e.deltaY > 0 ? 0.9 : 1.1))))
  }

  const saveAndEnter = () => {
    const data = JSON.stringify(tiles)
    localStorage.setItem("garden-custom-tilemap", data)
    setInfo("已保存! 跳转到沙箱...")
    setTimeout(() => nav("/sandbox?map=custom"), 400)
  }

  const load = () => {
    const inp = document.createElement("input")
    inp.type = "file"; inp.accept = ".json"
    inp.onchange = (e) => {
      const f = e.target.files[0]; if (!f) return
      const r = new FileReader()
      r.onload = ev => {
        try { const d = JSON.parse(ev.target.result); setTiles(d); setInfo("已加载 " + Object.keys(d).length + " 个瓦片") }
        catch { setInfo("文件格式错误") }
      }
      r.readAsText(f)
    }
    inp.click()
  }

  const clearAll = () => {
    if (confirm("确认清空所有瓦片?")) { setTiles({}); setInfo("已清空") }
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#0d1117" }}>
      <canvas ref={cv} style={{ width: "100%", height: "100%", display: "block", background: "#16213e" }}
        onMouseDown={(e) => { handleMouse(e); handleMidDown(e) }}
        onMouseMove={handleMouse} onMouseUp={handleMouse} onMouseLeave={handleMouse}
        onWheel={handleWheel} onContextMenu={e => e.preventDefault()} />

      {/* Right toolbar */}
      <div style={{ position: "fixed", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 6, background: "rgba(0,0,0,0.85)", padding: "10px 6px", borderRadius: 10, zIndex: 10 }}>
        {[1, 2, 3, 4, 5, 0].map(b => (
          <button key={b} onClick={() => { setBrush(b); setInfo("当前: " + BRUSH_NAMES[b]) }}
            style={{
              width: 40, height: 40, borderRadius: 6,
              border: "2px solid " + (brush === b ? "#4ecdc4" : "rgba(255,255,255,0.1)"),
              background: b === 0 ? "rgba(255,255,255,0.05)" : BRUSH_COLORS[b] || "transparent",
              color: b === 0 ? "#888" : "#fff", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", transition: ".15s"
            }} title={BRUSH_NAMES[b]}>
            {BRUSH_NAMES[b]}
          </button>
        ))}
      </div>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 10, left: 10, zIndex: 10, display: "flex", gap: 6 }}>
        <button onClick={saveAndEnter}
          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #4ecdc4", background: "rgba(78,205,196,0.15)", color: "#4ecdc4", cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
          保存并进入沙箱
        </button>
        <button onClick={() => {
          const data = JSON.stringify(tiles)
          const b = new Blob([data], { type: "application/json" })
          const a = document.createElement("a")
          a.href = URL.createObjectURL(b); a.download = "tilemap.json"; a.click()
          setInfo("已导出 tilemap.json")
        }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.6)", color: "#ccc", cursor: "pointer", fontSize: 12 }}>
          导出 JSON
        </button>
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.6)", color: "#ccc", cursor: "pointer", fontSize: 12 }}>
          加载
        </button>
        <button onClick={clearAll} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e74c3c", background: "rgba(0,0,0,0.6)", color: "#e74c3c", cursor: "pointer", fontSize: 12 }}>
          清空
        </button>
        <Link to="/"><button style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.6)", color: "#ccc", cursor: "pointer", fontSize: 12 }}>返回</button></Link>
      </div>

      {/* Info */}
      <div style={{ position: "fixed", bottom: 10, left: 10, zIndex: 10, fontSize: 11, color: "#555" }}>{info}</div>
    </div>
  )
}
