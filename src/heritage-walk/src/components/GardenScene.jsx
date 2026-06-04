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

// Yangzhou residence components

function RoofTile({ width = 6, depth = 8, position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, -depth/4]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.18, depth/2 + 0.3]} />
        <meshStandardMaterial color="#5a5040" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, depth/4]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.18, depth/2 + 0.3]} />
        <meshStandardMaterial color="#5a5040" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[width + 0.6, 0.15, 0.18]} />
        <meshStandardMaterial color="#3a3028" roughness={0.7} />
      </mesh>
    </group>
  )
}
function Desk({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.8, 0.06, 0.8]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.5} />
      </mesh>
      {[[-0.7, 0.22, -0.28], [0.7, 0.22, -0.28], [-0.7, 0.22, 0.28], [0.7, 0.22, 0.28]].map((p, i) => (
        <mesh key={"dl"+i} position={p} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.44, 6]} />
          <meshStandardMaterial color="#5a3020" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Table({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.8, 0.06, 1.0]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.5} />
      </mesh>
      {[[-0.7, 0.25, -0.35], [0.7, 0.25, -0.35], [-0.7, 0.25, 0.35], [0.7, 0.25, 0.35]].map((p, i) => (
        <mesh key={"tl"+i} position={p} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.5, 6]} />
          <meshStandardMaterial color="#5a3020" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Bookshelf({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.0, 2.4, 0.8]} />
        <meshStandardMaterial color="#5a3020" roughness={0.6} />
      </mesh>
      {[0.4, 1.2, 2.0].map((h, i) => (
        <mesh key={"sh"+i} position={[0, h, 0]} castShadow>
          <boxGeometry args={[1.8, 0.04, 0.76]} />
          <meshStandardMaterial color="#4a2518" roughness={0.5} />
        </mesh>
      ))}
      {[{x:-0.7,y:0.8,c:"#e74c3c"},{x:0,y:1.0,c:"#3498db"},{x:0.7,y:0.6,c:"#2ecc71"},{x:-0.3,y:1.6,c:"#f39c12"},{x:0.5,y:1.4,c:"#9b59b6"},{x:-0.5,y:2.1,c:"#1abc9c"}].map((b, i) => (
        <mesh key={"bk"+i} position={[b.x*0.7, b.y, 0.25]} castShadow>
          <boxGeometry args={[0.12, 0.28, 0.15]} />
          <meshStandardMaterial color={b.c} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function MainHall({ position, rotation = 0 }) {
  const w = 8, d = 6, h = 4
  const b = "#8b8070"
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0,0.02,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[w-0.4,d-0.4]} />
        <meshStandardMaterial color="#5a4030" roughness={0.7} />
      </mesh>
      <mesh position={[0,h/2,-d/2+0.15]} castShadow receiveShadow>
        <boxGeometry args={[w,h,0.3]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[-w/2+0.15,h/2,0]} castShadow>
        <boxGeometry args={[0.3,h,d]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[w/2-0.15,h/2,0]} castShadow>
        <boxGeometry args={[0.3,h,d]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[-2.5,h/2,d/2-0.15]} castShadow>
        <boxGeometry args={[w/2-1.2,h,0.3]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[2.5,h/2,d/2-0.15]} castShadow>
        <boxGeometry args={[w/2-1.2,h,0.3]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <RoofTile width={w+0.8} depth={d+0.8} position={[0,h+0.1,0]} />
      <Table position={[0,0,-d/4]} />
      <mesh position={[0, h*0.35, d/2-0.16]} castShadow>
        <boxGeometry args={[2.0, h*0.7, 0.1]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.6} />
      </mesh>
      <Bookshelf position={[w/2-1.5,0,d/5]} rotation={0.2} />
      <mesh position={[0,h-0.8,d/2-0.18]} rotation={[0.1,0,0]}>
        <boxGeometry args={[3.0,0.6,0.06]} />
        <meshStandardMaterial color="#3a2010" roughness={0.4} />
      </mesh>
      <pointLight position={[w/4,h-0.8,-d/4]} intensity={15} distance={6} color="#f5c070" decay={1.8} />
      <pointLight position={[-w/4,h-0.8,-d/4]} intensity={15} distance={6} color="#f5c070" decay={1.8} />
      {[[w/4,h-1.1,-d/4],[-w/4,h-1.1,-d/4]].map((lp,i)=>(
        <group key={"lp"+i} position={lp}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15,0.2,0.5,8]} />
            <meshStandardMaterial color="#e8b830" roughness={0.3} emissive="#e8b830" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0,0.35,0]} castShadow>
            <cylinderGeometry args={[0.08,0.1,0.6,6]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.7} emissive="#110a00" emissiveIntensity={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function SideRoom({ width = 4.5, depth = 3.5, height = 3, hasDesk = false, hasBed = false, position, rotation = 0 }) {
  const w = width, d = depth, h = height
  const b = "#8b8070"
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0,0.01,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[w-0.4,d-0.4]} />
        <meshStandardMaterial color="#5a4030" roughness={0.7} />
      </mesh>
      <mesh position={[0,h/2,-d/2+0.12]} castShadow receiveShadow>
        <boxGeometry args={[w,h,0.25]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[-w/2+0.12,h/2,0]} castShadow>
        <boxGeometry args={[0.25,h,d]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[w/2-0.12,h/2,0]} castShadow>
        <boxGeometry args={[0.25,h,d]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[-w/4,h/2,d/2-0.12]} castShadow>
        <boxGeometry args={[w/2,h,0.25]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <mesh position={[w/4,h/2,d/2-0.12]} castShadow>
        <boxGeometry args={[w/2,h,0.25]} />
        <meshStandardMaterial color={b} roughness={0.9} />
      </mesh>
      <RoofTile width={w+0.5} depth={d+0.5} position={[0,h+0.08,0]} />
      <mesh position={[0,h*0.55,-d/2+0.15]}>
        <boxGeometry args={[1.0,0.8,0.04]} />
        <meshStandardMaterial color="#2a2a1a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, h*0.35, d/2-0.13]} castShadow>
        <boxGeometry args={[1.2, h*0.7, 0.08]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.6} />
      </mesh>
      {hasDesk && <Desk position={[-w/4,0,-d/4]} rotation={0.1} />}
      {hasBed && (
        <group position={[w/4,0,d/4]}>
          <mesh position={[0,0.2,0]} castShadow>
            <boxGeometry args={[1.8,0.15,2.2]} />
            <meshStandardMaterial color="#8b6b4a" roughness={0.6} />
          </mesh>
          <mesh position={[0,0.5,0]}>
            <boxGeometry args={[1.7,0.08,2.1]} />
            <meshStandardMaterial color="#e8dcc8" roughness={0.4} />
          </mesh>
        </group>
      )}
      <pointLight position={[0,h-0.5,0]} intensity={10} distance={4} color="#f5c070" decay={1.8} />
    </group>
  )
}

function Courtyard({ size = 5, position }) {
  return (
    <group position={position}>
      <mesh position={[0,0.005,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[size,size]} />
        <meshStandardMaterial color="#b0a898" roughness={0.7} />
      </mesh>
    </group>
  )
}

function Well({ position }) {
  return (
    <group position={position}>
      <mesh position={[0,0.4,0]} castShadow>
        <cylinderGeometry args={[0.5,0.55,0.8,16]} />
        <meshStandardMaterial color="#998870" roughness={0.8} />
      </mesh>
      <mesh position={[0,0.85,0]} castShadow>
        <torusGeometry args={[0.5,0.06,8,16]} />
        <meshStandardMaterial color="#776655" roughness={0.75} />
      </mesh>
    </group>
  )
}



function CourtyardWall({ position, rotation = 0, gap = false }) {
  if (gap) return null
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.2, 0.15]} />
        <meshStandardMaterial color="#c8b898" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, -0.08]} castShadow>
        <boxGeometry args={[0.55, 0.08, 0.03]} />
        <meshStandardMaterial color="#5a5040" roughness={0.7} />
      </mesh>
    </group>
  )
}

function StoneBench({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.35]} />
        <meshStandardMaterial color="#a09080" roughness={0.6} />
      </mesh>
      {[[-0.6, 0.12, 0], [0.6, 0.12, 0]].map((p, i) => (
        <mesh key={"sbl"+i} position={p} castShadow>
          <boxGeometry args={[0.2, 0.22, 0.35]} />
          <meshStandardMaterial color="#908070" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function FlowerPot({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.2, 0.5, 8]} />
        <meshStandardMaterial color="#8b6b4a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.25, 6, 4]} />
        <meshStandardMaterial color="#4a8a3a" roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.65, 0.05]}>
        <sphereGeometry args={[0.12, 5, 3]} />
        <meshStandardMaterial color="#3d7a2d" roughness={0.6} />
      </mesh>
    </group>
  )
}

