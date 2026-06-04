import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"

console.log("[main] starting...");
const root = ReactDOM.createRoot(document.getElementById("root"))
console.log("[main] rendering...");
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)