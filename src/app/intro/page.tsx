"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dietLabels, dishSuits, dishes } from "@/lib/data";
import { pathAfterIntro } from "@/lib/flow";
import { speak, type VoiceCommand } from "@/lib/voice";

/** Introduktion första gången: tre korta steg, går alltid att hoppa över. */
export default function IntroPage() {
  const router = useRouter();
  const { patient, meals, markOnboarded, soundOn } = useRequirePatient();
  const { t, tm, speechLang } = useT();
  const i = t.intro;
  const [step, setStep] = useState(0);

  // Läs upp varje nytt steg i ljudläge (första steget läses av Screen).
  useEffect(() => {
    if (soundOn && step > 0) speak(i.speak[step], speechLang);
  }, [step, soundOn, i, speechLang]);

  if (!patient) return null;

  const finish = () => {
    markOnboarded();
    router.push(pathAfterIntro(meals));
  };
  const last = step === i.steps.length - 1;
  const next = () => (last ? finish() : setStep(step + 1));
  const examples = dishes.filter((d) => dishSuits(d, patient)).slice(0, 3);

  const commands: VoiceCommand[] = [
    { phrases: ["hoppa över", "börja"], action: finish },
    { phrases: ["nästa", "fortsätt", "okej", "ja", "visa maten"], action: next },
    { phrases: ["tillbaka"], action: () => setStep(Math.max(0, step - 1)) },
  ];

  return (
    <Screen
      speakText={i.speak[0]}
      commands={commands}
      voiceHint="”nästa”"
      highlightTools={last}
      footer={
        <>
          <button className="btn btn-ghost" onClick={finish}>{i.skip}</button>
          <button className="btn btn-primary btn-large" onClick={next}>{last ? i.start : i.next}</button>
        </>
      }
    >
      <div className="intro">
        <p className="intro-count" aria-live="polite">{i.of(step + 1, i.steps.length)}</p>
        <div className="intro-dots" aria-hidden>
          {i.steps.map((_, n) => <span key={n} className={n === step ? "on" : ""} />)}
        </div>

        <div className="intro-visual" aria-hidden>
          {step === 0 && (
            <div className="intro-photos">
              {examples.map((d) => <img key={d.id} src={d.image} alt="" />)}
            </div>
          )}
          {step === 1 && (
            <div className="intro-safe">
              <span className="intro-big">🛡️</span>
              <div className="chips">
                {patient.diet.map((d) => (
                  <span key={d} className="chip chip-static">✓ {tm.diet(d, dietLabels[d])}</span>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="intro-tools">
              <span className="tool-demo">🔈 {t.readAloud}</span>
              <span className="tool-demo"><b>Aa</b> {t.biggerText}</span>
              <span className="tool-demo tool-demo-help">🙋 {t.help}</span>
              <span className="tool-demo">🌐 {t.language}</span>
            </div>
          )}
        </div>

        <h1>{i.steps[step].title}</h1>
        <p className="lead">{i.steps[step].body}</p>
      </div>
    </Screen>
  );
}
