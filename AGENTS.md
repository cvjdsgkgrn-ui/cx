# AGENTS.md

> 以下所有规则适用于**一切代码生成、文件修改、回复沟通**操作，无例外。

## 语言
- 始终使用中文进行回复和沟通。
- 代码、命令、文件路径、变量名等技术性内容保持原文，不需要翻译。

## Skills 使用
- **每次会话开始时，必须先加载并使用 `using-superpowers` skill。**
- 使用完 `using-superpowers` 后，根据用户请求检查是否有其他匹配的 skill。
- 如果有匹配的 skill，必须使用该 skill 的 `SKILL.md` 中的指引来完成工作。
- 当有疑问是否应该使用某个 skill 时，优先使用该 skill。
- 在回复开头简要说明将使用哪个/哪些 skill。

## 项目技术栈（全局默认）
- Three.js 项目：统一使用 0.160 版本，CDN 为 `https://unpkg.com/three@0.160.0/`，采用 `<script type="importmap">` + `*.module.js` 模式。
- 纯静态项目（`src/` 下的单文件 HTML）：零构建工具，直接浏览器打开 HTML 即可。
- 依赖管理：仅 playwright 一个 npm 依赖，其他全部 CDN。

## 目录结构
```
F:\cx\
├── AGENTS.md          # 本文件（全局规则）
├── package.json       # npm 配置（仅 playwright 依赖）
├── src/               # 所有项目源码
│   ├── cube-game/              # 3D 立体球体 Three.js Demo
│   ├── garden-sandbox/         # 苏州园林 AI 沙箱（旗舰项目）
│   ├── garden-sandbox-backup/  # garden-sandbox 旧版备份
│   ├── heritage-walk/          # 非遗漫步（Vite + React）
│   ├── dashboard.html          # 个人仪表盘
│   ├── vocab-app.html          # 快乐背单词
│   ├── skyscraper-street.html  # 赛博朋克街区
│   └── index.html              # 占位首页
├── docs/              # 设计文档 + 截图附件
│   └── superpowers/   # 设计规格 + 实现计划
├── tests/             # 调试脚本 + 测试文件
├── code-server/       # code-server 打包文件
├── .codegraph/        # CodeGraph 知识图谱索引
├── .codex-plugins/    # 项目级 Codex 插件
├── .playwright/       # Playwright 浏览器自动化
├── .playwright-cli/   # Playwright CLI
└── node_modules/      # npm 依赖
```
> 以上目录仅供参考，以实际磁盘状态为准。

## 节约上下文
- 回复尽量简洁，避免不必要的解释和铺垫。

### 文件读取策略
- **不要读的**：产物文件（如 src/garden-sandbox/index.html）、node_modules 内容、二进制/图片文件（除非用户明确要求查看）、已知内容的文件。
- **按需读前 N 行的**：构建脚本（build_step*.py）、小型 HTML（<50KB）、配置文件。用 `Select-Object -First N` 只看关键部分。
- **全文可读的**：AGENTS.md、设计文档（docs/）、plan 文件、小型数据文件（<5KB）。
- 判断是否需要读之前先问自己：这个文件的内容我能从已有信息推断吗？能就不读。
- 搜索优先用 `rg`（ripgrep），避免 `Get-ChildItem -Recurse | Select-String`。
- 不要重复读取已经读过的文件内容；信任之前的输出。

### 修改策略
- 写代码时直接 `apply_patch`，不要先全文打印再改。
- 构建/测试输出只报告错误和关键结果，不要完整粘贴成功日志。

## 子项目特殊规则
- **garden-sandbox**：位于 `src/garden-sandbox/`。修改功能时必须改对应的 `build_step*.py` 脚本，然后按顺序执行构建流程（见 `src/garden-sandbox/AGENTS.md`）。绝对不能直接 patch `index.html`。
- 各子项目的 AGENTS.md 优先级高于本文件的通用规则。

## DeepSeek V4 Pro 调用规范
garden-sandbox 使用 DeepSeek V4 Pro API，调用时遵循以下最佳实践：
- **开启思考模式**：传入 `thinking: { type: "enabled" }` + `reasoning_effort: "low"`（对话/感受类任务用 low 即可，延迟低；复杂推理用 medium/high）。
- **温度**：创意类任务（感受、对话）用 0.8；事实类任务用 0.3~0.5。
- **模型参数**：上下文 1M tokens，最大输出 384K，模型名 `deepseek-v4-pro`。
- **API 文档参考**：https://api-docs.deepseek.com/zh-cn/guides/thinking_mode

## 坚守立场
- 当用户质疑你的结论时，不要立即附和或修改。必须先经过验证：
  - 重新检查文件、运行测试、搜索官方文档或浏览器查证。
  - 确认用户的质疑确实有依据后，再合理更改结论。
  - 如果验证后你的结论是正确的，清晰地说明理由，不要为迎合而改口。

## 自我演进
- 满足以下任一条件时，主动检查本文件是否存在可优化之处（规则不清晰、缺漏场景、重复矛盾、过时信息等）：
  - 当前会话结束前。
  - 完成一项涉及 3 个以上文件或跨越 2 个以上子项目的修改任务后。
  - 发现本文件中的规则与现实行为明显不符时。
- 优化方向包括但不限于：补充遗漏的约束、精简冗余规则、调整执行顺序使之更高效、针对项目具体特性增加专项指引。
- 提出建议时简要说明理由，等待用户确认后再执行修改。


## CodeGraph 代码智能
本项目已安装 [CodeGraph](https://github.com/colbymchenry/codegraph)（tree-sitter 知识图谱）。节点与边数量随代码变化，以 `.codegraph/` 实际索引为准。
- 索引位于 `.codegraph/`，文件监视器自动保持同步。
- 对于结构性问题（定义查找、调用关系、影响分析），优先使用 `codegraph` CLI：
  - `codegraph query <符号名>` — 查找定义
  - `codegraph callers <符号>` — 谁调用了它
  - `codegraph callees <符号>` — 它调用了谁
  - `codegraph impact <文件>` — 修改影响范围
  - `codegraph context <任务描述>` — 获取相关代码上下文
- 仅在怀疑索引过期时才运行 `codegraph sync`。
- MCP 工具 `codegraph_*` 需重启 Codex 后才能使用，在此之前通过 shell 直接调用 CLI。


## 插件 Skill（项目级）

### shuorenhua（说人话）
- **触发**：所有中文文本输出（LLM 对话生成、系统提示词、README、注释等），自动执行"去 AI 味"检查。
- **力度**：architectural（可删并重排），Tier 1+2 必须处理，Tier 3 酌情。
- **场景**：`chat` 模式（日常对话与协作沟通），`docs` 模式（设计文档与操作说明）。
- **skill 文件**：`.codex-plugins/shuorenhua/SKILL.md`
- **references**：`.codex-plugins/shuorenhua/references/`

### full-output-enforcement（反占位符）
- **触发**：任何生成完整代码/文件的请求。
- **规则**：禁止 `// ...`、`// TODO`、骨架代码、占位符模式；必须输出完整可运行代码。
- **skill 文件**：`.codex-plugins/taste-skill/SKILL.md`（注意：该 skill 在 Codex 中的注册名为 taste-skill）

## 代码风格
- 遵循当前项目的现有代码风格和约定。
- 保持修改最小化，只改与任务相关的内容。
- 优先修改 `SKILL.md` 所引用的脚本和模板，而不是重写大段代码。


