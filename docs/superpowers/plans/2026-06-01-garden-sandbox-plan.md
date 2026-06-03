# 苏州园林 AI 沙箱 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个单文件 Web Demo：苏州园林 3D 沙箱，AI 匠人在园林中漫游、感知景色、彼此对话。

**Architecture:** 单文件 HTML，CDN 引入 Three.js。CSS Grid 三栏布局（鸟瞰图 | 感知/对话流 | POV 3D 视角）。LLM API 通过 fetch 直接调用生成角色感受和对话。

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), Three.js (CDN), Canvas 2D, OpenAI-compatible API

---

### Task 1: 项目骨架 — HTML 结构 + CSS Grid 布局

**Files:**
- Create: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 创建目录**

```powershell
New-Item -ItemType Directory -Force -Path "F:\cx\garden-sandbox"
```

- [ ] **Step 2: 写入基础 HTML 骨架和 CSS Grid 三栏布局**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>苏州园林 AI 沙箱</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a2e; font-family: "Microsoft YaHei", sans-serif; overflow: hidden; height: 100vh; }
  #app {
    display: grid;
    grid-template-columns: 40fr 60fr;
    grid-template-rows: 60fr 40fr;
    height: 100vh;
    gap: 4px;
    padding: 4px;
  }
  #map-panel {
    grid-row: 1 / 3;
    background: #16213e;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  #map-canvas { width: 100%; height: 100%; }
  #info-panel {
    background: #0f3460;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  #character-tabs {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: rgba(0,0,0,0.2);
  }
  .char-tab {
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: #ccc;
    background: rgba(255,255,255,0.08);
    font-size: 13px;
    transition: all 0.2s;
  }
  .char-tab.active { background: rgba(255,255,255,0.2); color: #fff; }
  .char-tab:hover { background: rgba(255,255,255,0.15); }
  #text-stream {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    color: #d0d0d0;
    font-size: 13px;
    line-height: 1.8;
  }
  .stream-msg {
    margin-bottom: 10px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
    border-left: 3px solid transparent;
  }
  .stream-msg.feeling { border-left-color: #e2b04a; }
  .stream-msg.dialogue { border-left-color: #4ecdc4; }
  .msg-speaker { font-weight: bold; margin-bottom: 2px; }
  #pov-panel {
    background: #0f3460;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  #pov-container { width: 100%; height: 100%; }
  #api-config {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 100;
    display: flex;
    gap: 6px;
  }
  #api-config input {
    padding: 5px 8px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #222;
    color: #eee;
    font-size: 12px;
    width: 200px;
  }
  #api-config button {
    padding: 5px 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    background: #4ecdc4;
    color: #111;
    font-size: 12px;
  }
</style>
</head>
<body>
<div id="api-config">
  <input id="api-key" type="password" placeholder="API Key">
  <input id="api-url" value="https://api.openai.com/v1/chat/completions" placeholder="API URL">
  <button id="api-save">保存</button>
</div>
<div id="app">
  <div id="map-panel">
    <canvas id="map-canvas"></canvas>
  </div>
  <div id="info-panel">
    <div id="character-tabs"></div>
    <div id="text-stream"></div>
  </div>
  <div id="pov-panel">
    <div id="pov-container"></div>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 3: 浏览器打开验证** — 双击 `index.html`，确认三栏布局显示正常（深色面板）

---

### Task 2: Three.js 场景 — 天空盒 + 地面 + 光照

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 在 `</body>` 前引入 Three.js CDN 和场景初始化脚本**

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
  }
}
</script>
<script type="module">
import * as THREE from "three";

// ===== 全局状态 =====
const SCENE_SIZE = 30;
const COLOR_SKY_TOP = 0x87CEEB;
const COLOR_SKY_BOTTOM = 0xe0e8d0;
const COLOR_GROUND = 0x5a7d4a;

// ===== Three.js 场景 =====
const povContainer = document.getElementById("pov-container");
const povRenderer = new THREE.WebGLRenderer({ antialias: true });
povRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
povRenderer.shadowMap.enabled = true;
povContainer.appendChild(povRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLOR_SKY_BOTTOM);
scene.fog = new THREE.Fog(COLOR_SKY_BOTTOM, 40, 80);

