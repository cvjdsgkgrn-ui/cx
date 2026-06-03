# Fix HTML unicode escapes in index.html
import re
SRC = r"F:\cx\src\garden-sandbox\index.html"
with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()

# Split at the importmap script tag - everything before is HTML
split = content.find('<script type="importmap">')
if split < 0:
    print("ERROR: importmap not found")
    exit(1)
html_part = content[:split]
js_part = content[split:]

# Replace \uXXXX with actual Unicode characters
def unescape(m):
    return chr(int(m.group(1), 16))
html_fixed = re.sub(r"\\u([0-9a-fA-F]{4})", unescape, html_part)

# Also fix the JS part: unescape \uXXXX that are in JS f-strings (already handled)
# but HTML uses actual encoded chars

with open(SRC, "w", encoding="utf-8", newline="\n") as f:
    f.write(html_fixed + js_part)
print("HTML unicode escapes fixed")

