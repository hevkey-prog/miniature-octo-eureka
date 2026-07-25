import json, re
import numpy as np

# Whisper-word-timestamp clock: replaces generic onset-strength energy with
# actual recognized-speech event timestamps (filters out non-vocal onset
# noise, captures real pauses/gaps between phrases). Per the project brief,
# Demucs+transcribe was noted as clearly more accurate than onset-strength
# alone ("ดีขึ้นมาก ครอบคลุมทั้งเพลง") — this reuses that transcript instead
# of discarding it, while still avoiding brief's failure mode #4 (fuzzy TEXT
# matching against repeated lyrics) by only using WORD TIMESTAMPS/ORDER, not
# matching transcribed text content to lyrics content at all.

words = json.load(open("whisper_words.json", encoding="utf-8"))
mids = np.array([(w["start"] + w["end"]) / 2 for w in words])
mids.sort()

song_duration = 229.848  # from ffprobe on song.mp3

# cumulative recognized-word "clock": count of words heard by time t,
# normalized into the same units as wall-clock time so it can be inverted
counts = np.arange(1, len(mids) + 1, dtype=float)
clock = counts / counts[-1] * song_duration

def clock_to_time(frac_of_total_words):
    idx = frac_of_total_words * counts[-1]
    return float(np.interp(idx, counts, mids))

def char_weight(text):
    stripped = re.sub(r"[^\w]", "", text, flags=re.UNICODE)
    return max(1, len(stripped))

rows = json.load(open("lyrics_lines.json", encoding="utf-8"))
weights = [char_weight(r["text"]) for r in rows]
total_w = sum(weights)

HEAD = 0.3
TAIL = 1.0

cum_w = 0.0
out_rows = []
for r, w in zip(rows, weights):
    start_frac = cum_w / total_w
    cum_w += w
    end_frac = cum_w / total_w
    t_start = clock_to_time(start_frac)
    t_end = clock_to_time(end_frac)
    out_rows.append({"section": r["section"], "text": r["text"], "start": t_start, "end": t_end})

# guarantee monotonic non-overlapping starts (word-count clock can be locally
# flat across a real silence, which combined with rounding could otherwise
# produce a zero/negative gap between two consecutive lines)
for i in range(1, len(out_rows)):
    if out_rows[i]["start"] <= out_rows[i - 1]["start"]:
        out_rows[i]["start"] = out_rows[i - 1]["start"] + 0.1
    if out_rows[i]["end"] <= out_rows[i]["start"]:
        out_rows[i]["end"] = out_rows[i]["start"] + 0.5

out_rows[0]["start"] = max(HEAD, out_rows[0]["start"])
out_rows[-1]["end"] = min(song_duration - 0.05, out_rows[-1]["end"] if out_rows[-1]["end"] > out_rows[-1]["start"] else out_rows[-1]["start"] + 2.0)

for r in out_rows:
    r["start"] = round(r["start"], 3)
    r["end"] = round(r["end"], 3)

json.dump(out_rows, open("timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

durs = [out_rows[i + 1]["start"] - out_rows[i]["start"] for i in range(len(out_rows) - 1)]
durs.append(out_rows[-1]["end"] - out_rows[-1]["start"])
print(f"n={len(out_rows)} min={min(durs):.2f} max={max(durs):.2f} mean={sum(durs)/len(durs):.2f}")
print("first:", out_rows[0])
print("last:", out_rows[-1])

# quick sanity print around the known Slow Bridge / Verse3 boundaries
for r in out_rows:
    if r["section"] in ("Slow Bridge - tempo drops, half-time, soft delivery", "Verse 3 - Present") and r == next(x for x in out_rows if x["section"] == r["section"]):
        print(f"{r['section']} starts at {r['start']:.1f}s: {r['text'][:40]}")
