"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageChoice, Screen, STOPPED_KEY, UNDO_STOP_MS } from "@/components/Screen";
import { useOrder, useT } from "@/components/OrderProvider";
import { checkPersonnummer, formatPersonnummer, type PersonnummerError } from "@/lib/personnummer";
import { DEMO_PERSONNUMMER, findPatient } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const { login, undoStop, drafts } = useOrder();
  const { t } = useT();
  const l = t.login;
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<PersonnummerError | "notFound" | null>(null);
  // Personnumret för den som nyss tryckte på Avbryt – då erbjuds "Ångra" en kort stund.
  const [stopped, setStopped] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STOPPED_KEY);
      sessionStorage.removeItem(STOPPED_KEY);
      const flag = raw ? (JSON.parse(raw) as { personnummer: string; at: number }) : null;
      if (flag && Date.now() - flag.at < UNDO_STOP_MS) setStopped(flag.personnummer);
    } catch {
      // Ingen lagring – visa ingen notis.
    }
  }, []);

  const undo = () => {
    if (!stopped) return;
    router.push(undoStop(stopped) ?? "/valkommen");
  };

  // Varje fel har en handling som löser det.
  const errorAction: Partial<Record<PersonnummerError | "notFound", () => void>> = {
    date: () => { setDigits(""); setError(null); },
    checksum: () => { setDigits((d) => d.slice(0, 8)); setError(null); },
    notFound: () => { setDigits(""); setError(null); },
  };

  const press = (key: string) => {
    setError(null);
    setStopped(null);
    setDigits((d) => (d.length < 12 ? d + key : d));
  };
  const erase = () => {
    setError(null);
    setDigits((d) => d.slice(0, -1));
  };

  const submit = () => {
    const check = checkPersonnummer(digits);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    const patient = findPatient(check.normalized);
    if (!patient) {
      setError("notFound");
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
          {stopped && (
            <div className="notice" role="status">
              <p>✓ {t.stopped.done}{drafts[stopped] ? ` ${t.stopped.saved}` : ""}</p>
              <button className="btn btn-small" onClick={undo}>{t.stopped.undo}</button>
            </div>
          )}
          <p className="eyebrow">{l.eyebrow}</p>
          <h1>{l.title}</h1>
          <p className="lead">{l.lead}</p>
          <ul className="reassure">
            {l.reassure.map((r) => <li key={r}>{r}</li>)}
            <li>{l.reassureTools}</li>
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
          {error && (
            <div className="error" role="alert">
              <p>{l.errors[error]}</p>
              {errorAction[error] && (
                <button className="btn btn-small error-action" onClick={errorAction[error]}>
                  {l.errorActions[error as keyof typeof l.errorActions]}
                </button>
              )}
            </div>
          )}

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