function CourtyardGate({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[-1.2, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#8b8070" roughness={0.85} />
      </mesh>
      <mesh position={[1.2, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#8b8070" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[3.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#6b4c3b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.2, 0]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[3.8, 0.12, 0.8]} />
        <meshStandardMaterial color="#5a5040" roughness={0.75} />
      </mesh>
      <mesh position={[0, 3.2, 0]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[3.8, 0.12, 0.8]} />
        <meshStandardMaterial color="#5a5040" roughness={0.75} />
      </mesh>
      <mesh position={[-0.5, 1.4, 0.12]} castShadow>
        <boxGeometry args={[0.9, 2.4, 0.08]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.6} />
      </mesh>
      <mesh position={[0.5, 1.4, 0.12]} castShadow>
        <boxGeometry args={[0.9, 2.4, 0.08]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.6} />
      </mesh>
    </group>
  )
}

function DefaultScene() {
  return (
    <group>
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <planeGeometry args={[SCENE_SIZE * 3, SCENE_SIZE * 3]} />
        <meshStandardMaterial color="#6b8e5a" roughness={0.85} />
      </mesh>

      {/* Courtyard floor */}
      <Courtyard size={7} position={[0, 0, 0]} />

      {/* South wall + gate */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = -5 + i * 0.6
        if (i >= 7 && i <= 10) return null
        return <CourtyardWall key={"sw"+i} position={[x, 0, 4.5]} />
      })}
      <CourtyardGate position={[0, 0, 4.5]} />

      {/* East wall */}
      {Array.from({ length: 14 }).map((_, i) => (
        <CourtyardWall key={"ew"+i} position={[6, 0, -3.6 + i * 0.6]} />
      ))}

      {/* West wall */}
      {Array.from({ length: 14 }).map((_, i) => (
        <CourtyardWall key={"ww"+i} position={[-6, 0, -3.6 + i * 0.6]} />
      ))}

      {/* Buildings */}
      <MainHall position={[0, 0, -5]} rotation={Math.PI} />
      <SideRoom width={5} depth={3.5} height={3} hasDesk position={[5.5, 0, -1.5]} rotation={0.1} />
      <SideRoom width={4.5} depth={3.5} height={3} hasBed position={[-5.5, 0, -1.5]} rotation={-0.1} />

      {/* Courtyard props */}
      <StoneBench position={[-2, 0, -2]} rotation={0} />
      <StoneBench position={[2.5, 0, 1]} rotation={Math.PI/2} />
      <FlowerPot position={[-3, 0, -2]} />
      <FlowerPot position={[3, 0, 1.5]} />
      <FlowerPot position={[0, 0, -3.5]} />

      {/* Well - outside east */}
            <Well position={[8, 0, 3]} />

      
{/* Bamboo east */}
      {[10.2, 10.8, 9.6, 10.5, 9.9, 10.3].map((bx, i) => {
        const bz = [3.2, 2.7, 3.5, 3.0, 2.4, 3.8][i];
        const h1 = [1.8, 2.2, 1.5, 2.6, 1.4, 2.0][i];
        const h2 = [3.8, 4.5, 3.2, 5.0, 3.0, 4.2][i];
        const ch = [5.2, 4.8, 5.6, 5.0, 4.5, 5.4][i];
        return (
        <group key={"bme"+i} position={[bx, 0, bz]}>
          <mesh position={[0, h1, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, h2, 6]} />
            <meshStandardMaterial color="#4a7a3a" roughness={0.8} />
          </mesh>
          <mesh position={[0, ch, 0]}>
            <coneGeometry args={[0.2, 0.5, 6]} />
            <meshStandardMaterial color="#3d6a2d" roughness={0.75} />
          </mesh>
        </group>
      )})}
{/* Locust tree west */}
      <group position={[-9, 0, 4]}>
        <mesh position={[0, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.4, 3.6, 8]} />
          <meshStandardMaterial color="#5a4030" roughness={0.85} />
        </mesh>
        {[[0, 2.8], [0.5, 3.2], [-0.5, 3.0], [0, 3.6], [0.3, 3.8], [-0.3, 3.5]].map(([ox, oy], i) => (
          <mesh key={"lt"+i} position={[ox, oy, 0]} castShadow>
            <sphereGeometry args={[0.7+i*0.08, 8, 6]} />
            <meshStandardMaterial color={"hsl("+(120+i*5)+", "+(40+i*3)+"%, "+(22+i*2)+"%)"} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Paths */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={"path"+i} position={[0, 0.006, 4.5 - i*0.3]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[1.0, 0.3]} />
          <meshStandardMaterial color="#a09888" roughness={0.85} />
        </mesh>
      ))}

      <fog attach="fog" args={["#c8c0b0", 12, 50]} />
    </group>
  )
}

function DynamicScene({ tileData }) {
  if (!tileData) return <DefaultScene />
  const roadTiles = [], waterTiles = [], pavClusters = []
  const visited = new Set()
  for (const key in tileData) {
    const [x, z] = key.split(",").map(Number)
    const type = tileData[key]
    if (type === 1) roadTiles.push({ x, z })
    else if (type === 3) waterTiles.push({ x, z })
    else if (type === 4 && !visited.has(key)) {
      const cluster = []
      const stack = [key]
      visited.add(key)
      while (stack.length) {
        const k = stack.pop()
        cluster.push(k.split(",").map(Number))
        const [cx, cz] = k.split(",").map(Number)
        for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nk = (cx+dx) + "," + (cz+dz)
          if (tileData[nk] === 4 && !visited.has(nk)) { visited.add(nk); stack.push(nk) }
        }
      }
      const cx = Math.round(cluster.reduce((s,p)=>s+p[0],0)/cluster.length)
      const cz = Math.round(cluster.reduce((s,p)=>s+p[1],0)/cluster.length)
      pavClusters.push({ x: cx, z: cz })
    }
  }
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-0.02,0]}>
        <planeGeometry args={[SCENE_SIZE*3, SCENE_SIZE*3]} />
        <meshStandardMaterial color="#6b8e5a" roughness={0.85} />
      </mesh>
      {roadTiles.map((t,i)=>(
        <mesh key={"road"+i} position={[t.x,0.005,t.z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[0.45,0.45]} />
          <meshStandardMaterial color="#a09888" roughness={0.85} />
        </mesh>
      ))}
      {waterTiles.length>0 && waterTiles.map((t,i)=>(
        <mesh key={"water"+i} position={[t.x,0.02,t.z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[0.48,0.48]} />
          <meshStandardMaterial color="#5588aa" roughness={0.3} metalness={0.4} transparent opacity={0.8} />
        </mesh>
      ))}
      {pavClusters.map((p,i)=>(
        <SideRoom key={"pav"+i} width={3.5} depth={2.8} height={2.5} position={[p.x,0,p.z]} />
      ))}
      <fog attach="fog" args={["#c8c0b0",12,50]} />
    </group>
  )
}




