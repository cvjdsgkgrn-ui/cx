import { useRef, useState, useCallback } from "react"
import { PRESET_CHARACTERS, PRESET_IDS, SCENE_SIZE, POIS, CONVERSE_DIST, CONVERSE_COOLDOWN_MS } from "../store/gameData"
import { findPath } from "../utils/pathfinding"

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function useCharacters() {
  const charactersRef = useRef(
    PRESET_CHARACTERS.map((p) => ({
      ...p, id: p.id,
      position: { x: pickRandom(POIS).x + (Math.random() - 0.5) * 4, z: pickRandom(POIS).z + (Math.random() - 0.5) * 4 },
      rotation: Math.random() * Math.PI * 2,
      target: null, path: [], isResting: false, restTimer: 5 + Math.random() * 10,
      isConversing: false, isSpeaking: false, dialogueText: null,
      observeTimer: 20 + Math.random() * 20, lastConverse: {}
    }))
  )

  const [charList, setCharList] = useState(
    PRESET_CHARACTERS.map(p => ({ id: p.id, name: p.name, color: p.color }))
  )

  const selectedIdRef = useRef(null)
  const [selectedId, setSelectedId] = useState(() => {
    const ids = PRESET_CHARACTERS.map(p => p.id)
    return ids[Math.floor(Math.random() * ids.length)]
  })

  const setTargetRef = useRef(() => {})
  const onSelectCharRef = useRef(() => {})

  const setSelected = useCallback((id) => setSelectedId(id), [])

  setTargetRef.current = useCallback((charId, x, z) => {
    const c = charactersRef.current.find(c => c.id === charId)
    if (!c) return
    const path = findPath(c.position.x, c.position.z, x, z)
    c.target = path.length > 1 ? path[1] : { x, z }
    c.path = path.slice(2)
    c.isResting = false
    c.restTimer = 0
  }, [])

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
    return id
  }, [])

  const deleteCharacter = useCallback((id) => {
    if (PRESET_IDS.has(id)) return
    charactersRef.current = charactersRef.current.filter(c => c.id !== id)
    setCharList(prev => prev.filter(c => c.id !== id))
    if (selectedIdRef.current === id) { selectedIdRef.current = null; setSelectedId(null) }
  }, [])

  return {
    charactersRef, charList, selectedIdRef, selectedId, setSelected,
    setTargetRef, onSelectCharRef, addCharacter, deleteCharacter
  }
}