// 天空渐变（用大球体模拟）
const skyGeo = new THREE.SphereGeometry(60, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(COLOR_SKY_TOP) },
    bottomColor: { value: new THREE.Color(COLOR_SKY_BOTTOM) },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
    }
  `,
  side: THREE.BackSide,
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// 地面
const groundGeo = new THREE.PlaneGeometry(SCENE_SIZE * 2, SCENE_SIZE * 2);
const groundMat = new THREE.MeshStandardMaterial({ color: COLOR_GROUND, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 光照
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(20, 30, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 100;
sunLight.shadow.camera.left = -40;
sunLight.shadow.camera.right = 40;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;
scene.add(sunLight);

// 相机
const povCamera = new THREE.PerspectiveCamera(65, 1, 0.5, 100);
povCamera.position.set(0, 1.5, 0);

// 响应式
function resizePOV() {
  const rect = povContainer.getBoundingClientRect();
  povRenderer.setSize(rect.width, rect.height);
  povCamera.aspect = rect.width / Math.max(rect.height, 1);
  povCamera.updateProjectionMatrix();
}
window.addEventListener("resize", resizePOV);
resizePOV();
</script>
```

- [ ] **Step 2: 在 `</script>` 前加入渲染循环**

```javascript
function animate() {
  requestAnimationFrame(animate);
  povRenderer.render(scene, povCamera);
}
animate();
```

- [ ] **Step 3: 浏览器验证** — 右下 POV 面板显示绿色地面 + 渐变天空

---

### Task 3: 角色建模 — 球体 + 四棱锥 + 颜色区分

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 在 `<script type="module">` 内，全局状态区域添加角色定义**

```javascript
// ===== 角色定义 =====
const CHARACTERS = [
  {
    id: "wa", name: "老周", role: "瓦工",
    color: 0xB75C3A, hexColor: "#B75C3A",
    personality: "香山帮瓦工，四十多岁，专注飞檐翘角与瓦当铺设，手上全是老茧",
  },
  {
    id: "mu", name: "阿木", role: "木匠",
    color: 0xC4956A, hexColor: "#C4956A",
    personality: "香山帮木匠，三十岁出头，精通榫卯结构，喜欢琢磨梁架",
  },
  {
    id: "hua", name: "墨池", role: "画师",
    color: 0x6B8E7A, hexColor: "#6B8E7A",
    personality: "游历苏州各园的画师，痴迷园林构图与借景手法，随身带着速写本",
  },
];

const characters = [];
let selectedCharacter = null;
```

- [ ] **Step 2: 添加角色创建函数**

```javascript
// ===== 角色创建 =====
function createCharacterMesh(data) {
  const group = new THREE.Group();

  // 身体：四棱锥（用 ConeGeometry，4 边 = 四棱锥）
  const bodyGeo = new THREE.ConeGeometry(0.35, 0.8, 4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // 头：球体
  const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.4 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.1;
  head.castShadow = true;
  group.add(head);

  // 帽子（小圆盘）
  const hatGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.08, 16);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.28;
  group.add(hat);

  group.position.set(
    (Math.random() - 0.5) * SCENE_SIZE * 0.7,
    0,
    (Math.random() - 0.5) * SCENE_SIZE * 0.7
  );

  return group;
}
```

- [ ] **Step 3: 初始化角色并加入场景**

```javascript
// 初始化角色
CHARACTERS.forEach((def) => {
  const mesh = createCharacterMesh(def);
  scene.add(mesh);
  const charObj = {
    ...def,
    mesh,
    target: null,
    state: "wander",
    wanderDir: Math.random() * Math.PI * 2,
    observeTimer: 5 + Math.random() * 5,
    speed: 0.03 + Math.random() * 0.02,
  };
  characters.push(charObj);
});
selectedCharacter = characters[0];
```

- [ ] **Step 4: 浏览器验证** — POV 面板中出现 3 个彩色几何体角色（赭石、木色、青灰），地面上随机分布

---

### Task 4: 角色移动 — 漫游 + 右键导航

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 在角色初始化代码后，添加移动更新函数**

