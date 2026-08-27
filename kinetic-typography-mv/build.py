"""Entry point: synth placeholder audio, render kinetic typography frames,
mux into the final MP4. Run with: python3 build.py
"""
from lyrics import DURATION
from render import mux_audio, render_frames_to_ffmpeg
import audio


def energy_fn(t):
    from render import energy_at
    return energy_at(t)


if __name__ == "__main__":
    print("Synthesizing placeholder audio...")
    audio.generate(DURATION, energy_fn, "output/audio.wav")

    print("Rendering frames...")
    render_frames_to_ffmpeg()

    print("Muxing audio...")
    mux_audio()

    print("Done -> output/kinetic_mv.mp4")
