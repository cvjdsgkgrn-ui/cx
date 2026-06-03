# 个人仪表盘 — 实现计划

> **Goal:** 构建单文件个人仪表盘，包含时钟、天气、待办、引言四个模块，卡片网格响应式布局
> **Architecture:** 单 HTML 文件，Tailwind CSS CDN 负责样式，原生 JS 分四个独立模块
> **Tech Stack:** HTML5 + Tailwind CSS @4 CDN + Vanilla JS + Open-Meteo API + localStorage

---

## 文件结构

| 文件 | 职责 |
|------|------|
| dashboard.html | 唯一文件，包含 HTML 骨架、Tailwind CDN、四个 JS 模块 |

---

### Task 1: HTML 骨架 + 时钟模块

**Files:**
- Create: F:\cx\dashboard.html

- [ ] **Step 1: 创建完整 HTML 骨架**

写入 F:\cx\dashboard.html：

`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>个人仪表盘</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center transition-colors duration-1000" id="body">
  <div class="w-full max-w-4xl mx-auto p-4 md:p-8">
    <!-- 时钟 -->
    <div class="text-center mb-8">
      <div id="clock" class="text-6xl md:text-8xl font-light tracking-widest tabular-nums">00:00:00</div>
      <div id="date" class="text-lg md:text-xl text-slate-400 mt-2">加载中...</div>
    </div>
    <!-- 卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <!-- 天气卡片 -->
      <div class="bg-white/10 backdrop-blur rounded-2xl p-6" id="weather-card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm uppercase tracking-wider text-slate-400">天气</h2>
          <span class="text-xs text-slate-500" id="weather-location">定位中...</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-5xl" id="weather-icon">⏳</span>
          <div>
            <div class="text-3xl font-light" id="weather-temp">-- C</div>
            <div class="text-sm text-slate-400 mt-1">
              <span id="weather-humidity">湿度 --</span> | 
              <span id="weather-wind">风速 --</span>
            </div>
          </div>
        </div>
        <div id="weather-error" class="hidden text-xs text-red-400 mt-3"></div>
      </div>
      <!-- 待办卡片 -->
      <div class="bg-white/10 backdrop-blur rounded-2xl p-6" id="todo-card">
        <h2 class="text-sm uppercase tracking-wider text-slate-400 mb-3">待办</h2>
        <div class="flex gap-2 mb-4">
          <input id="todo-input" type="text" placeholder="添加新待办..."
            class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 transition">
          <button id="todo-add" class="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm transition">+</button>
        </div>
        <ul id="todo-list" class="space-y-2 max-h-64 overflow-y-auto"></ul>
        <div class="text-xs text-slate-500 mt-3 text-center" id="todo-count">共 0 项</div>
      </div>
      <!-- 引言卡片 — 横跨两列 -->
      <div class="bg-white/10 backdrop-blur rounded-2xl p-6 md:col-span-2" id="quote-card">
        <p class="text-lg md:text-xl text-slate-300 italic leading-relaxed text-center transition-opacity duration-500" id="quote-text"></p>
        <p class="text-xs text-slate-500 text-center mt-2" id="quote-author"></p>
      </div>
    </div>
  </div>
  <script>
    // === 模块代码见后续步骤 ===
  </script>
</body>
</html>
`

- [ ] **Step 2: 时钟 JS**

替换 <script> 内注释为：

`js
// === 时钟模块 ===
function updateClock() {
  var now = new Date();
  var time = now.toLocaleTimeString('zh-CN', { hour12: false });
  document.getElementById('clock').textContent = time;
  var opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  document.getElementById('date').textContent = now.toLocaleDateString('zh-CN', opts);
  var hour = now.getHours();
  var body = document.getElementById('body');
  if (hour >= 18 || hour < 6) {
    body.classList.remove('from-slate-900', 'to-slate-800');
    body.classList.add('from-indigo-950', 'to-slate-950');
  } else {
    body.classList.remove('from-indigo-950', 'to-slate-950');
    body.classList.add('from-slate-900', 'to-slate-800');
  }
}
updateClock();
setInterval(updateClock, 1000);
`

