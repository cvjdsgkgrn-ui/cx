import { useEffect } from "react"
import { POIS, CONVERSE_DIST, CONVERSE_COOLDOWN_MS, SCENE_SIZE } from "../store/gameData"
import { findPath, pushApart, getTileData } from "../utils/pathfinding"
import { generateFeeling, generateDialogue } from "../utils/ai"

const LANDMARKS = ["飞檐翘角的亭台", "曲径通幽的长廊", "碧波荡漾的池塘", "精雕细琢的月洞门", "层叠错落的假山"]

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function useGameLoop({ charactersRef, apiKey, apiUrl, addMessage, onTick }) {
  useEffect(() => {
    const tick = () => {
      const chars = charactersRef.current
      const now = Date.now()

      pushApart(chars, 1.2)

      let activeConverseCount = chars.filter(c => c.isConversing).length

      for (const c of chars) {
        if (c.isConversing) continue

        if (c.isResting) {
          c.restTimer -= 0.5
          if (c.restTimer <= 0) {
            c.isResting = false
            c.restTimer = 0
            const poi = pickRandom(POIS)
            const m = 3
            let wx, wz, tries = 0
            const tileData = getTileData()
            do {
              wx = Math.max(-SCENE_SIZE + m, Math.min(SCENE_SIZE - m, poi.x + (Math.random() - 0.5) * 6))
              wz = Math.max(-SCENE_SIZE + m, Math.min(SCENE_SIZE - m, poi.z + (Math.random() - 0.5) * 6))
              tries++
            } while (tries < 8 && tileData && tileData[Math.round(wx) + "," + Math.round(wz)] === 3)
            const path = findPath(c.position.x, c.position.z, wx, wz)
            if (path.length > 1) { c.path = path.slice(1); c.target = path[1] }
          }
          continue
        }

        if (c.target || c.path.length > 0) continue

        if (!c.isResting) { c.isResting = true; c.restTimer = 3 + Math.random() * 6 }

        c.observeTimer = (c.observeTimer || 20) - 0.5
        if (c.observeTimer <= 0) {
          c.observeTimer = 30 + Math.random() * 40
          if (apiKey) {
            generateFeeling(c, pickRandom(LANDMARKS), apiKey, apiUrl)
              .then(t => addMessage(c.name, t, "feeling"))
              .catch(e => addMessage(c.name, "望着景色出了神...", "feeling"))
          }
        }

        for (const other of chars) {
          if (other.id === c.id || other.isConversing || c.isConversing) continue
          const d = Math.sqrt((c.position.x - other.position.x) ** 2 + (c.position.z - other.position.z) ** 2)
          if (d < CONVERSE_DIST && (now - (c.lastConverse[other.id] || 0)) > CONVERSE_COOLDOWN_MS) {
            c.isConversing = other.isConversing = true
            c.isSpeaking = other.isSpeaking = true
            c.target = other.target = null
            c.path = other.path = []
            c.lastConverse[other.id] = other.lastConverse[c.id] = now
            if (apiKey) {
              generateDialogue(c, other, apiKey, apiUrl).then(t => {
                addMessage(c.name + " & " + other.name, t, "dialogue")
                c.dialogueText = t.substring(0, 60)
                other.dialogueText = t.substring(0, 60)
                setTimeout(() => {
                  c.isConversing = c.isSpeaking = false; c.dialogueText = null
                  other.isConversing = other.isSpeaking = false; other.dialogueText = null
                }, 6000)
              }).catch(e => {
                c.isConversing = other.isConversing = c.isSpeaking = other.isSpeaking = false
                addMessage("系统", "对话API错误: " + e.message, "system")
              })
            }
            activeConverseCount++
            if (activeConverseCount >= 2) break
          }
        }

        if (c.path.length > 0 && !c.target && !c.isResting) {
          c.target = c.path[0]; c.path = c.path.slice(1)
        }
      }

      // Signal that a tick completed (event-driven re-render)
      if (onTick) onTick()
    }

    const iv = setInterval(tick, 350)
    return () => clearInterval(iv)
  }, [addMessage, apiKey, apiUrl, charactersRef, onTick])
}
