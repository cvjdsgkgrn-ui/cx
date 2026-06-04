import { useState, useCallback, useRef, useEffect, memo } from "react"
import { useSearchParams } from "react-router-dom"
import { Canvas } from "@react-three/fiber"
import { Sky, OrbitControls } from "@react-three/drei"

import GardenScene, { getBuildingObstacles } from "../components/GardenScene"
import { CharacterMesh, CharacterLabel, SpeechBubble3D } from "../components/CharacterSystem"
import { generateFeeling, generateDialogue } from "../utils/ai"
import { findPath, pushApart, setSceneData, getTileData } from "../utils/pathfinding"
import POVRenderer from "../components/POVRenderer"
import AddCharacterDialog from "../components/AddCharacterDialog"
import SafeCanvas from "../components/SafeCanvas"
import { PRESET_CHARACTERS, PRESET_IDS, SCENE_SIZE, POIS, CONVERSE_DIST, CONVERSE_COOLDOWN_MS, KNOWLEDGE_CARDS } from "../store/gameData"

const DEFAULT_API_URL = "https://api.deepseek.com/v1/chat/completions"
// API Key 从 URL 参数 ?key=xxx 读取，或使用 localStorage 中的 key
function getApiKey() {
  const params = new URLSearchParams(window.location.search)
  const urlKey = params.get("key")
  if (urlKey) {
    localStorage.setItem("deepseek_api_key", urlKey)
    window.history.replaceState({}, "", window.location.pathname)
    return urlKey
  }
  return localStorage.getItem("deepseek_api_key") || ""
}

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
    <SafeCanvas>
      <Canvas shadows camera={{ position: [0, 25, 18], fov: 50 }}
        style={{ position: "absolute", inset: 0 }}
        gl={{ preserveDrawingBuffer: false, alpha: false, antialias: true }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[20, 25, 10]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
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
      </Canvas>
    </SafeCanvas>
  )
})