- [ ] **Step 3: 验证时钟**

浏览器打开 F:\cx\dashboard.html：
Expected: 时钟每秒刷新，中文日期显示，夜间 18:00 后背景变暗

---

### Task 2: 天气模块

**Files:**
- Modify: F:\cx\dashboard.html — 追加天气 JS

- [ ] **Step 1: 追加天气 JS**

在时钟模块代码之后追加：

`js
// === 天气模块 ===
var WMO_CODES = {
  0: '\u2600\uFE0F', 1: '\uD83C\uDF24\uFE0F', 2: '\u26C5', 3: '\u2601\uFE0F',
  45: '\uD83C\uDF2B\uFE0F', 48: '\uD83C\uDF2B\uFE0F',
  51: '\uD83C\uDF26\uFE0F', 53: '\uD83C\uDF26\uFE0F', 55: '\uD83C\uDF27\uFE0F',
  61: '\uD83C\uDF27\uFE0F', 63: '\uD83C\uDF27\uFE0F', 65: '\uD83C\uDF27\uFE0F',
  71: '\u2744\uFE0F', 73: '\u2744\uFE0F', 75: '\u2744\uFE0F',
  80: '\uD83C\uDF26\uFE0F', 81: '\uD83C\uDF27\uFE0F', 82: '\u26C8\uFE0F',
  95: '\u26C8\uFE0F', 96: '\u26C8\uFE0F', 99: '\u26C8\uFE0F'
};

function fetchWeather(lat, lon) {
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto';
  fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var c = data.current;
      document.getElementById('weather-icon').textContent = WMO_CODES[c.weather_code] || '\uD83C\uDF08';
      document.getElementById('weather-temp').textContent = c.temperature_2m + '\u00B0C';
      document.getElementById('weather-humidity').textContent = '\u6E7F\u5EA6 ' + c.relative_humidity_2m + '%';
      document.getElementById('weather-wind').textContent = '\u98CE\u901F ' + c.wind_speed_10m + 'm/s';
      document.getElementById('weather-location').textContent = '\u4E0A\u6D77';
      localStorage.setItem('weather_cache', JSON.stringify({
        temp: c.temperature_2m, humidity: c.relative_humidity_2m,
        wind: c.wind_speed_10m, code: c.weather_code, time: Date.now()
      }));
    })
    .catch(function() {
      document.getElementById('weather-error').textContent = '\u26A0 \u65E0\u6CD5\u83B7\u53D6\u5929\u6C14\u6570\u636E';
      document.getElementById('weather-error').classList.remove('hidden');
    });
}

function loadWeather() {
  var cached = localStorage.getItem('weather_cache');
  if (cached) {
    var c = JSON.parse(cached);
    document.getElementById('weather-icon').textContent = WMO_CODES[c.code] || '\uD83C\uDF08';
    document.getElementById('weather-temp').textContent = c.temp + '\u00B0C';
    document.getElementById('weather-humidity').textContent = '\u6E7F\u5EA6 ' + c.humidity + '%';
    document.getElementById('weather-wind').textContent = '\u98CE\u901F ' + c.wind + 'm/s';
    if (Date.now() - c.time > 30 * 60 * 1000) {
      document.getElementById('weather-error').textContent = '\u26A0 \u6570\u636E\u53EF\u80FD\u5DF2\u8FC7\u671F';
      document.getElementById('weather-error').classList.remove('hidden');
    }
  }
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      function(pos) { fetchWeather(pos.coords.latitude, pos.coords.longitude); },
      function() { fetchWeather(31.23, 121.47); }
    );
  } else {
    fetchWeather(31.23, 121.47);
  }
}
loadWeather();
setInterval(loadWeather, 30 * 60 * 1000);
`

