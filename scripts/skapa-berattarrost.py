"""Läser in berättarrösten till produktvideon med Piper (lokal talsyntes, svensk röst).

Förberedelse (en gång):
  pip install piper-tts
  hämta sv_SE-nst-medium.onnx och sv_SE-nst-medium.onnx.json från
  https://huggingface.co/rhasspy/piper-voices/tree/main/sv/sv_SE/nst/medium

Kör: python3 scripts/skapa-berattarrost.py <röstmodell.onnx> <utmapp>
Skapar en WAV-fil per scen och tider.json med varje repliks längd i sekunder.
Rösten görs lugn och lite djupare, som en berättare i en naturdokumentär: långsammare tempo,
längre pauser mellan meningarna och tonhöjden sänkt med ungefär 7 % (kräver ffmpeg).
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
    raw = out / f"{scene}-ra.wav"
    wav = out / f"{scene}.wav"
    subprocess.run(
        [sys.executable, "-m", "piper", "-m", model, "-f", str(raw), "--length-scale", "1.18", "--sentence-silence", "0.5"],
        input=text.encode("utf-8"),
        check=True,
        capture_output=True,
    )
    # Djupare och varmare: sänk tonhöjden utan att ändra tempot, och lyft basen något.
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
         "asetrate=22050*0.93,aresample=22050,atempo=1.0753,bass=g=3:f=150,highpass=f=60", str(wav)],
        check=True,
    )
    raw.unlink()
    with wave.open(str(wav)) as w:
        durations[scene] = round(w.getnframes() / w.getframerate(), 2)
    print(f"{scene}: {durations[scene]} s")
(out / "tider.json").write_text(json.dumps(durations, indent=2), encoding="utf-8")
