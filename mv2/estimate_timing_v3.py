import json, re
import difflib
import numpy as np

# Sequence-alignment approach: instead of assuming a uniform correspondence
# between our lyrics and the whisper transcript (v2's weakness — drifts hard
# whenever whisper hallucinates/misses a stretch, e.g. it swallowed ~3 real
# lines into one bogus 9s token right at the Verse2->Bridge transition), find
# actual matching substrings between our known lyrics and the whisper
# transcript (which is mostly close-but-imperfect), and only trust time
# anchors at those verified matches. Unmatched stretches are interpolated
# locally between the nearest verified anchors, so errors stay contained
# instead of compounding over 74 lines.

SONG_DURATION = 229.848
HEAD, TAIL = 0.3, 1.0

def norm(s):
    # keep Thai + latin letters only, lowercase latin, for robust matching
    return re.sub(r"[^\w]", "", s, flags=re.UNICODE).lower()

rows = json.load(open("lyrics_lines.json", encoding="utf-8"))
words = json.load(open("whisper_words.json", encoding="utf-8"))
words.sort(key=lambda w: w["start"])

# --- known lyrics: normalized char stream + per-char line/offset map ---
known_chars = []
known_line_of_char = []
line_char_start = []
for li, r in enumerate(rows):
    line_char_start.append(len(known_chars))
    for ch in norm(r["text"]):
        known_chars.append(ch)
        known_line_of_char.append(li)
known_text = "".join(known_chars)
line_char_start.append(len(known_chars))  # sentinel end

# --- whisper transcript: normalized char stream + per-char timestamp ---
whisper_chars = []
whisper_time_of_char = []
for w in words:
    chs = norm(w["word"])
    if not chs:
        continue
    t0, t1 = w["start"], w["end"]
    n = len(chs)
    for i, ch in enumerate(chs):
        whisper_chars.append(ch)
        frac = (i + 0.5) / n
        whisper_time_of_char.append(t0 + frac * (t1 - t0))
whisper_text = "".join(whisper_chars)
whisper_time_of_char = np.array(whisper_time_of_char)

print(f"known_text len={len(known_text)}  whisper_text len={len(whisper_text)}")

sm = difflib.SequenceMatcher(None, known_text, whisper_text, autojunk=False)
blocks = [b for b in sm.get_matching_blocks() if b.size >= 5]
print(f"matching blocks (size>=5): {len(blocks)}")

# enforce strict monotonic increase in both a (known) and b (whisper) offsets
anchors_a, anchors_t = [0], [HEAD]
last_a, last_b = -1, -1
for b in blocks:
    if b.a <= last_a or b.b <= last_b:
        continue
    t = float(whisper_time_of_char[b.b])
    if t <= anchors_t[-1]:
        continue
    anchors_a.append(b.a)
    anchors_t.append(t)
    last_a, last_b = b.a + b.size, b.b + b.size
anchors_a.append(len(known_text))
anchors_t.append(SONG_DURATION - TAIL)

print(f"usable anchors: {len(anchors_a)}")
coverage = sum(b.size for b in blocks) / len(known_text)
print(f"approx char coverage of matches: {coverage:.1%}")

def offset_to_time(a):
    return float(np.interp(a, anchors_a, anchors_t))

out_rows = []
for li, r in enumerate(rows):
    t_start = offset_to_time(line_char_start[li])
    t_end = offset_to_time(line_char_start[li + 1])
    out_rows.append({"section": r["section"], "text": r["text"], "start": t_start, "end": t_end})

# monotonic safety net
for i in range(1, len(out_rows)):
    if out_rows[i]["start"] <= out_rows[i - 1]["start"] + 0.05:
        out_rows[i]["start"] = out_rows[i - 1]["start"] + 0.4
    if out_rows[i]["end"] <= out_rows[i]["start"] + 0.2:
        out_rows[i]["end"] = out_rows[i]["start"] + 0.6

for r in out_rows:
    r["start"] = round(r["start"], 3)
    r["end"] = round(r["end"], 3)

json.dump(out_rows, open("timing_v3.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

durs = [out_rows[i + 1]["start"] - out_rows[i]["start"] for i in range(len(out_rows) - 1)]
durs.append(out_rows[-1]["end"] - out_rows[-1]["start"])
print(f"n={len(out_rows)} min={min(durs):.2f} max={max(durs):.2f} mean={sum(durs)/len(durs):.2f}")

for r in out_rows:
    if r["section"].startswith("Slow Bridge") or r["section"] == "Verse 3 - Present":
        pass
sections_seen = set()
for r in out_rows:
    if r["section"] not in sections_seen:
        sections_seen.add(r["section"])
        print(f"{r['section']!r} starts at {r['start']:.1f}s: {r['text'][:40]}")
