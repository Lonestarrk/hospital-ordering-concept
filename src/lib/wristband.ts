// Inloggning med patientens armband: NFC-tagg eller streckkod. Båda innehåller personnumret,
// t.ex. "PNR:194803022328" (NFC som NDEF-textpost, streckkoden som Code 128, QR eller Data Matrix).
// Plattan läser armbandet på tre sätt:
//  1. Web NFC (Chrome på Android) – plattans inbyggda NFC-läsare.
//  2. En inkopplad NFC-läsare eller streckkodsskanner som "skriver" numret som ett tangentbord
//     och avslutar med Enter.
//  3. Plattans kamera läser streckkoden. Bilden tolkas i plattan och lämnar den aldrig.
// Inget skrivs för hand: utan armband går det inte att logga in.

import { checkPersonnummer } from "./personnummer";

export type WristbandError = "unreadable" | "denied" | "camera";

type NdefRecord = { recordType: string; data?: DataView; encoding?: string };
type NdefReadingEvent = Event & { message: { records: NdefRecord[] } };
type NdefReader = EventTarget & {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  onreading: ((e: NdefReadingEvent) => void) | null;
  onreadingerror: (() => void) | null;
};

/** Finns plattans egen NFC-läsare för webben? (Chrome på Android, via HTTPS.) */
export function webNfcSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

/** Plockar ut ett giltigt personnummer ur det armbandet innehåller, annars undefined. */
export function personnummerFromTag(text: string): string | undefined {
  const check = checkPersonnummer(text.replace(/^PNR:/i, "").trim());
  return check.ok ? check.normalized : undefined;
}

/**
 * Lyssnar på plattans NFC-läsare. Måste startas av ett tryck (webbläsaren kräver det).
 * Returnerar en funktion som stänger av läsaren.
 */
export async function scanWristband(handlers: {
  onRead: (text: string) => void;
  onError: (error: WristbandError) => void;
}): Promise<() => void> {
  const controller = new AbortController();
  try {
    const Reader = (window as unknown as { NDEFReader: new () => NdefReader }).NDEFReader;
    const reader = new Reader();
    await reader.scan({ signal: controller.signal });
    reader.onreading = (e) => {
      const record = e.message.records.find((r) => r.recordType === "text" && r.data);
      if (!record?.data) return handlers.onError("unreadable");
      handlers.onRead(new TextDecoder(record.encoding ?? "utf-8").decode(record.data));
    };
    reader.onreadingerror = () => handlers.onError("unreadable");
  } catch (error) {
    handlers.onError((error as DOMException)?.name === "NotAllowedError" ? "denied" : "unreadable");
  }
  return () => controller.abort();
}

/** Streckkoder som förekommer på patientarmband. */
const BARCODE_FORMATS = ["code_128", "qr_code", "data_matrix", "pdf417", "code_39"] as const;

type Detector = { detect: (source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<{ rawValue: string }[]> };

/** Webbläsarens egen streckkodsläsare om den finns, annars ZXing (WebAssembly från appen själv). */
async function createDetector(): Promise<Detector> {
  const Native = (window as unknown as { BarcodeDetector?: new (o: object) => Detector & object }).BarcodeDetector;
  if (Native) {
    const supported: string[] = await (Native as unknown as { getSupportedFormats: () => Promise<string[]> })
      .getSupportedFormats()
      .catch(() => []);
    if (supported.includes("code_128")) return new Native({ formats: BARCODE_FORMATS });
  }
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  prepareZXingModule({
    overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? `/zxing/${path}` : prefix + path) },
  });
  return new BarcodeDetector({ formats: [...BARCODE_FORMATS] });
}

/** Finns det en kamera att läsa streckkoden med? */
export function cameraSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Visar kamerans bild i videoelementet och letar efter armbandets streckkod.
 * Returnerar en funktion som stänger kameran.
 */
export async function scanBarcode(
  video: HTMLVideoElement,
  handlers: { onRead: (text: string) => void; onError: (error: WristbandError) => void },
): Promise<() => void> {
  let stream: MediaStream | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    clearInterval(timer);
    stream?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  };
  try {
    // Den främre kameran sitter mot patienten, som håller upp handleden.
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;
    await video.play();
    const detector = await createDetector();
    let busy = false;
    timer = setInterval(async () => {
      if (busy || video.readyState < 2) return;
      busy = true;
      try {
        const [code] = await detector.detect(video);
        if (code?.rawValue) {
          stop();
          handlers.onRead(code.rawValue);
        }
      } catch {
        // En bild som inte gick att tolka – försök med nästa.
      }
      busy = false;
    }, 250);
  } catch {
    stop();
    handlers.onError("camera");
  }
  return stop;
}

/** Läser streckkoden i en bild – används av demon, som visar Ingrids armband i stället för kamerabilden. */
export async function readBarcodeImage(image: HTMLImageElement): Promise<string | undefined> {
  if (!image.complete) await new Promise((resolve) => image.addEventListener("load", resolve, { once: true }));
  const detector = await createDetector();
  const [code] = await detector.detect(image).catch(() => []);
  return code?.rawValue;
}

/**
 * Läser streckkoden i ett foto. Används när webbläsaren inte kan visa kamerans bild direkt
 * (äldre iPad och Chrome på iOS före 14.3): då tar plattans vanliga kamera ett foto i stället.
 * Fotot skalas ner först, så att det går snabbt även på en gammal platta. Bilden lämnar aldrig plattan.
 */
export async function readBarcodeFile(file: File): Promise<string | undefined> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const detector = await createDetector();
    const [code] = await detector.detect(canvas).catch(() => []);
    return code?.rawValue;
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}
