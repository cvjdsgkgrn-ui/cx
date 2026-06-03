import { useRef, useMemo } from "react"
import * as THREE from "three"
import { SCENE_SIZE } from "../store/gameData"

// Tile types from editor: 1=road, 2=wall, 3=water, 4=pavilion, 5=moongate
const TILE_COLORS = { 1: "#888", 2: "#e8d5b7", 3: "#5588aa", 4: "#c4a882", 5: "#e8d5b7" }

// Get custom tile data from the pathfinding module's internal state
let _getTileData = null
export function setTileDataProvider(fn) { _getTileData = fn }

function getTileData() {
  if (_getTileData) return _getTileData()
  return null
}

// ─── Default Scene (preset mode) ─────────────────────────
function DefaultScene() {
  return (
    <group>
      {/* Cross paths */}
      {Array.from({ length: 40 }).map((_, i) => {
        const x = -12 + i * 0.6
        if (Math.abs(x) < 2.5) return null
        return (
          <group key={"h"+i}>
            <mesh position={[x, 0.005, 0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
              <planeGeometry args={[0.4, 0.6]} />
              <meshStandardMaterial color="#888" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.005, x]} rotation={[-Math.PI/2,0,0]} receiveShadow>
              <planeGeometry args={[0.4, 0.6]} />
              <meshStandardMaterial color="#888" roughness={0.95} />
            </mesh>
          </group>
        )
      })}

      {/* Curved path */}
      {Array.from({ length: 50 }).map((_, i) => {
        const t = i / 50
        const x = -6 + t * 14
        const z = -4 + Math.sin(t * Math.PI) * 6
        return (
          <mesh key={"c"+i} position={[x, 0.005, z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
            <planeGeometry args={[0.3, 0.6]} />
            <meshStandardMaterial color="#888" roughness={0.95} />
          </mesh>
        )
      })}

      {/* Pond at (5,-4) */}
      <mesh position={[5, 0.02, -4]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <circleGeometry args={[4.5, 32]} />
        <meshStandardMaterial color="#5588aa" roughness={0.3} metalness={0.4} transparent opacity={0.85} />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i/24)*Math.PI*2
        const r = 4.2+Math.random()*0.6
        return (
          <mesh key={"pr"+i} position={[5+Math.cos(a)*r, 0.15, -4+Math.sin(a)*r]}
            rotation={[Math.random()*0.5, Math.random()*Math.PI, Math.random()*0.5]} castShadow>
            <dodecahedronGeometry args={[0.15+Math.random()*0.25]} />
            <meshStandardMaterial color="#888" roughness={0.8} />
          </mesh>
        )
      })}

      {/* Pavilion at (-8,-6) */}
      <Pavilion position={[-8, 0, -6]} />

      {/* Moon Gate at (8,-2) */}
      <MoonGate position={[8, 0, -2]} />

      {/* Trees */}
      <TreeCluster />

      {/* Rocks */}
      <RockCluster />

      {/* Walls */}
      <GardenWalls />
    </group>
  )
}

// ─── Dynamic Scene (custom tilemap mode) ──────────────────
function DynamicScene({ tileData }) {
  if (!tileData) return <DefaultScene />

  // Group tiles by type and find clusters for structures
  const roadTiles = []
  const wallTiles = []
  const waterTiles = []
  const pavClusters = [] // array of {x,z} centers
  const gateClusters = []
  const visited = new Set()

  for (const key in tileData) {
    const [x, z] = key.split(",").map(Number)
    const type = tileData[key]

    if (type === 1) roadTiles.push({ x, z })
    else if (type === 2) wallTiles.push({ x, z })
    else if (type === 3) waterTiles.push({ x, z })
    else if (type === 4 && !visited.has(key)) {
      // Flood-fill to find pavilion cluster center
      const cluster = []
      const stack = [key]
      visited.add(key)
      while (stack.length) {
        const k = stack.pop()
        cluster.push(k.split(",").map(Number))
        const [cx, cz] = k.split(",").map(Number)
        for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nk = (cx+dx) + "," + (cz+dz)
          if (tileData[nk] === 4 && !visited.has(nk)) {
            visited.add(nk); stack.push(nk)
          }
        }
      }
      // Center = average
      const cx = Math.round(cluster.reduce((s,p) => s+p[0], 0) / cluster.length)
      const cz = Math.round(cluster.reduce((s,p) => s+p[1], 0) / cluster.length)
      pavClusters.push({ x: cx, z: cz })
    }
    else if (type === 5 && !visited.has(key)) {
      const cluster = []
      const stack = [key]
      visited.add(key)
      while (stack.length) {
        const k = stack.pop()
        cluster.push(k.split(",").map(Number))
        const [cx, cz] = k.split(",").map(Number)
        for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nk = (cx+dx) + "," + (cz+dz)
          if (tileData[nk] === 5 && !visited.has(nk)) {
            visited.add(nk); stack.push(nk)
          }
        }
      }
      const cx = Math.round(cluster.reduce((s,p) => s+p[0], 0) / cluster.length)
      const cz = Math.round(cluster.reduce((s,p) => s+p[1], 0) / cluster.length)
      gateClusters.push({ x: cx, z: cz })
    }
  }

  return (
    <group>
      {roadTiles.map((t, i) => (
        <mesh key={"r"+i} position={[t.x, 0.005, t.z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#999" roughness={0.9} />
        </mesh>
      ))}
      {wallTiles.map((t, i) => (
        <mesh key={"w"+i} position={[t.x, 1, t.z]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 2, 0.8]} />
          <meshStandardMaterial color="#e8d5b7" roughness={0.7} />
        </mesh>
      ))}
      {waterTiles.map((t, i) => (
        <mesh key={"wt"+i} position={[t.x, 0.02, t.z]} rotation={[-Math.PI/2,0,0]} receiveShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#5588aa" roughness={0.3} metalness={0.4} transparent opacity={0.85} />
        </mesh>
      ))}
      {pavClusters.map((p, i) => (
        <Pavilion key={"pav"+i} position={[p.x, 0, p.z]} />
      ))}
      {gateClusters.map((g, i) => (
        <MoonGate key={"gate"+i} position={[g.x, 0, g.z]} />
      ))}
      <TreeCluster excludeWater={tileData} />
      <RockCluster excludeWater={tileData} />
    </group>
  )
}

