import subprocess, glob, os, json

clips = sorted(glob.glob("assets/bg/*.mp4"))
XFD = 0.8
SIZE = 1080

# Story arc: clips 0-4 (Intro/Verse1/Verse2) = questioning/searching, cool
# misty blue-grey; clips 5-9 (Verse3/Verse4) = deeper inquiry, clearer with
# a warm candlelit undertone; clips 10-13 (Outro "dissolving word by word")
# = bright, airy, high-key, desaturating toward white.
COOL_END = 5
WARM_START = 5
BRIGHT_START = 10

def grade_for(i):
    if i < COOL_END:
        return "eq=brightness=-0.03:saturation=0.55:contrast=1.08,colorbalance=bs=0.10:bm=0.08,vignette=PI/3.4"
    elif i < BRIGHT_START:
        return "eq=brightness=0.0:saturation=0.68:contrast=1.10,colorbalance=rs=0.10:rm=0.08,vignette=PI/3.8"
    else:
        return "eq=brightness=0.06:saturation=0.55:contrast=0.98,colorbalance=rh=0.06:gh=0.04,vignette=PI/5.0"

def probe_dur(f):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
        capture_output=True, text=True
    ).stdout.strip()
    return float(out)

durs = [probe_dur(f) for f in clips]
print(list(zip(clips, durs)))

n = len(clips)
inputs = []
for f in clips:
    inputs += ["-i", f]

filters = []
for i in range(n):
    filters.append(
        f"[{i}:v]scale={SIZE}:{SIZE}:force_original_aspect_ratio=increase,"
        f"crop={SIZE}:{SIZE},setsar=1,fps=25,format=yuv420p,"
        f"{grade_for(i)}[c{i}]"
    )

chain_label = "c0"
cum_dur = durs[0]
for i in range(1, n):
    offset = cum_dur - XFD * i
    out_label = f"x{i}"
    filters.append(
        f"[{chain_label}][c{i}]xfade=transition=fade:duration={XFD}:offset={offset:.3f}[{out_label}]"
    )
    chain_label = out_label
    cum_dur += durs[i]

final_dur = cum_dur - XFD * (n - 1)
print("Final background duration:", final_dur)

filter_complex = ";".join(filters)

cmd = ["ffmpeg", "-y"] + inputs + [
    "-filter_complex", filter_complex,
    "-map", f"[{chain_label}]",
    "-r", "25",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p",
    "out/background.mp4"
]

with open("bg_cmd.json", "w") as f:
    json.dump({"cmd": cmd, "final_dur": final_dur}, f, indent=2)

print("Running ffmpeg...")
r = subprocess.run(cmd, capture_output=True, text=True)
print("RC:", r.returncode)
if r.returncode != 0:
    print(r.stderr[-4000:])
else:
    print("OK")
    print(r.stderr[-800:])
