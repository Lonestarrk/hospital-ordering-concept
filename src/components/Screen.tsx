"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useOrder } from "./OrderProvider";
import {
  chime,
  listenOnce,
  matchCommand,
  normalize,
  recognitionSupported,
  speak,
  stopSpeaking,
  type VoiceCommand,
} from "@/lib/voice";

const STEPS = ["Mat", "Dryck", "Kolla", "Klart"];

type ScreenProps = {
  /** Texten som läses upp i ljudläge och när man trycker på "Ljud". */
  speakText: string;
  /** Vilket steg (1–4) som ska markeras i stegindikatorn. Utelämna för att dölja den. */
  step?: number;
  /** Röstkommandon för sidan. Utelämna för att dölja mikrofonknappen. */
  commands?: VoiceCommand[];
  /** Exempel på vad man kan säga, t.ex. "lax" eller "soppa". */
  voiceHint?: string;
  children: ReactNode;
  footer?: ReactNode;
};

type ListenState =
  | { kind: "idle" }
  | { kind: "listening" }
  | { kind: "heard"; text: string; understood: boolean };

/** Bekräftar ett val med en ljudsignal – och tal om text anges – när ljudläget är på. */
export function useAnnounce() {
  const { soundOn } = useOrder();
  return useCallback(
    (text?: string) => {
      if (!soundOn) return;
      chime();
      if (text) speak(text);
    },
    [soundOn],
  );
}

