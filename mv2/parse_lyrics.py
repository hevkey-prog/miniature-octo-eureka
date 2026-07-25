import re, json

def parse(path="lyrics.md"):
    rows = []
    section = None
    for raw in open(path, encoding="utf-8"):
        line = raw.rstrip("\n").strip()
        if not line:
            continue
        m = re.match(r"^##\s*\[(.+?)\]", line)
        if m:
            section = m.group(1).strip()
            continue
        if line.startswith("#") or line.startswith("*") or line.startswith("```") or line.startswith("---"):
            continue
        if section is None:
            continue
        rows.append({"section": section, "text": line})
    return rows

if __name__ == "__main__":
    rows = parse()
    print(f"Total lines: {len(rows)}")
    from collections import Counter
    c = Counter(r["section"] for r in rows)
    for s, n in c.items():
        print(f"  {s}: {n} lines")
    json.dump(rows, open("lyrics_lines.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
