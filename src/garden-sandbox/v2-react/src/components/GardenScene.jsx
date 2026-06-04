// ═══ GardenScene.jsx — v2.5 纯代码精绘苏州园林场景 ═══
import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useGLTF } from "@react-three/drei"
import { SCENE_SIZE } from "../store/gameData"

// ═══ 纹理工厂 (Canvas绘制，不依赖外部文件) ═══

let _texCache = {}

function tex(key, drawFn) {
  if (_texCache[key]) return _texCache[key]
  const size = 256
  const c = document.createElement("canvas")
  c.width = c.height = size
  drawFn(c.getContext("2d"), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  _texCache[key] = t
  return t
}

// 瓦片纹理 — 深灰弧线模拟层叠瓦片
function roofTex() {
  return tex("roof", (ctx, s) => {
    ctx.fillStyle = "#3a3430"; ctx.fillRect(0, 0, s, s)
    const h = 22
    for (let y = 0; y < s; y += h) {
      const off = (Math.floor(y / h) % 2) * (s / 14)
      for (let x = -s/8 + off; x < s + s/8; x += s/7) {
        const g = 20 + Math.floor((y % h) / h * 10)
        ctx.fillStyle = `rgb(${45+g},${40+g},${35+g})`
        ctx.beginPath()
        ctx.arc(x, y + h * 0.55, s / 14, 0, Math.PI)
        ctx.fill()
      }
    }
    // subtle moss patches
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(80,100,60,${0.03 + Math.random()*0.06})`
      ctx.beginPath()
      ctx.arc(Math.random()*s, Math.random()*s, 4+Math.random()*12, 0, Math.PI*2)
      ctx.fill()
    }
  })}

// 木纹
function woodTex() {
  return tex("wood", (ctx, s) => {
    ctx.fillStyle = "#7a4a2a"; ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 60; i++) {
      const y = (i/60)*s
      ctx.strokeStyle = `rgba(0,0,0,${0.03+Math.random()*0.05})`
      ctx.lineWidth = 1 + Math.random()*2
      ctx.beginPath(); ctx.moveTo(0, y)
      for (let x=0; x<s; x+=6) ctx.lineTo(x, y + Math.sin(x*0.03+i)*2.5)
      ctx.stroke()
    }
  })}

// 石材
function stoneTex() {
  return tex("stone", (ctx, s) => {
    ctx.fillStyle = "#c8c0b8"; ctx.fillRect(0, 0, s, s)
    for (let i=0; i<100; i++) {
      const x = Math.random()*s, y = Math.random()*s
      ctx.fillStyle = `rgba(${180+Math.random()*50},${170+Math.random()*40},${160+Math.random()*30},0.12)`
      ctx.beginPath(); ctx.arc(x, y, 3+Math.random()*7, 0, Math.PI*2); ctx.fill()
    }
  })}

// 树叶纹理
function leafTex(hue) {
  const key = "leaf_" + Math.round(hue/10)*10
  return tex(key, (ctx, s) => {
    ctx.fillStyle = `hsl(${hue}, 50%, 30%)`; ctx.fillRect(0, 0, s, s)
    for (let i=0; i<40; i++) {
      ctx.fillStyle = `hsla(${hue+Math.random()*20-10}, 40%, ${25+Math.random()*15}%, 0.3)`
      ctx.beginPath(); ctx.arc(Math.random()*s, Math.random()*s, 8+Math.random()*20, 0, Math.PI*2); ctx.fill()
    }
  })}

// Tile types: 1=road, 2=wall, 3=water, 4=pavilion, 5=moongate, 6=tree, 7=rock
const TILE_COLORS = { 1: "#777", 2: "#e8d5b7", 3: "#5588aa", 4: "#c4a882", 5: "#e8d5b7" }

let _getTileData = null
export function setTileDataProvider(fn) { _getTileData = fn }
function getTileData() { return _getTileData ? _getTileData() : null }

// ═══ 亭子 — 八角重檐，瓦顶木柱石台 ═══
function Pavilion({ position }) {
  const rTex = useMemo(() => roofTex(), [])
  const wTex = useMemo(() => woodTex(), [])
  const sTex = useMemo(() => stoneTex(), [])

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 台基 */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.3, 8]} />
        <meshStandardMaterial map={sTex} roughness={0.6} />
      </mesh>
      {/* 台基压边 */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <torusGeometry args={[1.85, 0.06, 8, 8]} />
        <meshStandardMaterial color="#a09888" roughness={0.5} />
      </mesh>

      {/* 8根木柱 */}
      {Array.from({length: 8}).map((_, i) => {
        const a = (i/8)*Math.PI*2 + Math.PI/8
        const r = 1.35
        return (
          <group key={i}>
            <mesh position={[Math.cos(a)*r, 1.0, Math.sin(a)*r]} castShadow>
              <cylinderGeometry args={[0.09, 0.11, 2.0, 8]} />
              <meshStandardMaterial map={wTex} roughness={0.4} />
            </mesh>
            {/* 柱础 */}
            <mesh position={[Math.cos(a)*r, 0.22, Math.sin(a)*r]}>
              <cylinderGeometry args={[0.16, 0.18, 0.15, 8]} />
              <meshStandardMaterial map={sTex} roughness={0.6} />
            </mesh>
            {/* 斗栱简化 */}
            <mesh position={[Math.cos(a)*r, 2.1, Math.sin(a)*r]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.3, 0.08, 0.3]} />
              <meshStandardMaterial map={wTex} roughness={0.4} />
            </mesh>
          </group>
        )
      })}

      {/* 额枋 (环形梁) */}
      <mesh position={[0, 2.15, 0]} rotation={[-Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[1.4, 0.07, 8, 8]} />
        <meshStandardMaterial map={wTex} roughness={0.4} />
      </mesh>

      {/* 下层屋檐 (宽飞檐) */}
      <mesh position={[0, 2.25, 0]} castShadow>
        <coneGeometry args={[2.8, 0.35, 8]} />
        <meshStandardMaterial map={rTex} roughness={0.5} />
      </mesh>

      {/* 上层屋顶 (主体) */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <coneGeometry args={[2.2, 1.1, 8]} />
        <meshStandardMaterial map={rTex} roughness={0.5} />
      </mesh>

      

      {/* 宝顶 */}
      <mesh position={[0, 3.35, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#e2b04a" emissive="#e2b04a" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>

      {/* 栏杆 */}
      {Array.from({length: 24}).map((_, i) => {
        const a = (i/24)*Math.PI*2
        const r = 1.65
        const y0 = 0.32
        return (
          <mesh key={"rl"+i} position={[Math.cos(a)*r, y0+0.3, Math.sin(a)*r]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.55, 4]} />
            <meshStandardMaterial map={wTex} roughness={0.5} />
          </mesh>
        )
      })}
      {/* 栏杆扶手环 */}
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.65, 0.04, 8, 24]} />
        <meshStandardMaterial map={wTex} roughness={0.5} />
      </mesh>
    </group>
  )
}

// ═══ 月洞门 — 粉墙+圆洞门 ═══
function MoonGate({ position }) {
  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 墙体 */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[3.2, 4.0, 0.25]} />
        <meshStandardMaterial color="#f5efe0" roughness={0.5} />
      </mesh>
      {/* 门洞圆环 */}
      <mesh position={[0, 1.5, 0.14]} castShadow>
        <torusGeometry args={[1.0, 0.1, 16, 32]} />
        <meshStandardMaterial color="#c4a882" roughness={0.35} />
      </mesh>
      {/* 门顶横枋 */}
      <mesh position={[0, 4.05, 0]} castShadow>
        <boxGeometry args={[3.3, 0.12, 0.35]} />
        <meshStandardMaterial color="#8B4513" roughness={0.5} />
      </mesh>
      {/* 两侧抱框 */}
      {[-1, 1].map(side => (
        <mesh key={"mf"+side} position={[side*1.55, 2.0, 0]} castShadow>
          <boxGeometry args={[0.2, 4.0, 0.3]} />
          <meshStandardMaterial color="#8B4513" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ═══ 树 — 树干+层叠锥形树冠+纹理 ═══
function SimpleTree({ x, z, scale, hue, rot }) {
  const lTex = useMemo(() => leafTex(hue), [hue])
  const s = scale || 0.7
  return (
    <group position={[x, 0, z]} scale={[s,s,s]} rotation={[0, rot||0, 0]}>
      {/* 树干 */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.11, 1.0, 6]} />
        <meshStandardMaterial color="#6b4c3b" roughness={0.85} />
      </mesh>
      {/* 三层树冠 (从大到小) */}
      {[0.65, 0.55, 0.4].map((r, i) => (
        <mesh key={i} position={[0, 1.0 + i*0.55, 0]} castShadow>
          <coneGeometry args={[r, 0.7, 8]} />
          <meshStandardMaterial map={lTex} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// ═══ 石头 ═══
function SimpleRock({ x, z, scale, tone }) {
  return (
    <mesh position={[x, 0.08, z]} rotation={[0.15, (x*7+z*3)%Math.PI*2, 0.1]} castShadow>
      <dodecahedronGeometry args={[scale||0.3, 0]} />
      <meshStandardMaterial color={`hsl(0,0%,${tone||50}%)`} roughness={0.8} flatShading />
    </mesh>
  )
}

// ═══ Default Scene ═══
function DefaultScene() {
  const treeData = useRef(null)
  const rockData = useRef(null)
  if (!treeData.current) {
    treeData.current = Array.from({length: 35}, () => ({
      x: (Math.random()-0.5)*SCENE_SIZE*1.8,
      z: (Math.random()-0.5)*SCENE_SIZE*1.8,
      s: 0.4+Math.random()*0.7,
      hue: 80+Math.random()*50,
      rot: Math.random()*Math.PI*2
    }))
  }
  if (!rockData.current) {
    rockData.current = Array.from({length: 20}, () => ({
      x: (Math.random()-0.5)*SCENE_SIZE*1.6,
      z: (Math.random()-0.5)*SCENE_SIZE*1.6,
      s: 0.15+Math.random()*0.4,
      tone: 35+Math.random()*30
    }))
  }

  return (
    <group>
      {/* 十字石板路 */}
      {Array.from({length: 36}).map((_,i) => {
        const x = -10.5 + i*0.6
        if (Math.abs(x) < 2.2) return null
        return (
          <mesh key={"h"+i} position={[x, 0.01, 0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
            <planeGeometry args={[0.45, 0.45]} />
            <meshStandardMaterial color="#b0a090" roughness={0.85} />
          </mesh>
        )
      })}
      {/* 曲径 */}
      {Array.from({length: 45}).map((_,i) => {
        const t = i/45
        const x = -5 + t*12
        const z = -3 + Math.sin(t*Math.PI)*6
        return (
          <mesh key={"c"+i} position={[x, 0.01, z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
            <planeGeometry args={[0.3, 0.5]} />
            <meshStandardMaterial color="#b0a090" roughness={0.85} />
          </mesh>
        )
      })}

      {/* 池塘 */}
      <mesh position={[5, 0.03, -4]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <circleGeometry args={[4.2, 32]} />
        <meshStandardMaterial color="#5588aa" roughness={0.2} metalness={0.5} transparent opacity={0.78} />
      </mesh>
      {/* 池边石 */}
      {Array.from({length: 20}).map((_,i) => {
        const a = (i/20)*Math.PI*2
        return (
          <mesh key={"pr"+i} position={[5+Math.cos(a)*4, 0.12, -4+Math.sin(a)*4]} castShadow>
            <icosahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#888" roughness={0.8} flatShading />
          </mesh>
        )
      })}

      {/* 亭子 */}
      <Pavilion position={[-8, 0, -6]} />
      {/* 月洞门 */}
      <MoonGate position={[8, 0, -3]} />

      {/* 树 */}
      {treeData.current.map((t,i) => <SimpleTree key={"t"+i} {...t} />)}
      {/* 石头 */}
      {rockData.current.map((r,i) => <SimpleRock key={"r"+i} {...r} />)}

      {/* 围墙 */}
      <GardenWalls />
    </group>
  )
}

// ═══ Dynamic Scene (custom tilemap) ═══
function DynamicScene({ tileData }) {
  if (!tileData) return <DefaultScene />

  const seedRef = useRef({})
  const seed = seedRef.current

  const roadTiles=[]; const wallTiles=[]; const waterTiles=[]
  const treePositions=[]; const rockPositions=[]
  const pavClusters=[]; const gateClusters=[]
  const visited = new Set()

  // 第一遍：提取树木和石头
  for (const key in tileData) {
    const type = tileData[key]
    const [x,z] = key.split(",").map(Number)
    if (type === 6 && !seed[key]) { seed[key] = Math.random() }
    if (type === 6) treePositions.push({x,z,s:0.4+seed[key]*0.7,hue:80+seed[key]*50,rot:seed[key]*Math.PI*2})
    if (type === 7 && !seed[key]) { seed[key] = Math.random() }
    if (type === 7) rockPositions.push({x,z,s:0.15+seed[key]*0.4,tone:35+seed[key]*30})
  }

  // 第二遍：道路/墙壁/水域/建筑集群
  for (const key in tileData) {
    const [x,z] = key.split(",").map(Number)
    const type = tileData[key]
    if (type === 1) roadTiles.push({x,z})
    else if (type === 2) wallTiles.push({x,z})
    else if (type === 3) waterTiles.push({x,z})
    else if (type === 4 && !visited.has(key)) {
      const cluster=[]; const stack=[key]; visited.add(key)
      while (stack.length) {
        const k=stack.pop(); cluster.push(k.split(",").map(Number))
        const [cx,cz]=k.split(",").map(Number)
        for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nk=(cx+dx)+","+(cz+dz)
          if (tileData[nk]===4&&!visited.has(nk)){visited.add(nk);stack.push(nk)}
        }
      }
      pavClusters.push({x:Math.round(cluster.reduce((s,p)=>s+p[0],0)/cluster.length),z:Math.round(cluster.reduce((s,p)=>s+p[1],0)/cluster.length)})
    }
    else if (type === 5 && !visited.has(key)) {
      const cluster=[]; const stack=[key]; visited.add(key)
      while (stack.length) {
        const k=stack.pop(); cluster.push(k.split(",").map(Number))
        const [cx,cz]=k.split(",").map(Number)
        for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nk=(cx+dx)+","+(cz+dz)
          if (tileData[nk]===5&&!visited.has(nk)){visited.add(nk);stack.push(nk)}
        }
      }
      gateClusters.push({x:Math.round(cluster.reduce((s,p)=>s+p[0],0)/cluster.length),z:Math.round(cluster.reduce((s,p)=>s+p[1],0)/cluster.length)})
    }
  }

  return (
    <group>
      {roadTiles.map((t,i)=>(
        <mesh key={"rd"+i} position={[t.x,0.01,t.z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[0.9,0.9]} />
          <meshStandardMaterial color="#b0a090" roughness={0.85} />
        </mesh>
      ))}
      {waterTiles.map((t,i)=>(
        <mesh key={"wt"+i} position={[t.x,0.03,t.z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[0.9,0.9]} />
          <meshStandardMaterial color="#5588aa" roughness={0.2} metalness={0.5} transparent opacity={0.78} />
        </mesh>
      ))}
      {wallTiles.map((t,i)=>(
        <mesh key={"wl"+i} position={[t.x,1,t.z]} castShadow>
          <boxGeometry args={[0.9,2,0.9]} />
          <meshStandardMaterial color="#f5efe0" roughness={0.5} />
        </mesh>
      ))}
      {pavClusters.map((p,i)=><Pavilion key={"pav"+i} position={[p.x,0,p.z]}/>)}
      {gateClusters.map((g,i)=><MoonGate key={"gate"+i} position={[g.x,0,g.z]}/>)}
      {treePositions.map((t,i)=><SimpleTree key={"tt"+i} {...t}/>)}
      {rockPositions.map((r,i)=><SimpleRock key={"rr"+i} {...r}/>)}
    </group>
  )
}

// ═══ 围墙 ═══
function GardenWalls() {
  const walls = useRef(null)
  if (!walls.current) {
    const items = []
    const half = SCENE_SIZE-1; const s = 0.5
    for (let side=0;side<4;side++) {
      const ns = side%2===0; const sign = side<2?-1:1
      const g0 = (s-0.3)*half*0.4; const g1 = g0+3+s*2
      for (let p=-half;p<=half;p+=1) {
        if (p>=g0-0.5&&p<=g1+0.5) continue
        items.push(ns?{x:p,z:sign*half}:{x:sign*half,z:p})
      }
    }
    walls.current = items
  }
  return (
    <group>
      {walls.current.map((w,i)=>(
        <mesh key={i} position={[w.x,1,w.z]} castShadow receiveShadow>
          <boxGeometry args={[0.8,2,0.8]} />
          <meshStandardMaterial color="#f5efe0" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ═══ 导出 ═══
export default function GardenScene({ weather, tileData }) {
  const hasCustom = tileData && Object.keys(tileData).length > 0
  return (
    <group>
      {/* 草地 */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-0.01,0]}>
        <planeGeometry args={[SCENE_SIZE*3,SCENE_SIZE*3]} />
        <meshStandardMaterial color={weather==="night"?"#2a3a1a":weather==="dusk"?"#3a4a2a":weather==="cloudy"?"#4a5a3a":"#4a6741"} roughness={0.85} />
      </mesh>
      {/* 薄雾 */}
      <fog attach="fog" args={[weather==="night"?"#1a1a3e":weather==="dusk"?"#e8945a":weather==="cloudy"?"#b0b8c0":"#d4cfc4", weather==="night"?12:weather==="dusk"?18:22, weather==="night"?40:weather==="dusk"?55:65]} />
      {hasCustom ? <DynamicScene tileData={tileData}/> : <DefaultScene/>}
    </group>
  )
}