export function Screen({ speakText, step, commands, voiceHint, children, footer }: ScreenProps) {
  const { patient, textSize, toggleTextSize, soundOn, setSoundOn } = useOrder();
  const [helpOpen, setHelpOpen] = useState(false);
  const [listen, setListen] = useState<ListenState>({ kind: "idle" });
  const [micAvailable, setMicAvailable] = useState(false);
  const abortRef = useRef<() => void>(() => {});

  useEffect(() => setMicAvailable(recognitionSupported()), []);

  // I ljudläge läses varje ny sida upp automatiskt.
  useEffect(() => {
    if (soundOn) speak(speakText);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSound = () => {
    if (soundOn) {
      stopSpeaking();
      setSoundOn(false);
    } else {
      setSoundOn(true);
      speak(speakText);
    }
  };

  const globalCommands: VoiceCommand[] = [
    {
      phrases: ["hjälp", "personal*", "sköterska*"],
      action: () => {
        setHelpOpen(true);
        speak("Vill du att personalen kommer? Tryck på den gröna knappen.");
      },
    },
    { phrases: ["läs upp", "läs menyn", "upprepa", "igen", "vad sa du"], action: () => speak(speakText) },
    { phrases: ["större text", "större"], action: () => textSize === "normal" && toggleTextSize() },
    { phrases: ["mindre text", "mindre"], action: () => textSize === "stor" && toggleTextSize() },
    { phrases: ["tyst", "stäng av ljud*"], action: () => { stopSpeaking(); setSoundOn(false); } },
  ];

  const handleHeard = (alternatives: string[]) => {
    const all = [...(commands ?? []), ...globalCommands];
    const match = matchCommand(alternatives, all);
    const text = alternatives[0] ?? "";
    setListen({ kind: "heard", text, understood: !!match });
    if (match) {
      match.action(normalize(text));
    } else {
      speak(`Jag hörde "${text}", men förstod inte. ${voiceHint ? `Du kan säga till exempel ${voiceHint}.` : ""}`);
    }
  };

  // Gör att man kan prova röstkommandon utan mikrofon (demo/test):
  // window.dispatchEvent(new CustomEvent("ingrid-voice", { detail: "lax" }))
  const handleHeardRef = useRef(handleHeard);
  handleHeardRef.current = handleHeard;
  useEffect(() => {
    const onVoice = (e: Event) => handleHeardRef.current([(e as CustomEvent<string>).detail]);
    window.addEventListener("ingrid-voice", onVoice);
    return () => window.removeEventListener("ingrid-voice", onVoice);
  }, []);

  const startListening = async () => {
    if (listen.kind === "listening") {
      abortRef.current();
      return;
    }
    stopSpeaking();
    setSoundOn(true);
    setListen({ kind: "listening" });
    abortRef.current = await listenOnce({
      onResult: handleHeard,
      onError: (error) => {
        if (error === "no-speech") speak("Jag hörde ingenting. Tryck på mikrofonen och försök igen.");
        else if (error === "not-allowed") speak("Mikrofonen är avstängd. Tryck på Hjälp så kommer personalen.");
      },
      onEnd: () => setListen((l) => (l.kind === "listening" ? { kind: "idle" } : l)),
    });
  };

  const showMic = commands !== undefined && micAvailable;

  return (
    <div className="screen">
      <header className="topbar">
        <div className="topbar-place">
          <span className="logo" aria-hidden>🍽️</span>
          <div>
            <div className="topbar-title">Måltider</div>
            {patient && (
              <div className="topbar-sub">
                {patient.room} · {patient.bed}
              </div>
            )}
          </div>
        </div>
        <div className="topbar-actions">
          <button className="tool" onClick={toggleSound} aria-pressed={soundOn}>
            <span aria-hidden>{soundOn ? "🔊" : "🔈"}</span> {soundOn ? "Ljud på" : "Läs upp"}
          </button>
          <button
            className="tool"
            onClick={toggleTextSize}
            aria-pressed={textSize === "stor"}
          >
            <span aria-hidden className="tool-aa">Aa</span>
            {textSize === "stor" ? "Mindre text" : "Större text"}
          </button>
          <button className="tool tool-help" onClick={() => setHelpOpen(true)}>
            <span aria-hidden>🙋</span> Hjälp
          </button>
        </div>
      </header>

      {step !== undefined && (
        <ol className="progress" aria-label="Steg">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={label} className={`progress-step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
                <span className="progress-dot">{state === "done" ? "✓" : n}</span>
                {label}
              </li>
            );
          })}
        </ol>
      )}

      <main className="content">{children}</main>

      {(footer || showMic) && (
        <footer className="footer">
          {footer}
          {showMic && (
            <div className="voice">
              {listen.kind !== "idle" && (
                <div className={`voice-bubble ${listen.kind === "heard" && !listen.understood ? "voice-miss" : ""}`} role="status">
                  {listen.kind === "listening" ? (
                    <>Jag lyssnar… {voiceHint && <span>Säg till exempel <strong>{voiceHint}</strong></span>}</>
                  ) : (
                    <>Du sa: <strong>”{listen.text}”</strong>{!listen.understood && <span> – försök igen</span>}</>
                  )}
                </div>
              )}
              <button
                className={`mic ${listen.kind === "listening" ? "mic-on" : ""}`}
                onClick={startListening}
                aria-label={listen.kind === "listening" ? "Sluta lyssna" : "Prata – säg vad du vill"}
              >
                <span aria-hidden>🎤</span>
                <span className="mic-label">{listen.kind === "listening" ? "Lyssnar…" : "Prata"}</span>
              </button>
            </div>
          )}
        </footer>
      )}

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  const [called, setCalled] = useState(false);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        {called ? (
          <>
            <div className="dialog-icon" aria-hidden>✅</div>
            <h2 id="help-title">Personalen är meddelad</h2>
            <p>Någon kommer till dig så snart de kan. Du behöver inte göra något mer.</p>
            <button className="btn btn-primary btn-block" onClick={onClose}>Okej</button>
          </>
        ) : (
          <>
            <div className="dialog-icon" aria-hidden>🙋</div>
            <h2 id="help-title">Vill du ha hjälp?</h2>
            <p>Det är helt okej att be om hjälp. Vi kan skicka en signal till personalen på avdelningen.</p>
            <button className="btn btn-primary btn-block" onClick={() => setCalled(true)}>
              Ja, be personalen komma
            </button>
            <button className="btn btn-ghost btn-block" onClick={onClose}>Nej tack, jag fortsätter själv</button>
          </>
        )}
      </div>
    </div>
  );
}
