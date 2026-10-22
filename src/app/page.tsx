"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, STOPPED_KEY, STOPPED_NOTICE_MS, useAnnounce } from "@/components/Screen";
import { InstallBanner } from "@/components/Install";
import { VideoDialog } from "@/components/VideoDialog";
import { useOrder, useT } from "@/components/OrderProvider";
import {
  cameraSupported,
  personnummerFromTag,
  readBarcodeFile,
  readBarcodeImage,
  scanBarcode,
  scanWristband,
  webNfcSupported,
  type WristbandError,
} from "@/lib/wristband";
import { DEMO_PERSONNUMMER, findPatient } from "@/lib/data";

type Phase =
  | { kind: "waiting" }
  | { kind: "reading" }
  /** Kameran letar efter streckkoden. I demon visas Ingrids armband i stället för kamerabilden. */
  | { kind: "camera"; demo?: boolean }
  | { kind: "hello"; name: string }
  | { kind: "error"; error: WristbandError | "notFound" };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useOrder();
  const { t } = useT();
  const l = t.login;
  const announce = useAnnounce();
  const [phase, setPhase] = useState<Phase>({ kind: "waiting" });
  const [nfc, setNfc] = useState(false);
  const [readerOn, setReaderOn] = useState(false);
  const [camera, setCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const demoImageRef = useRef<HTMLImageElement>(null);
  const stopCamera = useRef<() => void>(() => {});
  const photoRef = useRef<HTMLInputElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  // Bekräftelse direkt efter Avbryt. Ingen "Ångra" – plattan kan redan vara hos nästa patient.
  const [stopped, setStopped] = useState(false);
  // Efter "Hej Ingrid!" tonas inloggningen ut innan nästa sida visas.
  const [leaving, setLeaving] = useState(false);
  useEffect(() => router.prefetch("/tillfalle"), [router]);
  useEffect(() => {
    try {
      const at = Number(sessionStorage.getItem(STOPPED_KEY));
      sessionStorage.removeItem(STOPPED_KEY);
      if (at && Date.now() - at < STOPPED_NOTICE_MS) setStopped(true);
    } catch {
      // Ingen lagring – visa ingen notis.
    }
  }, []);

  // Inloggningen sker bara med armbandet – från plattans NFC-läsare, en inkopplad läsare eller demoknappen.
  const handleTag = (text: string) => {
    if (phase.kind === "hello") return;
    setStopped(false);
    const pnr = personnummerFromTag(text);
    if (!pnr) return setPhase({ kind: "error", error: "unreadable" });
    const patient = findPatient(pnr);
    if (!patient) return setPhase({ kind: "error", error: "notFound" });
    setPhase({ kind: "hello", name: patient.firstName });
    announce(l.hello(patient.firstName));
    setTimeout(() => setLeaving(true), 900);
    setTimeout(() => router.push(login(patient)), 1150);
  };
  const handleTagRef = useRef(handleTag);
  handleTagRef.current = handleTag;
  const onError = (error: WristbandError) => setPhase({ kind: "error", error });

  // Plattans egen läsare. Har plattan redan fått lov startar den direkt, annars med ett tryck.
  const stopReader = useRef<() => void>(() => {});
  const startReader = async () => {
    stopReader.current();
    setPhase({ kind: "waiting" });
    setReaderOn(true);
    stopReader.current = await scanWristband({ onRead: (text) => handleTagRef.current(text), onError });
  };
  useEffect(() => {
    setNfc(webNfcSupported());
    setCamera(cameraSupported());
    if (!webNfcSupported()) return;
    navigator.permissions
      ?.query({ name: "nfc" as PermissionName })
      .then((p) => {
        if (p.state === "granted") startReader();
      })
      .catch(() => {});
    return () => {
      stopReader.current();
      stopCamera.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // En inkopplad NFC-läsare eller streckkodsskanner "skriver" armbandets innehåll snabbt och avslutar med Enter.
  // Långsam inmatning för hand räknas inte – det går inte att logga in genom att skriva ett nummer.
  useEffect(() => {
    let buffer = "";
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      const time = performance.now();
      if (time - last > 80) buffer = "";
      last = time;
      // Streckkodsskannrar avslutar med Enter eller Tab.
      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.length >= 10) handleTagRef.current(buffer);
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };
    // Demo och test: window.dispatchEvent(new CustomEvent("ingrid-nfc", { detail: "PNR:194803022328" }))
    const onDemo = (e: Event) => handleTagRef.current((e as CustomEvent<string>).detail);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ingrid-nfc", onDemo);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ingrid-nfc", onDemo);
    };
  }, []);

  const demo = () => {
    stopCamera.current();
    setPhase({ kind: "reading" });
    setTimeout(() => handleTagRef.current(`PNR:${DEMO_PERSONNUMMER}`), 900);
  };
  // Streckkoden läses med plattans kamera. Bilden tolkas i plattan.
  const openCamera = async () => {
    stopCamera.current();
    setPhase({ kind: "camera" });
    // Vänta tills videoelementet syns.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (!videoRef.current) return;
    stopCamera.current = await scanBarcode(videoRef.current, {
      onRead: (text) => {
        setPhase({ kind: "reading" });
        handleTagRef.current(text);
      },
      onError,
    });
  };
  // Utan direkt kamerabild (äldre iPad): plattans vanliga kamera tar ett foto av streckkoden.
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhase({ kind: "reading" });
    const text = await readBarcodeFile(file);
    if (!text) return onError("unreadable");
    handleTagRef.current(text);
  };
  const closeCamera = () => {
    stopCamera.current();
    setPhase({ kind: "waiting" });
  };
  // Demo: Ingrids armband visas där kamerabilden skulle vara, och streckkoden läses på riktigt.
  const demoBarcode = async () => {
    stopCamera.current();
    setPhase({ kind: "camera", demo: true });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const text = demoImageRef.current ? await readBarcodeImage(demoImageRef.current) : undefined;
    if (!text) return onError("unreadable");
    setPhase({ kind: "reading" });
    handleTagRef.current(text);
  };

  const retry = (error: WristbandError | "notFound") =>
    error === "camera" ? photoRef.current?.click() : nfc ? startReader() : setPhase({ kind: "waiting" });

  return (
    <Screen speakText={l.speak}>
      <div className={`login ${leaving ? "is-leaving" : ""}`}>
        {/* Bara inloggningen: språk, uppläsning och textstorlek finns i menyn uppe i hörnet. */}
        <InstallBanner />
        {stopped && (
          <div className="notice" role="status">
            <p>✓ {t.stopped.done}</p>
          </div>
        )}

        <section className={`login-band is-${phase.kind}`} aria-label={l.bandLabel}>
          {phase.kind === "camera" ? (
            <div className="band-camera">
              {phase.demo ? (
                <img ref={demoImageRef} className="band-camera-demo" src="/armband/ingrid-streckkod.png" alt="" />
              ) : (
                <video ref={videoRef} className="band-camera-video" muted playsInline />
              )}
              <span className="band-camera-line" aria-hidden />
            </div>
          ) : (
            <div className="band-spot" aria-hidden>
              <span className="band-ring" />
              <span className="band-ring band-ring-2" />
              <span className="band-icon">{phase.kind === "hello" ? "✓" : "📶"}</span>
              <span className="band-spot-label">{l.bandSpot}</span>
            </div>
          )}
          <div className="band-text" role="status" aria-live="polite">
            {phase.kind === "hello" ? (
              <h1>{l.hello(phase.name)}</h1>
            ) : phase.kind === "reading" ? (
              <h1>{l.reading}</h1>
            ) : phase.kind === "camera" ? (
              <>
                <h1>{l.cameraTitle}</h1>
                <p>{l.cameraHint}</p>
              </>
            ) : (
              <>
                <h1>{l.bandTitle}</h1>
                <p>{l.bandHint}</p>
              </>
            )}
          </div>
          {phase.kind === "error" && (
            <div className="error" role="alert">
              <p>{l.errors[phase.error]}</p>
              <button className="btn btn-small error-action" onClick={() => retry(phase.error)}>
                {l.errorActions[phase.error]}
              </button>
            </div>
          )}
          {nfc && !readerOn && phase.kind === "waiting" && (
            <div className="band-start">
              <button className="btn btn-primary btn-large" onClick={startReader}>{l.start}</button>
              <p className="muted">{l.startHint}</p>
            </div>
          )}
          {phase.kind !== "hello" && phase.kind !== "reading" && (
            phase.kind === "camera" ? (
              <button className="btn btn-ghost" onClick={closeCamera}>{l.cameraClose}</button>
            ) : camera ? (
              <button className="btn btn-ghost band-camera-open" onClick={openCamera}>
                <span aria-hidden>📷</span> {l.camera}
              </button>
            ) : (
              <button className="btn btn-ghost band-camera-open" onClick={() => photoRef.current?.click()}>
                <span aria-hidden>📷</span> {l.photo}
              </button>
            )
          )}
          {/* Fotot tas med plattans vanliga kamera och tolkas i plattan. */}
          <input ref={photoRef} type="file" accept="image/*" capture="user" hidden onChange={onPhoto} />

          <div className="demo-links">
            <button className="demo-link" onClick={demo} disabled={phase.kind === "reading" || phase.kind === "hello"}>
              {l.demo}
            </button>
            <button className="demo-link" onClick={demoBarcode} disabled={phase.kind === "reading" || phase.kind === "hello"}>
              {l.demoBarcode}
            </button>
          </div>
        </section>

        {/* Produktfilmen – öppnas i ett fönster som kan visas i helskärm. */}
        <button className="video-link" onClick={() => setVideoOpen(true)}>{l.video}</button>
      </div>
      {videoOpen && <VideoDialog onClose={() => setVideoOpen(false)} />}
    </Screen>
  );
}
