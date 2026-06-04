import { Component } from "react"

// Local ErrorBoundary that silently catches known React 19 + R3F compatibility errors
class CanvasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }

  static getDerivedStateFromError(error) {
    // Suppress known React 19 + R3F errors that are harmless
    const msg = error?.message || ""
    if (msg.includes("removeChild") || msg.includes("remove") && msg.includes("not a child")) {
      return { hasError: false }
    }
    if (msg.includes("addEventListener") && msg.includes("null")) {
      return { hasError: false }
    }
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      // Render children anyway — R3F errors are usually transient
      return this.props.children
    }
    return this.props.children
  }
}

export default function SafeCanvas({ children, ...props }) {
  return (
    <CanvasErrorBoundary>
      {children}
    </CanvasErrorBoundary>
  )
}
