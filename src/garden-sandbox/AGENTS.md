# 苏州园林 AI 沙箱 — AGENTS.md

## 项目概述
- 全国第八届大学生艺术展演 · 艺术实践工作坊
- 主题：艺术与科技 × 香山帮营造技艺
- 苏州园林 3D 沙箱 + AI 角色自主对话 + 场景编辑器

## 目录结构
```
garden-sandbox/
  📁 v1-legacy/              ← v1.x 旧版单文件 HTML (已废弃，仅供参考)
      index.html              — 340KB 单文件完整版
      editor.html             — 场景编辑器
      launcher.html           — 启动器
      scene_data/             — 旧版场景数据
      _build_*.py             — 旧版构建脚本 (临时)
  📁 v2-react/               ← v2.5 (2026-06-04) — 当前版本: React + Three.js + Vite
      src/
        pages/    Home.jsx    — 首页二选一 (沙箱 / 编辑器)
                  Sandbox.jsx — 3D鸟瞰 + 2D小地图 + POV + 对话
                  Editor.jsx  — 瓦片地图编辑器
        components/ GardenScene.jsx       — 3D场景 (预设+自定义)
                    CharacterSystem.jsx   — 陶俑角色模型+标签+气泡
                    POVRenderer.jsx       — 第三人称视角渲染
                    AddCharacterDialog.jsx— 创建角色弹窗
                    CharacterPOV.jsx      — POV辅助
                    TimelinePanel.jsx     — 时间线面板
        store/    gameData.js — 预设角色/POI/知识卡片/常量
        utils/    ai.js       — DeepSeek API
                  pathfinding.js — A*寻路+碰撞
      public/    — 静态资源 (天空盒/HDR/图标)
      dist/      — build产物
  📄 AGENTS.md               ← 本文件
  🖼️ garden_sky.jpg          — 天空盒纹理
  🖼️ autumn_park_2k.hdr      — HDR环境光
  🖼️ placeholder_sky.jpg     — 备用天空
```

## 版本历史

### v2.5.1 (2026-06-04) — 当前
- 修复 tick 函数括号不平衡导致的角色不说话/寻路逻辑错误
- 重构休息+寻路流程: 到达→休息(15-50tick)→醒来→选POI→寻路
- 休息时保留观察和对话能力

### v2.5 (2026-06-04) — 
- React 19.2 + React Router 7.5
- @react-three/fiber 9 + @react-three/drei 10 + Three 0.174
- Vite 6.2
- 陶俑风格角色: 球头+扁圆柱身+斗笠+底座
- 预设角色 (老周/小林/芸娘, 不可删除)
- 3D鸟瞰 + 2D小地图 + 第三人称POV
- 场景编辑器: 瓦片绘制 → localStorage → 沙箱联动
- DeepSeek API 对话生成 (用户自行输入Key)
- 编码: UTF-8

### v1.x (2026-05-30~06-02) — 已废弃
- 单文件 HTML + Three.js CDN
- Canvas 2D 小地图
- 基础角色移动和对话

## 启动方式
```powershell
cd F:/cx/src/garden-sandbox/v2-react
npx vite build                    # 构建
npx vite preview --port 8080      # 启动
# 访问 http://127.0.0.1:8080/sandbox
```

## API 配置
- 在沙箱右上角⚙设置面板输入 DeepSeek API Key
- API URL: https://api.deepseek.com/v1/chat/completions
- Key 不存储在代码中，用户自行填入

## 关键约束
- UTF-8 编码 (PowerShell: Set-Content -Encoding UTF8)
- 无 StrictMode (防止 Canvas 双重挂载白屏)
- 预设角色 ID (wa/mu/you) 不可删除
- 角色靠近 (CONVERSE_DIST=5) 且冷却 (30s) 后才触发对话
- Vite proxy /api/deepseek → api.deepseek.com

## 用户偏好记录
- 3D 鸟瞰 + 2D 小地图，左侧上下分布
- 角色自主移动，用户可标记目的地
- 陶俑风格角色，展演友好
- 对话只在角色靠近时触发
- 预设角色不可删除，自定义角色可删
- 新手教程引导 (待完善)
- 角色寻路优化 (待完善)



