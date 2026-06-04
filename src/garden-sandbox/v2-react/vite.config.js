import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom", "react-router"]
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "react-router"],
    force: true
  },
  server: {
    headers: {
      "Cache-Control": "no-store"
    },
    proxy: {
      "/api/deepseek": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ""),
        secure: true
      }
    }
  }
})
