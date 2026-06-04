import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Sandbox from "./pages/Sandbox.jsx"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="*" element={<Sandbox />} />
    </Routes>
  </BrowserRouter>
)