"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useOrder } from "@/components/OrderProvider";
import { checkPersonnummer, formatPersonnummer } from "@/lib/personnummer";
import { DEMO_PERSONNUMMER, findPatient } from "@/lib/data";

const SLOTS = "ÅÅÅÅMMDD-XXXX";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useOrder();
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
      setError(check.reason);
      return;
    }
    const patient = findPatient(check.normalized);
    if (!patient) {
      setError("Vi hittar inte numret på din avdelning. Kontrollera siffrorna eller tryck på Hjälp.");
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
  const display = formatted + SLOTS.slice(formatted.length);
  const complete = digits.length === 12;

  return (
    <Screen speakText="Hej och välkommen! Här beställer du din mat. Skriv ditt personnummer med siffrorna på skärmen. Först år, månad och dag, sedan de fyra sista siffrorna. Tryck sedan på Fortsätt.">
      <div className="login">
        <section className="login-intro">
          <p className="eyebrow">Hej och välkommen!</p>
          <h1>Här beställer du din mat</h1>
          <p className="lead">
            Skriv ditt personnummer så vet vi vem du är – och vilken mat som passar dig.
          </p>
          <ul className="reassure">
            <li>Det tar ungefär två minuter</li>
            <li>Du kan inte göra fel – allt går att ändra</li>
            <li>Behöver du hjälp? Tryck på <strong>Hjälp</strong> uppe till höger</li>
          </ul>
        </section>

        <section className="login-pad" aria-label="Skriv personnummer">
          <label className="pnr-label" htmlFor="pnr">Ditt personnummer</label>
          <output id="pnr" className={`pnr ${error ? "pnr-error" : ""}`} aria-live="polite">
            <span className="pnr-typed">{formatted}</span>
            <span className="pnr-rest" aria-hidden>{display.slice(formatted.length)}</span>
          </output>
          <p className="pnr-hint">År, månad, dag – och fyra sista siffrorna</p>
          {error && <p className="error" role="alert">{error}</p>}

          <div className="keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <button key={k} className="key" onClick={() => press(k)}>{k}</button>
            ))}
            <button className="key key-muted" onClick={erase} aria-label="Radera en siffra">⌫ Radera</button>
            <button className="key" onClick={() => press("0")}>0</button>
            <button
              className="key key-go"
              onClick={submit}
              disabled={!complete}
            >
              Fortsätt →
            </button>
          </div>

          <button className="demo-link" onClick={() => { setError(null); setDigits(DEMO_PERSONNUMMER); }}>
            Demo: fyll i Ingrids personnummer
          </button>
          <a className="demo-link" href="/koket">Personal: kökets vy →</a>
        </section>
      </div>
    </Screen>
  );
}
