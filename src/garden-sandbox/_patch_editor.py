import os
os.chdir(r"F:\cx\garden-sandbox")

with open("index.html", "r", encoding="utf-8") as f:
    c = f.read()

# Remove old editor code
if "TILE_TYPES" in c:
    # Find and remove old editor block
    start = c.find("const TILE_TYPES")
    end = c.find("function drawEditorGrid")
    end2 = c.find("let lastTime=performance.now();")
    if start > 0 and end > 0 and end2 > end:
        c = c[:start] + c[end2:]
    # Remove old drawEditorGrid call
    c = c.replace("drawEditorGrid();", "")
    # Remove old toolbar HTML
    c = c.replace('<div id="editor-legend">', '<!-- old editor removed --><div id="editor-legend" style="display:none">')

# Add new editor CSS
editor_css = """
#editor-toggle{position:absolute;bottom:4px;right:4px;z-index:10;padding:3px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.6);color:#aaa;font-size:10px;cursor:pointer;font-family:inherit;transition:all .15s}
#editor-toggle:hover{background:rgba(78,205,196,0.2);color:#4ecdc4}
#editor-toggle.active{background:rgba(78,205,196,0.3);color:#fff;border-color:#4ecdc4}
#editor-toolbar{position:absolute;top:50%;right:36px;z-index:10;transform:translateY(-50%);display:none;flex-direction:column;gap:3px;background:rgba(0,0,0,0.8);padding:6px 4px;border-radius:6px}
#editor-toolbar.show{display:flex}
.et-btn{width:28px;height:28px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-size:10px;color:#fff;font-family:inherit;display:flex;align-items:center;justify-content:center;transition:all .12s;position:relative}
.et-btn:hover{border-color:#fff;transform:scale(1.1)}
.et-btn.active{border-color:#4ecdc4;box-shadow:0 0 6px rgba(78,205,196,0.4)}
.et-tooltip{position:absolute;right:34px;background:rgba(0,0,0,0.9);color:#fff;padding:2px 6px;border-radius:3px;font-size:9px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s}
.et-btn:hover .et-tooltip{opacity:1}
#editor-save-btn{position:absolute;top:4px;right:4px;z-index:10;padding:2px 6px;border-radius:3px;border:1px solid rgba(78,205,196,0.3);background:rgba(78,205,196,0.1);color:#4ecdc4;font-size:9px;cursor:pointer;font-family:inherit;display:none}
#editor-save-btn.show{display:block}
#editor-save-btn:hover{background:rgba(78,205,196,0.25)}
#editor-tooltip{position:absolute;z-index:11;background:rgba(0,0,0,0.85);color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;pointer-events:none;display:none}
"""
if True:
    c = c.replace("</style>", editor_css + "</style>")
    print("CSS added")

# Add toolbar HTML
if True:
    old = '<div id="map-canvas-bottom"><canvas id="map-canvas"></canvas>'
    new = '<div id="map-canvas-bottom"><canvas id="map-canvas"></canvas><button id="editor-toggle" title="\u7f16\u8f91\u5668">\u7f16</button><div id="editor-toolbar"><button class="et-btn active" data-brush="1" style="background:#888"><span class="et-tooltip">\u9053\u8def</span></button><button class="et-btn" data-brush="2" style="background:#c44"><span class="et-tooltip">\u5899</span></button><button class="et-btn" data-brush="3" style="background:#48c"><span class="et-tooltip">\u6c34\u57df</span></button><button class="et-btn" data-brush="4" style="background:#e2b04a"><span class="et-tooltip">\u4ead\u5b50</span></button><button class="et-btn" data-brush="5" style="background:#c8a"><span class="et-tooltip">\u6708\u6d1e\u95e8</span></button><button class="et-btn" data-brush="0" style="background:rgba(255,255,255,0.05);color:#888"><span class="et-tooltip">\u64e6\u9664</span></button></div><button id="editor-save-btn">\u4fdd\u5b58</button><div id="editor-tooltip"></div>'
    c = c.replace(old, new)
    print("HTML toolbar added")

