#!/usr/bin/env python3
"""Turn narration.json into one WAV per line with a local Piper voice.

Usage: python3 make_voice.py <voice .onnx> <speaker number> <output dir>
Writes n1.wav ... and durations.json (seconds per line). Needs `pip install piper-tts`.
"""
import json, os, subprocess, sys, wave

model, speaker, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'narration.json')))
os.makedirs(out, exist_ok=True)
durations = {}
for key, text in lines.items():
    path = os.path.join(out, f'{key}.wav')
    subprocess.run([sys.executable, '-m', 'piper', '-m', model, '-s', speaker, '--length-scale', '1.04', '--sentence-silence', '0.28', '-f', path],
                   input=text.encode(), check=True, stderr=subprocess.DEVNULL)
    with wave.open(path) as w:
        durations[key] = round(w.getnframes() / w.getframerate(), 2)
json.dump(durations, open(os.path.join(out, 'durations.json'), 'w'), indent=1)
print(json.dumps(durations), 'total', round(sum(durations.values()), 1))
