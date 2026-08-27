import subprocess
import sys
import time

import numpy as np

from background import render_background
from lyrics import DURATION, FPS, HEIGHT, LINES, WIDTH
from text_render import draw_line

OUT_DIR = "output"
SILENT_MP4 = f"{OUT_DIR}/video_silent.mp4"
AUDIO_WAV = f"{OUT_DIR}/audio.wav"
FINAL_MP4 = f"{OUT_DIR}/kinetic_mv.mp4"


def energy_at(t):
    for start, end, _, style in LINES:
        if start - 0.3 <= t <= end and style in ("chorus", "hook"):
            return 1.0
    return 0.4


def active_lines_at(t):
    return [ln for ln in LINES if ln[0] - 0.15 <= t <= ln[1] + 0.35]


def render_frames_to_ffmpeg():
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}", "-pix_fmt", "rgb24", "-r", str(FPS),
        "-i", "-",
        "-an", "-vcodec", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "slow", "-crf", "23", "-tune", "film",
        SILENT_MP4,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    n_frames = int(DURATION * FPS)
    base_hue = 0.62
    t0 = time.time()
    for f in range(n_frames):
        t = f / FPS
        energy = energy_at(t)
        base_hue_drift = base_hue + 0.02 * np.sin(t * 0.05)
        img = render_background(t, WIDTH, HEIGHT, base_hue=base_hue_drift, energy=energy)

        for line in active_lines_at(t):
            start, end, text, style = line
            draw_line(img, t, start, end, text, style, WIDTH, HEIGHT)

        proc.stdin.write(np.asarray(img).tobytes())

        if f % (FPS * 2) == 0:
            elapsed = time.time() - t0
            print(f"frame {f}/{n_frames}  t={t:5.1f}s  elapsed={elapsed:5.1f}s", flush=True)

    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        sys.exit("ffmpeg (video) failed")


def mux_audio():
    cmd = [
        "ffmpeg", "-y",
        "-i", SILENT_MP4,
        "-i", AUDIO_WAV,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
        "-shortest",
        FINAL_MP4,
    ]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    print("Rendering frames...")
    render_frames_to_ffmpeg()
    print("Muxing audio...")
    mux_audio()
    print(f"Done -> {FINAL_MP4}")
