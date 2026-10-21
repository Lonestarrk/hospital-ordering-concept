"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useOrder } from "./OrderProvider";

const STEPS = ["Mat", "Dryck", "Kolla", "Klart"];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "sv-SE";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

type ScreenProps = {
  /** Texten som läses upp när man trycker på "Läs upp". */
  speakText: string;
  /** Vilket steg (1–4) som ska markeras i stegindikatorn. Utelämna för att dölja den. */
  step?: number;
  children: ReactNode;
  footer?: ReactNode;
};

export function Screen({ speakText, step, children, footer }: ScreenProps) {
  const { patient, textSize, toggleTextSize } = useOrder();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

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
          <button className="tool" onClick={() => speak(speakText)}>
            <span aria-hidden>🔊</span> Läs upp
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

      {footer && <footer className="footer">{footer}</footer>}

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
