// Inloggning med patientens armband (NFC). Armbandets tagg innehåller en NDEF-textpost med
// personnumret, t.ex. "PNR:194803022328". Plattan läser den på två sätt:
//  1. Web NFC (Chrome på Android) – plattans inbyggda läsare.
//  2. En inkopplad NFC-läsare som "skriver" numret som ett tangentbord och avslutar med Enter.
// Inget skrivs för hand: utan armband går det inte att logga in.

import { checkPersonnummer } from "./personnummer";

export type WristbandError = "unreadable" | "denied";

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
