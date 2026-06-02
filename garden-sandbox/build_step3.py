# -*- coding: utf-8 -*-
OUT = r"F:\cx\garden-sandbox\index.html"

def esc(s):
    return "".join("\\u%04x" % ord(c) if ord(c) > 127 else c for c in s)

S = {
    "add_btn": esc("+ 添加"),
    "pov_suffix": esc("的视角"),
    "feeling": esc("感受："),
    "dialogue": esc("对话："),
    "sys_prompt": esc("你是苏州园林中的匠人或画师，用口语化中文简短自然地回应。"),
    "alert_fill": esc("请填写所有字段"),
    "saved": esc("已保存"),
    "cleared": esc("已清空"),
    "online": esc("在线"),
    "conn_fail": esc("连接失败"),
}

js2 = f"""
// A* Pathfinding grid
const GRID_RES=1.0; // 1m per cell
const GRID_SIZE=Math.ceil(SCENE_SIZE*2/GRID_RES)+2;
const gridOffset=Math.floor(GRID_SIZE/2);
function worldToGrid(wx,wz){{
  return{{x:Math.round(wx/GRID_RES)+gridOffset,z:Math.round(wz/GRID_RES)+gridOffset}};
}}
function gridToWorld(gx,gz){{
  return{{x:(gx-gridOffset)*GRID_RES,z:(gz-gridOffset)*GRID_RES}};
}}
function isBlocked(gx,gz){{
  const w=gridToWorld(gx,gz);
  if(Math.abs(w.x)>HALF||Math.abs(w.z)>HALF)return true;
  for(const o of OBSTACLES){{
    const dx=w.x-o.x,dz=w.z-o.z;
    if(dx*dx+dz*dz<(o.r+0.4)*(o.r+0.4))return true;
  }}
  return false;
}}
function findPath(sx,sz,ex,ez){{
  const s=worldToGrid(sx,sz);
  const e=worldToGrid(ex,ez);
  if(s.x===e.x&&s.z===e.z)return[];
  if(isBlocked(e.x,e.z))return null;
  const open=[],closed=new Set();
  const key=(x,z)=>x+","+z;
  const startKey=key(s.x,s.z);
  const cameFrom={{}};
  const gScore={{}};gScore[startKey]=0;
  const fScore={{}};fScore[startKey]=Math.abs(s.x-e.x)+Math.abs(s.z-e.z);
  open.push({{x:s.x,z:s.z,f:fScore[startKey]}});
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  let found=false;
  while(open.length>0&&open.length<800){{
    open.sort((a,b)=>a.f-b.f);
    const cur=open.shift();
    const ck=key(cur.x,cur.z);
    if(cur.x===e.x&&cur.z===e.z){{found=true;break;}}
    if(closed.has(ck))continue;
    closed.add(ck);
    for(const[dgx,dgz]of dirs){{
      const nx=cur.x+dgx,nz=cur.z+dgz;
      const nk=key(nx,nz);
      if(closed.has(nk))continue;
      if(nx<0||nz<0||nx>=GRID_SIZE||nz>=GRID_SIZE)continue;
      if(isBlocked(nx,nz))continue;
      const diag=Math.abs(dgx)+Math.abs(dgz)===2?1.414:1;
      const tg=gScore[ck]+diag;
      if(tg<(gScore[nk]||Infinity)){{
        cameFrom[nk]=ck;
        gScore[nk]=tg;
        fScore[nk]=tg+Math.abs(nx-e.x)+Math.abs(nz-e.z);
        open.push({{x:nx,z:nz,f:fScore[nk]}});
      }}
    }}
  }}
  if(!found)return null;
  // Reconstruct path
  const path=[];
  let ck=key(e.x,e.z);
  while(ck!==startKey){{
    const[gx,gz]=ck.split(",").map(Number);
    const w=gridToWorld(gx,gz);
    path.unshift({{x:w.x,z:w.z}});
    ck=cameFrom[ck];
    if(!ck||path.length>200)break;
  }}
  // Simplify path: remove redundant midpoints
  const simp=[path[0]];
  for(let i=1;i<path.length-1;i++){{
    const prev=simp[simp.length-1];
    const cur=path[i];
    const next=path[i+1];
    const d1=Math.atan2(cur.x-prev.x,cur.z-prev.z);
    const d2=Math.atan2(next.x-cur.x,next.z-cur.z);
    let diff=Math.abs(d1-d2);
    if(diff>Math.PI)diff=Math.PI*2-diff;
    if(diff>0.15)simp.push(cur);
  }}
  simp.push(path[path.length-1]);
  return simp;
}}

// Collision detection
function checkCollision(x,z,excludeChar){{
  if(Math.abs(x)>HALF||Math.abs(z)>HALF)return true;
  for(const o of OBSTACLES){{
    if(excludeChar&&o.charRef===excludeChar)continue;
    const dx=x-o.x,dz=z-o.z;
    const minDist=o.r+0.35;
    if(dx*dx+dz*dz<minDist*minDist)return true;
  }}
  return false;
}}

function pushAwayFromObstacles(c){{
  for(const o of OBSTACLES){{
    const dx=c.mesh.position.x-o.x,dz=c.mesh.position.z-o.z;
    const minDist=o.r+0.4;
    const dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<minDist&&dist>0.001){{
      const pushX=dx/dist*(minDist-dist)*0.5;
      const pushZ=dz/dist*(minDist-dist)*0.5;
      c.mesh.position.x+=pushX;
      c.mesh.position.z+=pushZ;
      if(Math.abs(c.mesh.position.x)>HALF)c.mesh.position.x=Math.sign(c.mesh.position.x)*HALF;
      if(Math.abs(c.mesh.position.z)>HALF)c.mesh.position.z=Math.sign(c.mesh.position.z)*HALF;
    }}
  }}
}}

function wanderWithAttraction(c){{
  if(!c.wanderTimer)c.wanderTimer=3+Math.random()*5;
  c.wanderTimer-=0.016;
  if(c.wanderTimer<=0){{
    c.wanderTimer=3+Math.random()*5;
    const poi=POI[Math.floor(Math.random()*POI.length)];
    c.wanderDir=Math.atan2(poi.x-c.mesh.position.x,poi.z-c.mesh.position.z);
  }}
}}

function updateCharacterMovement(c){{

  if(c.target){{

    if(!c.path||c.path.length===0||c.pathRecheck--<=0){{

      c.pathRecheck=30;

      const path=findPath(c.mesh.position.x,c.mesh.position.z,c.target.x,c.target.z);

      if(path&&path.length>0){{

        c.path=path;c.pathIdx=0;

      }}else{{

        c.path=null;c.target=null;c.state="wander";

        c.wanderDir=Math.random()*Math.PI*2;

        return;

      }}

    }}

    const wp=c.path[c.pathIdx];

    const dx=wp.x-c.mesh.position.x,dz=wp.z-c.mesh.position.z;

    const dist=Math.sqrt(dx*dx+dz*dz);

    if(dist<0.3){{

      c.pathIdx++;

      if(c.pathIdx>=c.path.length){{

        c.path=null;c.target=null;c.state="wander";

        c.wanderDir=Math.random()*Math.PI*2;

      }}

    }}else{{

      const spd=Math.min(c.speed*0.9,dist*3);

      let nx=c.mesh.position.x+dx/dist*spd;

      let nz=c.mesh.position.z+dz/dist*spd;

      if(!checkCollision(nx,nz)){{

        c.mesh.position.x=nx;c.mesh.position.z=nz;

      }}

      c.state="navigate";

    }}

  }}else{{

    c.state="wander";

    let nx=c.mesh.position.x+Math.sin(c.wanderDir)*c.speed;

    let nz=c.mesh.position.z+Math.cos(c.wanderDir)*c.speed;

    if(!c.lastPos){{c.lastPos={{x:c.mesh.position.x,z:c.mesh.position.z}};c.stuckTimer=0;}}

    const moved=Math.abs(c.mesh.position.x-c.lastPos.x)+Math.abs(c.mesh.position.z-c.lastPos.z);

    c.lastPos={{x:c.mesh.position.x,z:c.mesh.position.z}};

    if(moved<0.02){{c.stuckTimer+=0.1;}}else{{c.stuckTimer=0;}}

    if(checkCollision(nx,nz)||c.stuckTimer>3){{

      let bestDir=c.wanderDir,bestDist=0;

      for(let ang=-Math.PI*0.8;ang<=Math.PI*0.8;ang+=0.15){{

        const tryDir=c.wanderDir+ang;

        const tx=c.mesh.position.x+Math.sin(tryDir)*c.speed*4;

        const tz=c.mesh.position.z+Math.cos(tryDir)*c.speed*4;

        if(!checkCollision(tx,tz)){{

          let farX=tx,farZ=tz,steps=0;

          while(!checkCollision(farX,farZ)&&steps<5){{

            farX+=Math.sin(tryDir)*c.speed*2;

            farZ+=Math.cos(tryDir)*c.speed*2;

            steps++;

          }}

          const dist=steps*c.speed*2;

          if(dist>bestDist){{bestDist=dist;bestDir=tryDir;}}

        }}

      }}

      if(bestDist>0.5){{

        c.wanderDir=bestDir;

        c.stuckTimer=0;

      }}else{{

        const poi=POI[Math.floor(Math.random()*POI.length)];

        c.wanderDir=Math.atan2(poi.x-c.mesh.position.x,poi.z-c.mesh.position.z);

        pushAwayFromObstacles(c);

        c.stuckTimer=0;

      }}

    }}

    c.mesh.position.x+=Math.sin(c.wanderDir)*c.speed;

    c.mesh.position.z+=Math.cos(c.wanderDir)*c.speed;

    if(Math.abs(c.mesh.position.x)>HALF){{c.mesh.position.x=Math.sign(c.mesh.position.x)*HALF;c.wanderDir=-c.wanderDir+(Math.random()-0.5)*0.5;}}

    if(Math.abs(c.mesh.position.z)>HALF){{c.mesh.position.z=Math.sign(c.mesh.position.z)*HALF;c.wanderDir=Math.PI-c.wanderDir+(Math.random()-0.5)*0.5;}}

    wanderWithAttraction(c);

  }}

  pushAwayFromObstacles(c);

  // Smooth rotation toward movement direction

  let targetAngle=c.wanderDir;

  if(c.state==="navigate"&&c.path&&c.path.length>0){{

    targetAngle=Math.atan2(c.path[c.pathIdx].x-c.mesh.position.x,c.path[c.pathIdx].z-c.mesh.position.z);

  }}

  let diff=targetAngle-c.mesh.rotation.y;

  while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;

  c.mesh.rotation.y+=Math.sign(diff)*Math.min(Math.abs(diff),0.03);

}}

function updatePOV(){{
  if(!selectedCharacter)return;
  const pos=selectedCharacter.mesh.position,ry=selectedCharacter.mesh.rotation.y;
  povCamera.position.lerp(new THREE.Vector3(pos.x-Math.sin(ry)*1.5,1.8,pos.z-Math.cos(ry)*1.5),0.05);
  povLookTarget.lerp(new THREE.Vector3(pos.x+Math.sin(ry)*5,2.5,pos.z+Math.cos(ry)*5),0.06);
  povCamera.lookAt(povLookTarget);
  const lbl=document.getElementById("pov-label");
  if(lbl&&selectedCharacter){{lbl.textContent=selectedCharacter.name+"\\uff08"+selectedCharacter.role+"\\uff09{S['pov_suffix']}";lbl.style.borderLeftColor=selectedCharacter.hexColor;}}
}}

// LLM
function getAPIConfig(){{return{{key:document.getElementById("api-key").value.trim(),url:document.getElementById("api-url").value.trim()}};}}
async function callLLM(sp){{
  const{{key,url}}=getAPIConfig();if(!key||!url)return null;
  try{{
    const res=await fetch(url,{{method:"POST",headers:{{"Content-Type":"application/json",Authorization:"Bearer "+key}},body:JSON.stringify({{model:"deepseek-v4-pro",messages:[{{role:"system",content:"{S['sys_prompt']}"}},{{role:"user",content:sp}}],max_tokens:200,temperature:0.9}})}});
    if(!res.ok){{apiStatus.textContent="HTTP "+res.status;apiStatus.style.color="#e74c3c";return null;}}
    const data=await res.json();apiStatus.textContent="{S['online']}";apiStatus.style.color="#4ecdc4";
    return data.choices?.[0]?.message?.content?.trim()||null;
  }}catch(e){{apiStatus.textContent="{S['conn_fail']}";apiStatus.style.color="#e74c3c";return null;}}
}}

async function updateCharacterAI(c,dt){{
  c.observeTimer-=dt;
  if(c.observeTimer<=0&&c===selectedCharacter){{
    c.observeTimer=8+Math.random()*8;
    const lm=LANDMARKS[Math.floor(Math.random()*LANDMARKS.length)];
    const text=await callLLM("你是"+c.name+"\\uff08"+c.role+"\\uff1a"+c.personality+"\\u3002你在苏州园林里，眼前是"+lm+"\\u3002请用第一人称口语化中文说一句感受，不超过40字，直接输出。");
    if(text)addStreamMessage(c,"{S['feeling']}"+text,"feeling");
  }}
  for(const o of characters){{
    if(o===c||o.state==="converse"||c.state==="converse")continue;
    const dx=c.mesh.position.x-o.mesh.position.x,dz=c.mesh.position.z-o.mesh.position.z;
    const dist=Math.sqrt(dx*dx+dz*dz);
    const pk=[c.id,o.id].sort().join("-"),now=Date.now();
    if(dist<CONVERSE_DIST&&(!CONVERSE_COOLDOWN[pk]||now-CONVERSE_COOLDOWN[pk]>30000)){{
      CONVERSE_COOLDOWN[pk]=now;c.state="converse";o.state="converse";
      c.isBouncing=true;c.bounceTime=0;o.isBouncing=true;o.bounceTime=0;
      c.mesh.rotation.y=Math.atan2(o.mesh.position.x-c.mesh.position.x,o.mesh.position.z-c.mesh.position.z);
      o.mesh.rotation.y=Math.atan2(c.mesh.position.x-o.mesh.position.x,c.mesh.position.z-o.mesh.position.z);
      const mx=(c.mesh.position.x+o.mesh.position.x)/2,mz=(c.mesh.position.z+o.mesh.position.z)/2;
      c.mesh.position.x=mx-0.5;o.mesh.position.x=mx+0.5;c.mesh.position.z=mz;o.mesh.position.z=mz;
      const text=await callLLM("你是"+c.name+"\\uff08"+c.role+"\\uff1a"+c.personality+"\\u3002你在苏州园林遇到了"+o.name+"\\uff08"+o.role+"\\u3002请进行2-3轮简短对话，围绕香山帮营造技艺或园林美学。格式：\\u300c"+c.name+"\\uff1axxx\\u300d\\u300c"+o.name+"\\uff1axxx\\u300d，直接输出。");
      if(text)addStreamMessage(c,"{S['dialogue']}"+text,"dialogue");
      setTimeout(async()=>{{const reply=await callLLM("\u4f60\u662f"+o.name+"\uff08"+o.role+"\uff1a"+o.personality+"\u3002\u4f60\u5728\u56ed\u4e2d\u9047\u5230"+c.name+"\uff0c\u4ed6\u5bf9\u4f60\u8bf4\uff1a\u300c"+text+"\u300d\u3002\u8bf7\u56de\u5e94\u4ed6\uff0c\u53e3\u8bed\u5316\uff0c\u4e0d\u8d85\u8fc725\u5b57\uff0c\u76f4\u63a5\u8f93\u51fa\u3002");if(reply)addStreamMessage(o,reply,"dialogue");c.state="wander";o.state="wander";c.wanderDir=Math.random()*Math.PI*2;o.wanderDir=Math.random()*Math.PI*2;}},4000);
    }}
  }}
}}
"""

with open(OUT, "a", encoding="utf-8", newline="\n") as f:
    f.write(js2)

print("JS part 2 appended")