- [ ] **Step 2: 验证天气**

刷新浏览器：
Expected: 显示温度、湿度、风速，emoji 天气图标；拒绝定位后回退上海

---

### Task 3: 待办模块

**Files:**
- Modify: F:\cx\dashboard.html — 追加待办 JS

- [ ] **Step 1: 追加待办 JS**

在天气模块之后追加：

`js
// === 待办模块 ===
function loadTodos() {
  var raw = localStorage.getItem('dashboard_todos');
  return raw ? JSON.parse(raw) : [];
}
function saveTodos(todos) {
  localStorage.setItem('dashboard_todos', JSON.stringify(todos));
}
function renderTodos() {
  var todos = loadTodos();
  var list = document.getElementById('todo-list');
  list.innerHTML = '';
  var done = 0;
  todos.forEach(function(t, i) {
    var li = document.createElement('li');
    li.className = 'flex items-center gap-2 group';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.className = 'accent-emerald-500 cursor-pointer';
    cb.addEventListener('change', function() {
      todos[i].done = cb.checked;
      saveTodos(todos);
      renderTodos();
    });
    var span = document.createElement('span');
    span.textContent = t.text;
    span.className = 'flex-1 text-sm ' + (t.done ? 'line-through text-slate-500' : '');
    var del = document.createElement('button');
    del.textContent = '\u00D7';
    del.className = 'text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs';
    del.addEventListener('click', function() {
      todos.splice(i, 1);
      saveTodos(todos);
      renderTodos();
    });
    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(del);
    list.appendChild(li);
    if (t.done) done++;
  });
  document.getElementById('todo-count').textContent = '\u5DF2\u5B8C\u6210 ' + done + ' / \u5171 ' + todos.length;
  if (todos.length === 0) {
    list.innerHTML = '<li class="text-slate-600 text-sm text-center py-4">\u8FD8\u6CA1\u6709\u5F85\u529E\uFF0C\u6DFB\u52A0\u4E00\u4E2A\u5427 \u2728</li>';
    document.getElementById('todo-count').textContent = '\u5171 0 \u9879';
  }
}
document.getElementById('todo-add').addEventListener('click', function() {
  var input = document.getElementById('todo-input');
  var text = input.value.trim();
  if (!text) return;
  var todos = loadTodos();
  todos.push({ text: text, done: false });
  saveTodos(todos);
  input.value = '';
  renderTodos();
});
document.getElementById('todo-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('todo-add').click();
});
renderTodos();
`

- [ ] **Step 2: 验证待办**

刷新浏览器：
Expected: 可添加/勾选/删除待办；刷新后数据保持；空列表显示引导文案

---

### Task 4: 引言模块

**Files:**
- Modify: F:\cx\dashboard.html — 追加引言 JS

- [ ] **Step 1: 追加引言 JS**

在待办 JS 之后追加：

