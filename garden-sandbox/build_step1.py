# -*- coding: utf-8 -*-
OUT = r"F:\cx\garden-sandbox\index.html"

def esc(s):
    return "".join("\\u%04x" % ord(c) if ord(c) > 127 else c for c in s)

html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>""" + esc("苏州园林 AI 沙箱") + """</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a2e;font-family:"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;height:100vh;color:#d0d0d0}
#app{display:grid;grid-template-columns:30fr 70fr;grid-template-rows:1fr;height:100vh;gap:4px;padding:4px}
#map-panel{display:flex;flex-direction:column;gap:3px}
#map-three-top{flex:1;background:#16213e;border-radius:10px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);min-height:0}
#map-canvas-bottom{flex:1;background:#16213e;border-radius:10px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);min-height:0;display:flex;flex-direction:column}
#map-canvas-bottom canvas{width:100%;height:100%;display:block}
#knowledge-card{background:rgba(15,52,96,0.7);border-radius:6px;padding:4px 8px;font-size:10px;color:#999;line-height:1.4;border-left:2px solid #e2b04a;flex-shrink:0;margin-top:3px;max-height:44px;overflow:hidden;cursor:default;transition:all .3s}
#knowledge-card:hover{background:rgba(78,205,196,0.08);border-left-color:#4ecdc4;color:#bbb}
#right-main{display:flex;flex-direction:column;gap:4px;min-height:0}
#top-bar{display:flex;align-items:center;gap:8px;padding:4px 8px;background:rgba(0,0,0,0.2);border-radius:8px;flex-shrink:0;min-height:32px}
#weather-group{display:flex;gap:3px}
.weather-btn{width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-size:12px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;transition:all .15s}
.weather-btn:hover{background:rgba(78,205,196,0.2);border-color:#4ecdc4}
.weather-btn.active{background:rgba(78,205,196,0.3);border-color:#4ecdc4;box-shadow:0 0 6px rgba(78,205,196,0.25)}
#status-mini{flex:1;font-size:11px;color:#bbb;display:flex;align-items:center;gap:12px;min-width:0}
#status-mini .s-item{display:flex;align-items:center;gap:4px;white-space:nowrap}
#status-mini .s-label{color:#777;font-size:10px}
#status-mini .s-val{font-weight:bold}
#character-tabs{display:flex;gap:4px;padding:4px 8px;background:rgba(0,0,0,0.2);flex-shrink:0;align-items:center;border-radius:8px;flex-wrap:wrap}
.char-tab{padding:3px 8px;border-radius:5px;border:none;cursor:pointer;color:#aaa;background:rgba(255,255,255,0.04);font-size:11px;transition:all .15s;font-family:inherit}
.char-tab.active{background:rgba(255,255,255,0.15);color:#fff}
.char-tab:hover{background:rgba(255,255,255,0.1)}
#info-panel{background:#0f3460;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,0.08);flex:1;min-height:0}
#text-stream{flex:1;overflow-y:auto;padding:6px 8px;font-size:11px;line-height:1.5}
.stream-msg{margin-bottom:4px;padding:5px 7px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:3px solid transparent;animation:msgIn .3s ease-out}
@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.stream-msg.feeling{border-left-color:#e2b04a}
.stream-msg.dialogue{border-left-color:#4ecdc4}
.msg-speaker{font-weight:bold;margin-bottom:2px;font-size:10px}
.msg-text{white-space:pre-wrap}
#pov-panel{background:#0f3460;border-radius:10px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);flex-shrink:0;min-height:0}
#pov-container{width:100%;height:100%}
#pov-container canvas{display:block}
#pov-label{position:absolute;top:6px;left:6px;z-index:5;background:rgba(0,0,0,0.7);color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:bold;pointer-events:none;border-left:2px solid #4ecdc4}
#speech-bubbles{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10}
.speech-bubble{position:absolute;background:rgba(0,0,0,0.88);color:#fff;padding:5px 10px;border-radius:6px;font-size:11px;max-width:200px;text-align:center;transform:translate(-50%,-100%);animation:bubbleFade 3.5s ease-out forwards;white-space:pre-wrap;line-height:1.4}
.speech-bubble::after{content:"";position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid rgba(0,0,0,0.88)}
@keyframes bubbleFade{0%{opacity:0;transform:translate(-50%,-100%) translateY(6px)}8%{opacity:1;transform:translate(-50%,-100%) translateY(0)}80%{opacity:1}100%{opacity:0}}
#quick-row{display:flex;gap:4px;padding:4px;background:rgba(0,0,0,0.2);border-radius:6px;flex-shrink:0;flex-wrap:wrap}
.quick-btn{padding:3px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;color:#aaa;background:rgba(255,255,255,0.03);font-size:10px;font-family:inherit;transition:all .12s}
.quick-btn:hover{background:rgba(78,205,196,0.15);border-color:#4ecdc4;color:#4ecdc4}
#add-char-btn{padding:3px 8px;border-radius:5px;border:1.5px solid #4ecdc4;cursor:pointer;color:#4ecdc4;background:rgba(78,205,196,0.06);font-size:11px;font-family:inherit;font-weight:bold;transition:all .15s;margin-left:auto;white-space:nowrap;flex-shrink:0}
#add-char-btn:hover{background:rgba(78,205,196,0.18)}
#timeline-btn{font-size:10px;color:#777;cursor:pointer;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all .15s;flex-shrink:0}
#timeline-btn:hover{background:rgba(78,205,196,0.1);color:#4ecdc4}
#timeline-panel{display:none;position:fixed;top:0;right:0;width:300px;height:100vh;background:rgba(10,15,30,0.97);border-left:1px solid rgba(255,255,255,0.1);z-index:150;overflow-y:auto;padding:12px;backdrop-filter:blur(10px)}
#timeline-panel.show{display:block}
#timeline-panel h4{color:#fff;font-size:13px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
#timeline-panel .tl-close{cursor:pointer;color:#e74c3c;font-size:16px;background:none;border:none}
.tl-item{padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.02);border-radius:3px;font-size:10px;color:#bbb;border-left:2px solid #555}
.tl-item.feeling{border-left-color:#e2b04a}
.tl-item.dialogue{border-left-color:#4ecdc4}
.tl-time{font-size:9px;color:#555}
#add-char-dialog{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:200;display:none;justify-content:center;align-items:center}
#add-char-dialog.show{display:flex}
#add-char-dialog .dialog-box{background:#1a3a5c;border-radius:12px;padding:20px;width:360px;max-width:90vw;border:1px solid rgba(255,255,255,0.12)}
#add-char-dialog h3{color:#fff;margin-bottom:12px;font-size:15px}
#add-char-dialog label{display:block;color:#aaa;font-size:11px;margin-bottom:3px;margin-top:10px}
#add-char-dialog input,#add-char-dialog textarea,#add-char-dialog select{width:100%;padding:6px 10px;border-radius:5px;border:1px solid #555;background:#0d1f35;color:#eee;font-size:12px;font-family:inherit;outline:none;resize:vertical}
#add-char-dialog textarea{height:70px}
#add-char-dialog input:focus,#add-char-dialog textarea:focus{border-color:#4ecdc4}
#add-char-dialog .color-pick-row{display:flex;gap:8px;align-items:center}
#add-char-dialog input[type=color]{width:36px;height:32px;padding:2px;cursor:pointer}
#add-char-dialog .hex-input{flex:1}
#add-char-dialog .btn-row{display:flex;gap:8px;margin-top:14px;justify-content:flex-end}
#add-char-dialog .btn-row button{padding:6px 16px;border-radius:5px;border:none;cursor:pointer;font-size:12px;font-family:inherit}
#add-char-dialog .btn-cancel{background:rgba(255,255,255,0.1);color:#ccc}
#add-char-dialog .btn-create{background:#4ecdc4;color:#111;font-weight:bold}
#add-char-dialog .btn-random{background:rgba(78,205,196,0.12);color:#4ecdc4;margin-right:auto}
#add-char-dialog .btn-random:hover{background:rgba(78,205,196,0.25)}
#settings-btn{position:fixed;top:10px;right:10px;z-index:101;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.5);color:#ccc;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);transition:all .15s}
#settings-btn:hover{background:rgba(78,205,196,0.15);border-color:#4ecdc4;color:#4ecdc4}
#settings-panel{position:fixed;top:46px;right:10px;z-index:100;background:rgba(15,20,35,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;backdrop-filter:blur(10px);display:none;min-width:240px}
#settings-panel.show{display:block}
.settings-inner label{display:block;color:#aaa;font-size:10px;margin-bottom:2px;margin-top:6px}
.settings-inner label:first-child{margin-top:0}
.settings-inner input{width:100%;padding:5px 8px;border-radius:4px;border:1px solid #444;background:#0a0f1e;color:#eee;font-size:11px;font-family:inherit;outline:none}
.settings-inner input:focus{border-color:#4ecdc4}
.settings-btns{display:flex;gap:8px;align-items:center;margin-top:8px}
.settings-btns button{padding:5px 14px;border-radius:4px;border:none;cursor:pointer;background:#4ecdc4;color:#111;font-size:11px;font-weight:bold;font-family:inherit}
#hint-bar{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);font-size:10px;color:rgba(255,255,255,0.3);z-index:50;pointer-events:none}
</style>
</head>
<body>
<button id="settings-btn" title="""" + esc("设置") + """">⚙</button>
<div id="settings-panel">
  <div class="settings-inner">
    <label>""" + esc("API Key") + """</label>
    <input id="api-key" type="password" placeholder="sk-...">
    <label>""" + esc("API URL") + """</label>
    <input id="api-url" value="https://api.deepseek.com/v1/chat/completions">
    <div class="settings-btns">
      <button id="api-save">""" + esc("保存") + """</button>
      <span id="api-status"></span>
    </div>
  </div>
</div>
<div id="app">
  <div id="map-panel">
    <div id="map-three-top"></div>
    <div id="map-canvas-bottom">
      <canvas id="map-canvas"></canvas>
      <div id="knowledge-card">""" + esc("点击角色标签查看匠人技艺知识") + """</div>
    </div>
  </div>
  <div id="right-main">
    <div id="character-tabs"></div>
    <div id="top-bar">
      <div id="weather-group">
        <button class="weather-btn active" data-w="day" title="""" + esc("白天") + """">☀</button>
        <button class="weather-btn" data-w="dusk" title="""" + esc("黄昏") + """">🌅</button>
        <button class="weather-btn" data-w="night" title="""" + esc("夜晚") + """">🌙</button>
        <button class="weather-btn" data-w="rain" title="""" + esc("雨天") + """">🌧</button>
      </div>
      <div id="status-mini">
        <span class="s-item"><span class="s-label">""" + esc("角色") + """</span><span class="s-val" id="st-name">-</span></span>
        <span class="s-item"><span class="s-label">""" + esc("身份") + """</span><span class="s-val" id="st-role">-</span></span>
        <span class="s-item"><span class="s-label">""" + esc("年龄") + """</span><span class="s-val" id="st-age">-</span></span>
        <span class="s-item" id="st-mood">😐</span>
      </div>
      <button id="timeline-btn">📋 """ + esc("记录") + """</button>
    </div>
    <div id="info-panel">
      <div id="text-stream"></div>
    </div>
    <div id="pov-panel">
      <div id="pov-label"></div>
      <div id="pov-container"></div>
      <div id="speech-bubbles"></div>
    </div>
    <div id="quick-row">
      <button class="quick-btn" data-target="-10,-8">🏯 """ + esc("去亭子") + """</button>
      <button class="quick-btn" data-target="10,-4">🚪 """ + esc("去月洞门") + """</button>
      <button class="quick-btn" data-target="5,-4">💧 """ + esc("去水池") + """</button>
      <button class="quick-btn" data-target="-14,7">🪨 """ + esc("去假山") + """</button>
    </div>
  </div>
</div>
<div id="add-char-dialog">
  <div class="dialog-box">
    <h3>""" + esc("添加新角色") + """</h3>
    <label>""" + esc("角色名") + """</label><input id="new-char-name" placeholder="""" + esc("如：老李") + """">
    <label>""" + esc("身份") + """</label><input id="new-char-role" placeholder="""" + esc("如：石匠、园丁、诗人...") + """">
    <label>""" + esc("性别") + """</label><select id="new-char-gender"><option value="male">""" + esc("男性") + """</option><option value="female">""" + esc("女性") + """</option></select>
    <label>""" + esc("年龄") + """</label><input id="new-char-age" type="number" value="30" min="8" max="90">
    <label>""" + esc("颜色") + """</label>
    <div class="color-pick-row">
      <input type="color" id="new-char-color" value="#e07b3c">
      <input type="text" id="new-char-hex" class="hex-input" placeholder="#e07b3c">
    </div>
    <label>""" + esc("人设描述") + """</label>
    <textarea id="new-char-persona" placeholder="""" + esc("如：香山帮石匠，五十多岁，太湖石在他手里能变成活物...") + """"></textarea>
    <div class="btn-row">
      <button class="btn-random" id="btn-random-char">""" + esc("随机生成") + """</button>
      <button class="btn-cancel" id="btn-cancel-add">""" + esc("取消") + """</button>
      <button class="btn-create" id="btn-create-char">""" + esc("创建角色") + """</button>
    </div>
  </div>
</div>
<div id="timeline-panel">
  <h4>📋 """ + esc("事件时间线") + """ <button class="tl-close" id="tl-close">✕</button></h4>
  <div id="tl-list"></div>
</div>
<div id="hint-bar">""" + esc("3D 环绕鸟瞰 | 右键地图导航 | 点击标签切换角色") + """</div>
"""

with open(OUT, "w", encoding="utf-8-sig", newline="\n") as f:
    f.write(html + """<script type="importmap">
{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js", "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/" } }
</script>
""")

print("HTML part OK")
