"""Läser in berättarrösten till produktvideon med Piper (lokal talsyntes, svensk röst).

Förberedelse (en gång):
  pip install piper-tts
  hämta sv_SE-nst-medium.onnx och sv_SE-nst-medium.onnx.json från
  https://huggingface.co/rhasspy/piper-voices/tree/main/sv/sv_SE/nst/medium

Kör: python3 scripts/skapa-berattarrost.py <röstmodell.onnx> <utmapp>
Skapar en WAV-fil per scen och tider.json med varje repliks längd i sekunder.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

model, out = sys.argv[1], Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
lines = json.loads(Path("docs/lansering/berattarrost.json").read_text(encoding="utf-8"))
durations = {}
for scene, text in lines.items():
    wav = out / f"{scene}.wav"
    # Lite lugnare tempo än standard (length_scale > 1) – det låter mer som en speaker.
    subprocess.run(
        [sys.executable, "-m", "piper", "-m", model, "-f", str(wav), "--length-scale", "1.08", "--sentence-silence", "0.25"],
        input=text.encode("utf-8"),
        check=True,
        capture_output=True,
    )
    with wave.open(str(wav)) as w:
        durations[scene] = round(w.getnframes() / w.getframerate(), 2)
    print(f"{scene}: {durations[scene]} s")
(out / "tider.json").write_text(json.dumps(durations, indent=2), encoding="utf-8")
