"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageChoice, Screen, STOPPED_KEY, UNDO_STOP_MS, useAnnounce } from "@/components/Screen";
import { useOrder, useT } from "@/components/OrderProvider";
import {
  cameraSupported,
  personnummerFromTag,
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
  const { login, undoStop, drafts } = useOrder();
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
    const path = undoStop(stopped);
    if (path) router.push(path);
  };

  // Inloggningen sker bara med armbandet – från plattans NFC-läsare, en inkopplad läsare eller demoknappen.
  const handleTag = (text: string) => {
    setStopped(null);
    const pnr = personnummerFromTag(text);
    if (!pnr) return setPhase({ kind: "error", error: "unreadable" });
    const patient = findPatient(pnr);
    if (!patient) return setPhase({ kind: "error", error: "notFound" });
    setPhase({ kind: "hello", name: patient.firstName });
    announce(l.hello(patient.firstName));
    setTimeout(() => router.push(login(patient)), 900);
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
    error === "camera" ? openCamera() : nfc ? startReader() : setPhase({ kind: "waiting" });

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
              <h2>{l.hello(phase.name)}</h2>
            ) : phase.kind === "reading" ? (
              <h2>{l.reading}</h2>
            ) : phase.kind === "camera" ? (
              <>
                <h2>{l.cameraTitle}</h2>
                <p>{l.cameraHint}</p>
              </>
            ) : (
              <>
                <h2>{l.bandTitle}</h2>
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
          {camera && phase.kind !== "hello" && phase.kind !== "reading" && (
            phase.kind === "camera" ? (
              <button className="btn btn-ghost" onClick={closeCamera}>{l.cameraClose}</button>
            ) : (
              <button className="btn btn-ghost band-camera-open" onClick={openCamera}>
                <span aria-hidden>📷</span> {l.camera}
              </button>
            )
          )}
          {!nfc && <p className="muted band-external">{l.external}</p>}

          <div className="demo-links">
            <button className="demo-link" onClick={demo} disabled={phase.kind === "reading" || phase.kind === "hello"}>
              {l.demo}
            </button>
            <button className="demo-link" onClick={demoBarcode} disabled={phase.kind === "reading" || phase.kind === "hello"}>
              {l.demoBarcode}
            </button>
          </div>
        </section>
      </div>
    </Screen>
  );
}
