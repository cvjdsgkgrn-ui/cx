import { useState, useCallback } from "react"
import { generatePersona } from "../utils/ai"

const RANDOM_NAMES = ["小明", "阿福", "春兰", "老张", "翠花", "大壮", "秀英", "铁柱", "桂花", "建国"]
const RANDOM_ROLES = ["游客", "画师", "诗人", "石匠", "园丁", "书生", "琴师", "茶客", "摄影师", "学生"]
const RANDOM_COLORS = ["#ff6b9d", "#4ecdc4", "#45b7d1", "#f9ca24", "#6ab04c", "#e056a0", "#f0932b", "#a29bfe", "#fd79a8", "#00cec9"]
const AGE_MIN = 8
const AGE_MAX = 82

function randomPersona(name, role) {
  const templates = [
    `一个热爱苏州园林的${role}，对建筑细节有独到的观察。`,
    `本地长大的${role}，对园林里的每一块石头都有感情。`,
    `从外地慕名而来的${role}，被园林的精致震撼到了。`,
    `${role}，性格开朗健谈，喜欢和遇到的每个人聊天。`,
    `${role}，安静内敛，喜欢独自欣赏园林的每个角落。`
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

export default function AddCharacterDialog({ onAdd, onClose, apiKey, apiUrl }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("游客")
  const [color, setColor] = useState("#4ecdc4")
  const [gender, setGender] = useState("male")
  const [age, setAge] = useState(25)
  const [persona, setPersona] = useState("")
  const [loading, setLoading] = useState(false)

  const randomize = useCallback(() => {
    const g = Math.random() > 0.5 ? "male" : "female"
    setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)])
    setRole(RANDOM_ROLES[Math.floor(Math.random() * RANDOM_ROLES.length)])
    setColor(RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)])
    setGender(g)
    setAge(Math.floor(AGE_MIN + Math.random() * (AGE_MAX - AGE_MIN)))
    setPersona(randomPersona(name, role))
  }, [])

  const handleCreate = useCallback(async () => {
    const n = name.trim() || "无名氏"
    const r = role.trim() || "游客"
    let p = persona.trim()
    if (!p && apiKey) {
      try {
        setLoading(true)
        p = await generatePersona(n, r, apiKey, apiUrl)
      } catch (e) {
        p = randomPersona(n, r)
      } finally {
        setLoading(false)
      }
    }
    if (!p) p = randomPersona(n, r)
    onAdd({ name: n, role: r, color, gender, age, persona: p })
    onClose()
  }, [name, role, color, gender, age, persona, apiKey, apiUrl, onAdd, onClose])

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200,
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1a3a5c", borderRadius: 12, padding: 20, width: 380, maxWidth: "90vw",
        border: "1px solid rgba(255,255,255,0.12)", maxHeight: "85vh", overflowY: "auto"
      }}>
        <h3 style={{ color: "#fff", margin: "0 0 12px", fontSize: 15 }}>创建新角色</h3>

        {/* Preview */}
        <div style={{
          display: "flex", gap: 12, alignItems: "center", padding: 12,
          background: "rgba(0,0,0,0.2)", borderRadius: 8, marginBottom: 12
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "3px solid rgba(255,255,255,0.2)"
          }}>
            <span style={{ fontSize: 20 }}>{gender === "male" ? "♂" : "♀"}</span>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>{name || "???"}</div>
            <div style={{ color: "#999", fontSize: 11 }}>{role} · {age}岁 · {gender === "male" ? "男" : "女"}</div>
          </div>
        </div>

        {/* Fields */}
        <label style={{ display: "block", color: "#aaa", fontSize: 11, marginBottom: 3, marginTop: 8 }}>名称</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="角色名称"
          style={{ width: "100%", padding: "6px 10px", borderRadius: 5, border: "1px solid #555", background: "#0d1f35", color: "#eee", fontSize: 12 }} />

        <label style={{ display: "block", color: "#aaa", fontSize: 11, marginBottom: 3, marginTop: 8 }}>身份</label>
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="如：游客、画师"
          style={{ width: "100%", padding: "6px 10px", borderRadius: 5, border: "1px solid #555", background: "#0d1f35", color: "#eee", fontSize: 12 }} />

        <label style={{ display: "block", color: "#aaa", fontSize: 11, marginBottom: 3, marginTop: 8 }}>性别</label>
        <select value={gender} onChange={e => setGender(e.target.value)}
          style={{ width: "100%", padding: "6px 10px", borderRadius: 5, border: "1px solid #555", background: "#0d1f35", color: "#eee", fontSize: 12 }}>
          <option value="male">男（锥尖向下 · 蓝帽）</option>
          <option value="female">女（锥尖向上 · 粉帽）</option>
        </select>

        <label style={{ display: "block", color: "#aaa", fontSize: 11, marginBottom: 3, marginTop: 8 }}>年龄 ({age}岁)</label>
        <input type="range" min={AGE_MIN} max={AGE_MAX} value={age} onChange={e => setAge(+e.target.value)}
          style={{ width: "100%", accentColor: "#4ecdc4" }} />

        <label style={{ display: "block", color: "#aaa", fontSize: 11, marginBottom: 3, marginTop: 8 }}>颜色</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 36, height: 32, padding: 2, cursor: "pointer" }} />
          <input value={color} onChange={e => setColor(e.target.value)}
            style={{ flex: 1, padding: "6px 10px", borderRadius: 5, border: "1px solid #555", background: "#0d1f35", color: "#eee", fontSize: 12 }} />
        </div>

        <label style={{ display: "block", color: "#aaa", fontSize: 11, marginBottom: 3, marginTop: 8 }}>人物简介</label>
        <textarea value={persona} onChange={e => setPersona(e.target.value)}
          placeholder="简短描述这个人物的性格特点..."
          style={{ width: "100%", padding: "6px 10px", borderRadius: 5, border: "1px solid #555", background: "#0d1f35", color: "#eee", fontSize: 12, resize: "vertical", height: 60 }} />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button onClick={randomize}
            style={{ padding: "6px 16px", borderRadius: 5, border: "none", cursor: "pointer", background: "rgba(78,205,196,0.12)", color: "#4ecdc4", fontSize: 12, marginRight: "auto" }}>
            🎲 随机生成
          </button>
          <button onClick={onClose}
            style={{ padding: "6px 16px", borderRadius: 5, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "#ccc", fontSize: 12 }}>
            取消
          </button>
          <button onClick={handleCreate} disabled={loading}
            style={{ padding: "6px 16px", borderRadius: 5, border: "none", cursor: loading ? "wait" : "pointer", background: loading ? "#3a8a7e" : "#4ecdc4", color: "#111", fontWeight: "bold", fontSize: 12 }}>
            {loading ? "生成中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  )
}
