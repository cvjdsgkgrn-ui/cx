import { useState, useCallback, useRef, useEffect, memo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Canvas } from "@react-three/fiber"
import { Sky, OrbitControls } from "@react-three/drei"
import GardenScene from "../components/GardenScene"
import { CharacterMesh, CharacterLabel, SpeechBubble3D } from "../components/CharacterSystem"
import { generateFeeling, generateDialogue } from "../utils/ai"
import { findPath, pushApart, setSceneData, getTileData } from "../utils/pathfinding"
import POVRenderer from "../components/POVRenderer"
import AddCharacterDialog from "../components/AddCharacterDialog"
import { PRESET_CHARACTERS, PRESET_IDS, SCENE_SIZE, POIS, CONVERSE_DIST, CONVERSE_COOLDOWN_MS, KNOWLEDGE_CARDS } from "../store/gameData"

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const StableCanvas = memo(function StableCanvas({ gameStateRef }) {
  const [, tick] = useState(0)
  const [selId, setSelId] = useState(null)
  const selectCallbackRef = useRef(null)
  useEffect(() => {
    const iv = setInterval(() => {
      const state = gameStateRef.current
      if (!state) return
      const id = state.selectedIdRef.current
      setSelId(prev => prev !== id ? id : prev)
      selectCallbackRef.current = state.onSelectCharRef.current
      tick(t => t + 1)
    }, 300)
    return () => clearInterval(iv)
  }, [])
  const state = gameStateRef.current
  const chars = state ? state.charactersRef.current : []
  const weather = state ? state.weatherRef.current : "sunny"
  return (
    <Canvas shadows camera={{ position: [0, 25, 18], fov: 50 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ preserveDrawingBuffer: false, alpha: false, antialias: true }}>
      <Sky sunPosition={weather==="night"?[0,-10,100]:weather==="dusk"?[50,8,60]:weather==="cloudy"?[80,12,80]:[100,20,100]} />
      <ambientLight intensity={weather==="night"?0.18:weather==="dusk"?0.3:weather==="cloudy"?0.4:0.5} color={weather==="night"?"#4466aa":weather==="dusk"?"#f4a460":weather==="cloudy"?"#c8c8d0":"#fff8e1"} />
      <directionalLight position={weather==="night"?[10,8,10]:weather==="dusk"?[30,12,15]:[20,25,10]} intensity={weather==="night"?0.3:weather==="dusk"?0.7:weather==="cloudy"?0.9:1.3} castShadow shadow-mapSize={[1024,1024]} color={weather==="night"?"#8899cc":weather==="dusk"?"#f4c78e":weather==="cloudy"?"#d8d8e0":"#ffffff"} />
      <GardenScene weather={weather} tileData={getTileData()} />
      {/* WeatherParticles temporarily removed */}
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
      {/* EffectComposer disabled - React 19 compat */}
    </Canvas>
  )
})