```javascript
// ===== 角色移动 =====
const HALF = SCENE_SIZE - 2;

function updateCharacterMovement(char) {
  if (char.target) {
    // 导航模式
    const dx = char.target.x - char.mesh.position.x;
    const dz = char.target.z - char.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.3) {
      char.target = null;
      char.state = "wander";
      char.wanderDir = Math.random() * Math.PI * 2;
    } else {
      char.mesh.position.x += (dx / dist) * char.speed;
      char.mesh.position.z += (dz / dist) * char.speed;
      char.mesh.rotation.y = Math.atan2(dx, dz);
      char.state = "navigate";
    }
  } else {
    // 漫游模式
    char.mesh.position.x += Math.sin(char.wanderDir) * char.speed * 0.5;
    char.mesh.position.z += Math.cos(char.wanderDir) * char.speed * 0.5;
    char.mesh.rotation.y = char.wanderDir;

    // 边界反弹
    if (Math.abs(char.mesh.position.x) > HALF) {
      char.wanderDir = Math.PI - char.wanderDir;
      char.mesh.position.x = Math.sign(char.mesh.position.x) * HALF;
    }
    if (Math.abs(char.mesh.position.z) > HALF) {
      char.wanderDir = -char.wanderDir;
      char.mesh.position.z = Math.sign(char.mesh.position.z) * HALF;
    }

    // 偶尔随机转向
    if (Math.random() < 0.005) {
      char.wanderDir += (Math.random() - 0.5) * Math.PI * 0.5;
    }
    char.state = "wander";
  }
}
```

- [ ] **Step 2: 在 animate() 中调用移动更新**

```javascript
function animate() {
  requestAnimationFrame(animate);

  // 更新所有角色
  characters.forEach(updateCharacterMovement);

  povRenderer.render(scene, povCamera);
}
```

- [ ] **Step 3: 浏览器验证** — 3 个角色在绿色地面上缓缓走动，碰到边界会转向

---

### Task 5: 鸟瞰地图 — Canvas 2D + 角色位置同步

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 获取 Canvas 上下文并添加绘制函数**

```javascript
// ===== 鸟瞰地图 =====
const mapCanvas = document.getElementById("map-canvas");
const mapCtx = mapCanvas.getContext("2d");

function resizeMap() {
  const rect = mapCanvas.parentElement.getBoundingClientRect();
  mapCanvas.width = rect.width;
  mapCanvas.height = rect.height;
}
window.addEventListener("resize", resizeMap);
resizeMap();

function drawMap() {
  const w = mapCanvas.width;
  const h = mapCanvas.height;
  mapCtx.clearRect(0, 0, w, h);

  // 背景
  mapCtx.fillStyle = "#1a3a1a";
  mapCtx.fillRect(0, 0, w, h);

  // 园林简图：围墙
  const scale = Math.min(w, h) / (SCENE_SIZE * 2);
  const ox = w / 2;
  const oy = h / 2;

  mapCtx.strokeStyle = "#4a7a4a";
  mapCtx.lineWidth = 3;
  mapCtx.strokeRect(ox - SCENE_SIZE * scale, oy - SCENE_SIZE * scale, SCENE_SIZE * 2 * scale, SCENE_SIZE * 2 * scale);

  // 水面示意（椭圆）
  mapCtx.fillStyle = "rgba(60, 120, 180, 0.4)";
  mapCtx.beginPath();
  mapCtx.ellipse(ox + 3 * scale, oy - 2 * scale, 5 * scale, 3 * scale, 0, 0, Math.PI * 2);
  mapCtx.fill();

  // 建筑示意（矩形）
  mapCtx.fillStyle = "rgba(180, 150, 120, 0.5)";
  mapCtx.fillRect(ox - 8 * scale, oy - 6 * scale, 4 * scale, 4 * scale);
  mapCtx.fillRect(ox + 5 * scale, oy + 3 * scale, 3 * scale, 3 * scale);
  mapCtx.fillRect(ox - 2 * scale, oy + 5 * scale, 5 * scale, 3 * scale);

  // 路径
  mapCtx.strokeStyle = "rgba(200, 180, 150, 0.4)";
  mapCtx.lineWidth = 1;
  mapCtx.setLineDash([4, 4]);
  mapCtx.beginPath();
  mapCtx.moveTo(ox - 8 * scale, oy - 6 * scale);
  mapCtx.lineTo(ox - 2 * scale, oy + 5 * scale);
  mapCtx.stroke();
  mapCtx.setLineDash([]);

  // 角色圆点
  const pointRadius = 8;
  characters.forEach((char) => {
    const px = ox + char.mesh.position.x * scale;
    const py = oy + char.mesh.position.z * scale;

    // 外圈光晕
    mapCtx.beginPath();
    mapCtx.arc(px, py, pointRadius + 4, 0, Math.PI * 2);
    mapCtx.fillStyle = char === selectedCharacter ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
    mapCtx.fill();

    // 角色圆点
    mapCtx.beginPath();
    mapCtx.arc(px, py, pointRadius, 0, Math.PI * 2);
    mapCtx.fillStyle = char.hexColor;
    mapCtx.fill();

    // 名称标签
    mapCtx.fillStyle = "#fff";
    mapCtx.font = "11px Microsoft YaHei";
    mapCtx.textAlign = "center";
    mapCtx.fillText(char.name, px, py - pointRadius - 6);
  });
}
```

