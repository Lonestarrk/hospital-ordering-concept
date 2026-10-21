// Installera appen (PWA). Webbläsaren skickar "beforeinstallprompt" när appen går att
// installera. Vi sparar händelsen så att vår egen fråga – och knappen i sidhuvudet –
// kan visa webbläsarens installationsruta när patienten eller personalen vill.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export type InstallState = {
  /** Webbläsaren kan visa sin installationsruta. */
  canPrompt: boolean;
  /** iPad/iPhone: installeras via Dela → Lägg till på hemskärmen. */
  ios: boolean;
  /** Appen körs redan som installerad. */
  installed: boolean;
};

const DISMISSED_KEY = "ingrid-install-dismissed";

let deferred: InstallEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Vi visar vår egen fråga i stället för webbläsarens mini-banner.
    // Installationsikonen i adressfältet (Chrome, Edge) finns kvar ändå.
    event.preventDefault();
    deferred = event as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

function runningInstalled(): boolean {
  return (
    installedNow ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function installState(): InstallState {
  if (typeof window === "undefined") return { canPrompt: false, ios: false, installed: false };
  const installed = runningInstalled();
  return { canPrompt: !installed && !!deferred, ios: !installed && isIos(), installed };
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Visar webbläsarens installationsruta. Returnerar om den installerades. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === "accepted";
}

/** "Inte nu": frågan visas inte igen, men knappen i sidhuvudet finns kvar. */
export function dismissInstall() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Utan lagring visas frågan igen nästa gång – inget annat händer.
  }
  notify();
}

export function installDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Registrerar service workern (bara i produktion, så att utvecklingsläget inte cachas). */
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Utan service worker fungerar appen som vanlig webbsida.
  });
}
