"use client";

import { useEffect, useState } from "react";
import { useT } from "./OrderProvider";
import {
  dismissInstall,
  installDismissed,
  installState,
  promptInstall,
  registerServiceWorker,
  subscribeInstall,
  type InstallState,
} from "@/lib/install";

const NONE: InstallState = { canPrompt: false, ios: false, installed: false };

/** Om appen går att installera just nu, och om frågan redan har fått "Inte nu". */
function useInstall() {
  const [state, setState] = useState<InstallState>(NONE);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const update = () => {
      setState(installState());
      setDismissed(installDismissed());
    };
    update();
    return subscribeInstall(update);
  }, []);
  return { ...state, available: state.canPrompt || state.ios, dismissed };
}

/** Registrerar service workern en gång när appen startar. */
export function PwaSetup() {
  useEffect(() => registerServiceWorker(), []);
  return null;
}

/** Frågan på inloggningssidan: "Installera Måltider på plattan?" Visas tills någon svarar. */
export function InstallBanner() {
  const { t } = useT();
  const k = t.install;
  const { available, dismissed, canPrompt } = useInstall();
  const [ios, setIos] = useState(false);
  if (!available || dismissed) return null;

  const install = () => (canPrompt ? promptInstall() : setIos(true));
  return (
    <>
      <section className="install-banner" aria-labelledby="install-title">
        <img className="install-icon" src="/ikoner/ikon-192.png" alt="" />
        <div className="install-text">
          <h2 id="install-title">{k.title}</h2>
          <p>{k.body}</p>
        </div>
        <div className="install-actions">
          <button className="btn btn-ghost btn-small" onClick={dismissInstall}>{k.no}</button>
          <button className="btn btn-primary btn-small" onClick={install}>{k.yes}</button>
        </div>
      </section>
      {ios && <IosInstallDialog onClose={() => setIos(false)} />}
    </>
  );
}

/** Knappen i sidhuvudet: installera när som helst, även efter "Inte nu". */
export function InstallButton({ hideWhileAsking }: { hideWhileAsking?: boolean }) {
  const { t } = useT();
  const k = t.install;
  const { available, dismissed, canPrompt } = useInstall();
  const [ios, setIos] = useState(false);
  // På inloggningssidan står frågan redan på sidan – då behövs inte knappen också.
  if (!available || (hideWhileAsking && !dismissed)) return null;
  return (
    <>
      <button className="tool tool-install" onClick={() => (canPrompt ? promptInstall() : setIos(true))} aria-label={k.buttonAria}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        <span className="tool-label">{k.button}</span>
      </button>
      {ios && <IosInstallDialog onClose={() => setIos(false)} />}
    </>
  );
}

/** iPad och iPhone har ingen installationsruta – där visar vi stegen i Safari. */
function IosInstallDialog({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const k = t.install;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="ios-install-title" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <img className="install-icon install-icon-large" src="/ikoner/ikon-192.png" alt="" />
        <h2 id="ios-install-title">{k.iosTitle}</h2>
        <ol className="install-steps">
          {k.iosSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <button className="btn btn-primary btn-large" onClick={onClose} autoFocus>{k.close}</button>
      </div>
    </div>
  );
}