- [ ] **Step 2: 在 animate() 中调用绘制**

```javascript
function animate() {
  requestAnimationFrame(animate);
  characters.forEach(updateCharacterMovement);
  drawMap();
  povRenderer.render(scene, povCamera);
}
```

- [ ] **Step 3: 浏览器验证** — 左侧鸟瞰地图显示园林简图，3 个彩色圆点随角色移动实时更新

---

### Task 6: POV 视角切换 + 鸟瞰交互

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 添加 POV 相机跟随 & 鸟瞰图点击选中/右键导航**

```javascript
// ===== POV 跟随选中角色 =====
function updatePOV() {
  if (!selectedCharacter) return;
  const pos = selectedCharacter.mesh.position;
  povCamera.position.set(pos.x, 1.5, pos.z);
  povCamera.rotation.set(0, selectedCharacter.mesh.rotation.y, 0);
}

// ===== 鸟瞰图交互 =====
mapCanvas.addEventListener("click", (e) => {
  const rect = mapCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const scale = Math.min(mapCanvas.width, mapCanvas.height) / (SCENE_SIZE * 2);
  const ox = mapCanvas.width / 2;
  const oy = mapCanvas.height / 2;

  // 检测点击了哪个角色
  for (const char of characters) {
    const px = ox + char.mesh.position.x * scale;
    const py = oy + char.mesh.position.z * scale;
    const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
    if (dist < 14) {
      selectedCharacter = char;
      // updateTabs() will be fully defined in Task 9; stub here
      if (typeof updateTabs === "function") updateTabs();
      return;
    }
  }
});

mapCanvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (!selectedCharacter) return;
  const rect = mapCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const scale = Math.min(mapCanvas.width, mapCanvas.height) / (SCENE_SIZE * 2);
  const ox = mapCanvas.width / 2;
  const oy = mapCanvas.height / 2;

  selectedCharacter.target = {
    x: (mx - ox) / scale,
    z: (my - oy) / scale,
  };
});
```

- [ ] **Step 2: 在 animate() 中调用 updatePOV()**

```javascript
function animate() {
  requestAnimationFrame(animate);
  characters.forEach(updateCharacterMovement);
  updatePOV();
  drawMap();
  povRenderer.render(scene, povCamera);
}
```

- [ ] **Step 3: 浏览器验证** — 左下 POV 视角跟随选中角色；左键单击地图圆点切换角色；右键标目的地，角色走向目标

---

### Task 7: LLM API 接入 — 感受 + 对话生成

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 添加 API 调用函数和触发逻辑**

```javascript
// ===== LLM API =====
function getAPIConfig() {
  const key = document.getElementById("api-key").value;
  const url = document.getElementById("api-url").value;
  return { key, url };
}

async function callLLM(systemPrompt, userPrompt) {
  const { key, url } = getAPIConfig();
  if (!key) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("LLM error:", e);
    return null;
  }
}
```

- [ ] **Step 2: 添加感受和对话触发逻辑**

