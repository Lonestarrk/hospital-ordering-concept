// Tal och röstkommandon med webbläsarens inbyggda Web Speech API.
// Uppläsning (speechSynthesis) sker i enheten. Taligenkänning används BARA när den kan köras
// i enheten (processLocally). Annars döljs mikrofonen – ljud får aldrig skickas till en
// extern taltjänst/AI-modell (skyddsräcke 2: patientdata går aldrig okontrollerat till AI).

export function speak(text: string, lang = "sv-SE", onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (voice) utterance.voice = voice;
  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

let audioCtx: AudioContext | null = null;

/** En mjuk tvåtonssignal som bekräftar ett val. */
export function chime() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  audioCtx ??= new AudioContext();
  const ctx = audioCtx;
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * 0.12;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

// ---------- Taligenkänning ----------

type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  processLocally?: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

type LocalOptions = { langs: string[]; processLocally: boolean };

type RecognitionCtor = (new () => Recognition) & {
  available?: (opts: LocalOptions) => Promise<string>;
  install?: (opts: LocalOptions) => Promise<boolean>;
};

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, RecognitionCtor | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const LOCAL: LocalOptions = { langs: ["sv-SE"], processLocally: true };

/**
 * Sant om webbläsaren har API:t för taligenkänning i enheten. Själva kontrollen att en svensk
 * modell finns görs först när patienten trycker på mikrofonen (se listenOnce) – att fråga
 * direkt vid sidladdning kan krascha webbläsare som saknar taltjänst.
 */
export function localRecognitionSupported(): boolean {
  return typeof getRecognitionCtor()?.available === "function";
}

/** Lyssnar efter ett yttrande och returnerar de tolkningar webbläsaren föreslår. */
export async function listenOnce(handlers: {
  onResult: (alternatives: string[]) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): Promise<() => void> {
  const Ctor = getRecognitionCtor();
  const fail = (error: string) => {
    handlers.onError(error);
    handlers.onEnd();
    return () => {};
  };
  if (!Ctor?.available) return fail("not-local");

  // Kräv igenkänning i enheten. Saknas modellen laddas den ner först (en gång).
  try {
    let status = await Ctor.available(LOCAL);
    if (status === "downloadable" && Ctor.install) {
      handlers.onError("installing");
      if (await Ctor.install(LOCAL)) status = "available";
    }
    if (status !== "available") return fail("not-local");
  } catch {
    return fail("not-local");
  }

  const recognition = new Ctor();
  if (!("processLocally" in recognition)) return fail("not-local");
  recognition.processLocally = true;
  recognition.lang = "sv-SE";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (e) => {
    const first = e.results[0];
    const alternatives: string[] = [];
    for (let i = 0; i < first.length; i++) alternatives.push(first[i].transcript);
    handlers.onResult(alternatives);
  };
  recognition.onerror = (e) => handlers.onError(e.error);
  recognition.onend = () => handlers.onEnd();
  recognition.start();
  return () => recognition.abort();
}

// ---------- Kommandon ----------

export type VoiceCommand = {
  /**
   * Ord eller fraser som utlöser kommandot (små bokstäver). Matchar hela ord; avsluta med *
   * för att även matcha böjningar, t.ex. "lax*" matchar "laxen".
   */
  phrases: string[];
  /** Får det som hördes, t.ex. för att skilja "jag gillar fisk" från "jag gillar inte fisk". */
  action: (heard: string) => void;
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseMatches(heard: string, phrase: string): boolean {
  return phrase.endsWith("*")
    ? heard.includes(` ${phrase.slice(0, -1)}`)
    : heard.includes(` ${phrase} `);
}

/** Hittar första kommandot vars fras finns i någon av webbläsarens tolkningar. */
export function matchCommand(alternatives: string[], commands: VoiceCommand[]): VoiceCommand | null {
  for (const alt of alternatives) {
    const heard = ` ${normalize(alt)} `;
    for (const command of commands) {
      if (command.phrases.some((p) => phraseMatches(heard, p))) return command;
    }
  }
  return null;
}
