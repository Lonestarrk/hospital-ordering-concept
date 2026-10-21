"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrder, useT } from "./OrderProvider";
import { languages } from "@/lib/i18n";
import { consistencyLabels, dietLabels, type Patient } from "@/lib/data";
import { demoClockActive, hhmm } from "@/lib/clock";
import { useNow } from "./useNow";
import {
  chime,
  listenOnce,
  matchCommand,
  normalize,
  localRecognitionSupported,
  speak,
  stopSpeaking,
  type VoiceCommand,
} from "@/lib/voice";

type ScreenProps = {
  /** Texten som läses upp i ljudläge och när man trycker på "Ljud". */
  speakText: string;
  /** Vilket steg (1–4) som ska markeras i stegindikatorn. Utelämna för att dölja den. */
  step?: number;
  /** Röstkommandon för sidan (svenska). Utelämna för att dölja mikrofonknappen. */
  commands?: VoiceCommand[];
  /** Exempel på vad man kan säga, t.ex. "lax" eller "soppa". */
  voiceHint?: string;
  /** Sidans rubrik. Anges den står kosten på samma rad som rubriken i stället för under sidhuvudet. */
  heading?: ReactNode;
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
  const { speechLang } = useT();
  return useCallback(
    (text?: string) => {
      if (!soundOn) return;
      chime();
      if (text) speak(text, speechLang);
    },
    [soundOn, speechLang],
  );
}