const StableMinimap = memo(function StableMinimap({ gameStateRef }) {
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const waypointRef = useRef({ x: 0, z: 0, active: false, time: 0 })
  const rafRef = useRef(null)
  const selectCallbackRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const doResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(rect.width), h = Math.round(rect.height)
      if (w < 2 || h < 2) return
      if (sizeRef.current.w === w && sizeRef.current.h === h) return
      sizeRef.current = { w, h }
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + "px"; canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = () => {
      doResize()
      const w = sizeRef.current.w, h = sizeRef.current.h
      if (w < 2 || h < 2) { rafRef.current = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = "#16213e"; ctx.fillRect(0, 0, w, h)
      const scale = Math.min(w, h) / (SCENE_SIZE * 2.3)
      const ox = w / 2, oy = h / 2
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 0.5
      for (let i = -SCENE_SIZE; i <= SCENE_SIZE; i += 5) {
        ctx.beginPath(); ctx.moveTo(ox + i * scale, oy - SCENE_SIZE * scale); ctx.lineTo(ox + i * scale, oy + SCENE_SIZE * scale); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ox - SCENE_SIZE * scale, oy + i * scale); ctx.lineTo(ox + SCENE_SIZE * scale, oy + i * scale); ctx.stroke()
      }
      const tileData = getTileData()
      if (tileData) {
        const entries = Object.entries(tileData)
        for (const [key, v] of entries) {
          if (v === 0) continue
          const [tx, tz] = key.split(",").map(Number)
          ctx.fillStyle = v === 1 ? "rgba(80,140,80,0.25)" : v === 2 ? "rgba(120,90,60,0.2)" : "rgba(60,120,180,0.3)"
          ctx.fillRect(ox + tx * scale - scale / 2, oy + tz * scale - scale / 2, scale, scale)
        }
      }
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
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", () => {}) }
  }, [])
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

export default function Sandbox() {

  const nav = useNavigate()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("deepseek_api_key") || "")
  const [apiUrl, setApiUrl] = useState("https://api.deepseek.com/v1/chat/completions")
  const [searchParams] = useSearchParams()
  const [tutorialStep, setTutorialStep] = useState(0)
  const mapMode = searchParams.get("map") || "preset"

  const charactersRef = useRef(
    PRESET_CHARACTERS.map((p) => ({
      ...p, id: p.id,
      position: { x: pickRandom(POIS).x + (Math.random()-0.5)*4, z: pickRandom(POIS).z + (Math.random()-0.5)*4 },
      rotation: Math.random() * Math.PI * 2,
      target: null, path: [], isResting: false, restTimer: 5 + Math.random() * 10,
      isConversing: false, isSpeaking: false, dialogueText: null,
      observeTimer: 20 + Math.random() * 20, lastConverse: {}
    }))
  )
  const selectedIdRef = useRef(null)
  const weatherRef = useRef("sunny")
  const setTargetRef = useRef(() => {})
  const onSelectCharRef = useRef(() => {})
  const gameStateRef = useRef({ charactersRef, selectedIdRef, weatherRef, setTargetRef, onSelectCharRef })
  const [charList, setCharList] = useState(
    PRESET_CHARACTERS.map(p => ({ id: p.id, name: p.name, color: p.color }))
  )
  const [selectedId, setSelectedId] = useState(() => {
    const ids = PRESET_CHARACTERS.map(p => p.id)
    return ids[Math.floor(Math.random() * ids.length)]
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showAddChar, setShowAddChar] = useState(false)
  const msgLogRef = useRef(null)
  const [messageStream, setMessageStream] = useState([])
  const [knowledgeCard, setKnowledgeCard] = useState(pickRandom(KNOWLEDGE_CARDS))
  const [knowledgeExpanded, setKnowledgeExpanded] = useState(false)
  const [weatherLabel, setWeatherLabel] = useState("sunny")
  const selectedCharacter = selectedId ? charactersRef.current.find(c => c.id === selectedId) : null

  onSelectCharRef.current = useCallback((id) => setSelectedId(id), [])
  const addMessage = useCallback((speaker, text, type) => {
    setMessageStream(prev => [...prev.slice(-200), {
      id: performance.now() + Math.random(), speaker, text, type,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    }])
  }, [])
  const setWeather = useCallback((w) => { weatherRef.current = w; setWeatherLabel(w) }, [])
  const addCharacter = useCallback((charData) => {
    const id = "c" + Date.now()
    charactersRef.current.push({
      ...charData, id,
      position: { x: (Math.random() - 0.5) * SCENE_SIZE * 1.4, z: (Math.random() - 0.5) * SCENE_SIZE * 1.4 },
      rotation: Math.random() * Math.PI * 2, target: null, path: [],
      isResting: false, restTimer: 5 + Math.random() * 10,
      isConversing: false, isSpeaking: false, dialogueText: null,
      observeTimer: 20 + Math.random() * 20, lastConverse: {}
    })
    setCharList(prev => [...prev, { id, name: charData.name, color: charData.color }])
    addMessage("系统", "新角色 " + charData.name + " 加入了园林", "system")
  }, [addMessage])
  const deleteCharacter = useCallback((id) => {
    if (PRESET_IDS.has(id)) return
    charactersRef.current = charactersRef.current.filter(c => c.id !== id)
    setCharList(prev => prev.filter(c => c.id !== id))
    if (selectedIdRef.current === id) { selectedIdRef.current = null; setSelectedId(null) }
    addMessage("系统", "角色已离开园林", "system")
  }, [addMessage])
  setTargetRef.current = useCallback((charId, x, z) => {
    const c = charactersRef.current.find(c => c.id === charId)
    if (!c) return
    const path = findPath(c.position.x, c.position.z, x, z)
    c.target = path.length > 1 ? path[1] : { x, z }
    c.path = path.slice(2)
    c.isResting = false; c.restTimer = 0
  }, [])

  useEffect(() => {
    if (mapMode === "custom") {
      try {
        const raw = localStorage.getItem("garden-custom-tilemap")
        if (raw) { setSceneData(SCENE_SIZE, JSON.parse(raw)); addMessage("系统", "已加载自定义场景地图", "system") }
      } catch (e) { console.warn("Custom tilemap load failed", e) }
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const chars = charactersRef.current
      const now = Date.now()
      const landmarks = ["飞檐翘角的亭台","曲径通幽的长廊","碧波荡漾的池塘","精雕细琢的月洞门","层叠错落的假山"]
      pushApart(chars, 1.2)
      let activeConverseCount = chars.filter(c => c.isConversing).length
      for (const c of chars) {
        if (c.isConversing) continue
        if (c.isResting) {
          c.restTimer -= 0.5
          if (c.restTimer <= 0) {
            c.isResting = false; c.restTimer = 0
            const poi = pickRandom(POIS)
            const m = 3
            let wx, wz, tries = 0
            const tileData = getTileData()
            do {
              wx = Math.max(-SCENE_SIZE+m, Math.min(SCENE_SIZE-m, poi.x + (Math.random()-0.5)*6))
              wz = Math.max(-SCENE_SIZE+m, Math.min(SCENE_SIZE-m, poi.z + (Math.random()-0.5)*6))
              tries++
            } while (tries < 8 && tileData && tileData[Math.round(wx)+","+Math.round(wz)] === 3)
            const path = findPath(c.position.x, c.position.z, wx, wz)
            if (path.length > 1) { c.path = path.slice(1); c.target = path[1] }
          }
          continue
        }
        if (c.target || c.path.length > 0) continue
        if (!c.isResting) { c.isResting = true; c.restTimer = 6 + Math.random() * 12 }
        c.observeTimer = (c.observeTimer||20)-0.5
        if (c.observeTimer<=0) {
          c.observeTimer = 30+Math.random()*40
          if (apiKey) {
            generateFeeling(c, pickRandom(landmarks), apiKey, apiUrl)
              .then(t=>addMessage(c.name,t,"feeling")).catch(()=>{})
          }
        }
        for (const other of chars) {
          if (other.id===c.id||other.isConversing||c.isConversing) continue
          const d = Math.sqrt((c.position.x-other.position.x)**2+(c.position.z-other.position.z)**2)
          if (d<CONVERSE_DIST && (now-(c.lastConverse[other.id]||0))>CONVERSE_COOLDOWN_MS) {
            c.isConversing=other.isConversing=true; c.isSpeaking=other.isSpeaking=true
            c.target=other.target=null; c.path=other.path=[]
            c.lastConverse[other.id]=other.lastConverse[c.id]=now
            if (apiKey) {
              generateDialogue(c, other, apiKey, apiUrl).then(t=>{
                addMessage(c.name+" & "+other.name, t, "dialogue")
                c.dialogueText=t.substring(0,60); other.dialogueText=t.substring(0,60)
                setTimeout(()=>{
                  c.isConversing=c.isSpeaking=false; c.dialogueText=null
                  other.isConversing=other.isSpeaking=false; other.dialogueText=null
                },6000)
              }).catch(e=>{c.isConversing=other.isConversing=c.isSpeaking=other.isSpeaking=false; addMessage("系统","对话API错误: "+e.message,"system")})
            }
            activeConverseCount++
            if (activeConverseCount >= 2) break
          }
        }
        if (c.path.length>0 && !c.target && !c.isResting) { c.target=c.path[0]; c.path=c.path.slice(1) }
      }
    }
    const iv = setInterval(tick, 350)
    return () => clearInterval(iv)
  }, [addMessage, apiKey, apiUrl])

  useEffect(() => {
    if (msgLogRef.current) msgLogRef.current.scrollTop = msgLogRef.current.scrollHeight
  }, [messageStream])

  const updateKnowledge = useCallback(() => setKnowledgeCard(pickRandom(KNOWLEDGE_CARDS)), [])

  return (
    <>
    {tutorialStep >= 0 && tutorialStep < 6 && (
      <div onClick={() => { const ns = tutorialStep + 1; setTutorialStep(ns); if (ns >= 6) { localStorage.setItem("garden-tutorial-done", "1"); setTutorialStep(-1) } }}
        style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#1a3a5c", borderRadius: 14, padding: "28px 32px", maxWidth: 420, border: "1px solid rgba(255,255,255,0.12)", textAlign: "center", cursor: "default" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{["🏯","👆","💬","👁️","☀️","🎉"][tutorialStep]}</div>
          <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 17 }}>{["欢迎来到苏州园林 AI 沙箱","选择一个角色","观察角色对话","查看角色视角","切换天气与时间","开始探索吧！"][tutorialStep]}</h3>
          <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
            {[
              "左侧3D鸟瞰园林，AI角色在园中漫步。右侧是对话记录和角色视角。",
              "点击左侧角色列表中的角色即可选中。选中后在右下角可以看到ta的视角。",
              "角色会在园林中观察景色并彼此交谈。对话会出现在右侧面板中。",
              "右下角POV窗口显示所选角色的第一人称视角。试试切换不同角色！",
              "点击天气按钮切换晴天/多云/黄昏/夜晚，感受不同氛围。",
              "你已掌握基本操作！点击任意位置关闭教程，开始探索吧。"
            ][tutorialStep]}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {tutorialStep > 0 && (
              <button onClick={() => setTutorialStep(s => s - 1)} style={{ padding: "7px 18px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 13 }}>上一步</button>
            )}
            <button onClick={() => { const ns = tutorialStep + 1; setTutorialStep(ns); if (ns >= 6) { localStorage.setItem("garden-tutorial-done", "1"); setTutorialStep(-1) } }}
              style={{ padding: "7px 22px", borderRadius: 6, border: "none", background: "#4ecdc4", color: "#111", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
              {tutorialStep < 5 ? "下一步" : "开始探索"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: 22, height: 4, borderRadius: 2, background: i === tutorialStep ? "#4ecdc4" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <div onClick={() => { localStorage.setItem("garden-tutorial-done", "1"); setTutorialStep(-1) }}
            style={{ marginTop: 12, color: "#555", fontSize: 11, cursor: "pointer" }}>跳过教程</div>
        </div>
      </div>
    )}
    <div style={{display:"grid",gridTemplateColumns:"30fr 70fr",height:"100vh",gap:4,padding:4,background:"#1a1a2e",fontFamily:"Microsoft YaHei,PingFang SC,sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
        <div style={{flex:1,background:"#16213e",borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",minHeight:0,position:"relative"}}>
          <StableCanvas gameStateRef={gameStateRef} />
        </div>
        <div style={{flex:1,background:"#16213e",borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",minHeight:0}}>
          <StableMinimap gameStateRef={gameStateRef} />
        </div>
        <div onClick={() => setKnowledgeExpanded(e => !e)} style={{background:"rgba(15,52,96,0.7)",borderRadius:6,padding:"4px 8px",fontSize:11,color:"#aaa",borderLeft:"2px solid #e2b04a",flexShrink:0,cursor:"pointer",maxHeight:knowledgeExpanded?120:44,overflow:"hidden",transition:"max-height 0.3s"}}>
          {knowledgeExpanded ? (
            <><b>{knowledgeCard.title}</b><br/>{knowledgeCard.text}</>
          ) : (
            <><b>{knowledgeCard.title}</b> <span onClick={e=>{e.stopPropagation();updateKnowledge()}} style={{cursor:"pointer",fontSize:12}}>🔄</span><br/>{knowledgeCard.text.substring(0,30)}...</>
          )}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
        <div style={{display:"flex",gap:14,alignItems:"center",padding:"5px 10px",background:"rgba(0,0,0,0.25)",borderRadius:8,flexShrink:0}}>
          <button onClick={() => nav("/")}
            style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.04)",color:"#999",cursor:"pointer",fontSize:11}}>
            ← 首页
          </button>
          <div style={{display:"flex",gap:3,alignItems:"center"}}>
            {["sunny","cloudy","dusk","night"].map(w => (
              <button key={w} onClick={() => setWeather(w)}
                style={{
                  padding:"3px 7px",borderRadius:4,border:weatherLabel===w?"1.5px solid rgba(255,255,255,0.3)":"1px solid transparent",
                  background:weatherLabel===w?"rgba(255,255,255,0.1)":"transparent",
                  fontSize:14,cursor:"pointer",lineHeight:1
                }}>
                {{sunny:"☀️",cloudy:"☁️",dusk:"🌅",night:"🌙"}[w]}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddChar(true)}
            style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid rgba(78,205,196,0.7)",background:"rgba(78,205,196,0.08)",color:"#4ecdc4",cursor:"pointer",fontSize:11}}>
            + 新角色
          </button>
          <div style={{flex:1}} />
          <button onClick={()=>setShowSettings(!showSettings)}
            style={{width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(0,0,0,0.5)",color:"#ccc",fontSize:14,cursor:"pointer"}}>
            {"\u2699"}
          </button>
        </div>
        {showSettings && (
          <div style={{background:"rgba(15,20,35,0.95)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:12,flexShrink:0}}>
            <div style={{color:"#aaa",fontSize:10,marginBottom:3}}>API Key (DeepSeek)</div>
            <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:4,border:"1px solid #444",background:"#0a0f1e",color:"#ccc",fontSize:11}}/>
            <div style={{color:"#aaa",fontSize:10,marginTop:8,marginBottom:3}}>API URL</div>
            <input value={apiUrl} onChange={e=>setApiUrl(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:4,border:"1px solid #444",background:"#0a0f1e",color:"#888",fontSize:11}}/>
            <button onClick={()=>setShowSettings(false)} style={{marginTop:8,padding:"5px 14px",borderRadius:4,border:"none",background:"#2a6b5e",color:"#fff",fontSize:11,cursor:"pointer",width:"100%"}}>保存设置</button>
          </div>
        )}
        <div style={{display:"flex",gap:4,padding:"4px 8px",background:"rgba(0,0,0,0.2)",borderRadius:8,flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
          {charList.map(c=>(
            <button key={c.id} onClick={()=>{selectedIdRef.current=c.id;setSelectedId(c.id)}}
              style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",
                background:c.id===selectedId?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",
                color:c.id===selectedId?"#fff":"#aaa",fontSize:11,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:c.color,display:"inline-block"}}/>
              {c.name}
              {!PRESET_IDS.has(c.id)&&c.id===selectedId&&(
                <span onClick={e=>{e.stopPropagation();deleteCharacter(c.id)}} style={{marginLeft:2,color:"#e74c3c",cursor:"pointer",fontSize:14,lineHeight:1}}>×</span>
              )}
            </button>
          ))}
        </div>
        <div style={{flex:1,background:"#0f3460",borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",minHeight:0,display:"flex",flexDirection:"column"}}>
          <div ref={msgLogRef} style={{flex:1,overflowY:"auto",padding:"6px 8px",fontSize:11,lineHeight:1.5}}>
            {messageStream.length===0&&<div style={{color:"#555",textAlign:"center",marginTop:20}}>等待 AI 角色开始观察与对话...</div>}
            {messageStream.slice(-100).map(msg=>(
              <div key={msg.id} style={{marginBottom:4,padding:"5px 7px",background:"rgba(255,255,255,0.03)",borderRadius:4,
                borderLeft:`3px solid ${msg.type==="feeling"?"#e2b04a":msg.type==="dialogue"?"#4ecdc4":"#555"}`}}>
                <div style={{fontWeight:"bold",marginBottom:2,fontSize:10,color:msg.type==="feeling"?"#e2b04a":msg.type==="dialogue"?"#4ecdc4":"#aaa"}}>
                  {msg.speaker} <span style={{fontWeight:"normal",fontSize:9,color:"#555"}}>{msg.time}</span>
                </div>
                <div style={{whiteSpace:"pre-wrap",color:"#ddd"}}>{msg.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,height:"35%",background:"#0f3460",borderRadius:10,position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",minHeight:100}}>
          {selectedCharacter?(
            <>
              <div style={{position:"absolute",top:6,left:6,zIndex:5,background:"rgba(0,0,0,0.7)",color:"#fff",padding:"2px 8px",borderRadius:3,fontSize:10,fontWeight:"bold",borderLeft:"2px solid #4ecdc4"}}>
                {"\ud83d\udc41 "}{selectedCharacter.name} 的视角
              </div>
              <POVRenderer character={selectedCharacter} characters={charactersRef.current}/>
            </>
          ):(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#555",fontSize:12}}>
              选择一个角色查看视角
            </div>
          )}
        </div>
      </div>
      {showAddChar&&(
        <AddCharacterDialog onAdd={addCharacter} onClose={()=>setShowAddChar(false)}
          apiKey={apiKey} apiUrl={apiUrl}/>
      )}
    </div>
    </>
  )
}





