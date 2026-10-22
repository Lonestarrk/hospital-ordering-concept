"""Läser in berättarrösten (engelska) till produktvideon med Kokoro – en öppen talsyntesmodell
som körs lokalt. Rösten är bm_george: en lugn brittisk mansröst, i stil med en naturdokumentär.

Förberedelse (en gång):
  pip install kokoro-onnx soundfile
  hämta kokoro-v1.0.onnx och voices-v1.0.bin från
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

Kör: python3 scripts/skapa-berattarrost.py <mapp med modellfilerna> <utmapp>
Skapar en WAV-fil per scen och tider.json med varje repliks längd i sekunder.
"""
import json
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

models, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
kokoro = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
lines = json.loads(Path("docs/lansering/berattarrost.json").read_text(encoding="utf-8"))
durations = {}
for scene, text in lines.items():
    raw = out / f"{scene}-ra.wav"
    wav = out / f"{scene}.wav"
    # Lite långsammare än normalt – en berättare som tar sig tid.
    samples, rate = kokoro.create(text, voice="bm_george", speed=0.9, lang="en-gb")
    sf.write(raw, samples, rate)
    # Varmare klang och jämn nivå: lyft basen något och dämpa det allra högsta.
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
         "highpass=f=60,bass=g=2:f=140,treble=g=-1.5:f=8000", str(wav)],
        check=True,
    )
    raw.unlink()
    durations[scene] = round(len(samples) / rate, 2)
    print(f"{scene}: {durations[scene]} s")
(out / "tider.json").write_text(json.dumps(durations, indent=2), encoding="utf-8")
