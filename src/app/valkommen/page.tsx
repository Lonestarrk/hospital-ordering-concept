"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dietLabels, dishes, meal } from "@/lib/data";
import { pathAfterWelcome } from "@/lib/flow";
import type { VoiceCommand } from "@/lib/voice";

export default function WelcomePage() {
  const router = useRouter();
  const { patient, logout, meals, draft, resumeDraft, discardDraft } = useRequirePatient();
  const { t, tm } = useT();
  const w = t.welcome;
  if (!patient) return null;

  const proceed = () => router.push(pathAfterWelcome(meals));
  const draftDish = dishes.find((d) => d.id === draft?.order.dishId);
  const resume = () => {
    const path = resumeDraft();
    router.push(path ?? "/meny");
  };
  const restart = () => {
    discardDraft();
    proceed();
  };
  const notMe = () => { logout(); router.replace("/"); };

  const diets = patient.diet.map((d) => tm.diet(d, dietLabels[d]));
  const allergies = patient.allergies.map((a) => tm.allergen(a));
  const place = `${tm.word(patient.room)}, ${tm.word(patient.bed)}`;

  const commands: VoiceCommand[] = [
    { phrases: ["nej", "inte jag", "fel"], action: notMe },
    ...(draftDish ? [{ phrases: ["fortsätt", "där jag var"], action: resume }, { phrases: ["börja om"], action: restart }] : []),
    { phrases: ["ja", "det är jag", "stämmer", "fortsätt", "japp", "absolut"], action: proceed },
  ];

  const speakText = draftDish
    ? w.resumeSpeak(tm.dish(draftDish).name)
    : w.speak({
        name: patient.firstName,
        full: `${patient.firstName} ${patient.lastName}`,
        place,
        diets: t.and(diets),
        allergies: allergies.length ? t.and(allergies) : w.noAllergies,
      });

  return (
    <Screen
      speakText={speakText}
      commands={commands}
      voiceHint="”ja” eller ”nej”"
      footer={
        draftDish ? (
          <>
            <button className="btn btn-ghost" onClick={restart}>{w.restart}</button>
            <button className="btn btn-primary btn-large" onClick={resume}>{w.resume}</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={notMe}>{w.no}</button>
            <button className="btn btn-primary btn-large" onClick={proceed}>{w.yes}</button>
          </>
        )
      }
    >
      <div className="welcome">
        <div className="welcome-wave" aria-hidden>👋</div>
        <h1>{draftDish ? w.resumeTitle : w.hello(patient.firstName)}</h1>

        {draftDish ? (
          <div className="card resume">
            <img className="resume-image" src={draftDish.image} alt={tm.dish(draftDish).imageAlt} />
            <p className="lead">{w.resumeBody(tm.dish(draftDish).name)}</p>
          </div>
        ) : (
          <>
            <p className="lead">{w.isThisRight}</p>

            <div className="card identity">
              <div className="identity-row">
                <span className="identity-key">{w.name}</span>
                <span className="identity-val">{patient.firstName} {patient.lastName}</span>
              </div>
              <div className="identity-row">
                <span className="identity-key">{w.place}</span>
                <span className="identity-val">{tm.word(patient.ward)}<br />{place}</span>
              </div>
            </div>

            <div className="card care">
              <div className="care-icon" aria-hidden>💚</div>
              <div>
                <h2>{w.careTitle}</h2>
                <p>{w.careBody}</p>
                <div className="chips">
                  {diets.map((d) => <span key={d} className="chip chip-static">✓ {d}</span>)}
                  {allergies.map((a) => (
                    <span key={a} className="chip chip-static">✓ {w.allergyFree(a.toLowerCase())}</span>
                  ))}
                </div>
                <p className="care-note">
                  {w.careNote[0]}<strong>{w.careNote[1]}</strong>{w.careNote[2]}
                </p>
              </div>
            </div>

            <p className="muted">{w.today(tm.word(meal.name).toLowerCase(), meal.servedAt)}</p>
          </>
        )}
      </div>
    </Screen>
  );
}