`js
// === 引言模块 ===
var QUOTES = [
  { text: '\u5B8C\u6210\u6BD4\u5B8C\u7F8E\u66F4\u91CD\u8981\u3002', author: 'Sheryl Sandberg' },
  { text: '\u7B80\u5355\u662F\u7EC8\u6781\u7684\u590D\u6742\u3002', author: '\u8FBE\u82AC\u5947' },
  { text: '\u884C\u52A8\u662F\u6CBB\u6108\u6050\u60E7\u7684\u826F\u836F\u3002', author: '\u5A01\u5EC9\u00B7\u8A79\u59C6\u65AF' },
  { text: '\u4E0D\u79EF\u8DB4\u6B65\uFF0C\u65E0\u4EE5\u81F3\u5343\u91CC\u3002', author: '\u8340\u5B50' },
  { text: '\u4EE3\u7801\u662F\u5199\u7ED9\u4EBA\u770B\u7684\uFF0C\u987A\u5E26\u80FD\u5728\u673A\u5668\u4E0A\u8FD0\u884C\u3002', author: 'Harold Abelson' },
  { text: '\u5C11\u5373\u662F\u591A\u3002', author: '\u5BC6\u65AF\u00B7\u51E1\u5FB7\u7F57' },
  { text: '\u6700\u597D\u7684\u4EE3\u7801\u662F\u6CA1\u6709\u4EE3\u7801\u3002', author: 'Jeff Atwood' },
  { text: '\u4E13\u6CE8\u662F\u628A\u4E00\u4EF6\u4E8B\u505A\u5230\u6781\u81F4\u3002', author: '\u4E54\u5E03\u65AF' },
  { text: '\u4E0D\u8981\u91CD\u590D\u81EA\u5DF1\u3002', author: 'Andy Hunt' },
  { text: '\u6E05\u6670\u7684\u4EE3\u7801\u4E0D\u9700\u8981\u6CE8\u91CA\u3002', author: 'Robert C. Martin' },
  { text: '\u5148\u8BA9\u5B83\u53EF\u4EE5\u8FD0\u884C\uFF0C\u518D\u8BA9\u5B83\u6B63\u786E\uFF0C\u6700\u540E\u8BA9\u5B83\u5FEB\u3002', author: 'Kent Beck' },
  { text: '\u8C03\u8BD5\u662F\u5199\u4EE3\u7801\u7684\u4E24\u500D\u96BE\u3002', author: 'Brian Kernighan' },
  { text: '\u7A0B\u5E8F\u5FC5\u987B\u9996\u5148\u4E3A\u4EBA\u7C7B\u7F16\u5199\u3002', author: 'Donald Knuth' },
  { text: '\u4ECA\u5929\u662F\u4F59\u751F\u7B2C\u4E00\u5929\u3002', author: '\u4F5A\u540D' },
  { text: '\u79CD\u4E00\u68F5\u6811\u6700\u597D\u7684\u65F6\u95F4\u662F\u5341\u5E74\u524D\uFF0C\u5176\u6B21\u662F\u73B0\u5728\u3002', author: '\u975E\u6D32\u8C1A\u8BED' },
  { text: '\u5DE5\u6B32\u5584\u5176\u4E8B\uFF0C\u5FC5\u5148\u5229\u5176\u5668\u3002', author: '\u5B54\u5B50' },
  { text: '\u5343\u91CC\u4E4B\u884C\uFF0C\u59CB\u4E8E\u8DB3\u4E0B\u3002', author: '\u8001\u5B50' },
  { text: '\u77E5\u4E4B\u4E3A\u77E5\u4E4B\uFF0C\u4E0D\u77E5\u4E3A\u4E0D\u77E5\uFF0C\u662F\u77E5\u4E5F\u3002', author: '\u5B54\u5B50' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' }
];

function pickQuote() {
  var last = localStorage.getItem('last_quote_index');
  var idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); }
  while (QUOTES.length > 1 && idx === parseInt(last));
  localStorage.setItem('last_quote_index', idx);
  return QUOTES[idx];
}

var quote = pickQuote();
document.getElementById('quote-text').textContent = '\u201C' + quote.text + '\u201D';
document.getElementById('quote-author').textContent = '\u2014 ' + quote.author;
`

- [ ] **Step 2: 验证引言**

刷新 3 次：
Expected: 每次显示不同引言，不连续重复

---

### Task 5: 最终检查

- [ ] **Step 1: 对照 spec 逐项验证**

| 需求 | 预期 |
|------|------|
| 时钟每秒刷新 + 中文日期 | ✅ |
| 天气 API + geolocation + 缓存 | ✅ |
| 待办增删勾选 + 持久化 | ✅ |
| 引言随机 + 防重复 | ✅ |
| 响应式 sm/md/lg | ✅ |
| 夜间模式 18:00-6:00 | ✅ |
| 离线天气缓存提示 | ✅ |
| 待办空状态 | ✅ |
| 定位拒接不阻塞 | ✅ |
