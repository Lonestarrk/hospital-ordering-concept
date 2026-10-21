"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageChoice, Screen } from "@/components/Screen";
import { useOrder, useT } from "@/components/OrderProvider";
import { checkPersonnummer, formatPersonnummer } from "@/lib/personnummer";
import { DEMO_PERSONNUMMER, findPatient } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useOrder();
  const { t } = useT();
  const l = t.login;
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const press = (key: string) => {
    setError(null);
    setDigits((d) => (d.length < 12 ? d + key : d));
  };
  const erase = () => {
    setError(null);
    setDigits((d) => d.slice(0, -1));
  };

  const submit = () => {
    const check = checkPersonnummer(digits);
    if (!check.ok) {
      setError(l.errors[check.reason]);
      return;
    }
    const patient = findPatient(check.normalized);
    if (!patient) {
      setError(l.errors.notFound);
      return;
    }
    login(patient);
    router.push("/valkommen");
  };

  // Gör det också möjligt att skriva med ett vanligt tangentbord.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") erase();
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const formatted = formatPersonnummer(digits);
  const display = formatted + l.slots.slice(formatted.length);
  const complete = digits.length === 12;

  return (
    <Screen speakText={l.speak}>
      <div className="login">
        <section className="login-intro">
          <LanguageChoice />
          <p className="eyebrow">{l.eyebrow}</p>
          <h1>{l.title}</h1>
          <p className="lead">{l.lead}</p>
          <ul className="reassure">
            {l.reassure.map((r) => <li key={r}>{r}</li>)}
            <li>{l.reassureHelp[0]}<strong>{l.reassureHelp[1]}</strong>{l.reassureHelp[2]}</li>
          </ul>
        </section>

        <section className="login-pad" aria-label={l.pnrLabel}>
          <label className="pnr-label" htmlFor="pnr">{l.pnrLabel}</label>
          <output id="pnr" dir="ltr" className={`pnr ${error ? "pnr-error" : ""}`} aria-live="polite">
            <span className="pnr-typed">{formatted}</span>
            <span className="pnr-rest" aria-hidden>{display.slice(formatted.length)}</span>
          </output>
          <p className="pnr-hint">{l.pnrHint}</p>
          {error && <p className="error" role="alert">{error}</p>}

          <div className="keypad" dir="ltr">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <button key={k} className="key" onClick={() => press(k)}>{k}</button>
            ))}
            <button className="key key-muted" onClick={erase} aria-label={l.eraseAria}>{l.erase}</button>
            <button className="key" onClick={() => press("0")}>0</button>
            <button
              className="key key-go"
              onClick={submit}
              disabled={!complete}
            >
              {l.submit}
            </button>
          </div>

          <button className="demo-link" onClick={() => { setError(null); setDigits(DEMO_PERSONNUMMER); }}>
            {l.demoFill}
          </button>
        </section>
      </div>
    </Screen>
  );
}
