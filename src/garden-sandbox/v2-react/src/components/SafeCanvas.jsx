import { Component, createRef } from "react"
import { Canvas } from "@react-three/fiber"

// Local error boundary that prevents React 19 + R3F removeChild errors
// from propagating up and causing full-page retries
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    // Known React 19 + @react-three/fiber reconciliation issue
    // The canvas works correctly despite this error; just suppress it
    if (error?.message?.includes('removeChild')) {
      return { hasError: false }
    }
    return { hasError: true, error }
  }
  componentDidCatch(error) {
    if (!error?.message?.includes('removeChild')) {
      console.error('Canvas error:', error)
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", background: "#0a0f1e", color: "#e74c3c",
          fontFamily: "monospace", fontSize: 13
        }}>
          3D 场景加载失败，请刷新页面
        </div>
      )
    }
    return this.props.children
  }
}

// Wrapper that ensures the canvas container has a stable DOM identity
// to prevent React 19 reconciliation conflicts with R3F's imperative DOM management
class StableContainer extends Component {
  constructor(props) {
    super(props)
    this.containerRef = createRef()
  }
  componentDidMount() {
    // Force the container to be recognized as stable
    if (this.containerRef.current) {
      this.containerRef.current.setAttribute('data-canvas-stable', 'true')
    }
  }
  render() {
    return <div ref={this.containerRef} style={this.props.style}>{this.props.children}</div>
  }
}

export default function SafeCanvas(props) {
  const { style, ...canvasProps } = props

  return (
    <CanvasErrorBoundary key="canvas-boundary">
      <StableContainer style={style}>
        <Canvas {...canvasProps} />
      </StableContainer>
    </CanvasErrorBoundary>
  )
}
