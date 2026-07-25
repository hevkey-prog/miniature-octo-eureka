import json, re, subprocess, os
import numpy as np
import librosa

SONG = "song.mp3"
VOCALS = "out/demucs/htdemucs/song/vocals.wav"

def run_demucs():
    if os.path.exists(VOCALS):
        print("vocals.wav already exists, skipping demucs")
        return
    subprocess.run(
        ["python3", "-m", "demucs", "--two-stems", "vocals", "-n", "htdemucs", "-o", "out/demucs", SONG],
        check=True,
    )

def char_weight(text):
    # crude syllable-count proxy: strip spaces/punctuation, count remaining
    # chars (Thai chars ~1 syllable-ish each, English roughly similar enough
    # for a DRAFT that the user will correct by ear anyway)
    stripped = re.sub(r"[^\w]", "", text, flags=re.UNICODE)
    return max(1, len(stripped))

def fmt(t):
    m = int(t // 60)
    s = t - m * 60
    return f"{m}:{s:05.2f}"

def main():
    run_demucs()
    y, sr = librosa.load(VOCALS, sr=22050, mono=True)
    hop = 256
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    times = librosa.frames_to_time(np.arange(len(onset_env)), sr=sr, hop_length=hop)
    duration = librosa.get_duration(y=y, sr=sr)

    # floor so silent stretches still advance the "clock" a little, avoiding
    # zero-division / infinite dwell during instrumental gaps
    onset_env = onset_env + 0.05 * onset_env.max()
    cum = np.cumsum(onset_env)
    cum = cum / cum[-1] * duration  # cumulative "work" clock, same units as time

    def work_to_time(w):
        w = min(max(w, 0.0), duration)
        return float(np.interp(w, cum, times))

    rows = json.load(open("lyrics_lines.json", encoding="utf-8"))
    weights = [char_weight(r["text"]) for r in rows]
    total_w = sum(weights)

    # leave a small head/tail margin so the first/last line isn't jammed
    # against absolute 0 or the very end of the track
    HEAD = 0.6
    TAIL = 1.0
    usable = duration - HEAD - TAIL

    cum_w = 0.0
    out_rows = []
    for r, w in zip(rows, weights):
        start_frac = cum_w / total_w
        cum_w += w
        end_frac = cum_w / total_w
        start_t = HEAD + start_frac * usable
        end_t = HEAD + end_frac * usable
        # map through the onset-weighted clock too, so line boundaries drift
        # toward where singing is actually dense vs. sparse
        start_work = start_frac * duration
        end_work = end_frac * duration
        start_t2 = work_to_time(start_work)
        end_t2 = work_to_time(end_work)
        # blend linear-proportional with onset-weighted estimate
        start_final = 0.5 * start_t + 0.5 * start_t2
        end_final = 0.5 * end_t + 0.5 * end_t2
        out_rows.append({"section": r["section"], "text": r["text"], "start": round(start_final, 2), "end": round(end_final, 2)})

    json.dump(out_rows, open("draft_timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    with open("draft_timing.txt", "w", encoding="utf-8") as f:
        last_section = None
        for r in out_rows:
            if r["section"] != last_section:
                f.write(f"\n--- [{r['section']}] ---\n")
                last_section = r["section"]
            f.write(f"{fmt(r['start'])} - {fmt(r['end'])}  {r['text']}\n")

    print(f"song duration: {duration:.2f}s, {len(out_rows)} lines")
    print("wrote draft_timing.txt and draft_timing.json")

if __name__ == "__main__":
    main()
