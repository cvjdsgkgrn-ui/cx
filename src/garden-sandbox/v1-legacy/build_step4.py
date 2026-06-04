# -*- coding: utf-8 -*-
OUT = r"F:\cx\src\garden-sandbox\index.html"

js3 = r"""
// Bubbles
function showBubble(c,text){
  // Trim text to fit
  const maxLen=40;
  const displayText=text.length>maxLen?text.slice(0,maxLen)+"...":text;
  const b=document.createElement("div");b.className="speech-bubble";
  b.textContent=displayText;bubbleContainer.appendChild(b);
  // Position: bottom-center of POV panel, stacked
  const r=povContainer.getBoundingClientRect();
  const existing=document.querySelectorAll(".speech-bubble");
  const offset=existing.length*52; // Stack bubbles upward
  b.style.left="50%";
  b.style.top=(r.height-16-offset)+"px";
  b.style.transform="translate(-50%,0)";
  // Longer display time
  const duration=3000+text.length*30;
  setTimeout(()=>b.remove(),duration);
}
function createTextSprite(text){
  const cv=document.createElement("canvas");cv.width=256;cv.height=48;
  const ctx=cv.getContext("2d");ctx.fillStyle="rgba(0,0,0,0.85)";
  ctx.beginPath();ctx.roundRect(4,4,248,40,6);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="bold 12px Microsoft YaHei,PingFang SC,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
  let line="",y=22;for(const ch of text){if(ctx.measureText(line+ch).width>230){ctx.fillText(line,128,y);line=ch;y+=15;}else line+=ch;}
  if(line)ctx.fillText(line,128,y);
  const tex=new THREE.CanvasTexture(cv);tex.minFilter=THREE.LinearFilter;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
  sp.scale.set(1.6,0.35,1);return sp;
}
function show3DBubble(c,text){
  if(c.bubbleSprite){scene.remove(c.bubbleSprite);}
  const sp=createTextSprite(text);
  sp.position.copy(c.mesh.position);sp.position.y+=1.8;
  sp.userData.isBubble=true; // Mark for selective rendering
  scene.add(sp);
  c.bubbleSprite=sp;c.bubbleTimer=5.0;c.isBouncing=true;c.bounceTime=0;
}
function addStreamMessage(c,text,type){
  const div=document.createElement("div");div.className="stream-msg "+type;
  div.innerHTML='<div class="msg-speaker" style="color:'+c.hexColor+'">'+c.name+"\uff08"+c.role+"\uff09</div><div class=\"msg-text\">"+text+"</div>";
  textStream.appendChild(div);textStream.scrollTop=textStream.scrollHeight;
  const clean=text.replace(/\u611f\u53d7\uff1a|\u5bf9\u8bdd\uff1a/,"").slice(0,50)+(text.length>50?"...":"");
  showBubble(c,clean);show3DBubble(c,clean);
  c.bubbleSprite.scale.set(0.01,0.01,1);
  if(typeof addTimelineEntry==="function")addTimelineEntry(c,clean,type);
}

// Tabs
function deleteCharacter(c){
  if(!c.isCustom)return;
  const idx=characters.indexOf(c);
  if(idx<0)return;
  if(c===selectedCharacter)selectedCharacter=characters.find(ch=>ch!==c)||null;
  if(c.bubbleSprite)scene.remove(c.bubbleSprite);
  scene.remove(c.mesh);
  characters.splice(idx,1);
  updateTabs();
}
function updateTabs(){
  const tabs=document.getElementById("character-tabs");tabs.innerHTML="";
  characters.forEach(c=>{
    const wrap=document.createElement("span");
    wrap.style.cssText="display:inline-flex;align-items:center;gap:2px;flex-shrink:0";
    const btn=document.createElement("button");btn.className="char-tab"+(c===selectedCharacter?" active":"");
    btn.textContent=c.name+"\uff08"+c.role+"\uff09";btn.style.borderBottom="2px solid "+c.hexColor;
    btn.addEventListener("click",()=>{selectedCharacter=c;updateTabs();});wrap.appendChild(btn);
    if(c.isCustom){
      const del=document.createElement("button");
      del.textContent="\u00d7";del.title="\u5220\u9664\u89d2\u8272";
      del.style.cssText="width:20px;height:20px;border-radius:50%;border:none;background:rgba(231,76,60,0.25);color:#e74c3c;cursor:pointer;font-size:14px;font-weight:bold;line-height:1;padding:0;flex-shrink:0;transition:all .15s";
      del.addEventListener("mouseenter",()=>{del.style.background="rgba(231,76,60,0.55)";del.style.color="#fff";});
      del.addEventListener("mouseleave",()=>{del.style.background="rgba(231,76,60,0.25)";del.style.color="#e74c3c";});
      del.addEventListener("click",(e)=>{e.stopPropagation();if(confirm("\u786e\u5b9a\u5220\u9664\u89d2\u8272\u201c"+c.name+"\u201d\uff1f"))deleteCharacter(c);});
      wrap.appendChild(del);
    }
    tabs.appendChild(wrap);
  });
  const addBtn=document.createElement("button");addBtn.id="add-char-btn";addBtn.textContent="\u002b \u6dfb\u52a0";
  addBtn.addEventListener("click",()=>{document.getElementById("add-char-dialog").classList.add("show");});
  tabs.appendChild(addBtn);
}
updateTabs();

// Status bar update
function updateStatusBar(){
  if(!selectedCharacter){
    document.getElementById("st-name").textContent="-";
    document.getElementById("st-role").textContent="-";
    document.getElementById("st-age").textContent="-";
    document.getElementById("st-mood").textContent="😐";
    return;
  }
  document.getElementById("st-name").textContent=selectedCharacter.name;
  document.getElementById("st-role").textContent=selectedCharacter.role;
  document.getElementById("st-age").textContent=selectedCharacter.age||"-";
  const moods=["😊","😐","🤔","😌","😤"];
  document.getElementById("st-mood").textContent=moods[Math.floor(Math.random()*moods.length)];
}

// Weather system
let currentWeather="day";
const weatherColors={
  day:{sky:0xd4e4c0,fog:0xd4e4c0,ambient:0.5,sun:1.3,ground:0x5a7d4a},
  dusk:{sky:0xe8a860,fog:0xe8a860,ambient:0.45,sun:0.8,ground:0x4a6d3a},
  night:{sky:0x1a1a3e,fog:0x1a1a3e,ambient:0.25,sun:0.3,ground:0x2a3d1a},
  rain:{sky:0x888899,fog:0x888899,ambient:0.35,sun:0.5,ground:0x4a6a3a}
};
// Auto-detect weather from real world
async function autoDetectWeather(){
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),5000);
    const resp=await fetch("https://wttr.in/Suzhou?format=j1",{signal:controller.signal});
    clearTimeout(timeout);
    if(!resp.ok)return;
    const w=await resp.json();
    const code=w.current_condition[0].weatherCode;
    const sunrise=w.weather[0].astronomy[0].sunrise;
    const sunset=w.weather[0].astronomy[0].sunset;
    // Parse sunrise/sunset times
    const parseTime=s=>{const p=s.split(":");const h=parseInt(p[0]);const m=parseInt(p[1]);const isPM=s.includes("PM");return(isPM&&h<12?h+12:!isPM&&h===12?0:h)*60+m;};
    const now=new Date();const mins=now.getHours()*60+now.getMinutes();
    const sr=parseTime(sunrise),ss=parseTime(sunset);
    // Determine time of day
    if(mins<sr-30||mins>ss+30)currentWeather="night";
    else if(mins>ss-40&&mins<=ss+30)currentWeather="dusk";
    else currentWeather="day";
    // Determine weather condition
    if(code>=200&&code<400)currentWeather="rain";
    else if(code>=600&&code<700)currentWeather="rain";
    else if(code===113||code===116){} // keep time-based
    else if(code>=300&&code<400)currentWeather="rain";
    setWeather(currentWeather);
  }catch(e){
    console.log("Weather API unavailable, using local time");
    const h=new Date().getHours();
    if(h<6||h>=20)setWeather("night");
    else if(h>=17)setWeather("dusk");
    else setWeather("day");
  }
}
autoDetectWeather();

function setWeather(w){
  currentWeather=w;
  const c=weatherColors[w];
  scene.background=new THREE.Color(c.sky);
  scene.fog=new THREE.Fog(c.fog,30,80);
  scene.children.forEach(ch=>{
    if(ch.isDirectionalLight)ch.intensity=c.sun;
    if(ch.isAmbientLight)ch.intensity=c.ambient;
  });
  if(ground&&ground.material)ground.material.color.set(c.ground);
  document.querySelectorAll(".weather-btn").forEach(b=>b.classList.toggle("active",b.dataset.w===w));
}
document.querySelectorAll(".weather-btn").forEach(b=>{
  b.addEventListener("click",()=>setWeather(b.dataset.w));
});

// Quick navigation
document.querySelectorAll(".quick-btn").forEach(b=>{
  b.addEventListener("click",()=>{
    if(!selectedCharacter)return;
    const coords=b.dataset.target.split(",");
    selectedCharacter.target={x:parseFloat(coords[0]),z:parseFloat(coords[1])};
  });
});

// Timeline
const timeline=[];
function addTimelineEntry(c,text,type){
  const now=new Date();
  const time=now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
  timeline.push({time,name:c.name,text,type});
  const tlist=document.getElementById("tl-list");
  if(tlist){
    const div=document.createElement("div");
    div.className="tl-item "+type;
    div.innerHTML='<span class="tl-time">'+time+'</span> <b>'+c.name+'</b> '+text.slice(0,40);
    tlist.prepend(div);
    if(tlist.children.length>50)tlist.lastChild.remove();
  }
}
document.getElementById("timeline-btn").addEventListener("click",()=>{
  document.getElementById("timeline-panel").classList.toggle("show");
});
document.getElementById("tl-close").addEventListener("click",()=>{
  document.getElementById("timeline-panel").classList.remove("show");
});

// Knowledge card
const KNOWLEDGE={
  "\u74e6\u5320":["\u98de\u6a90\u7fd8\u89d2\u662f\u9999\u5c71\u5e2e\u7684\u72ec\u95e8\u6280\u827a\uff0c\u6bcf\u4e2a\u7fd8\u89d2\u7684\u5f27\u5ea6\u90fd\u9760\u5320\u4eba\u76ee\u6d4b\u624b\u8c03\u3002","\u5c0f\u9752\u74e6\u94fa\u8bbe\u65f6\uff0c\u5e95\u74e6\u4ef0\u9762\u3001\u76d6\u74e6\u8986\u7f1d\uff0c\u96e8\u6c34\u6ef4\u6c34\u4e0d\u6f0f\u3002"],
  "\u6728\u5320":["\u69ab\u536f\u7ed3\u6784\u4e0d\u7528\u4e00\u9489\u4e00\u94b0\uff0c\u5168\u51ed\u6728\u6599\u4e4b\u95f4\u7684\u54ac\u5408\u627f\u529b\u3002","\u300a\u8425\u9020\u6cd5\u539f\u300b\u8bb0\u5f55\u4e86\u9999\u5c71\u5e2e\u5404\u79cd\u6728\u67b6\u7684\u6bd4\u4f8b\u548c\u5c3a\u5bf8\u89c4\u8303\u3002"],
  "\u753b\u5e08":["\u501f\u666f\u662f\u82cf\u5dde\u56ed\u6797\u7684\u6838\u5fc3\u624b\u6cd5\uff0c\u901a\u8fc7\u6f0f\u7a97\u3001\u7a7a\u5eca\u5c06\u56ed\u5916\u666f\u8272\u5f15\u5165\u56ed\u4e2d\u3002","\u6587\u5f81\u660e\u66fe\u53c2\u4e0e\u62d9\u653f\u56ed\u7684\u8bbe\u8ba1\uff0c\u624b\u690d\u7d2b\u85e4\u81f3\u4eca\u72b9\u5728\u3002"],
  "\u77f3\u5320":["\u592a\u6e56\u77f3\u4ee5\u7626\u6f0f\u900f\u76b1\u4e3a\u7f8e\uff0c\u6bcf\u5757\u77f3\u5934\u7684\u6446\u653e\u89d2\u5ea6\u90fd\u6709\u8bb2\u7a76\u3002","\u53e0\u5c71\u7406\u6c34\u6a21\u62df\u81ea\u7136\u5c71\u6c34\uff0c\u5c3a\u5bf8\u4e4b\u95f4\u89c1\u5929\u5730\u3002"],
};
function updateKnowledge(){
  if(!selectedCharacter)return;
  const role=selectedCharacter.role;
  const items=KNOWLEDGE[role]||["\u9999\u5c71\u5e2e\u8425\u9020\u6280\u827a\u88ab\u5217\u4e3a\u975e\u7269\u8d28\u6587\u5316\u9057\u4ea7\uff0c\u4f20\u627f\u516d\u767e\u4f59\u5e74\u3002"];
  const card=document.getElementById("knowledge-card");
  if(card){
    card.textContent="📖 "+selectedCharacter.role+" · "+items[Math.floor(Math.random()*items.length)];
    card.style.cursor="pointer";
    card.title="点击刷新知识";
    card.onclick=()=>{const r=selectedCharacter?selectedCharacter.role:"";const its=KNOWLEDGE[r]||KNOWLEDGE["瓦匠"];card.textContent="📖 "+r+" · "+its[Math.floor(Math.random()*its.length)];};
    card.title="点击刷新知识";
    card.onclick=()=>{
      const r=selectedCharacter?selectedCharacter.role:"";
      const its=KNOWLEDGE[r]||KNOWLEDGE["瓦匠"];
      card.textContent="📖 "+r+" · "+its[Math.floor(Math.random()*its.length)];
    };
  }
}

// Tutorial system
let tutorialStep=0;
let tutorialActive=true;
const tutorialOverlay=document.createElement("div");
tutorialOverlay.id="tutorial-overlay";
tutorialOverlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;z-index:300;pointer-events:none;transition:opacity .3s";
document.body.appendChild(tutorialOverlay);

const tutorialBubble=document.createElement("div");
tutorialBubble.id="tutorial-bubble";
tutorialBubble.style.cssText="position:fixed;z-index:301;background:rgba(15,20,35,0.95);color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;max-width:280px;text-align:center;border:1px solid rgba(78,205,196,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.5);transition:all .4s;opacity:0;pointer-events:auto;line-height:1.6";
document.body.appendChild(tutorialBubble);

const tutorialSkip=document.createElement("button");
tutorialSkip.textContent="\u8df3\u8fc7\u6559\u7a0b \u00d7";
tutorialSkip.style.cssText="position:fixed;top:10px;right:48px;z-index:302;background:rgba(0,0,0,0.4);color:#888;border:1px solid rgba(255,255,255,0.1);padding:4px 10px;border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;transition:all .15s";
tutorialSkip.addEventListener("mouseenter",()=>{tutorialSkip.style.color="#e74c3c";tutorialSkip.style.borderColor="#e74c3c";});
tutorialSkip.addEventListener("mouseleave",()=>{tutorialSkip.style.color="#888";tutorialSkip.style.borderColor="rgba(255,255,255,0.1)";});
tutorialSkip.addEventListener("click",()=>{endTutorial();});
document.body.appendChild(tutorialSkip);

function highlightElement(el){
  if(!el)return;
  const r=el.getBoundingClientRect();
  const highlight=document.createElement("div");
  highlight.className="tutorial-highlight";
  highlight.style.cssText="position:fixed;z-index:299;border:2px solid #4ecdc4;border-radius:8px;box-shadow:0 0 20px rgba(78,205,196,0.4),0 0 60px rgba(78,205,196,0.15);pointer-events:none;transition:all .4s";
  highlight.style.left=(r.left-6)+"px";
  highlight.style.top=(r.top-6)+"px";
  highlight.style.width=(r.width+12)+"px";
  highlight.style.height=(r.height+12)+"px";
  tutorialOverlay.appendChild(highlight);
  return highlight;
}

function showTutorialBubble(text,x,y,arrowDir){
  if(typeof x==="string")x=window.innerWidth*parseFloat(x)/100;
  if(typeof y==="string")y=window.innerHeight*parseFloat(y)/100;
  tutorialBubble.textContent=text;
  tutorialBubble.style.opacity="0";
  tutorialBubble.style.left=x+"px";
  tutorialBubble.style.top=y+"px";
  tutorialBubble.style.transform="translate(-50%,-50%)";
  setTimeout(()=>{tutorialBubble.style.opacity="1";},100);
}

function clearTutorialHighlights(){
  document.querySelectorAll(".tutorial-highlight").forEach(e=>e.remove());
}

function nextTutorialStep(){
  clearTutorialHighlights();
  const quickRow=document.getElementById("quick-row");
  const tabs=document.getElementById("character-tabs");
  const mapCanvas=document.getElementById("map-canvas");
  const weather=document.getElementById("weather-group");
  
  // Helper: show bubble that advances on click
  function clickableBubble(text,x,y,highlightEl){
    if(highlightEl)highlightElement(highlightEl);
    showTutorialBubble(text+"\n\n\u25b6 \u70b9\u51fb\u6b64\u5904\u7ee7\u7eed",x,y,"down");
    tutorialBubble.style.cursor="pointer";
    tutorialBubble.onclick=()=>{
      tutorialBubble.onclick=null;
      tutorialBubble.style.cursor="default";
      tutorialStep++;
      if(tutorialStep<=5)nextTutorialStep();
      else endTutorial();
    };
  }
  
  switch(tutorialStep){
    case 0:
      clickableBubble("\u6b22\u8fce\u6765\u5230\u82cf\u5dde\u56ed\u6797AI\u6c99\u7bb1\uff01\n\n\u8fd9\u91cc\u6709AI\u5320\u4eba\u5728\u56ed\u4e2d\u751f\u6d3b\u3001\u5bf9\u8bdd\u3002\n\u4ed6\u4eec\u4f1a\u81ea\u5df1\u8d70\u52a8\u3001\u770b\u666f\u3001\u4ea4\u8c08\u3002","50%","45%",null);
      break;
    case 1:
      clickableBubble("\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae\u8ba9\u89d2\u8272\u53bb\u56ed\u6797\u5404\u5904","50%","62%",quickRow);
      break;
    case 2:
      if(tabs){
        const tabBtns=tabs.querySelectorAll(".char-tab");
        if(tabBtns.length>0)clickableBubble("\u70b9\u51fb\u89d2\u8272\u6807\u7b7e\u5207\u6362\u89c6\u89d2\uff0c\u67e5\u770b\u4e0d\u540c\u5320\u4eba\u7684\u89c6\u91ce","50%","10%",tabBtns[0]);
        else{tutorialStep++;nextTutorialStep();}
      }
      break;
    case 3:
      clickableBubble("\u5728\u5de6\u4fa7\u5730\u56fe\u4e0a\u53f3\u952e\u8bbe\u5b9a\u76ee\u7684\u5730\uff0c\n\u89d2\u8272\u4f1a\u81ea\u5df1\u5bfb\u8def\u8d70\u8fc7\u53bb","50%","75%",mapCanvas);
      break;
    case 4:
      clickableBubble("\u5207\u6362\u5929\u6c14\u611f\u53d7\u56ed\u6797\u56db\u65f6\u4e4b\u7f8e\n\u2600\u767d\u5929 \u2605\u9ec4\u660f \u2606\u591c\u665a \u2608\u96e8\u5929","50%","14%",weather);
      break;
    case 5:
      showTutorialBubble("\u2705 \u6559\u7a0b\u5b8c\u6210\uff01\n\n\u5c3d\u60c5\u63a2\u7d22\u5427\uff0c\u53f3\u4e0a\u89d2\u968f\u65f6\u53ef\u4ee5\u6dfb\u52a0\u65b0\u89d2\u8272\u54e6","50%","50%","down");
      tutorialBubble.style.cursor="pointer";
      tutorialBubble.onclick=()=>{endTutorial();};
      setTimeout(()=>{endTutorial();},5000);
      break;
  }
}

function endTutorial(){
  tutorialActive=false;
  clearTutorialHighlights();
  tutorialBubble.style.opacity="0";
  tutorialSkip.style.display="none";
  tutorialOverlay.style.display="none";
  setTimeout(()=>{
    tutorialBubble.remove();
    tutorialSkip.remove();
    tutorialOverlay.remove();
  },400);
}

// Start tutorial after a short delay
setTimeout(()=>{
  if(tutorialActive)nextTutorialStep();
},1500);

// Wire status bar to tab switching
const origUpdateTabs=updateTabs;
updateTabs=function(){
  origUpdateTabs();
  updateStatusBar();
  updateKnowledge();
};
updateStatusBar();
updateKnowledge();

// Settings
document.getElementById("settings-btn").addEventListener("click",e=>{e.stopPropagation();document.getElementById("settings-panel").classList.toggle("show");});
document.addEventListener("click",e=>{const p=document.getElementById("settings-panel");const b=document.getElementById("settings-btn");if(!p.contains(e.target)&&e.target!==b)p.classList.remove("show");});
document.getElementById("api-save").addEventListener("click",()=>{
  const key=document.getElementById("api-key").value.trim(),url=document.getElementById("api-url").value.trim();
  localStorage.setItem("garden_api_key",key);localStorage.setItem("garden_api_url",url);
  apiStatus.textContent=key?"\u5df2\u4fdd\u5b58":"\u5df2\u6e05\u7a7a";
});
const sk=localStorage.getItem("garden_api_key"),su=localStorage.getItem("garden_api_url");
if(sk)document.getElementById("api-key").value=sk;if(su)document.getElementById("api-url").value=su;

// Add character dialog
const cp=document.getElementById("new-char-color"),hi=document.getElementById("new-char-hex");
cp.addEventListener("input",()=>{hi.value=cp.value;});
hi.addEventListener("input",()=>{if(/^#[0-9a-fA-F]{6}$/.test(hi.value))cp.value=hi.value;});
document.getElementById("btn-cancel-add").addEventListener("click",()=>{
  document.getElementById("add-char-dialog").classList.remove("show");
  document.getElementById("new-char-name").value="";document.getElementById("new-char-role").value="";
  document.getElementById("new-char-age").value="30";document.getElementById("new-char-persona").value="";
});

// Random character generation
document.getElementById("btn-random-char").addEventListener("click",async()=>{
  const btn=document.getElementById("btn-random-char");
  const origText=btn.textContent;
  btn.textContent="\u751f\u6210\u4e2d...";
  btn.disabled=true;
  try{
    const cfg=getAPIConfig();
    if(!cfg.key||!cfg.url){
      const roles=["\u77f3\u5320","\u56ed\u4e01","\u4e66\u753b\u5320","\u7bc6\u523b\u5e08","\u6cb9\u6f06\u5320","\u96d5\u523b\u5e08","\u82b1\u5320","\u6e38\u5ba2","\u8bd7\u4eba","\u7434\u5e08","\u8336\u4eba","\u6e14\u592b","\u4f0d\u5320","\u6ce5\u6c34\u5320","\u5047\u5c71\u5320"];
      const names=["\u8001\u5f20","\u963f\u660e","\u5c0f\u6885","\u5927\u6797","\u8001\u738b","\u963f\u82b3","\u5c0f\u8d75","\u8001\u9648","\u963f\u79c0","\u5c0f\u9f99"];
      document.getElementById("new-char-name").value=names[Math.floor(Math.random()*names.length)];
      document.getElementById("new-char-role").value=roles[Math.floor(Math.random()*roles.length)];
      document.getElementById("new-char-gender").value=Math.random()>0.5?"male":"female";
      document.getElementById("new-char-age").value=18+Math.floor(Math.random()*55);
      document.getElementById("new-char-color").value="#"+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,"0");
      document.getElementById("new-char-hex").value=document.getElementById("new-char-color").value;
      const r2=roles[Math.floor(Math.random()*roles.length)];
      document.getElementById("new-char-persona").value="\u9999\u5c71\u5e2e"+r2+"\uff0c\u5728\u82cf\u5dde\u56ed\u6797\u91cc\u5fd9\u788c\u591a\u5e74\uff0c\u624b\u827a\u7cbe\u6e5b\u3002";
    }else{
      const resp=await fetch(cfg.url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+cfg.key},body:JSON.stringify({model:"deepseek-v4-pro",messages:[{role:"system",content:"\u4f60\u662f\u4e00\u4e2a\u89d2\u8272\u751f\u6210\u5668\u3002\u8f93\u51faJSON\u683c\u5f0f\uff1a{\\\"name\\\":\\\"\u89d2\u8272\u540d\\\",\\\"role\\\":\\\"\u8eab\u4efd\\\",\\\"gender\\\":\\\"male\u6216female\\\",\\\"age\\\":\u5e74\u9f84,\\\"color\\\":\\\"#XXXXXX\\\",\\\"persona\\\":\\\"\u4eba\u8bbe\u63cf\u8ff0\\\"}\u3002\u89d2\u8272\u662f\u82cf\u5dde\u56ed\u6797\u4e2d\u7684\u5320\u4eba\u6216\u6e38\u5ba2\uff0c\u4eba\u8bbe\u8981\u751f\u52a8\u3002\u53ea\u8f93\u51faJSON\u3002"},{role:"user",content:"\u968f\u673a\u751f\u6210\u4e00\u4e2a\u89d2\u8272"}],max_tokens:300,temperature:1.2})});
      if(resp.ok){
        const r=await resp.json();
        const txt=r.choices?.[0]?.message?.content||"";
        try{
          const j=JSON.parse(txt.replace(/```json|```/g,"").trim());
          document.getElementById("new-char-name").value=j.name||"";
          document.getElementById("new-char-role").value=j.role||"";
          document.getElementById("new-char-gender").value=j.gender||"male";
          document.getElementById("new-char-age").value=j.age||30;
          if(j.color)document.getElementById("new-char-color").value=j.color;
          document.getElementById("new-char-hex").value=j.color||"#e07b3c";
          document.getElementById("new-char-persona").value=j.persona||"";
        }catch(e){
          alert("\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5");
        }
      }
    }
  }catch(e){
    alert("\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5");
  }
  btn.textContent=origText;
  btn.disabled=false;
});

document.getElementById("btn-create-char").addEventListener("click",()=>{
  const name=document.getElementById("new-char-name").value.trim();
  const role=document.getElementById("new-char-role").value.trim();
  const gender=document.getElementById("new-char-gender").value;
  const age=parseInt(document.getElementById("new-char-age").value)||30;
  const hex=hi.value.trim();const persona=document.getElementById("new-char-persona").value.trim();
  if(!name||!role||!hex||!persona)return alert("\u8bf7\u586b\u5199\u6240\u6709\u5b57\u6bb5");
  const colorHex=parseInt(hex.replace("#",""),16);
  const def={id:"custom-"+Date.now(),name,role,gender,age,color:colorHex,hexColor:hex,personality:persona,isCustom:true};
  const mesh=createCharacterMesh(def);mesh.userData.characterId=def.id;scene.add(mesh);
  characters.push({...def,mesh,target:null,state:"wander",wanderDir:Math.random()*Math.PI*2,observeTimer:6+Math.random()*6,speed:0.008+Math.random()*0.007,bounceTime:0,isBouncing:false,bubbleSprite:null,path:null,pathIdx:0,pathRecheck:0});
  updateTabs();
  document.getElementById("add-char-dialog").classList.remove("show");
  document.getElementById("new-char-name").value="";document.getElementById("new-char-role").value="";
  document.getElementById("new-char-age").value="30";document.getElementById("new-char-persona").value="";
});

// 2D Map
function resizeMapCanvas(){
  const rect=mapCanvas.parentElement.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  mapCanvas.width=rect.width*dpr;mapCanvas.height=rect.height*dpr;
}
function drawMap2D(){
  const dpr=window.devicePixelRatio||1,w=mapCanvas.width/dpr,h=mapCanvas.height/dpr;
  mapCtx.setTransform(dpr,0,0,dpr,0,0);mapCtx.clearRect(0,0,w,h);
  const scale=Math.min(w,h)/(SCENE_SIZE*2.2),ox=w/2,oy=h/2;
  mapCtx.fillStyle="#1a3a1a";mapCtx.fillRect(0,0,w,h);
  mapCtx.strokeStyle="#5a8a5a";mapCtx.lineWidth=2;mapCtx.strokeRect(ox-SCENE_SIZE*scale,oy-SCENE_SIZE*scale,SCENE_SIZE*2*scale,SCENE_SIZE*2*scale);
  mapCtx.fillStyle="rgba(60,130,180,0.35)";mapCtx.beginPath();mapCtx.ellipse(ox+5*scale,oy-4*scale,5*scale,3.5*scale,0,0,Math.PI*2);mapCtx.fill();
  mapCtx.fillStyle="rgba(180,150,120,0.45)";
  mapCtx.fillRect(ox-9*scale,oy-8*scale,5*scale,5*scale);mapCtx.fillRect(ox+7*scale,oy+4*scale,4*scale,4*scale);
  mapCtx.fillRect(ox-3*scale,oy+6*scale,5*scale,3*scale);mapCtx.fillRect(ox+3*scale,oy-9*scale,3*scale,3*scale);
  mapCtx.strokeStyle="rgba(200,180,150,0.35)";mapCtx.lineWidth=1;mapCtx.setLineDash([5,5]);
  mapCtx.beginPath();mapCtx.moveTo(ox-9*scale,oy-8*scale);mapCtx.lineTo(ox-3*scale,oy+6*scale);mapCtx.stroke();
  mapCtx.beginPath();mapCtx.moveTo(ox+7*scale,oy+4*scale);mapCtx.lineTo(ox+5*scale,oy-4*scale);mapCtx.stroke();mapCtx.setLineDash([]);
  const pr=9;
  characters.forEach(c=>{
    const px=ox+c.mesh.position.x*scale,py=oy+c.mesh.position.z*scale;
    mapCtx.beginPath();mapCtx.arc(px,py,pr+5,0,Math.PI*2);mapCtx.fillStyle=c===selectedCharacter?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.25)";mapCtx.fill();
    mapCtx.beginPath();mapCtx.arc(px,py,pr,0,Math.PI*2);mapCtx.fillStyle=c.hexColor;mapCtx.fill();
    mapCtx.strokeStyle=c===selectedCharacter?"#fff":"rgba(255,255,255,0.4)";mapCtx.lineWidth=c===selectedCharacter?2:1;mapCtx.stroke();
    mapCtx.fillStyle="#fff";mapCtx.font="11px Microsoft YaHei,PingFang SC,sans-serif";mapCtx.textAlign="center";mapCtx.fillText(c.name,px,py-pr-7);
    if(c.target){const tx=ox+c.target.x*scale,ty=oy+c.target.z*scale;mapCtx.strokeStyle="rgba(255,255,255,0.3)";mapCtx.lineWidth=1;mapCtx.setLineDash([3,4]);mapCtx.beginPath();mapCtx.moveTo(px,py);mapCtx.lineTo(tx,ty);mapCtx.stroke();mapCtx.setLineDash([]);mapCtx.beginPath();mapCtx.arc(tx,ty,4,0,Math.PI*2);mapCtx.fillStyle="rgba(255,255,255,0.5)";mapCtx.fill();}
  });
}
mapCanvas.addEventListener("click",e=>{
  const rect=mapCanvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const scale=Math.min(rect.width,rect.height)/(SCENE_SIZE*2.2),ox=rect.width/2,oy=rect.height/2;
  for(const c of characters){
    const px=ox+c.mesh.position.x*scale,py=oy+c.mesh.position.z*scale;
    if(Math.sqrt((mx-px)**2+(my-py)**2)<16){selectedCharacter=c;updateTabs();return;}
  }
});
mapCanvas.addEventListener("contextmenu",e=>{
  e.preventDefault();if(!selectedCharacter)return;
  const rect=mapCanvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const scale=Math.min(rect.width,rect.height)/(SCENE_SIZE*2.2),ox=rect.width/2,oy=rect.height/2;
  selectedCharacter.target={x:(mx-ox)/scale,z:(my-oy)/scale};
});

// Render
function renderMapView(){
  mapControls.update();
  document.querySelectorAll(".speech-bubble").forEach(b=>b.style.opacity="0");
  sky.visible=false;const sb=scene.background;scene.background=null;
  mapRenderer.render(scene,mapCamera);
  scene.background=sb;sky.visible=true;
  document.querySelectorAll(".speech-bubble").forEach(b=>b.style.opacity="");
}
function resizeMap(){const rect=mapTopContainer.getBoundingClientRect();mapRenderer.setSize(rect.width,rect.height);mapCamera.aspect=rect.width/Math.max(rect.height,1);mapCamera.updateProjectionMatrix();}
function resizePOV(){const rect=povContainer.getBoundingClientRect();povRenderer.setSize(rect.width,rect.height);povCamera.aspect=rect.width/Math.max(rect.height,1);povCamera.updateProjectionMatrix();}
window.addEventListener("resize",()=>{resizePOV();resizeMap();resizeMapCanvas();});
resizePOV();resizeMap();resizeMapCanvas();

let lastTime=performance.now();
function animate(){
  requestAnimationFrame(animate);
  const now=performance.now(),dt=Math.min((now-lastTime)/1000,0.1);lastTime=now;
  characters.forEach(c=>updateCharacterMovement(c));
  characters.forEach(c=>{
    if(c.isBouncing){c.bounceTime+=dt;c.mesh.position.y=Math.abs(Math.sin(c.bounceTime*5))*0.35;if(c.bounceTime>1.5){c.isBouncing=false;c.mesh.position.y=0;c.bounceTime=0;}}
    if(c.bubbleSprite&&c.bubbleTimer!==undefined){
      c.bubbleTimer-=dt;
      const ageScale=c.age?Math.min(1.15,Math.max(0.55,c.age<14?0.6:c.age<25?0.85:c.age<60?1.0:0.9)):1.0;
      c.bubbleSprite.position.copy(c.mesh.position);c.bubbleSprite.position.y+=1.5+ageScale*0.9;
      if(c.bubbleTimer<0.8)c.bubbleSprite.material.opacity=Math.max(0,c.bubbleTimer/0.8);
      if(c.bubbleTimer<=0){scene.remove(c.bubbleSprite);c.bubbleSprite=null;}
    }
  });
  characters.forEach(c=>updateCharacterAI(c,dt));
  updatePOV();drawMap2D();renderMapView();
  // Show POV bubbles, hide during map render
  povRenderer.render(scene,povCamera);
}
animate();
</script>
</body>
</html>
"""

with open(OUT, "a", encoding="utf-8", newline="\n") as f:
    f.write(js3)

print("Final part appended - DONE")

