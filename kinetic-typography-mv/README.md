# Kinetic Typography MV (demo)

Generates a kinetic-typography music video as an MP4: word-by-word pop-in
lyrics over an animated gradient background, muxed with a synthesized
placeholder backing track (no real song was provided yet).

## Run

```
pip install pillow numpy
apt-get install -y ffmpeg fonts-thai-tlwg
python3 build.py
```

Output: `output/kinetic_mv.mp4`

## Files

- `lyrics.py` — line/word timing (`start, end, text, style`) and video
  resolution/duration. **Replace with real lyrics + timestamps** once a
  song is available.
- `easing.py` — animation easing helpers (pop/scale/fade curves).
- `background.py` — animated gradient, drifting particles, film grain.
- `text_render.py` — word-by-word kinetic pop-in/fade/bounce rendering,
  per-style (`verse` / `chorus` / `hook`) fonts and colors.
- `audio.py` — synthesizes a placeholder pad + pluck + kick backing track
  matched to `lyrics.py`'s duration and energy (verse vs. chorus/hook).
- `render.py` / `build.py` — frame loop piping raw RGB frames into ffmpeg,
  then muxing the audio track.

## Swapping in a real song

1. Replace `output/audio.wav` generation in `build.py` with your actual
   audio file (skip `audio.generate(...)`, just copy your file to
   `output/audio.wav`, or point `AUDIO_WAV` in `render.py` at it).
2. Rewrite `LINES` in `lyrics.py` with the real lyrics and timestamps
   (from the song, or word-level timestamps from a lyrics-alignment tool).
3. Re-run `python3 render.py` (frames + mux only, skips re-synthesizing
   audio).