const StableMinimap = memo(function StableMinimap({ gameStateRef }) {
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
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
      ctx.strokeStyle = "rgba(78,205,196,0.25)"; ctx.lineWidth = 1.5
      ctx.strokeRect(ox - SCENE_SIZE * scale, oy - SCENE_SIZE * scale, SCENE_SIZE * 2 * scale, SCENE_SIZE * 2 * scale)
      ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 0.5
      for (let i = -SCENE_SIZE; i <= SCENE_SIZE; i += 4) {
        ctx.beginPath(); ctx.moveTo(ox + i * scale, oy - SCENE_SIZE * scale); ctx.lineTo(ox + i * scale, oy + SCENE_SIZE * scale); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ox - SCENE_SIZE * scale, oy + i * scale); ctx.lineTo(ox + SCENE_SIZE * scale, oy + i * scale); ctx.stroke()
      }
      POIS.forEach(p => {
        ctx.fillStyle = "rgba(226,176,74,0.12)"
        ctx.beginPath(); ctx.arc(ox + p.x * scale, oy + p.z * scale, 3, 0, Math.PI * 2); ctx.fill()
      })
      const state = gameStateRef.current
      if (!state) { rafRef.current = requestAnimationFrame(draw); return }
      selectCallbackRef.current = state.onSelectCharRef.current
      const chars = state.charactersRef.current || []
      const selId = state.selectedIdRef.current
      chars.forEach(c => {
        if (!c.position) return
        const px = ox + c.position.x * scale, py = oy + c.position.z * scale
        ctx.fillStyle = c.color || "#fff"
        ctx.beginPath(); ctx.arc(px, py, selId === c.id ? 7 : 4.5, 0, Math.PI * 2); ctx.fill()
        if (selId === c.id) { ctx.strokeStyle = "#4ecdc4"; ctx.lineWidth = 2; ctx.stroke() }
      })
      rafRef.current = requestAnimationFrame(draw)
    }

    window.addEventListener("resize", () => { sizeRef.current = { w: 0, h: 0 } })
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
  const [searchParams] = useSearchParams()
  const mapMode = searchParams.get("map") || "preset"
  const apiKey = getApiKey()

  const charactersRef = useRef(
    PRESET_CHARACTERS.map((p, i) => ({
      ...p, id: p.id,
      position: { x: -8 + i * 6 + Math.random() * 3, z: -5 + i * 4 + Math.random() * 3 },
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

  const gameStateRef = useRef({
    charactersRef, selectedIdRef, weatherRef, setTargetRef, onSelectCharRef
  })

  const [charList, setCharList] = useState(
    PRESET_CHARACTERS.map(p => ({ id: p.id, name: p.name, color: p.color }))
  )
  const [selectedId, setSelectedId] = useState(() => {
    const ids = PRESET_CHARACTERS.map(p => p.id)
    return ids[Math.floor(Math.random() * ids.length)]
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showAddChar, setShowAddChar] = useState(false); const [showKnowledge, setShowKnowledge] = useState(false)
  const [messageStream, setMessageStream] = useState([])
  const [knowledgeCard, setKnowledgeCard] = useState(pickRandom(KNOWLEDGE_CARDS))
  const [weatherLabel, setWeatherLabel] = useState("sunny")

  const selectedCharacter = selectedId ? charactersRef.current.find(c => c.id === selectedId) : null

  onSelectCharRef.current = useCallback((id) => setSelectedId(id), [])

  const addMessage = useCallback((speaker, text, type) => {
    setMessageStream(prev => [...prev.slice(-80), {
      id: Date.now(), speaker, text, type,
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
    addMessage("系统", "新角色 " + charData.name + " 加入了故居宅院", "system")
  }, [addMessage])

  const deleteCharacter = useCallback((id) => {
    if (PRESET_IDS.has(id)) return
    charactersRef.current = charactersRef.current.filter(c => c.id !== id)
    setCharList(prev => prev.filter(c => c.id !== id))
    if (selectedIdRef.current === id) { selectedIdRef.current = null; setSelectedId(null) }
    addMessage("系统", "角色已离开故居", "system")
  }, [addMessage])

  setTargetRef.current = useCallback((charId, x, z) => {
    const c = charactersRef.current.find(c => c.id === charId)
    if (!c) return
    const path = findPath(c.position.x, c.position.z, x, z)
    c.target = path.length > 1 ? path[1] : { x, z }
    c.path = path.slice(2)
    c.isResting = false; c.restTimer = 0
  }, [])

  // Load custom tilemap
  useEffect(() => {
    if (mapMode === "custom") {
      try {
        const raw = localStorage.getItem("heritage-custom-tilemap")
        if (raw) {
          const tileData = JSON.parse(raw)
          setSceneData(SCENE_SIZE, tileData, getBuildingObstacles())
          addMessage("系统", "已加载自定义场景地图", "system")
        }
      } catch (e) { console.warn("Custom tilemap load failed", e) }
    } else {
      // Register default building obstacles for pathfinding
      setSceneData(SCENE_SIZE, null, getBuildingObstacles())
    }
  }, [])

  // AI game loop
  useEffect(() => {
    const tick = () => {
      const chars = charactersRef.current
      const now = Date.now()
      const landmarks = ["飞檐翘角的亭台","曲径通幽的长廊","碧波荡漾的池塘","精雕细琢的月洞门","层叠错落的假山"]
      pushApart(chars)

      for (const c of chars) {
        if (c.isConversing) continue
        if (c.restTimer > 0 && !c.target) { c.restTimer -= 0.5; c.isResting = true }
        else {
          c.isResting = false
          if (!c.target && !c.path.length) {
            const poi = pickRandom(POIS)
            const m = 4
            const wx = Math.max(-SCENE_SIZE+m, Math.min(SCENE_SIZE-m, poi.x+(Math.random()-0.5)*8))
            const wz = Math.max(-SCENE_SIZE+m, Math.min(SCENE_SIZE-m, poi.z+(Math.random()-0.5)*8))
            const path = findPath(c.position.x, c.position.z, wx, wz)
            c.target = path.length>1 ? path[1] : {x:wx,z:wz}
            c.path = path.slice(2)
            c.restTimer = 15 + Math.random()*25
          }
        }

        c.observeTimer = (c.observeTimer||20)-0.5
        if (c.observeTimer<=0) {
          c.observeTimer = 30+Math.random()*40
          generateFeeling(c, pickRandom(landmarks), apiKey, DEFAULT_API_URL)
            .then(t=>addMessage(c.name,t,"feeling")).catch(()=>{})
        }

        for (const other of chars) {
          if (other.id===c.id||other.isConversing||c.isConversing) continue
          const d = Math.sqrt((c.position.x-other.position.x)**2+(c.position.z-other.position.z)**2)
          if (d<CONVERSE_DIST && (now-(c.lastConverse[other.id]||0))>CONVERSE_COOLDOWN_MS) {
            c.isConversing=other.isConversing=true; c.isSpeaking=other.isSpeaking=true
            c.target=other.target=null; c.path=other.path=[]
            c.lastConverse[other.id]=other.lastConverse[c.id]=now
            generateDialogue(c, other, apiKey, DEFAULT_API_URL).then(t=>{
              addMessage(c.name+" & "+other.name, t, "dialogue")
              c.dialogueText=t.substring(0,60); other.dialogueText=t.substring(0,60)
              setTimeout(()=>{
                c.isConversing=c.isSpeaking=false; c.dialogueText=null
                other.isConversing=other.isSpeaking=false; other.dialogueText=null
              },6000)
            }).catch(e=>{c.isConversing=other.isConversing=c.isSpeaking=other.isSpeaking=false; addMessage('系统','对话API错误: '+e.message,'system')})
            break
          }
        }

        if (c.path.length>0 && !c.target && !c.isResting) { c.target=c.path[0]; c.path=c.path.slice(1) }
      }
    }
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [addMessage])

  const updateKnowledge = useCallback(() => setKnowledgeCard(pickRandom(KNOWLEDGE_CARDS)), [])

  return (
    <div style={{display:"grid",gridTemplateColumns:"30fr 70fr",height:"100vh",gap:4,padding:4,background:"#1a1a2e",fontFamily:"Microsoft YaHei,PingFang SC,sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
        <div style={{flex:1,background:"#16213e",borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",minHeight:0,position:"relative"}}>
          <StableCanvas gameStateRef={gameStateRef} />
        </div>
        <div style={{flex:1,background:"#16213e",borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",minHeight:0}}>
          <StableMinimap gameStateRef={gameStateRef} />
        </div>
        <div style={{background:"rgba(15,52,96,0.7)",borderRadius:6,padding:"4px 8px",fontSize:11,color:"#aaa",borderLeft:"2px solid #e2b04a",flexShrink:0,maxHeight: showKnowledge ? "none" : 44,overflow:"hidden",transition:"all .3s"}}>
          <b onClick={(e) => { e.stopPropagation(); updateKnowledge() }} style={{cursor:"pointer"}}>{knowledgeCard.title}</b>: {showKnowledge ? knowledgeCard.text : knowledgeCard.text.substring(0,50) + "..."} <span onClick={() => setShowKnowledge(k => !k)} style={{color:"#e2b04a",fontSize:10,marginLeft:4,cursor:"pointer"}}>{showKnowledge ? "▲收起" : "▼展开"}</span>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",background:"rgba(0,0,0,0.2)",borderRadius:8,flexShrink:0}}>
          {["sunny","cloudy","dusk","night"].map(w=>(
            <button key={w} onClick={()=>setWeather(w)}
              style={{width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:14,
                border:weatherLabel===w?"2px solid #4ecdc4":"1px solid rgba(255,255,255,0.1)",
                background:weatherLabel===w?"rgba(78,205,196,0.2)":"rgba(255,255,255,0.03)",color:"#ccc",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              {w==="sunny"?"\u2600":w==="cloudy"?"\u2601":w==="dusk"?"\ud83c\udf05":"\ud83c\udf19"}
            </button>
          ))}
          <span style={{fontSize:10,color:"#888",marginRight:12}}>
            {weatherLabel==="sunny"?"晴天":weatherLabel==="cloudy"?"多云":weatherLabel==="dusk"?"黄昏":"夜晚"}
          </span>
          <div style={{flex:1}}/>
          <button onClick={()=>setShowAddChar(true)}
            style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #4ecdc4",background:"rgba(78,205,196,0.06)",color:"#4ecdc4",cursor:"pointer",fontSize:11,fontWeight:"bold"}}>
            + 添加角色
          </button>
          <button onClick={()=>setShowSettings(!showSettings)}
            style={{width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(0,0,0,0.5)",color:"#ccc",fontSize:14,cursor:"pointer"}}>
            {"\u2699"}
          </button>
        </div>

        {showSettings && (
          <div style={{background:"rgba(15,20,35,0.95)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:12,flexShrink:0}}>
            <div style={{color:"#aaa",fontSize:10,marginBottom:3}}>API Key (DeepSeek)</div>
            <input type="password" defaultValue={apiKey} readOnly style={{width:"100%",padding:"6px 8px",borderRadius:4,border:"1px solid #444",background:"#0a0f1e",color:"#888",fontSize:11}}/>
            <div style={{color:"#aaa",fontSize:10,marginTop:8,marginBottom:3}}>API URL</div>
            <input defaultValue={DEFAULT_API_URL} readOnly style={{width:"100%",padding:"6px 8px",borderRadius:4,border:"1px solid #444",background:"#0a0f1e",color:"#888",fontSize:11}}/>
            <div style={{color:"#888",fontSize:10,marginTop:6}}>在设置中输入 DeepSeek API Key</div>
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
          <div style={{flex:1,overflowY:"auto",padding:"6px 8px",fontSize:11,lineHeight:1.5}}>
            {messageStream.length===0&&<div style={{color:"#555",textAlign:"center",marginTop:20}}>等待 AI 角色开始观察与对话...</div>}
            {messageStream.slice(-50).map(msg=>(
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
          apiKey={apiKey} apiUrl={DEFAULT_API_URL}/>
      )}
    </div>
  )
}














