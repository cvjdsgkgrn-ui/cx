// Simple A* pathfinding on a grid
const GRID_SIZE = 60
const GRID_RES = 1

function worldToGrid(wx, wz) {
  return { x: Math.floor(wx + GRID_SIZE / 2), z: Math.floor(wz + GRID_SIZE / 2) }
}

function gridToWorld(gx, gz) {
  return { x: gx - GRID_SIZE / 2 + 0.5, z: gz - GRID_SIZE / 2 + 0.5 }
}

// Obstacles
let blockedCells = {}
let sceneSize = 30
let _tileData = null

export function getTileData() { return _tileData }

export function setSceneData(size, obstacles, extraObstacles) {
  sceneSize = size
  blockedCells = {}
  _tileData = obstacles || null
  if (obstacles) {
    for (const key in obstacles) {
      if (obstacles[key] === 2 || obstacles[key] === 3) {
        blockedCells[key] = true
      }
    }
  }
  // Merge building obstacles from GardenScene
  if (extraObstacles) {
    for (const key in extraObstacles) {
      blockedCells[key] = true
    }
  }
}

function isBlocked(gx, gz) {
  const half = Math.floor(GRID_SIZE / 2)
  const margin = 1
  if (gx < half - sceneSize + margin || gx > half + sceneSize - margin ||
      gz < half - sceneSize + margin || gz > half + sceneSize - margin) { return true }
  const wx = gx - Math.floor(GRID_SIZE / 2), wz = gz - Math.floor(GRID_SIZE / 2)
  // Tile-based obstacles
  const key = wx + "," + wz
  return !!blockedCells[key]
}

// A* pathfinding
export function findPath(fromX, fromZ, toX, toZ) {
  const half = SCENE_SIZE - 1.5
  toX = Math.max(-half, Math.min(half, toX))
  toZ = Math.max(-half, Math.min(half, toZ))

  const start = worldToGrid(fromX, fromZ)
  const end = worldToGrid(toX, toZ)

  if (isBlocked(end.x, end.z)) {
    let best = null, bestDist = Infinity
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const nx = end.x + dx, nz = end.z + dz
        if (!isBlocked(nx, nz)) {
          const d = Math.abs(dx) + Math.abs(dz)
          if (d < bestDist) { bestDist = d; best = { x: nx, z: nz } }
        }
      }
    }
    if (!best) return [{ x: fromX, z: fromZ }, { x: toX, z: toZ }]
    return findPath(fromX, fromZ, gridToWorld(best.x, best.z).x, gridToWorld(best.x, best.z).z)
  }

  const openSet = new Set()
  const cameFrom = {}, gScore = {}, fScore = {}
  const sk = start.x + "," + start.z
  openSet.add(sk); gScore[sk] = 0; fScore[sk] = heuristic(start, end)

  let iterations = 0
  while (openSet.size > 0 && iterations < 800) {
    iterations++
    let current = null, lowest = Infinity
    for (const k of openSet) {
      if ((fScore[k] || Infinity) < lowest) { lowest = fScore[k]; current = k }
    }
    const [cx, cz] = current.split(",").map(Number)

    if (cx === end.x && cz === end.z) {
      const path = []
      let cur = current
      while (cur) {
        const [px, pz] = cur.split(",").map(Number)
        path.unshift(gridToWorld(px, pz))
        cur = cameFrom[cur]
      }
      const s = [path[0]]
      for (let i = 1; i < path.length; i++) {
        if (i === path.length - 1 || i % 2 === 0) s.push(path[i])
      }
      return s
    }

    openSet.delete(current)
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, nz = cz + dz
      if (isBlocked(nx, nz)) continue
      const nk = nx + "," + nz
      const tentative = (gScore[current] || Infinity) + 1
      if (tentative < (gScore[nk] || Infinity)) {
        cameFrom[nk] = current; gScore[nk] = tentative
        fScore[nk] = tentative + heuristic({ x: nx, z: nz }, end)
        openSet.add(nk)
      }
    }
  }
  return [{ x: fromX, z: fromZ }, { x: toX, z: toZ }]
}

function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.z - b.z) }

export function pushApart(characters, minDist = 0.7) {
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const a = characters[i], b = characters[j]
      if (!a.position || !b.position) continue
      const dx = a.position.x - b.position.x, dz = a.position.z - b.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < minDist && dist > 0.001) {
        const push = (minDist - dist) / 2
        a.position.x += (dx / dist) * push; a.position.z += (dz / dist) * push
        b.position.x -= (dx / dist) * push; b.position.z -= (dz / dist) * push
        const half = SCENE_SIZE - 1
        for (const c of [a, b]) {
          c.position.x = Math.max(-half, Math.min(half, c.position.x))
          c.position.z = Math.max(-half, Math.min(half, c.position.z))
        }
      }
    }
  }
}

const SCENE_SIZE = 30
export { SCENE_SIZE }
