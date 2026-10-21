// Tal och röstkommandon med webbläsarens inbyggda Web Speech API.
// Uppläsning (speechSynthesis) sker alltid lokalt i enheten. Taligenkänning körs lokalt
// när webbläsaren stöder det (processLocally); annars skickar webbläsaren ljudet till sin
// egen tjänst – se README. Inga personnummer eller journaldata tas emot via röst.

export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "sv-SE";
  utterance.rate = 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("sv"));
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

type RecognitionCtor = (new () => Recognition) & {
  available?: (opts: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, RecognitionCtor | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

/** Lyssnar efter ett yttrande och returnerar de tolkningar webbläsaren föreslår. */
export async function listenOnce(handlers: {
  onResult: (alternatives: string[]) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): Promise<() => void> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    handlers.onError("not-supported");
    handlers.onEnd();
    return () => {};
  }
  const recognition = new Ctor();
  recognition.lang = "sv-SE";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;

  // Föredra igenkänning i enheten när webbläsaren har en svensk modell installerad.
  try {
    if (Ctor.available && "processLocally" in recognition) {
      const status = await Ctor.available({ langs: ["sv-SE"], processLocally: true });
      if (status === "available") recognition.processLocally = true;
    }
  } catch {
    // Äldre webbläsare – använd standardläget.
  }

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
  action: () => void;
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
