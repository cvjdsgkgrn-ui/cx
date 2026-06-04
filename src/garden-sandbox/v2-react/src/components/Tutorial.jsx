import { useState } from "react"

const STEPS = [
  { emoji: "🏯", title: "欢迎来到苏州园林 AI 沙箱", text: "左侧3D鸟瞰园林，AI角色在园中漫步。右侧是对话记录和角色视角。" },
  { emoji: "👆", title: "选择一个角色", text: "点击左侧角色列表中的角色即可选中。选中后在右下角可以看到ta的视角。" },
  { emoji: "💬", title: "观察角色对话", text: "角色会在园林中观察景色并彼此交谈。对话会出现在右侧面板中。" },
  { emoji: "👁️", title: "查看角色视角", text: "右下角POV窗口显示所选角色的第一人称视角。试试切换不同角色！" },
  { emoji: "☀️", title: "切换天气与时间", text: "点击天气按钮切换晴天/多云/黄昏/夜晚，感受不同氛围。" },
  { emoji: "🎉", title: "开始探索吧！", text: "你已掌握基本操作！点击任意位置关闭教程，开始探索吧。" }
]

const TUTORIAL_DONE_KEY = "garden-tutorial-done"

export default function Tutorial() {
  const [step, setStep] = useState(() => {
    if (localStorage.getItem(TUTORIAL_DONE_KEY)) return -1
    return 0
  })

  if (step < 0 || step >= STEPS.length) return null

  const next = () => {
    const ns = step + 1
    if (ns >= STEPS.length) {
      localStorage.setItem(TUTORIAL_DONE_KEY, "1")
      setStep(-1)
    } else {
      setStep(ns)
    }
  }

  const skip = () => {
    localStorage.setItem(TUTORIAL_DONE_KEY, "1")
    setStep(-1)
  }

  const s = STEPS[step]

  return (
    <div onClick={next}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", cursor: "pointer"
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: "#1a3a5c", borderRadius: 14, padding: "28px 32px",
          maxWidth: 420, border: "1px solid rgba(255,255,255,0.12)",
          textAlign: "center", cursor: "default"
        }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{s.emoji}</div>
        <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 17 }}>{s.title}</h3>
        <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>{s.text}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: "7px 18px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 13 }}>
              上一步
            </button>
          )}
          <button onClick={next}
            style={{ padding: "7px 22px", borderRadius: 6, border: "none", background: "#4ecdc4", color: "#111", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
            {step < STEPS.length - 1 ? "下一步" : "开始探索"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: 22, height: 4, borderRadius: 2, background: i === step ? "#4ecdc4" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
        <div onClick={skip}
          style={{ marginTop: 12, color: "#555", fontSize: 11, cursor: "pointer" }}>
          跳过教程
        </div>
      </div>
    </div>
  )
}
