import { useState, useCallback, useRef, useEffect, memo, useReducer } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Sky, OrbitControls } from "@react-three/drei"
import SafeCanvas from "../components/SafeCanvas"
import GardenScene from "../components/GardenScene"
import { CharacterMesh, CharacterLabel, SpeechBubble3D } from "../components/CharacterSystem"
import { getTileData, setSceneData } from "../utils/pathfinding"
import POVRenderer from "../components/POVRenderer"
import AddCharacterDialog from "../components/AddCharacterDialog"
import Tutorial from "../components/Tutorial"
import SettingsPanel from "../components/SettingsPanel"
import CharacterBar from "../components/CharacterBar"
import MessageLog from "../components/MessageLog"
import KnowledgeCard from "../components/KnowledgeCard"
import { useMessages } from "../hooks/useMessages"
import { useCharacters } from "../hooks/useCharacters"
import { useGameLoop } from "../hooks/useGameLoop"
import { SCENE_SIZE } from "../store/gameData"

// ── 3D Canvas — subscribes to game loop ticks ──
const StableCanvas = memo(function StableCanvas({ gameStateRef, tickSubsRef }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  const [selId, setSelId] = useState(null)
  const selectCallbackRef = useRef(null)

  // Subscribe to game loop ticks (no parent re-render needed)
  useEffect(() => {
    const fn = () => forceUpdate()
    tickSubsRef.current.add(fn)
    return () => { tickSubsRef.current.delete(fn) }
  }, [tickSubsRef])

  // Update selected ID on each render
  const state = gameStateRef.current
  if (state) {
    const id = state.selectedIdRef.current
    if (selId !== id) {
      // Use a microtask to avoid setState during render
      queueMicrotask(() => setSelId(id))
    }
    selectCallbackRef.current = state.onSelectCharRef.current
  }

  const chars = state ? state.charactersRef.current : []
  const weather = state ? state.weatherRef.current : "sunny"

  return (
    <SafeCanvas shadows camera={{ position: [0, 25, 18], fov: 50 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ preserveDrawingBuffer: false, alpha: false, antialias: true }}>
      <Sky sunPosition={weather === "night" ? [0, -10, 100] : weather === "dusk" ? [50, 8, 60] : weather === "cloudy" ? [80, 12, 80] : [100, 20, 100]} />
      <ambientLight intensity={weather === "night" ? 0.18 : weather === "dusk" ? 0.3 : weather === "cloudy" ? 0.4 : 0.5} color={weather === "night" ? "#4466aa" : weather === "dusk" ? "#f4a460" : weather === "cloudy" ? "#c8c8d0" : "#fff8e1"} />
      <directionalLight position={weather === "night" ? [10, 8, 10] : weather === "dusk" ? [30, 12, 15] : [20, 25, 10]} intensity={weather === "night" ? 0.3 : weather === "dusk" ? 0.7 : weather === "cloudy" ? 0.9 : 1.3} castShadow shadow-mapSize={[1024, 1024]} color={weather === "night" ? "#8899cc" : weather === "dusk" ? "#f4c78e" : weather === "cloudy" ? "#d8d8e0" : "#ffffff"} />
      <GardenScene weather={weather} tileData={getTileData()} />
      {chars.map(c => (
        <group key={c.id}>
          <CharacterMesh character={c} isSelected={c.id === selId}
            onClick={(char) => {
              if (state) state.selectedIdRef.current = char.id
              if (selectCallbackRef.current) selectCallbackRef.current(char.id)
            }} sceneSize={SCENE_SIZE} />
          <CharacterLabel character={c} />
          {c.dialogueText && <SpeechBubble3D character={c} />}
        </group>
      ))}
      <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.3} minDistance={8} maxDistance={50} />
    </SafeCanvas>
  )
})

