import { useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sky, OrbitControls } from "@react-three/drei"
import GardenScene from "../components/GardenScene"
import SafeCanvas from "../components/SafeCanvas"
import { setSceneData, getTileData } from "../utils/pathfinding"
import { generateRandomTiles } from "../store/gameData"

const GRID = 30
const BRUSH_COLORS = { 1: "#777", 2: "#c44", 3: "#48c", 4: "#e2b04a", 5: "#c8a", 6: "#2d8a2d", 7: "#888", 8: "#87CEEB" }
const BRUSH_NAMES = { 0: "擦除", 1: "道路", 2: "墙壁", 3: "水域", 4: "亭子(5×5)", 5: "月洞门(3×3)", 6: "树木", 7: "石头", 8: "草坪" }
const BRUSH_RADIUS = { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1, 6: 0, 7: 0, 8: 0 }

const STORAGE_KEY = "garden-scenes-v2"

function loadScenes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}
function saveScenes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function Editor() {
  const nav = useNavigate()
  const cv = useRef(null)
  const [brush, setBrush] = useState(1)
  const [tiles, setTiles] = useState({})
  const [zoom, setZoom] = useState(1)
  const [px, setPx] = useState(0)
  const [py, setPy] = useState(0)
  const [info, setInfo] = useState("左键绘制 | 滚轮缩放 | 中键拖拽")
  const [hoverTile, setHoverTile] = useState(null)
  const [scenes, setScenes] = useState(loadScenes)
  const [sceneName, setSceneName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadPanel, setShowLoadPanel] = useState(false)
  const [previewTiles, setPreviewTiles] = useState(null)
  const down = useRef(false)
  const panning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  // Sync tile data to pathfinding module for 3D preview
  useEffect(() => {
    setSceneData(GRID, tiles)
    setPreviewTiles({ ...tiles })
  }, [tiles])

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

    ctx.fillStyle = "#0d1f2d"
    ctx.fillRect(0, 0, cw, ch)

    // Draw tiles
    for (const k in tiles) {
      const [sx, sy] = k.split(",")
      const x = +sx, y = +sy
      const col = BRUSH_COLORS[tiles[k]]
      if (col) {
        ctx.fillStyle = col
        ctx.globalAlpha = 0.65
        ctx.fillRect(ox + x * s - s / 2 + 1, oy + y * s - s / 2 + 1, s - 2, s - 2)
        ctx.globalAlpha = 1
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)"
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
    ctx.strokeStyle = "rgba(78,205,196,0.4)"
    ctx.lineWidth = 2
    ctx.strokeRect(ox - GRID * s, oy - GRID * s, GRID * 2 * s, GRID * 2 * s)

    // Hover
    if (hoverTile && !down.current) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)"
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

  const saveScene = () => {
    const name = sceneName.trim() || ("场景 " + (scenes.length + 1))
    const newScenes = [...scenes, { name, tiles, createdAt: new Date().toLocaleString() }]
    setScenes(newScenes)
    saveScenes(newScenes)
    setSceneName("")
    setShowSaveDialog(false)
    setInfo("已保存: " + name)
  }

  const loadScene = (idx) => {
    const scene = scenes[idx]
    setTiles({ ...scene.tiles })
    setShowLoadPanel(false)
    setInfo("已加载: " + scene.name)
  }

  const deleteScene = (idx) => {
    const newScenes = scenes.filter((_, i) => i !== idx)
    setScenes(newScenes)
    saveScenes(newScenes)
  }

  const enterSandbox = () => {
    const data = JSON.stringify(tiles)
    localStorage.setItem("garden-custom-tilemap", data)
    setInfo("跳转到沙箱...")
    setTimeout(() => nav("/sandbox?map=custom"), 300)
  }

  const randomScene = () => {
    const newTiles = generateRandomTiles()
    // Add trees
    for (let i = 0; i < 25; i++) {
      const x = Math.floor(Math.random() * 50 - 25)
      const z = Math.floor(Math.random() * 50 - 25)
      if (!newTiles[x + "," + z]) newTiles[x + "," + z] = 6
    }
    // Add rocks
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(Math.random() * 50 - 25)
      const z = Math.floor(Math.random() * 50 - 25)
      if (!newTiles[x + "," + z]) newTiles[x + "," + z] = 7
    }
    setTiles(newTiles)
    setInfo("随机生成场景")
  }

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", background: "#0a0f1e", fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif' }}>

      {/* ── LEFT: 2D Canvas Editor (60%) ── */}
      <div style={{ flex: "0 0 60%", position: "relative", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <canvas ref={cv} style={{ width: "100%", height: "100%", display: "block" }}
          onMouseDown={(e) => { handleMouse(e); handleMidDown(e) }}
          onMouseMove={handleMouse} onMouseUp={handleMouse} onMouseLeave={handleMouse}
          onWheel={handleWheel} onContextMenu={e => e.preventDefault()} />

        {/* Brush toolbar - right side */}
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 5, background: "rgba(0,0,0,0.85)", padding: "8px 5px", borderRadius: 10, zIndex: 10 }}>
          {Object.keys(BRUSH_NAMES).map(Number).sort((a,b)=>a-b).map(b => (
            <button key={b} onClick={() => { setBrush(b); setInfo(BRUSH_NAMES[b]) }}
              style={{
                width: 42, height: 34, borderRadius: 5, fontSize: 11,
                border: "2px solid " + (brush === b ? "#4ecdc4" : "rgba(255,255,255,0.1)"),
                background: b === 0 ? "rgba(255,255,255,0.05)" : BRUSH_COLORS[b] || "transparent",
                color: b === 0 ? "#888" : "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: ".15s", fontWeight: brush === b ? "bold" : "normal"
              }} title={BRUSH_NAMES[b]}>
              {BRUSH_NAMES[b].split("(")[0]}
            </button>
          ))}
        </div>

        {/* Top toolbar */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5, zIndex: 10, flexWrap: "wrap" }}>
          <button onClick={enterSandbox}
            style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid #4ecdc4", background: "rgba(78,205,196,0.15)", color: "#4ecdc4", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
            进入沙箱
          </button>
          <button onClick={() => setShowSaveDialog(true)}
            style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.6)", color: "#ccc", cursor: "pointer", fontSize: 11 }}>
            保存场景
          </button>
          <button onClick={() => setShowLoadPanel(true)}
            style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.6)", color: "#ccc", cursor: "pointer", fontSize: 11 }}>
            加载场景
          </button>
          <button onClick={randomScene}
            style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid #e2b04a", background: "rgba(226,176,74,0.1)", color: "#e2b04a", cursor: "pointer", fontSize: 11 }}>
            随机生成
          </button>
          <button onClick={() => { setTiles({}); setInfo("已清空") }}
            style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid #e74c3c", background: "rgba(0,0,0,0.6)", color: "#e74c3c", cursor: "pointer", fontSize: 11 }}>
            清空
          </button>
          <button onClick={() => nav("/")}
            style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.6)", color: "#ccc", cursor: "pointer", fontSize: 11 }}>
            ← 返回
          </button>
        </div>

        {/* Info bar */}
        <div style={{ position: "absolute", bottom: 6, left: 8, color: "#555", fontSize: 10, zIndex: 5 }}>{info}</div>
      </div>

      {/* ── RIGHT: 3D Preview (40%) ── */}
      <div style={{ flex: "1 1 40%", position: "relative", background: "#0d1117" }}>
        <div style={{ position: "absolute", top: 6, left: 8, zIndex: 5, color: "#888", fontSize: 10, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 4 }}>
          3D 实时预览
        </div>
        <SafeCanvas shadows camera={{ position: [0, 22, 16], fov: 50 }} style={{ position: "absolute", inset: 0 }}
          gl={{ preserveDrawingBuffer: false, alpha: false, antialias: true }}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[20, 25, 10]} intensity={1.3} castShadow shadow-mapSize={[512, 512]} />
          <GardenScene weather="sunny" tileData={previewTiles} />
          <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.3} minDistance={6} maxDistance={45} />
          {/* Postprocessing disabled — @react-three/postprocessing not installed */}
        </SafeCanvas>
      </div>

      {/* ── Save Dialog ── */}
      {showSaveDialog && (
        <div onClick={() => setShowSaveDialog(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#16213e", borderRadius: 10, padding: 20, width: 320, border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#fff", margin: "0 0 12px", fontSize: 14 }}>保存场景</h3>
            <input value={sceneName} onChange={e => setSceneName(e.target.value)} placeholder="输入场景名称..."
              style={{ width: "100%", padding: "8px 10px", borderRadius: 5, border: "1px solid #555", background: "#0d1f35", color: "#eee", fontSize: 13, marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowSaveDialog(false)} style={{ padding: "6px 14px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 12 }}>取消</button>
              <button onClick={saveScene} style={{ padding: "6px 14px", borderRadius: 5, border: "none", background: "#4ecdc4", color: "#111", fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Load Panel ── */}
      {showLoadPanel && (
        <div onClick={() => setShowLoadPanel(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#16213e", borderRadius: 10, padding: 20, width: 400, maxHeight: "70vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#fff", margin: "0 0 12px", fontSize: 14 }}>已保存的场景</h3>
            {scenes.length === 0 && <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 20 }}>暂无保存的场景</div>}
            {scenes.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 10px", marginBottom: 4, background: "rgba(255,255,255,0.03)", borderRadius: 6, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#eee", fontSize: 13 }}>{s.name}</div>
                  <div style={{ color: "#555", fontSize: 10 }}>{s.createdAt} · {Object.keys(s.tiles).length} 瓦片</div>
                </div>
                <button onClick={() => loadScene(i)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #4ecdc4", background: "rgba(78,205,196,0.1)", color: "#4ecdc4", cursor: "pointer", fontSize: 11 }}>加载</button>
                <button onClick={() => deleteScene(i)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e74c3c", background: "transparent", color: "#e74c3c", cursor: "pointer", fontSize: 11 }}>×</button>
              </div>
            ))}
            <button onClick={() => setShowLoadPanel(false)} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 12, width: "100%" }}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}



