import { useState, useCallback } from "react"

export function useMessages() {
  const [messageStream, setMessageStream] = useState([])

  const addMessage = useCallback((speaker, text, type) => {
    setMessageStream(prev => [...prev.slice(-200), {
      id: performance.now() + Math.random(),
      speaker, text, type,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    }])
  }, [])

  return { messageStream, addMessage }
}
