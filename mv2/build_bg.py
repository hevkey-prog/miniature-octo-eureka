import subprocess, glob, os, json

clips = sorted(glob.glob("assets/bg/*.mp4"))
XFD = 0.8
SIZE = 1080

# Story arc: clips 1-8 dark/chaotic (Intro+Verse1+Verse2), 9-11 warming
# (Slow Bridge), 12-15 bright/peaceful (Verse3+Outro). Grade shifts
# brightness/saturation/tint per group instead of one flat eq for the
# whole video, per the "ไล่โทนมืด→อบอุ่น" note in the project brief.
DARK_END = 8      # clips[0:8]  -> dark/cool
WARM_START = 8     # clips[8:11] -> transitional warm
BRIGHT_START = 11  # clips[11:] -> bright/peaceful

def grade_for(i):
    if i < DARK_END:
        # cool, desaturated, heavy vignette — reckless/chaotic energy
        return "eq=brightness=-0.08:saturation=0.42:contrast=1.22,colorbalance=bs=0.12:bm=0.06,vignette=PI/3.0"
    elif i < BRIGHT_START:
        # transitional — warming up, vignette easing off
        return "eq=brightness=-0.02:saturation=0.72:contrast=1.12,colorbalance=rs=0.08:rm=0.06,vignette=PI/3.6"
    else:
        # bright, warm, steady — settled/happy ending
        return "eq=brightness=0.03:saturation=0.98:contrast=1.05,colorbalance=rs=0.14:rm=0.10:rh=0.06,vignette=PI/4.5"

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