// ── 2D Minimap — subscribes to game loop ticks ──
const StableMinimap = memo(function StableMinimap({ gameStateRef, tickSubsRef }) {
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const waypointRef = useRef({ x: 0, z: 0, active: false, time: 0 })
  const selectCallbackRef = useRef(null)
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  // Subscribe to game loop ticks
  useEffect(() => {
    const fn = () => forceUpdate()
    tickSubsRef.current.add(fn)
    return () => { tickSubsRef.current.delete(fn) }
  }, [tickSubsRef])

  // Draw minimap on each render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    // Resize if needed
    const parent = canvas.parentElement
    if (parent) {
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(rect.width), h = Math.round(rect.height)
      if (w >= 2 && h >= 2 && (sizeRef.current.w !== w || sizeRef.current.h !== h)) {
        sizeRef.current = { w, h }
        canvas.width = w * dpr; canvas.height = h * dpr
        canvas.style.width = w + "px"; canvas.style.height = h + "px"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    const w = sizeRef.current.w, h = sizeRef.current.h
    if (w < 2 || h < 2) return

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = "#16213e"; ctx.fillRect(0, 0, w, h)

    const scale = Math.min(w, h) / (SCENE_SIZE * 2.3)
    const ox = w / 2, oy = h / 2

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 0.5
    for (let i = -SCENE_SIZE; i <= SCENE_SIZE; i += 5) {
      ctx.beginPath(); ctx.moveTo(ox + i * scale, oy - SCENE_SIZE * scale); ctx.lineTo(ox + i * scale, oy + SCENE_SIZE * scale); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ox - SCENE_SIZE * scale, oy + i * scale); ctx.lineTo(ox + SCENE_SIZE * scale, oy + i * scale); ctx.stroke()
    }

    // Tiles
    const tileData = getTileData()
    if (tileData) {
      for (const [key, v] of Object.entries(tileData)) {
        if (v === 0) continue
        const [tx, tz] = key.split(",").map(Number)
        ctx.fillStyle = v === 1 ? "rgba(80,140,80,0.25)" : v === 2 ? "rgba(120,90,60,0.2)" : "rgba(60,120,180,0.3)"
        ctx.fillRect(ox + tx * scale - scale / 2, oy + tz * scale - scale / 2, scale, scale)
      }
    }

    // Characters
    const state = gameStateRef.current
    const chars = state ? state.charactersRef.current || [] : []
    const selId = state ? state.selectedIdRef.current : null
    for (const c of chars) {
      if (!c.position) continue
      const cx = ox + c.position.x * scale, cy = oy + c.position.z * scale
      const r = c.id === selId ? 6 : 3.5
      ctx.fillStyle = c.color || "#fff"
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      if (c.id === selId) {
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke()
      }
    }

    // Waypoint marker
    const wp = waypointRef.current
    if (wp.active) {
      const dt = performance.now() - wp.time
      if (dt > 2000) { wp.active = false }
      else {
        const px = ox + wp.x * scale, py = oy + wp.z * scale
        const alpha = 1 - dt / 2000
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.moveTo(px, py - 10); ctx.lineTo(px + 6, py - 2)
        ctx.lineTo(px + 2, py + 2); ctx.lineTo(px + 8, py + 6)
        ctx.lineTo(px, py + 14); ctx.lineTo(px - 8, py + 6)
        ctx.lineTo(px - 2, py + 2); ctx.lineTo(px - 6, py - 2)
        ctx.closePath(); ctx.fill()
      }
    }
  })

  const handleClick = (e) => {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const w = sizeRef.current.w, h = sizeRef.current.h
    const scale = Math.min(w, h) / (SCENE_SIZE * 2.3)
    const ox = w / 2, oy = h / 2
    const state = gameStateRef.current; if (!state) return
    const chars = state.charactersRef.current || []
    for (const c of chars) {
      if (!c.position) continue
      if (Math.sqrt((mx - ox - c.position.x * scale) ** 2 + (my - oy - c.position.z * scale) ** 2) < 10) {
        state.selectedIdRef.current = c.id
        if (selectCallbackRef.current) selectCallbackRef.current(c.id)
        return
      }
    }
  }

  const handleRightClick = (e) => {
    e.preventDefault()
    const state = gameStateRef.current; if (!state) return
    const sid = state.selectedIdRef.current; if (!sid) return
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const w = sizeRef.current.w, h = sizeRef.current.h
    const scale = Math.min(w, h) / (SCENE_SIZE * 2.3)
    const ox = w / 2, oy = h / 2
    const wx = (mx - ox) / scale, wz = (my - oy) / scale
    const half = SCENE_SIZE - 2
    if (state.setTargetRef.current) {
      state.setTargetRef.current(sid, Math.max(-half, Math.min(half, wx)), Math.max(-half, Math.min(half, wz)))
    }
  }

  return <canvas ref={canvasRef} onClick={handleClick} onContextMenu={handleRightClick}
    style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }} />
})

// ── Memoized POV section (avoids re-rendering R3F Canvas on every tick) ──
const POVSection = memo(function POVSection({ selectedCharacter, charactersRef }) {
  if (!selectedCharacter) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555", fontSize: 12 }}>
        选择一个角色查看视角
      </div>
    )
  }
  return (
    <>
      <div style={{ position: "absolute", top: 6, left: 6, zIndex: 5, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: "bold", borderLeft: "2px solid #4ecdc4" }}>
        {"👁 "}{selectedCharacter.name} 的视角
      </div>
      <POVRenderer character={selectedCharacter} characters={charactersRef.current} />
    </>
  )
})

