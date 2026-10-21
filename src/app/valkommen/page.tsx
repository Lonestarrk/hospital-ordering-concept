"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dietLabels, meal } from "@/lib/data";
import type { VoiceCommand } from "@/lib/voice";

export default function WelcomePage() {
  const router = useRouter();
  const { patient, logout } = useRequirePatient();
  if (!patient) return null;

  const diets = patient.diet.map((d) => dietLabels[d]);
  const notMe = () => { logout(); router.replace("/"); };
  const commands: VoiceCommand[] = [
    { phrases: ["nej", "inte jag", "fel"], action: notMe },
    { phrases: ["ja", "det är jag", "stämmer", "fortsätt", "japp", "absolut"], action: () => router.push("/meny") },
  ];
  const allergies = patient.allergies.length > 0 ? patient.allergies.join(" och ") : "inga";

  return (
    <Screen
      speakText={`Hej ${patient.firstName}! Är det du, ${patient.firstName} ${patient.lastName}, i ${patient.room}, ${patient.bed}? Vi vet redan att du ska ha ${diets.join(" och ")}. Du är allergisk mot ${allergies}. Du ser bara mat som passar dig. Tryck på Ja, det är jag – eller tryck på mikrofonen och säg ja.`}
      commands={commands}
      voiceHint="”ja” eller ”nej”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={notMe}>
            Nej, det är inte jag
          </button>
          <button className="btn btn-primary btn-large" onClick={() => router.push("/meny")}>
            Ja, det är jag →
          </button>
        </>
      }
    >
      <div className="welcome">
        <div className="welcome-wave" aria-hidden>👋</div>
        <h1>Hej {patient.firstName}!</h1>
        <p className="lead">Stämmer det här?</p>

        <div className="card identity">
          <div className="identity-row">
            <span className="identity-key">Namn</span>
            <span className="identity-val">{patient.firstName} {patient.lastName}</span>
          </div>
          <div className="identity-row">
            <span className="identity-key">Plats</span>
            <span className="identity-val">{patient.ward}<br />{patient.room}, {patient.bed}</span>
          </div>
        </div>

        <div className="card care">
          <div className="care-icon" aria-hidden>💚</div>
          <div>
            <h2>Vi har koll på din kost</h2>
            <p>
              Vårdpersonalen har registrerat din kost och dina allergier. Du ser bara mat som
              passar dig – så du kan välja fritt utan att oroa dig.
            </p>
            <div className="chips">
              {diets.map((d) => <span key={d} className="chip chip-static">✓ {d}</span>)}
              {patient.allergies.map((a) => (
                <span key={a} className="chip chip-static chip-allergy">⚠ Allergi: {a}</span>
              ))}
            </div>
            <p className="care-note">
              Stämmer något inte? Tryck på <strong>Hjälp</strong>. Bara personalen kan ändra din kost
              och dina allergier.
            </p>
          </div>
        </div>

        <p className="muted">
          {meal.day} beställer du <strong>{meal.name.toLowerCase()}</strong> som serveras kl {meal.servedAt}.
        </p>
      </div>
    </Screen>
  );
}