```javascript
// ===== 感受 & 对话触发 =====
const LANDMARKS = [
  "飞檐翘角的亭台",
  "曲径通幽的长廊",
  "碧波荡漾的池塘",
  "太湖石堆叠的假山",
  "雕花的漏窗",
  "翠竹掩映的小径",
  "古木参天的庭院",
];
const CONVERSE_DIST = 1.5;
const CONVERSE_COOLDOWN = {};  // "id1-id2" -> timestamp

async function updateCharacterAI(char, dt) {
  // 感受触发
  char.observeTimer -= dt;
  if (char.observeTimer <= 0) {
    char.observeTimer = 8 + Math.random() * 6;
    if (char === selectedCharacter) {
      const landmark = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
      const sysPrompt = `你是一个${char.role}，名叫${char.name}。${char.personality}。你正在苏州园林中漫步，眼前看到的是${landmark}。请用第一人称、口语化中文，说一句看到这景色的感受。一句话，不超过40字。只输出这句话，不要加引号或其他任何内容。`;
      const text = await callLLM(sysPrompt, "眼前是" + landmark);
      if (text) addStreamMessage(char, text, "feeling");
    }
  }

  // 对话触发：检查与其他角色的距离
  for (const other of characters) {
    if (other === char) continue;
    const dx = char.mesh.position.x - other.mesh.position.x;
    const dz = char.mesh.position.z - other.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const pairKey = [char.id, other.id].sort().join("-");
    const now = Date.now();
    if (dist < CONVERSE_DIST && (!CONVERSE_COOLDOWN[pairKey] || now - CONVERSE_COOLDOWN[pairKey] > 15000)) {
      CONVERSE_COOLDOWN[pairKey] = now;
      char.state = "converse";
      other.state = "converse";
      const sysPrompt = `${char.name}（${char.role}：${char.personality}）和${other.name}（${other.role}：${other.personality}）在苏州园林中相遇。请生成一段简短的自然对话（2-3轮），内容围绕香山帮营造技艺或苏州园林美学展开。每轮格式：「角色名：内容」。只输出对话，不要加其他内容。`;
      const text = await callLLM(sysPrompt, "两位匠人在园林中相遇，开始交谈");
      if (text) addStreamMessage(char, text, "dialogue");
    }
  }
}

function addStreamMessage(char, text, type) {
  const stream = document.getElementById("text-stream");
  const div = document.createElement("div");
  div.className = `stream-msg ${type}`;
  div.innerHTML = `<div class="msg-speaker" style="color:${char.hexColor}">${char.name}（${char.role}）</div><div>${text}</div>`;
  stream.appendChild(div);
  stream.scrollTop = stream.scrollHeight;
}
```

- [ ] **Step 3: 在 animate() 中传入 deltaTime 并调用 AI 更新**

```javascript
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  characters.forEach(updateCharacterMovement);
  characters.forEach((c) => updateCharacterAI(c, dt));
  updatePOV();
  drawMap();
  povRenderer.render(scene, povCamera);
}
```

- [ ] **Step 4: 浏览器验证** — 填入 API Key 后，右上角每隔几秒出现选中角色的景色感受；两角色靠近时弹出对话框内容

---

### Task 8: 对话气泡 — CSS Overlay 在 3D 画面上

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 添加气泡 HTML 容器和样式**

```html
<!-- 在 #pov-panel 内，#pov-container 后添加 -->
<div id="speech-bubbles"></div>
```

```css
#speech-bubbles {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 10;
}
.speech-bubble {
  position: absolute;
  background: rgba(0,0,0,0.85);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 200px;
  text-align: center;
  transform: translate(-50%, -100%);
  animation: bubbleFade 3s ease-out forwards;
  white-space: pre-wrap;
}
@keyframes bubbleFade {
  0% { opacity: 0; transform: translate(-50%, -100%) translateY(10px); }
  10% { opacity: 1; transform: translate(-50%, -100%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
```

- [ ] **Step 2: 添加气泡投影函数**

```javascript
// ===== 对话气泡 =====
function showBubble(char, text) {
  const bubbleContainer = document.getElementById("speech-bubbles");
  const bubble = document.createElement("div");
  bubble.className = "speech-bubble";
  bubble.textContent = text;
  bubbleContainer.appendChild(bubble);

  // 3D → 2D 投影
  const pos3D = char.mesh.position.clone();
  pos3D.y += 1.6; // 头顶上方
  pos3D.project(povCamera);

  const rect = povContainer.getBoundingClientRect();
  const sx = (pos3D.x * 0.5 + 0.5) * rect.width;
  const sy = (-pos3D.y * 0.5 + 0.5) * rect.height;

  bubble.style.left = sx + "px";
  bubble.style.top = sy + "px";

  // 3 秒后移除
  setTimeout(() => bubble.remove(), 3000);
}
```

