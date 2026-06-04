import { lazy, Suspense, Component } from "react"
import { Routes, Route } from "react-router-dom"

const Home = lazy(() => import("./pages/Home.jsx"))
const Sandbox = lazy(() => import("./pages/Sandbox.jsx"))
const Editor = lazy(() => import("./pages/Editor.jsx"))

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, background: "#0a0f1e", color: "#e74c3c", fontFamily: "monospace", height: "100vh", overflow: "auto" }}>
          <h2>渲染错误</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0a0f1e", color: "#e2b04a", fontFamily: "Microsoft YaHei,PingFang SC,sans-serif", fontSize: 18 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏯</div>
        <div>加载中...</div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
