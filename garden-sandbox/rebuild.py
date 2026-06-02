# -*- coding: utf-8 -*-
"""Rebuild index.html with correct UTF-8 encoding"""

OUT = r"F:\cx\garden-sandbox\index.html"

# Read current file to extract JS (which uses \uXXXX and is correct)
with open(OUT, "r", encoding="utf-8-sig") as f:
    current = f.read()

# Extract JS portion
js_start = current.find("<script>")
js_end = current.find("</html>")
js_part = current[js_start:js_end]

# Chinese strings (from this UTF-8 .py file)
TITLE = "苏州园林 AI 沙箱"
SETTINGS = "设置"
SAVE = "保存"
ADD_TITLE = "添加新角色"
NAME_LABEL = "角色名"
NAME_PH = "如：老李"
ROLE_LABEL = "身份"
ROLE_PH = "如：石匠、园丁、诗人..."
GENDER = "性别"
MALE = "男性"
FEMALE = "女性"
AGE = "年龄"
COLOR = "颜色"
PERSONA_LABEL = "人设描述"
PERSONA_PH = "如：香山帮石匠，五十多岁，太湖石在他手里能变成活物..."
CANCEL = "取消"
CREATE = "创建角色"
RANDOM = "随机生成"
HINT = "3D 环绕鸟瞰 | 地图选角/导航 | 标签切换"
ADD_BTN = "+ 添加"
GEN = "生成中..."
GEN_FAIL = "生成失败，请重试"

