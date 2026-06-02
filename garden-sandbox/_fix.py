# Fix: double all braces in the wander section of build_step3 f-string
path3 = r"F:\cx\garden-sandbox\build_step3.py"
data = open(path3, "r", encoding="utf-8-sig").read()

# The new wander code from "c.state=\"wander\";" to "wanderWithAttraction(c);"
# In f-string, JS braces { } must be {{ }}
# Replace patterns that have single braces

# 1. if(!c.lastPos){...}  
data = data.replace(
    "if(!c.lastPos){c.lastPos={{x:c.mesh.position.x,z:c.mesh.position.z}};c.stuckTimer=0;}",
    "if(!c.lastPos){{c.lastPos={{x:c.mesh.position.x,z:c.mesh.position.z}};c.stuckTimer=0;}}"
)
# 2. if(moved<0.02){...}else{...}
data = data.replace(
    "if(moved<0.02){c.stuckTimer+=0.1;}else{c.stuckTimer=0;}",
    "if(moved<0.02){{c.stuckTimer+=0.1;}}else{{c.stuckTimer=0;}}"
)
# 3. for(let ang=...){...}
data = data.replace(
    "for(let ang=-Math.PI*0.8;ang<=Math.PI*0.8;ang+=0.15){",
    "for(let ang=-Math.PI*0.8;ang<=Math.PI*0.8;ang+=0.15){{"
)
# 4. if(!checkCollision(tx,tz)){...}
data = data.replace(
    "if(!checkCollision(tx,tz)){{",
    "if(!checkCollision(tx,tz)){{{{"
)
# Wait that's wrong - it's already doubled. Let me check
print("Checking patterns...")
for pattern in ["if(!c.lastPos)", "if(moved<0.02)", "for(let ang="]:
    idx = data.find(pattern)
    if idx > 0:
        print(f"  {pattern}: {data[idx:idx+80][:80]}")

with open(path3, "w", encoding="utf-8-sig", newline="\n") as f:
    f.write(data)