- [ ] **Step 3: 修改 addStreamMessage 同时触发气泡**

在 `addStreamMessage` 调用后增加：
```javascript
// 只对短消息显示气泡（对话第一句）
const shortText = text.length > 50 ? text.slice(0, 48) + "…" : text;
showBubble(char, shortText);
```

- [ ] **Step 4: 浏览器验证** — 角色头顶出现对话气泡，3 秒后淡出消失

---

### Task 9: 文字流面板 + 角色选择器完善

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 添加角色标签切换函数**

```javascript
// ===== 角色标签 =====
function updateTabs() {
  const tabs = document.getElementById("character-tabs");
  tabs.innerHTML = "";
  characters.forEach((char) => {
    const btn = document.createElement("button");
    btn.className = "char-tab" + (char === selectedCharacter ? " active" : "");
    btn.textContent = `${char.name}（${char.role}）`;
    btn.style.borderBottom = `2px solid ${char.hexColor}`;
    btn.addEventListener("click", () => {
      selectedCharacter = char;
      // updateTabs() will be fully defined in Task 9; stub here
      if (typeof updateTabs === "function") updateTabs();
    });
    tabs.appendChild(btn);
  });
}
updateTabs();
```

- [ ] **Step 2: 浏览器验证** — 右上角标签栏显示 3 个角色按钮，点击切换，鸟瞰图高亮同步更新

---

### Task 10: 整合调试 + 交互完善

**Files:**
- Modify: `F:\cx\garden-sandbox\index.html`

- [ ] **Step 1: 添加场景点缀（树木、石头装饰）**

```javascript
// ===== 场景装饰 =====
function addDecorations() {
  // 简易树木
  for (let i = 0; i < 20; i++) {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    tree.add(trunk);

    for (let j = 0; j < 3; j++) {
      const leafGeo = new THREE.ConeGeometry(0.6 - j * 0.2, 0.6, 8);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a6b2a + j * 0x111111 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 1.5 + j * 0.5;
      leaf.castShadow = true;
      tree.add(leaf);
    }

    tree.position.set(
      (Math.random() - 0.5) * SCENE_SIZE * 1.8,
      0,
      (Math.random() - 0.5) * SCENE_SIZE * 1.8
    );
    tree.scale.setScalar(0.5 + Math.random() * 0.5);
    scene.add(tree);
  }

  // 石头
  for (let i = 0; i < 8; i++) {
    const rockGeo = new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.5, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(
      (Math.random() - 0.5) * SCENE_SIZE * 1.6,
      0.1,
      (Math.random() - 0.5) * SCENE_SIZE * 1.6
    );
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}
addDecorations();
```

- [ ] **Step 2: 添加 API 保存按钮逻辑**

```javascript
document.getElementById("api-save").addEventListener("click", () => {
  const key = document.getElementById("api-key").value;
  const url = document.getElementById("api-url").value;
  localStorage.setItem("garden_api_key", key);
  localStorage.setItem("garden_api_url", url);
  alert("API 配置已保存");
});

// 加载已保存的配置
const savedKey = localStorage.getItem("garden_api_key");
const savedUrl = localStorage.getItem("garden_api_url");
if (savedKey) document.getElementById("api-key").value = savedKey;
if (savedUrl) document.getElementById("api-url").value = savedUrl;
```

- [ ] **Step 3: 浏览器全功能验证**

  1. 右侧保存 API Key
  2. 3 个角色在 3D 园林中漫步
  3. 左栏鸟瞰图跟随显示位置
  4. 点击地图圆点切换选中角色
  5. POV 视角切换到选中角色
  6. 右键地图标目的地，角色走向目标
  7. 右下 3D 画面出现对话气泡
  8. 右上角滚动显示感受和对话文字
  9. 点击标签切换角色

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `F:\cx\garden-sandbox\index.html` | 唯一的应用文件，包含全部 HTML/CSS/JS |

