from faster_whisper import WhisperModel
import json, time

t0 = time.time()
model = WhisperModel("medium", device="cpu", compute_type="int8")
segments, info = model.transcribe(
    "out/demucs/htdemucs/song/vocals.wav",
    word_timestamps=True,
    vad_filter=True,
    vad_parameters={"min_silence_duration_ms": 300},
    beam_size=5,
    language=None,
)
words = []
for seg in segments:
    for w in seg.words:
        words.append({"word": w.word, "start": w.start, "end": w.end, "prob": w.probability})

json.dump(words, open("whisper_words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"done in {time.time()-t0:.1f}s, {len(words)} words, detected lang={info.language}")