// ─── Sub-components ───────────────────────────────────────
function Pavilion({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.3, 4]} />
        <meshStandardMaterial color="#c4a882" roughness={0.7} />
      </mesh>
      {[0,1,2,3,4,5].map(i => {
        const a = (i/6)*Math.PI*2
        return (
          <mesh key={i} position={[Math.cos(a)*1.6, 1.2, Math.sin(a)*1.6]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 2.1]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
        )
      })}
      <mesh position={[0, 2.4, 0]} castShadow>
        <coneGeometry args={[2.6, 1.3, 6]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.5} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#e2b04a" emissive="#e2b04a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function MoonGate({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <torusGeometry args={[1.2, 0.15, 16, 32]} />
        <meshStandardMaterial color="#e8d5b7" roughness={0.4} />
      </mesh>
    </group>
  )
}

function TreeCluster({ excludeWater }) {
  const trees = useMemo(() => {
    const items = []
    for (let i = 0; i < 20; i++) {
      let x, z, tries = 0
      do {
        x = Math.round((Math.random() - 0.5) * SCENE_SIZE * 1.6)
        z = Math.round((Math.random() - 0.5) * SCENE_SIZE * 1.6)
        tries++
      } while (
        tries < 50 && (
          (Math.sqrt((x-5)**2+(z+4)**2) < 5.5) ||
          (Math.sqrt((x+8)**2+(z+6)**2) < 3.5) ||
          (excludeWater && (excludeWater[x+","+z] === 2 || excludeWater[x+","+z] === 3 || excludeWater[x+","+z] === 4 || excludeWater[x+","+z] === 5))
        )
      )
      const scale = 0.5 + Math.random() * 0.7
      const hue = 100 + Math.random() * 30
      items.push({ x, z, scale, rot: Math.random()*Math.PI*2, hue, sat1: 50+Math.random()*30, lit1: 25+Math.random()*15 })
    }
    return items
  }, [excludeWater])

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={[t.scale, t.scale, t.scale]} rotation={[0, t.rot, 0]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.2]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.7, 1.6, 8]} />
            <meshStandardMaterial color={`hsl(${t.hue}, ${t.sat1}%, ${t.lit1}%)`} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.8, 0]} castShadow>
            <coneGeometry args={[0.5, 1.2, 8]} />
            <meshStandardMaterial color={`hsl(${t.hue}, 50%, 30%)`} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RockCluster({ excludeWater }) {
  const rocks = useMemo(() => {
    return Array.from({ length: 12 }).map(() => {
      let x, z, tries = 0
      do {
        x = Math.round((Math.random() - 0.5) * SCENE_SIZE * 1.5)
        z = Math.round((Math.random() - 0.5) * SCENE_SIZE * 1.5)
        tries++
      } while (
        tries < 30 && excludeWater && (excludeWater[x+","+z] === 2 || excludeWater[x+","+z] === 3)
      )
      return {
        x, z,
        scale: 0.3 + Math.random() * 0.6,
        rot: [Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI],
        color: `hsl(0, 0%, ${40 + Math.random() * 20}%)`
      }
    })
  }, [excludeWater])

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, 0.05, r.z]} rotation={r.rot} castShadow>
          <dodecahedronGeometry args={[r.scale]} />
          <meshStandardMaterial color={r.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

function GardenWalls() {
  const wallData = useMemo(() => {
    const walls = []
    const half = SCENE_SIZE - 1
    for (let side = 0; side < 4; side++) {
      const isNS = side % 2 === 0
      const sign = side < 2 ? -1 : 1
      const gapStart = (Math.random() - 0.3) * half * 0.5
      const gapEnd = gapStart + 3 + Math.random() * 2
      for (let pos = -half; pos <= half; pos += 1) {
        if (pos >= gapStart - 0.5 && pos <= gapEnd + 0.5) continue
        walls.push(isNS ? { x: pos, z: sign * half } : { x: sign * half, z: pos })
      }
    }
    return walls
  }, [])

  return (
    <group>
      {wallData.map((w, i) => (
        <mesh key={i} position={[w.x, 1, w.z]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 2, 0.2]} />
          <meshStandardMaterial color="#e8d5b7" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Main GardenScene export ──────────────────────────────
export default function GardenScene({ weather, tileData }) {
  const sceneContent = tileData ? <DynamicScene tileData={tileData} /> : <DefaultScene />

  return (
    <group>
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[SCENE_SIZE * 3, SCENE_SIZE * 3]} />
        <meshStandardMaterial color="#3a5a3a" roughness={0.9} />
      </mesh>
      {sceneContent}
    </group>
  )
}

