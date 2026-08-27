"""Synthesizes a simple placeholder backing track (pad + pluck + soft kick)
so the MV isn't silent. Swap this out for a real song once one exists —
lyrics.py timestamps would need to be re-aligned to it too.
"""
import wave

import numpy as np

SR = 44100
BPM = 96
BEAT = 60.0 / BPM

# Am - F - C - G, looped
CHORDS = [
    [220.00, 261.63, 329.63],  # A3 C4 E4 (Am)
    [174.61, 220.00, 261.63],  # F3 A3 C4 (F)
    [130.81, 164.81, 196.00],  # C3 E3 G3 (C)
    [196.00, 246.94, 293.66],  # G3 B3 D4 (G)
]


def _adsr(n, a, d, s_level, r, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s_level, max(d_n, 1)),
        np.full(s_n, s_level),
        np.linspace(s_level, 0, max(r_n, 1)),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]


def _tone(freq, dur, sr=SR, harmonic_mix=(1.0, 0.35, 0.15)):
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    wave_sig = sum(m * np.sin(2 * np.pi * freq * k * t) for k, m in enumerate(harmonic_mix, start=1))
    return wave_sig / sum(harmonic_mix)


def _kick(dur=0.18, sr=SR):
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    freq = 120 * np.exp(-t * 18)
    phase = 2 * np.pi * np.cumsum(freq) / sr
    sig = np.sin(phase)
    env = np.exp(-t * 14)
    return sig * env


def _hat(dur=0.05, sr=SR, gain=0.12):
    n = int(sr * dur)
    noise = np.random.default_rng(42 + int(dur * 1000)).normal(0, 1, n)
    env = np.exp(-np.linspace(0, 1, n) * 12)
    return noise * env * gain


def generate(duration, energy_fn, out_path):
    n_samples = int(duration * SR)
    mix = np.zeros(n_samples)

    bar_len = BEAT * 4
    n_bars = int(duration / bar_len) + 1

    for bar in range(n_bars):
        bar_t = bar * bar_len
        chord = CHORDS[bar % len(CHORDS)]
        energy = energy_fn(bar_t)

        pad = np.zeros(int(SR * bar_len))
        for freq in chord:
            tone = _tone(freq, bar_len, harmonic_mix=(1.0, 0.25))
            env = _adsr(len(tone), a=0.4, d=0.3, s_level=0.7, r=0.6)
            pad += tone * env
        pad *= 0.05 * (0.6 + 0.4 * energy)

        start = int(bar_t * SR)
        end = min(start + len(pad), n_samples)
        mix[start:end] += pad[: end - start]

        for beat in range(4):
            beat_t = bar_t + beat * BEAT
            start = int(beat_t * SR)
            kick = _kick() * (0.35 + 0.25 * energy)
            end = min(start + len(kick), n_samples)
            if start < n_samples:
                mix[start:end] += kick[: end - start]

            for sub in (0, 0.5):
                ht = beat_t + sub * BEAT
                s = int(ht * SR)
                hat = _hat(gain=0.05 + 0.05 * energy)
                e = min(s + len(hat), n_samples)
                if s < n_samples:
                    mix[s:e] += hat[: e - s]

            note = chord[beat % len(chord)] * 2
            pluck = _tone(note, BEAT * 0.9, harmonic_mix=(1.0, 0.5, 0.2))
            penv = _adsr(len(pluck), a=0.005, d=0.15, s_level=0.0, r=0.05)
            pluck *= penv * 0.08 * (0.5 + 0.5 * energy)
            s = int(beat_t * SR)
            e = min(s + len(pluck), n_samples)
            if s < n_samples:
                mix[s:e] += pluck[: e - s]

    peak = np.max(np.abs(mix)) or 1.0
    mix = mix / peak * 0.9
    pcm = (mix * 32767).astype(np.int16)

    with wave.open(out_path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


if __name__ == "__main__":
    from lyrics import DURATION

    def energy_fn(t):
        return 1.0 if 29 <= t <= 51.5 or t >= 59 else 0.4

    generate(DURATION, energy_fn, "output/audio.wav")
    print("wrote output/audio.wav")
