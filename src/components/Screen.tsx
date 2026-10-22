"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrder, useT } from "./OrderProvider";
import { languages } from "@/lib/i18n";
import { consistencyLabels, dietLabels, type Patient } from "@/lib/data";
import { demoClockActive, hhmm } from "@/lib/clock";
import { useNow } from "./useNow";
import { InstallButton } from "./Install";
import {
  chime,
  matchCommand,
  normalize,
  speak,
  stopSpeaking,
  type VoiceCommand,
} from "@/lib/voice";

type ScreenProps = {
  /** Texten som läses upp i ljudläge och när man trycker på "Ljud". */
  speakText: string;
  /** Röstkommandon för sidan (svenska). Mikrofonen är borttagen; kommandona nås i demo via händelsen "ingrid-voice". */
  commands?: VoiceCommand[];
  /** Exempel på vad man kan säga, t.ex. "lax" eller "soppa". */
  voiceHint?: string;
  children: ReactNode;
  footer?: ReactNode;
};

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

export function Screen({ speakText, commands, voiceHint, children, footer }: ScreenProps) {
  const { patient: loggedIn, textSize, toggleTextSize, soundOn, setSoundOn, order, signOut } = useOrder();
  const router = useRouter();
  const pathname = usePathname();
  // Inloggningssidan visar aldrig patientens sidhuvud – inte ens i ögonblicket mellan att armbandet
  // lästs och att nästa sida visas.
  const patient = pathname === "/" ? null : loggedIn;
  const { t, tm, speechLang } = useT();
  const say = (text: string) => speak(text, speechLang);
  const [langOpen, setLangOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  // Avbryt finns efter inloggningen, men inte när beställningen redan är skickad.
  const canCancel = !!patient && !order.placed && pathname !== "/klart";
  const [demoClock, setDemoClock] = useState(false);
  const clock = useNow();
  useEffect(() => setDemoClock(demoClockActive()), []);

  // I ljudläge läses varje ny sida upp automatiskt.
  useEffect(() => {
    if (soundOn) say(speakText);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avbryt loggar ut helt – plattan kan gå vidare till nästa patient. Inloggningen visar en kort bekräftelse.
  const stop = () => {
    try {
      sessionStorage.setItem(STOPPED_KEY, String(Date.now()));
    } catch {
      // Utan lagring visas bara inloggningen.
    }
    stopSpeaking();
    signOut();
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

  return (
    <div className="screen">
      <header className={`topbar ${patient ? "has-patient" : ""}`}>
        {patient ? (
          <>
            <div className="topbar-name-row">
              <div className="topbar-title">{patient.firstName} {patient.lastName}</div>
              <DietBar patient={patient} onAbout={() => setDietOpen(true)} />
            </div>
            <div className="topbar-sub">
              {tm.word(patient.room)} · {tm.word(patient.bed)}
            </div>
          </>
        ) : (
          <div className="topbar-place">
            <img className="logo" src="/ikoner/ikon-192.png" alt="" />
            <div className="topbar-title">{t.appName}</div>
          </div>
        )}
        {/* I hörnet: inställningarna samlade i en meny, och Avbryt längst ut. */}
        <div className="topbar-actions">
          <ToolsMenu onLanguage={() => setLangOpen(true)} onSound={toggleSound} hideInstall={pathname === "/"} />
          {canCancel && (
            <button className="tool tool-cancel" onClick={stop}>
              <span aria-hidden>✕</span>
              <span className="tool-label">{t.cancel.replace(/^✕\s*/, "")}</span>
            </button>
          )}
        </div>
      </header>



      <main className="content">{children}</main>

      {/* Mikrofonen ("Prata") är borttagen – den var i vägen och taligenkänningen saknas på många plattor. */}
      {footer && <footer className="footer">{footer}</footer>}

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

/** Sätts när patienten avbryter, så att inloggningen kan bekräfta att hon är utloggad. */
export const STOPPED_KEY = "ingrid-stopped";
export const STOPPED_NOTICE_MS = 2 * 60 * 1000;

/**
 * Språk, uppläsning, textstorlek och installera – samlade bakom en knapp i hörnet, så att de
 * inte tar plats hela tiden. Knappen visar ikonerna för det som finns i menyn.
 */
function ToolsMenu({ onLanguage, onSound, hideInstall }: { onLanguage: () => void; onSound: () => void; hideInstall: boolean }) {
  const { textSize, toggleTextSize, soundOn, lang } = useOrder();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Stängs vid tryck utanför menyn och med Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (!ref.current?.contains(target) && !target.closest?.(".overlay")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="tools-menu" ref={ref}>
      <button
        className={`tool tool-menu ${open ? "is-open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="tools-menu-panel"
        aria-label={t.settings}
      >
        <span aria-hidden>🌐</span>
        <span aria-hidden>{soundOn ? "🔊" : "🔈"}</span>
        <span aria-hidden className="tool-aa">Aa</span>
        <span aria-hidden className="tool-menu-caret">▾</span>
      </button>
      {open && (
        <div className="tools-menu-panel" id="tools-menu-panel">
          <button
            className="menu-item"
            onClick={() => {
              setOpen(false);
              onLanguage();
            }}
          >
            <span aria-hidden className="menu-icon">🌐</span>
            <span>{t.chooseLanguage}</span>
            <span className="menu-value">{languages.find((l) => l.id === lang)?.name}</span>
          </button>
          <button className="menu-item" onClick={onSound} aria-pressed={soundOn}>
            <span aria-hidden className="menu-icon">{soundOn ? "🔊" : "🔈"}</span>
            <span>{t.readAloud}</span>
            <span className={`menu-switch ${soundOn ? "on" : ""}`} aria-hidden />
          </button>
          <button className="menu-item" onClick={toggleTextSize} aria-pressed={textSize === "stor"}>
            <span aria-hidden className="menu-icon tool-aa">Aa</span>
            <span>{t.biggerText}</span>
            <span className={`menu-switch ${textSize === "stor" ? "on" : ""}`} aria-hidden />
          </button>
          {!hideInstall && <InstallButton menuItem />}
        </div>
      )}
    </div>
  );
}

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

/**
 * Kosten står i sidhuvudet under namnet på varje sida, så att hon vet varför hon ser just den här maten.
 * Hela raden är en knapp som förklarar vem som har registrerat kosten.
 */
function DietBar({ patient, onAbout }: { patient: Patient; onAbout: () => void }) {
  const { t } = useT();
  const items = useDietTexts(patient);
  return (
    <button className="topbar-diet" onClick={onAbout} aria-label={`${t.diet.label}: ${items.join(", ")}. ${t.diet.about}`}>
      <span className="diet-label">
        <span aria-hidden>💚</span> {t.diet.label}:
      </span>
      {items.map((item) => (
        <span key={item} className="diet-item">✓ {item}</span>
      ))}
      <span className="diet-info" aria-hidden>ⓘ</span>
    </button>
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