export function Screen({ speakText, step, commands, voiceHint, heading, children, footer }: ScreenProps) {
  const { patient, textSize, toggleTextSize, soundOn, setSoundOn, lang, order, logout } = useOrder();
  const router = useRouter();
  const pathname = usePathname();
  const { t, tm, speechLang } = useT();
  const say = (text: string) => speak(text, speechLang);
  const [langOpen, setLangOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  // Avbryt finns efter inloggningen, men inte när beställningen redan är skickad.
  const canCancel = !!patient && !order.placed && pathname !== "/klart";
  const [listen, setListen] = useState<ListenState>({ kind: "idle" });
  const [micAvailable, setMicAvailable] = useState(false);
  const [demoClock, setDemoClock] = useState(false);
  const clock = useNow();
  useEffect(() => setDemoClock(demoClockActive()), []);
  const abortRef = useRef<() => void>(() => {});

  // Mikrofonen visas bara om taligenkänningen kan köras i enheten (inget ljud lämnar plattan).
  useEffect(() => {
    setMicAvailable(localRecognitionSupported());
  }, []);

  // I ljudläge läses varje ny sida upp automatiskt.
  useEffect(() => {
    if (soundOn) say(speakText);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avbryt sker direkt (det går att ångra): valet sparas och inloggningen erbjuder "Ångra".
  const stop = () => {
    if (patient) {
      try {
        sessionStorage.setItem(STOPPED_KEY, JSON.stringify({ personnummer: patient.personnummer, at: Date.now() }));
      } catch {
        // Utan lagring visas bara inloggningen – valet är ändå sparat till nästa inloggning.
      }
    }
    logout();
    router.replace("/");
  };

  const toggleSound = () => {
    if (soundOn) {
      stopSpeaking();
      setSoundOn(false);
    } else {
      setSoundOn(true);
      say(speakText);
    }
  };

  const globalCommands: VoiceCommand[] = [
    ...(canCancel
      ? [{ phrases: ["avbryt", "sluta", "inte nu", "ångrar mig"], action: () => stop() }]
      : []),
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
        else if (error === "not-allowed") speak("Mikrofonen är avstängd. Tryck på skärmen i stället.");
        else if (error === "installing") speak("Ett ögonblick, jag gör i ordning rösten.");
        else if (error === "not-local") {
          setMicAvailable(false);
          speak("Röststyrning finns inte på den här plattan. Tryck på skärmen i stället.");
        }
      },
      onEnd: () => setListen((l) => (l.kind === "listening" ? { kind: "idle" } : l)),
    });
  };

  // Röstkommandona finns på svenska; på andra språk används tryck (och uppläsning).
  const showMic = commands !== undefined && micAvailable && lang === "sv";

  return (
    <div className="screen">
      <header className="topbar">
        <div className="topbar-place">
          <span className="logo" aria-hidden>🍽️</span>
          <div>
            {patient ? (
              <>
                <div className="topbar-title">{patient.firstName} {patient.lastName}</div>
                <div className="topbar-sub">
                  {tm.word(patient.room)} · {tm.word(patient.bed)} · {t.appName}
                </div>
              </>
            ) : (
              <div className="topbar-title">{t.appName}</div>
            )}
          </div>
          {canCancel && (
            <button className="tool tool-cancel" onClick={stop}>
              {t.cancel}
            </button>
          )}
        </div>
        <div className="topbar-actions">
          <button className="tool" onClick={() => setLangOpen(true)} aria-label={t.chooseLanguage}>
            <span aria-hidden>🌐</span> {languages.find((l) => l.id === lang)?.name}
          </button>
          <button className="tool" onClick={toggleSound} aria-pressed={soundOn}>
            <span aria-hidden>{soundOn ? "🔊" : "🔈"}</span> {soundOn ? t.soundOn : t.readAloud}
          </button>
          <button
            className="tool"
            onClick={toggleTextSize}
            aria-pressed={textSize === "stor"}
          >
            <span aria-hidden className="tool-aa">Aa</span>
            {textSize === "stor" ? t.smallerText : t.biggerText}
          </button>
        </div>
      </header>

      {patient && !heading && <DietBar patient={patient} onAbout={() => setDietOpen(true)} />}

      {step !== undefined && (
        <ol className="progress" aria-label={t.stepsLabel}>
          {t.steps.map((label, i) => {
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

      <main className="content">
        {heading && (
          <div className="heading-row">
            {heading}
            {patient && <DietBar patient={patient} onAbout={() => setDietOpen(true)} />}
          </div>
        )}
        {children}
      </main>

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

      {langOpen && <LanguageDialog onClose={() => setLangOpen(false)} />}
      {dietOpen && patient && <DietDialog onClose={() => setDietOpen(false)} />}
      {/* Visas bara när klockan är ställd med ?klocka=HH:MM för en demo. */}
      {demoClock && <span className="demo-clock" lang="sv">🕒 Demotid {hhmm(clock)}</span>}
    </div>
  );
}

export function LanguageChoice({ onChosen }: { onChosen?: () => void }) {
  const { lang, setLang } = useOrder();
  return (
    <div className="lang-choice" role="radiogroup" aria-label="Språk · Language · اللغة">
      {languages.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={lang === l.id}
          lang={l.id}
          dir={l.dir}
          className={`lang-option ${lang === l.id ? "selected" : ""}`}
          onClick={() => {
            setLang(l.id);
            onChosen?.();
          }}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}

/** Sätts när patienten avbryter, så att inloggningen kan erbjuda "Ångra" en kort stund. */
export const STOPPED_KEY = "ingrid-stopped";
export const UNDO_STOP_MS = 2 * 60 * 1000;

/** Det som styr vilken mat hon ser – registrerat av personalen. */
export function useDietTexts(patient: Patient) {
  const { t, tm } = useT();
  return [
    ...patient.diet.map((d) => tm.diet(d, dietLabels[d])),
    ...patient.allergies.map((a) => t.diet.free(tm.allergen(a).toLowerCase())),
    ...(patient.consistency !== "normal"
      ? [t.diet.consistency(tm.consistency(patient.consistency, consistencyLabels[patient.consistency]))]
      : []),
  ];
}

/** Kosten syns på varje sida, så att hon vet varför hon ser just den här maten. */
function DietBar({ patient, onAbout }: { patient: Patient; onAbout: () => void }) {
  const { t } = useT();
  const items = useDietTexts(patient);
  return (
    <section className="diet-bar" aria-label={t.diet.label}>
      <span className="diet-label">
        <span aria-hidden>💚</span> {t.diet.label}:
      </span>
      <ul className="diet-items">
        {items.map((item) => (
          <li key={item} className="diet-item">✓ {item}</li>
        ))}
      </ul>
      <button className="diet-about" onClick={onAbout}>
        <span aria-hidden>ⓘ</span> {t.diet.about}
      </button>
    </section>
  );
}

function DietDialog({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const d = t.diet;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="diet-title" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon" aria-hidden>💚</div>
        <h2 id="diet-title">{d.aboutTitle}</h2>
        <p>{d.aboutBody}</p>
        <p className="muted">
          {d.aboutNote[0]}<strong>{d.aboutNote[1]}</strong>{d.aboutNote[2]}
        </p>
        <button className="btn btn-primary btn-large" onClick={onClose} autoFocus>
          {d.close}
        </button>
      </div>
    </div>
  );
}

function LanguageDialog({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="lang-title" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon" aria-hidden>🌐</div>
        <h2 id="lang-title">{t.chooseLanguage}</h2>
        <LanguageChoice onChosen={onClose} />
      </div>
    </div>
  );
}