// Export building wall coordinates for pathfinding avoidance
export function getBuildingObstacles() {
  const obstacles = {}

  // MainHall at (0,0,-5) rotation PI: w=8, d=6
  // Walls: back (z=-5-d/2=-8), front (z=-5+d/2=-2), left (x=-4), right (x=4)
  const main = { cx: 0, cz: -5, w: 8, d: 6 }
  addRect(main, obstacles)

  // East SideRoom at (5.5,0,-1.5): w=5, d=3.5
  const east = { cx: 5.5, cz: -1.5, w: 5, d: 3.5 }
  addRect(east, obstacles)

  // West SideRoom at (-5.5,0,-1.5): w=4.5, d=3.5
  const west = { cx: -5.5, cz: -1.5, w: 4.5, d: 3.5 }
  addRect(west, obstacles)

  // Pond at (-9,-2) radius 3.5
  for (let dx = -4; dx <= 4; dx++)
    for (let dz = -4; dz <= 4; dz++) {
      const wx = -9 + dx, wz = -2 + dz
      if (Math.sqrt(dx*dx + dz*dz) <= 3.7)
        obstacles[wx + ',' + wz] = true
    }

  return obstacles
}

function addRect({ cx, cz, w, d }, obstacles) {
  const hw = Math.floor(w / 2), hd = Math.floor(d / 2)
  for (let x = cx - hw; x <= cx + hw; x++)
    for (let z = cz - hd; z <= cz + hd; z++)
      obstacles[x + ',' + z] = true
  // Also mark the perimeter + 1 cell as blocked
  for (let x = cx - hw - 1; x <= cx + hw + 1; x++) {
    obstacles[x + ',' + (cz - hd - 1)] = true
    obstacles[x + ',' + (cz + hd + 1)] = true
  }
  for (let z = cz - hd; z <= cz + hd; z++) {
    obstacles[(cx - hw - 1) + ',' + z] = true
    obstacles[(cx + hw + 1) + ',' + z] = true
  }
}

export default function GardenScene({ weather, tileData }) {
  const hasCustomTiles = tileData && Object.keys(tileData).length > 0
  const sceneContent = hasCustomTiles ? <DynamicScene tileData={tileData} /> : <DefaultScene />
  return (
    <group>
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <planeGeometry args={[SCENE_SIZE * 3, SCENE_SIZE * 3]} />
        <meshStandardMaterial color="#6b8e5a" roughness={0.85} />
      </mesh>
      <fog attach="fog" args={["#c8c0b0", 12, 50]} />
      {sceneContent}
    </group>
  )
}
