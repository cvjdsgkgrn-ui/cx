import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"

const Home = lazy(() => import("./pages/Home.jsx"))
const Sandbox = lazy(() => import("./pages/Sandbox.jsx"))
const Editor = lazy(() => import("./pages/Editor.jsx"))

function Loading() {
  return React.createElement("div", {
    style: { display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#0a0f1e",color:"#e2b04a",fontFamily:"Microsoft YaHei,PingFang SC,sans-serif",fontSize:18 }
  }, React.createElement("div", { style: {textAlign:"center"} },
    React.createElement("div", { style: {fontSize:36,marginBottom:12} }, "\uD83C\uDFEF"),
    React.createElement("div", null, "\u52A0\u8F7D\u4E2D...")
  ))
}

export default function App() {
  return React.createElement(Suspense, { fallback: React.createElement(Loading) },
    React.createElement(Routes, null,
      React.createElement(Route, { path: "/", element: React.createElement(Home) }),
      React.createElement(Route, { path: "/sandbox", element: React.createElement(Sandbox) }),
      React.createElement(Route, { path: "/editor", element: React.createElement(Editor) })
    )
  )
}
