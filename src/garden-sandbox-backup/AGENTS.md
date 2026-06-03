# AGENTS.md - 苏州园林 AI 沙箱

## 编码规则（极其重要！）

**文件编码**：UTF-8 with BOM (utf-8-sig)

**核心原则**：
- HTML 中的中文：直接使用 UTF-8 编码写入（Python 文件保存为 utf-8-sig 后可安全处理中文）
- JS 字符串中的中文：使用 @\uXXXX Unicode 转义序列
- 绝不通过 PowerShell here-string 或 python -c 传递中文——必损坏

## 构建流程（必须严格按顺序！）

```
1. python build_step1.py   → 写入 HTML+CSS (覆盖模式)
2. python build_step2.py   → 追加 JS part1 (角色创建/场景/摄像机)
3. python build_step3.py   → 追加 JS part2 (移动/AI/POV/LLM)
4. python build_step4.py   → 追加 JS part3 (气泡/标签/地图/渲染循环)
5. python fix_html.py      → 后处理：把 HTML 部分的 \uXXXX 转换成实际 UTF-8 中文
```

## 文件清单
- F:\cx\src\garden-sandbox\index.html - 主文件
- F:\cx\src\garden-sandbox\build_step1.py - HTML+CSS 构建
- F:\cx\src\garden-sandbox\build_step2.py - JS 第1部分
- F:\cx\src\garden-sandbox\build_step3.py - JS 第2部分
- F:\cx\src\garden-sandbox\build_step4.py - JS 第3部分
- F:\cx\src\garden-sandbox\fix_html.py - HTML 后处理
- F:\cx\src\garden-sandbox\rebuild.py - 旧版一次性构建（已废弃，勿用）

## 技术栈
- Three.js 0.160 (CDN: unpkg, 经典 <script type="module"> 模式)
- DeepSeek V4 Pro API
- 纯前端，无构建工具

