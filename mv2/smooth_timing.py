import json

FLOOR = 2.3  # minimum seconds any single line stays as the "current" line
HEAD = 0.3
TAIL = 1.0

timing = json.load(open("timing.json", encoding="utf-8"))
n = len(timing)
song_end = timing[-1]["end"]

starts = [r["start"] for r in timing]
orig_dur = [starts[i + 1] - starts[i] for i in range(n - 1)]
orig_dur.append(timing[-1]["end"] - starts[-1])

# water-fill: guarantee every line >= FLOOR, pull the extra time from lines
# that already have slack (proportional to how much slack they had), so the
# total stays anchored to the song length instead of drifting the ending.
deficit = [max(0.0, FLOOR - d) for d in orig_dur]
total_deficit = sum(deficit)
surplus = [max(0.0, d - FLOOR) for d in orig_dur]
total_surplus = sum(surplus)

if total_deficit > 0 and total_surplus > 0:
    take_ratio = min(1.0, total_deficit / total_surplus)
else:
    take_ratio = 0.0

new_dur = []
for d, defi, surp in zip(orig_dur, deficit, surplus):
    if defi > 0:
        new_dur.append(d + defi)
    else:
        new_dur.append(d - surp * take_ratio)

# rescale so the total exactly matches the original song-timing span
span = song_end - starts[0]
scale = span / sum(new_dur)
new_dur = [d * scale for d in new_dur]

new_starts = [starts[0]]
for d in new_dur[:-1]:
    new_starts.append(new_starts[-1] + d)

for i, r in enumerate(timing):
    r["start"] = round(new_starts[i], 3)
    r["end"] = round(new_starts[i] + new_dur[i], 3)

json.dump(timing, open("timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

durs = [timing[i + 1]["start"] - timing[i]["start"] for i in range(n - 1)] + [timing[-1]["end"] - timing[-1]["start"]]
print(f"min {min(durs):.2f}  max {max(durs):.2f}  mean {sum(durs)/len(durs):.2f}")
print(f"last end: {timing[-1]['end']:.2f} (song end was {song_end:.2f})")
