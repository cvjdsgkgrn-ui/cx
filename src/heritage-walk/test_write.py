
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { SCENE_SIZE } from '../store/gameData'

const BRICK_COLOR = '#8b8070'
const WOOD_COLOR = '#6b4c3b'
const ROOF_COLOR = '#5a5040'
const WALL_COLOR = '#b0a090'
const GROUND_COLOR = '#6b8e5a'
const FLOOR_COLOR = '#3a3028'
const PAPER_COLOR = '#e8dcc8'
const VASE_COLOR = '#4a7c7c'

let _getTileData = null
export function setTileDataProvider(fn) { _getTileData = fn }
function getTileData() {
  if (_getTileData) return _getTileData()
  return null
}

print('test ok')