// ── Sandbox Page ──
export default function Sandbox() {
  const nav = useNavigate()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("deepseek_api_key") || "")
  const [apiUrl, setApiUrl] = useState("https://api.deepseek.com/v1/chat/completions")
  const [searchParams] = useSearchParams()
  const mapMode = searchParams.get("map") || "preset"

  const [showSettings, setShowSettings] = useState(false)
  const [showAddChar, setShowAddChar] = useState(false)
  const [weatherLabel, setWeatherLabel] = useState("sunny")

  const { messageStream, addMessage } = useMessages()
  const {
    charactersRef, charList, selectedIdRef, selectedId, setSelected,
    setTargetRef, onSelectCharRef, addCharacter, deleteCharacter
  } = useCharacters()

  const weatherRef = useRef("sunny")
  const setWeather = useCallback((w) => { weatherRef.current = w; setWeatherLabel(w) }, [])

  const gameStateRef = useRef({ charactersRef, selectedIdRef, weatherRef, setTargetRef, onSelectCharRef })

  onSelectCharRef.current = setSelected

  // Tick subscription ref — StableCanvas/Minimap subscribe, no parent re-render
  const tickSubsRef = useRef(new Set())
  const handleTick = useCallback(() => {
    tickSubsRef.current.forEach(fn => fn())
  }, [])
  useGameLoop({ charactersRef, apiKey, apiUrl, addMessage, onTick: handleTick })

  // Load custom tilemap
  useEffect(() => {
    if (mapMode === "custom") {
      try {
        const raw = localStorage.getItem("garden-custom-tilemap")
        if (raw) {
          setSceneData(SCENE_SIZE, JSON.parse(raw))
          addMessage("系统", "已加载自定义场景地图", "system")
        }
      } catch (e) {
        console.warn("Custom tilemap load failed", e)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddChar = useCallback((charData) => {
    const name = charData.name
    addCharacter(charData)
    addMessage("系统", "新角色 " + name + " 加入了园林", "system")
  }, [addCharacter, addMessage])

  const handleDeleteChar = useCallback((id) => {
    deleteCharacter(id)
    addMessage("系统", "角色已离开园林", "system")
  }, [deleteCharacter, addMessage])

  const selectedCharacter = selectedId ? charactersRef.current.find(c => c.id === selectedId) : null

  return (
    <>
      <Tutorial />

      <div style={{
        display: "grid", gridTemplateColumns: "30fr 70fr", height: "100vh",
        gap: 4, padding: 4, background: "#1a1a2e",
        fontFamily: "Microsoft YaHei,PingFang SC,sans-serif"
      }}>
        {/* ── Left: 3D + Minimap ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <div style={{
            flex: 1, background: "#16213e", borderRadius: 10, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)", minHeight: 0, position: "relative"
          }}>
            <StableCanvas gameStateRef={gameStateRef} tickSubsRef={tickSubsRef} />
          </div>
          <div style={{
            flex: 1, background: "#16213e", borderRadius: 10, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)", minHeight: 0
          }}>
            <StableMinimap gameStateRef={gameStateRef} tickSubsRef={tickSubsRef} />
          </div>
          <KnowledgeCard />
        </div>

        {/* ── Right: Controls + Log + POV ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>

          {/* Top bar */}
          <div style={{
            display: "flex", gap: 14, alignItems: "center", padding: "5px 10px",
            background: "rgba(0,0,0,0.25)", borderRadius: 8, flexShrink: 0
          }}>
            <button onClick={() => nav("/")} style={{
              padding: "4px 10px", borderRadius: 5,
              border: "1.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)", color: "#999",
              cursor: "pointer", fontSize: 11
            }}>
              ← 首页
            </button>
            {["sunny", "cloudy", "dusk", "night"].map(w => (
              <button key={w} onClick={() => setWeather(w)} style={{
                padding: "3px 7px", borderRadius: 4,
                border: weatherLabel === w ? "1.5px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                background: weatherLabel === w ? "rgba(255,255,255,0.1)" : "transparent",
                fontSize: 14, cursor: "pointer", lineHeight: 1
              }}>
                {{ sunny: "☀️", cloudy: "☁️", dusk: "🌅", night: "🌙" }[w]}
              </button>
            ))}
            <button onClick={() => setShowAddChar(true)} style={{
              padding: "4px 10px", borderRadius: 5,
              border: "1.5px solid rgba(78,205,196,0.7)",
              background: "rgba(78,205,196,0.08)", color: "#4ecdc4",
              cursor: "pointer", fontSize: 11
            }}>
              + 新角色
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowSettings(!showSettings)} style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.5)", color: "#ccc",
              fontSize: 14, cursor: "pointer"
            }}>
              {"⚙"}
            </button>
          </div>

          {showSettings && (
            <SettingsPanel
              apiKey={apiKey} setApiKey={setApiKey}
              apiUrl={apiUrl} setApiUrl={setApiUrl}
              onClose={() => setShowSettings(false)}
            />
          )}

          <CharacterBar
            charList={charList}
            selectedId={selectedId}
            onSelect={(id) => { selectedIdRef.current = id; setSelected(id) }}
            onDelete={handleDeleteChar}
          />

          <MessageLog messages={messageStream} />

          <div style={{
            flexShrink: 0, height: "35%", background: "#0f3460",
            borderRadius: 10, position: "relative", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)", minHeight: 100
          }}>
            <POVSection selectedCharacter={selectedCharacter} charactersRef={charactersRef} />
          </div>
        </div>

        {showAddChar && (
          <AddCharacterDialog
            onAdd={handleAddChar}
            onClose={() => setShowAddChar(false)}
            apiKey={apiKey} apiUrl={apiUrl}
          />
        )}
      </div>
    </>
  )
}
