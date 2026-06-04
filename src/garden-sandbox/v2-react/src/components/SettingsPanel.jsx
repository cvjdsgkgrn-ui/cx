export default function SettingsPanel({ apiKey, setApiKey, apiUrl, setApiUrl, onClose }) {
  return (
    <div style={{
      background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: 12, flexShrink: 0
    }}>
      <div style={{ color: "#aaa", fontSize: 10, marginBottom: 3 }}>API Key (DeepSeek)</div>
      <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
        style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #444", background: "#0a0f1e", color: "#ccc", fontSize: 11 }} />
      <div style={{ color: "#aaa", fontSize: 10, marginTop: 8, marginBottom: 3 }}>API URL</div>
      <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
        style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #444", background: "#0a0f1e", color: "#888", fontSize: 11 }} />
      <button onClick={onClose}
        style={{ marginTop: 8, padding: "5px 14px", borderRadius: 4, border: "none", background: "#2a6b5e", color: "#fff", fontSize: 11, cursor: "pointer", width: "100%" }}>
        保存设置
      </button>
    </div>
  )
}