# Build HTML header
html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{TITLE}</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#1a1a2e;font-family:"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;height:100vh;color:#d0d0d0}}
#app{{display:grid;grid-template-columns:30fr 70fr;grid-template-rows:60fr 40fr;height:100vh;gap:4px;padding:4px}}
#map-panel{{grid-row:1/3;display:flex;flex-direction:column;gap:3px}}
#map-three-top{{flex:1;background:#16213e;border-radius:10px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);min-height:0}}
#map-canvas-bottom{{flex:1;background:#16213e;border-radius:10px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);min-height:0}}
#map-canvas-bottom canvas{{width:100%;height:100%;display:block}}
#info-panel{{background:#0f3460;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,0.08)}}
#character-tabs{{display:flex;gap:4px;padding:8px 10px;background:rgba(0,0,0,0.25);flex-shrink:0}}
.char-tab{{padding:6px 14px;border-radius:6px;border:none;cursor:pointer;color:#aaa;background:rgba(255,255,255,0.06);font-size:13px;transition:all .2s;font-family:inherit}}
.char-tab.active{{background:rgba(255,255,255,0.18);color:#fff}}
.char-tab:hover{{background:rgba(255,255,255,0.12)}}
#text-stream{{flex:1;overflow-y:auto;padding:12px;font-size:13px;line-height:1.8}}
.stream-msg{{margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:6px;border-left:3px solid transparent;animation:msgIn .3s ease-out}}
@keyframes msgIn{{from{{opacity:0;transform:translateY(8px)}}to{{opacity:1;transform:translateY(0)}}}}
.stream-msg.feeling{{border-left-color:#e2b04a}}
.stream-msg.dialogue{{border-left-color:#4ecdc4}}
.msg-speaker{{font-weight:bold;margin-bottom:4px;font-size:12px}}
.msg-text{{white-space:pre-wrap}}
#pov-panel{{background:#0f3460;border-radius:10px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08)}}
#pov-container{{width:100%;height:100%}}
#pov-container canvas{{display:block}}
#pov-label{{position:absolute;top:10px;left:10px;z-index:5;background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:bold;pointer-events:none;border-left:3px solid #4ecdc4}}
#speech-bubbles{{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10}}
.speech-bubble{{position:absolute;background:rgba(0,0,0,0.88);color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;max-width:320px;text-align:left;transform:translate(-50%,-100%);animation:bubbleFade 4s ease-out forwards;white-space:pre-wrap;line-height:1.6;word-break:break-word}}
.speech-bubble::after{{content:"";position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid rgba(0,0,0,0.88)}}
@keyframes bubbleFade{{0%{{opacity:0;transform:translate(-50%,-100%) translateY(8px)}}8%{{opacity:1;transform:translate(-50%,-100%) translateY(0)}}80%{{opacity:1}}100%{{opacity:0}}}}
#add-char-btn{{padding:6px 14px;border-radius:6px;border:1.5px solid #4ecdc4;cursor:pointer;color:#4ecdc4;background:rgba(78,205,196,0.08);font-size:13px;font-family:inherit;font-weight:bold;transition:all .2s;margin-left:auto;white-space:nowrap}}
#add-char-btn:hover{{background:rgba(78,205,196,0.2)}}
#add-char-dialog{{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:200;display:none;justify-content:center;align-items:center}}
#add-char-dialog.show{{display:flex}}
#add-char-dialog .dialog-box{{background:#1a3a5c;border-radius:12px;padding:24px;width:380px;max-width:90vw;border:1px solid rgba(255,255,255,0.12)}}
#add-char-dialog h3{{color:#fff;margin-bottom:16px;font-size:16px}}
#add-char-dialog label{{display:block;color:#aaa;font-size:12px;margin-bottom:4px;margin-top:12px}}
#add-char-dialog input,#add-char-dialog textarea,#add-char-dialog select{{width:100%;padding:8px 12px;border-radius:6px;border:1px solid #555;background:#0d1f35;color:#eee;font-size:13px;font-family:inherit;outline:none;resize:vertical}}
#add-char-dialog textarea{{height:80px}}
#add-char-dialog input:focus,#add-char-dialog textarea:focus{{border-color:#4ecdc4}}
#add-char-dialog .color-pick-row{{display:flex;gap:8px;align-items:center}}
#add-char-dialog input[type=color]{{width:40px;height:36px;padding:2px;cursor:pointer}}
#add-char-dialog .hex-input{{flex:1}}
#add-char-dialog .btn-row{{display:flex;gap:8px;margin-top:18px;justify-content:flex-end}}
#add-char-dialog .btn-row button{{padding:8px 20px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-family:inherit}}
#add-char-dialog .btn-cancel{{background:rgba(255,255,255,0.1);color:#ccc}}
#add-char-dialog .btn-create{{background:#4ecdc4;color:#111;font-weight:bold}}
#add-char-dialog .btn-random{{background:rgba(255,255,255,0.1);color:#ccc;margin-right:auto}}
#add-char-dialog .btn-random:hover{{background:rgba(78,205,196,0.2);color:#4ecdc4}}
#settings-btn{{position:fixed;top:10px;right:10px;z-index:101;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.5);color:#ccc;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:all .2s}}
#settings-btn:hover{{background:rgba(78,205,196,0.15);border-color:#4ecdc4;color:#4ecdc4}}
#settings-panel{{position:fixed;top:52px;right:10px;z-index:100;background:rgba(15,20,35,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:14px;backdrop-filter:blur(12px);display:none;min-width:260px}}
#settings-panel.show{{display:block}}
.settings-inner label{{display:block;color:#aaa;font-size:11px;margin-bottom:3px;margin-top:8px}}
.settings-inner label:first-child{{margin-top:0}}
.settings-inner input{{width:100%;padding:6px 10px;border-radius:5px;border:1px solid #444;background:#0a0f1e;color:#eee;font-size:12px;font-family:inherit;outline:none}}
.settings-inner input:focus{{border-color:#4ecdc4}}
.settings-btns{{display:flex;gap:8px;align-items:center;margin-top:10px}}
.settings-btns button{{padding:6px 16px;border-radius:5px;border:none;cursor:pointer;background:#4ecdc4;color:#111;font-size:12px;font-weight:bold;font-family:inherit}}
#hint-bar{{position:fixed;bottom:10px;left:50%;transform:translateX(-50%);font-size:11px;color:rgba(255,255,255,0.35);z-index:50;pointer-events:none}}
</style>
</head>
<body>
<button id="settings-btn" title="{SETTINGS}">⚙</button>
<div id="settings-panel">
  <div class="settings-inner">
    <label>API Key</label>
    <input id="api-key" type="password" placeholder="sk-...">
    <label>API URL</label>
    <input id="api-url" value="https://api.deepseek.com/v1/chat/completions">
    <div class="settings-btns">
      <button id="api-save">{SAVE}</button>
      <span id="api-status"></span>
    </div>
  </div>
</div>
<div id="app">
  <div id="map-panel">
    <div id="map-three-top"></div>
    <div id="map-canvas-bottom"><canvas id="map-canvas"></canvas></div>
  </div>
  <div id="info-panel">
    <div id="character-tabs"></div>
    <div id="text-stream"></div>
  </div>
  <div id="pov-panel">
    <div id="pov-label"></div>
    <div id="pov-container"></div>
    <div id="speech-bubbles"></div>
  </div>
</div>
<div id="add-char-dialog">
  <div class="dialog-box">
    <h3>{ADD_TITLE}</h3>
    <label>{NAME_LABEL}</label><input id="new-char-name" placeholder="{NAME_PH}">
    <label>{ROLE_LABEL}</label><input id="new-char-role" placeholder="{ROLE_PH}">
    <label>{GENDER}</label><select id="new-char-gender"><option value="male">{MALE}</option><option value="female">{FEMALE}</option></select>
    <label>{AGE}</label><input id="new-char-age" type="number" value="30" min="8" max="90">
    <label>{COLOR}</label>
    <div class="color-pick-row">
      <input type="color" id="new-char-color" value="#e07b3c">
      <input type="text" id="new-char-hex" class="hex-input" placeholder="#e07b3c">
    </div>
    <label>{PERSONA_LABEL}</label>
    <textarea id="new-char-persona" placeholder="{PERSONA_PH}"></textarea>
    <div class="btn-row">
      <button class="btn-random" id="btn-random-char">{RANDOM}</button>
      <button class="btn-cancel" id="btn-cancel-add">{CANCEL}</button>
      <button class="btn-create" id="btn-create-char">{CREATE}</button>
    </div>
  </div>
</div>
<div id="hint-bar">{HINT}</div>
'''

# Write HTML + JS together
with open(OUT, "w", encoding="utf-8-sig", newline="\n") as f:
    f.write(html + js_part)

# Verify
with open(OUT, "rb") as f:
    raw = f.read()

bom = raw[:3] == b'\xef\xbb\xbf'
# Check for actual Chinese bytes
cnt = raw.count("添加新角色".encode("utf-8"))
print(f"BOM: {bom}, 添加新角色 count: {cnt}")
print(f"Multi-byte chars: {sum(1 for b in raw if b > 127)}")

# Check braces
with open(OUT, "r", encoding="utf-8-sig") as f:
    v = f.read()
print(f"Braces: {v.count('{')} = {v.count('}')} OK={v.count('{') == v.count('}')}")
