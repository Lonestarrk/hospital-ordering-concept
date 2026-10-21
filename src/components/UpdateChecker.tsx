"use client";

import { useEffect, useState } from "react";
import { useOrder, useT } from "./OrderProvider";

const CURRENT = process.env.NEXT_PUBLIC_APP_VERSION;
const CHECK_EVERY_MS = 5 * 60 * 1000;
/** Version som vi redan har laddat om för – så att det aldrig blir en evig loop. */
const RELOADED_KEY = "ingrid-reloaded-for";

function reloadOnceFor(version: string): boolean {
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === version) return false;
    sessionStorage.setItem(RELOADED_KEY, version);
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Märker när en ny version är publicerad. En installerad app på iPad laddas inte om när
 * man öppnar den igen, så utan den här kontrollen kan den visa en gammal version länge.
 * På inloggningssidan laddas den nya versionen direkt; annars får patienten välja när.
 * Påbörjade val ligger kvar efter omladdningen.
 */
export function UpdateChecker() {
  const { patient } = useOrder();
  const { t } = useT();
  const [available, setAvailable] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        const { version } = (await res.json()) as { version?: string };
        if (!stopped && version && version !== CURRENT) setAvailable(version);
      } catch {
        // Utan nät kontrollerar vi igen nästa gång.
      }
    };
    const onShow = () => check();
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("pageshow", onShow);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  // Ingen inloggad: inget att avbryta, så den nya versionen laddas direkt.
  useEffect(() => {
    if (available && !patient) reloadOnceFor(available);
  }, [available, patient]);

  if (!available || !patient) return null;
  return (
    <div className="update-banner" role="status">
      <span>{t.update.title}</span>
      <button className="btn btn-primary btn-small" onClick={() => window.location.reload()}>
        {t.update.button}
      </button>
    </div>
  );
}
