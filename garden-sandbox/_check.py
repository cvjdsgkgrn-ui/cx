path3 = r"F:\cx\garden-sandbox\build_step3.py"
data = open(path3, "r", encoding="utf-8-sig").read()

# Find the js2 f-string content 
start = data.find('js2 = f"""')
end = data.find('\n"""\n\nwith open', start)
js2 = data[start+10:end]

# Manual count with context
depth = 0
lines = js2.split("\n")
for ln, line in enumerate(lines):
    i = 0
    while i < len(line):
        if line[i:i+2] == '{{':
            i += 2; continue
        if line[i:i+2] == '}}':
            i += 2; continue
        if line[i] == '{':
            depth += 1
            if depth == 1:
                print(f"Line {ln+1}: OPEN depth={depth} -> {line.strip()[:80]}")
        elif line[i] == '}':
            depth -= 1
            if depth == 0:
                print(f"Line {ln+1}: CLOSE depth=0 -> {line.strip()[:80]}")
        i += 1

print(f"\nFinal depth: {depth}")
