# AGENTS.md — 苏州园林 AI 沙箱 v2.1

## 项目概述
- 全国第八届大学生艺术展演 · 艺术实践工作坊 — "艺术与科技" × 香山帮
- **当前版本: v2.1 — React + Three.js (R3F) + Vite 6 重构**
- 工作目录: `F:/cx/src/garden-sandbox/vite-app/`
- 旧版单文件 HTML (`F:/cx/src/garden-sandbox/index.html`) 已废弃

## 启动命令
```powershell
cd F:/cx/src/garden-sandbox/vite-app
# Dev server (开发，支持 HMR)
node_modules\.bin\vite.cmd --host 127.0.0.1 --port 9090
# 访问 http://127.0.0.1:9090/sandbox

# Build (生产构建)
node_modules\.bin\vite.cmd build
# 产物在 dist/ 目录

# Preview (预览构建产物)
node_modules\.bin\vite.cmd preview --host 127.0.0.1 --port 8080
```

## 版本号
- v2.1 (2026-06-03): React 19 + Vite 6 + R3F/Drei. 去掉 StrictMode, memo 稳定 Canvas, 编辑器联动沙箱, 自定义瓦片3D实体绑定
- v2.0 (2026-06-03): React 19 + Vite 8 + R3F 初始重构
- v1.x: 单文件 HTML + Three.js CDN (已废弃)

## 技术栈
- React 19.2 + React Router 7
- @react-three/fiber 9 + @react-three/drei 10 + Three.js 0.184
- Vite 6.4.3 (Vite 8 与 react-router v7 有兼容问题, 降级)
- DeepSeek API (通过 Vite proxy `/api/deepseek`)

## 文件架构
```
vite-app/src/
  main.jsx              — 入口, BrowserRouter + App
  App.jsx               — 路由: /  /sandbox  /editor
  pages/Home.jsx        — 首页: 进入沙箱 / 场景编辑器 二选一
  pages/Sandbox.jsx     — 主游戏: 3D鸟瞰(StableCanvas) + 2D地图(StableMinimap) + 对话 + POV
  pages/Editor.jsx      — 瓦片地图编辑器, 保存到localStorage, 一键进沙箱
  components/GardenScene.jsx    — 3D场景: 预设模式 + 自定义瓦片模式(DynamicScene)
  components/CharacterSystem.jsx — 陶俑风格角色: 球头+扁圆柱身+斗笠+底座
  components/POVRenderer.jsx     — 第三人称跟随摄像机 Canvas
  components/AddCharacterDialog.jsx — 创建角色弹窗
  store/gameData.js     — 常量: PRESET_CHARACTERS, POIS, CONVERSE_DIST=5, COOLDOWN=30s
  utils/ai.js           — DeepSeek API (走代理 /api/deepseek)
  utils/pathfinding.js  — A*寻路 + setSceneData/getTileData + 池塘障碍 + 自定义瓦片障碍
```

## 关键约束
- **编码**: UTF-8, PowerShell 写文件用 `Set-Content -Encoding UTF8`
- **API Key**: 硬编码 `sk-0d0e8cb1b88140f9a09de82af96922e8`
- **Proxy**: Vite proxy `/api/deepseek/v1/*` → `https://api.deepseek.com/*`
- **Canvas 稳定性**: StableCanvas/StableMinimap 用 `memo` 包裹, 通过 `gameStateRef` 通信
- **无 StrictMode**: 已移除, 防止 Canvas 双重挂载
- **vite 8 → 6**: 因 react-router 兼容性降级

## 编辑器→沙箱流程
1. 首页 → 场景编辑器
2. 画瓦片 (道路/墙壁/水域/亭子/月洞门)
3. "保存并进入沙箱" → localStorage `garden-custom-tilemap`
4. 跳转 `/sandbox?map=custom`
5. Sandbox 加载 tilemap → setSceneData(障碍) + GardenScene(DynamicScene) 渲染实体
6. 亭子/月洞门用 flood-fill 聚合, 避免 25 个重复

## 角色模型
- 陶俑风格: 球头(肤色) + 扁圆柱身(主题色) + 斗笠(扁锥+圆盘, 男蓝女粉) + 底座(土色)
- 无四肢, 无方向点, 整体古朴

## 已知问题和状态
- ✅ 3D场景稳定渲染
- ✅ 角色自动移动/休息/观察/对话
- ✅ DeepSeek API 通过代理正常工作
- ✅ 编辑器瓦片与3D实体绑定
- ✅ POV 第三人称跟随
- ✅ 对话气泡 (修复 hooks 违规问题)
- ⚠️ Three.js shadow map 弃用警告 (无害)
- ⚠️ 浏览器缓存可能导致显示旧版 → 换端口/硬刷新

## 每次修改后检查清单
1. `vite build` 无错误
2. 重启 dev server 换新端口
3. 换端口访问验证
4. 更新本文件版本号和状态
