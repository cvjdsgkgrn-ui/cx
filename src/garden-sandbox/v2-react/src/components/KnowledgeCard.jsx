import { useState, useCallback } from "react"
import { KNOWLEDGE_CARDS } from "../store/gameData"

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export default function KnowledgeCard() {
  const [card, setCard] = useState(() => pickRandom(KNOWLEDGE_CARDS))
  const [expanded, setExpanded] = useState(false)

  const updateKnowledge = useCallback(() => setCard(pickRandom(KNOWLEDGE_CARDS)), [])

  return (
    <div onClick={() => setExpanded(e => !e)}
      style={{
        background: "rgba(15,52,96,0.7)", borderRadius: 6, padding: "4px 8px",
        fontSize: 11, color: "#aaa", borderLeft: "2px solid #e2b04a",
        flexShrink: 0, cursor: "pointer",
        maxHeight: expanded ? 120 : 44, overflow: "hidden",
        transition: "max-height 0.3s"
      }}>
      {expanded ? (
        <><b>{card.title}</b><br />{card.text}</>
      ) : (
        <><b>{card.title}</b>
          {" "}
          <span onClick={e => { e.stopPropagation(); updateKnowledge() }}
            style={{ cursor: "pointer", fontSize: 12 }}>
            🔄
          </span>
          <br />{card.text.substring(0, 30)}...
        </>
      )}
    </div>
  )
}