# Add editor JS
if True:
    editor_js = """
const TILE_COLORS={"path":"#888","wall":"#c44","water":"#48c","pavilion":"#e2b04a","moongate":"#c8a"};
const TILE_LABELS={0:"\u64e6\u9664",1:"\u9053\u8def",2:"\u5899",3:"\u6c34\u57df",4:"\u4ead\u5b50",5:"\u6708\u6d1e\u95e8"};
let editorActive=false,editorBrush=1,editorMouseDown=false,tileMap={};
fetch("scene_data/tilemap.json").then(r=>r.json()).then(d=>{for(const[k,v]of Object.entries(d))tileMap[k]=v;console.log("Tilemap loaded:",Object.keys(tileMap).length,"tiles");}).catch(()=>console.log("No saved tilemap"));
const editorBtn=document.getElementById("editor-toggle");
const editorToolbar=document.getElementById("editor-toolbar");
const editorSaveBtn=document.getElementById("editor-save-btn");
const editorTip=document.getElementById("editor-tooltip");
editorBtn.addEventListener("click",()=>{editorActive=!editorActive;editorBtn.classList.toggle("active",editorActive);editorToolbar.classList.toggle("show",editorActive);editorSaveBtn.classList.toggle("show",editorActive);if(!editorActive)editorTip.style.display="none";});
editorToolbar.querySelectorAll(".et-btn").forEach(btn=>{btn.addEventListener("click",()=>{editorBrush=parseInt(btn.dataset.brush);editorToolbar.querySelectorAll(".et-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");});});
editorSaveBtn.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(tileMap)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tilemap.json";a.click();});
function editorPaint(e){if(!editorActive||!editorMouseDown)return;const rect=mapCanvas.getBoundingClientRect();const s=Math.min(rect.width,rect.height)/(SCENE_SIZE*2.2),ox=rect.width/2,oy=rect.height/2;const wx=Math.round((e.clientX-rect.left-ox)/s),wz=Math.round((e.clientY-rect.top-oy)/s),key=wx+","+wz;if(editorBrush===0){delete tileMap[key];}else{tileMap[key]=editorBrush;}editorTip.textContent="("+wx+","+wz+") "+TILE_LABELS[editorBrush];editorTip.style.display="block";editorTip.style.left=(e.clientX-rect.left+10)+"px";editorTip.style.top=(e.clientY-rect.top-25)+"px";}
mapCanvas.addEventListener("mousedown",e=>{if(editorActive){editorMouseDown=true;editorPaint(e);}});
mapCanvas.addEventListener("mousemove",e=>{if(editorActive)editorPaint(e);});
mapCanvas.addEventListener("mouseup",()=>{editorMouseDown=false;});
mapCanvas.addEventListener("mouseleave",()=>{editorMouseDown=false;});
mapCanvas.addEventListener("contextmenu",e=>{if(editorActive){e.preventDefault();e.stopPropagation();}});
document.addEventListener("mouseup",()=>{editorMouseDown=false;});
function drawEditorGrid(){if(!editorActive)return;const dpr=window.devicePixelRatio||1,w=mapCanvas.width/dpr,h=mapCanvas.height/dpr;const s=Math.min(w,h)/(SCENE_SIZE*2.2),ox=w/2,oy=h/2;const gs=Math.floor(-SCENE_SIZE*1.1),ge=Math.ceil(SCENE_SIZE*1.1);for(const[key,type]of Object.entries(tileMap)){const[gx,gz]=key.split(",").map(Number);const colorName={1:"path",2:"wall",3:"water",4:"pavilion",5:"moongate"}[type];const color=TILE_COLORS[colorName];if(!color)continue;mapCtx.fillStyle=color;mapCtx.globalAlpha=0.6;mapCtx.fillRect(ox+gx*s-s/2,oy+gz*s-s/2,s,s);mapCtx.globalAlpha=1;}mapCtx.strokeStyle="rgba(255,255,255,0.06)";mapCtx.lineWidth=0.5;for(let gx=gs;gx<=ge;gx++){mapCtx.beginPath();mapCtx.moveTo(ox+gx*s,oy+gs*s);mapCtx.lineTo(ox+gx*s,oy+ge*s);mapCtx.stroke();}for(let gz=gs;gz<=ge;gz++){mapCtx.beginPath();mapCtx.moveTo(ox+gs*s,oy+gz*s);mapCtx.lineTo(ox+ge*s,oy+gz*s);mapCtx.stroke();}}
"""
    c = c.replace("let lastTime=performance.now();", editor_js + "\nlet lastTime=performance.now();")
    c = c.replace("updatePOV();drawMap2D();renderMapView();", "updatePOV();drawMap2D();drawEditorGrid();renderMapView();")
    print("JS added")

with open("index.html", "w", encoding="utf-8", newline="\n") as f:
    f.write(c)

idx = c.find("<script>")
idx2 = c.find("<script>", idx+8)
js = c[idx2+8:c.rfind("</script>")]
bal = js.count("{") - js.count("}")
print(f"JS balance: {bal}")
print("DONE")
