"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishes, eatenOptions, reasonsDown, reasonsUp, type Eaten, type Rating } from "@/lib/data";
import type { VoiceCommand } from "@/lib/voice";

export default function FeedbackPage() {
  return (
    <Suspense>
      <Feedback />
    </Suspense>
  );
}

function Feedback() {
  const router = useRouter();
  const params = useSearchParams();
  const { patient, meals, updateMeal } = useRequirePatient();
  const announce = useAnnounce();
  const [rating, setRating] = useState<Rating | undefined>();
  const [reasons, setReasons] = useState<string[]>([]);
  const [eaten, setEaten] = useState<Eaten | undefined>();
  const [sent, setSent] = useState(false);

  const meal = meals.find((m) => m.id === params.get("id")) ?? meals.find((m) => !m.rating && !m.skipped);
  const dish = dishes.find((d) => d.id === meal?.dishId);
  // Efter omdömet: tillbaka till bekräftelsen om man kom därifrån, annars vidare till menyn.
  const next = params.get("sen") === "klart" ? "/klart" : "/meny";
  if (!patient || !meal || !dish) return null;

  const reasonList = rating === "upp" ? reasonsUp : reasonsDown;
  const tellStaff = reasonsDown.some((r) => r.tellStaff && reasons.includes(r.name));

  const rate = (r: Rating) => {
    if (r === rating) return;
    setRating(r);
    setReasons([]);
    announce(r === "upp" ? "Tummen upp! Vad tyckte du om?" : "Tummen ner. Vad var inte bra?");
  };

  const toggleReason = (name: string) => {
    const on = reasons.includes(name);
    setReasons(on ? reasons.filter((r) => r !== name) : [...reasons, name]);
    announce(on ? `${name}, borttaget.` : `${name}.`);
  };

  const chooseEaten = (id: Eaten) => {
    setEaten(id);
    announce(`Du åt ${eatenOptions.find((e) => e.id === id)?.name.toLowerCase()}.`);
  };

  const send = () => {
    if (!rating) return;
    updateMeal(meal.id, { rating, reasons, eaten });
    setSent(true);
    announce(
      `Tack ${patient.firstName}! Köket får ditt omdöme.${tellStaff ? " Vi säger också till personalen att maten var svår att tugga." : ""}`,
    );
  };

  const skip = () => {
    updateMeal(meal.id, { skipped: true });
    router.push(next);
  };

  const commands: VoiceCommand[] = sent
    ? [{ phrases: ["fortsätt", "nästa", "okej", "ja", "beställ*", "klar"], action: () => router.push(next) }]
    : [
        // Skälen först, så att "god smak" efter tummen upp inte tolkas som en ny tumme.
        ...(rating ? reasonList.map((r) => ({ phrases: r.voiceWords, action: () => toggleReason(r.name) })) : []),
        { phrases: ["tummen ner", "inte gott", "inte bra", "dålig*"], action: () => rate("ner") },
        { phrases: ["tummen upp", "gott", "bra", "jättegott", "god"], action: () => rate("upp") },
        ...eatenOptions.map((e) => ({ phrases: e.voiceWords, action: () => chooseEaten(e.id) })),
        { phrases: ["skicka", "klar", "färdig*"], action: send },
        { phrases: ["hoppa över", "senare", "vet inte"], action: skip },
      ];

  if (sent) {
    return (
      <Screen
        speakText={`Tack ${patient.firstName}! Köket får ditt omdöme. Säg fortsätt eller tryck på knappen.`}
        commands={commands}
        voiceHint="”fortsätt”"
        footer={
          <button className="btn btn-primary btn-large footer-end" onClick={() => router.push(next)}>
            {next === "/meny" ? "Beställ dagens mat →" : "Fortsätt →"}
          </button>
        }
      >
        <div className="done">
          <div className={`done-check ${rating === "ner" ? "done-check-neutral" : ""}`} aria-hidden>
            {rating === "upp" ? "👍" : "👎"}
          </div>
          <h1>Tack {patient.firstName}!</h1>
          <p className="lead">Köket får ditt omdöme om {dish.name.toLowerCase()}.</p>
          {tellStaff && (
            <div className="card care feedback-staff">
              <div className="care-icon" aria-hidden>💬</div>
              <p>
                Vi säger till personalen att maten var svår att tugga. De kan se över om du behöver
                annan mat – <strong>det är de som bestämmer</strong>, inget ändras automatiskt.
              </p>
            </div>
          )}
          {rating === "upp" && <p className="muted">Nästa gång ser du 👍 vid rätten på menyn.</p>}
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      speakText={`Hej ${patient.firstName}! ${meal.label} var ${dish.name}. Hur smakade det? Säg tummen upp eller tummen ner – eller tryck på en tumme. Du kan också hoppa över.`}
      commands={commands}
      voiceHint="”tummen upp” eller ”tummen ner”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={skip}>Hoppa över</button>
          <button className="btn btn-primary btn-large" onClick={send} disabled={!rating}>
            Skicka ✓
          </button>
        </>
      }
    >
      <div className="feedback-head">
        <img className="feedback-image" src={dish.image} alt={dish.imageAlt} />
        <div>
          <p className="eyebrow">{meal.label}</p>
          <h1>Hur smakade det?</h1>
          <p className="lead">{dish.name}</p>
        </div>
      </div>

      <div className="thumbs" role="radiogroup" aria-label="Omdöme">
        <button
          role="radio"
          aria-checked={rating === "upp"}
          className={`thumb thumb-up ${rating === "upp" ? "selected" : ""}`}
          onClick={() => rate("upp")}
        >
          <span className="thumb-icon" aria-hidden>👍</span>
          Gott
        </button>
        <button
          role="radio"
          aria-checked={rating === "ner"}
          className={`thumb thumb-down ${rating === "ner" ? "selected" : ""}`}
          onClick={() => rate("ner")}
        >
          <span className="thumb-icon" aria-hidden>👎</span>
          Inte så gott
        </button>
      </div>

      {rating && (
        <>
          <section className="section">
            <h2>
              {rating === "upp" ? "Vad var bra?" : "Vad var inte bra?"} <span className="optional">(om du vill)</span>
            </h2>
            <div className="chips">
              {reasonList.map(({ name }) => {
                const on = reasons.includes(name);
                return (
                  <button key={name} className={`chip ${on ? "selected" : ""}`} aria-pressed={on} onClick={() => toggleReason(name)}>
                    {on ? "✓ " : "+ "}{name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section">
            <h2>Hur mycket åt du? <span className="optional">(om du vill)</span></h2>
            <div className="segmented segmented-4" role="radiogroup" aria-label="Hur mycket du åt">
              {eatenOptions.map((e) => (
                <button
                  key={e.id}
                  role="radio"
                  aria-checked={eaten === e.id}
                  className={`segment segment-compact ${eaten === e.id ? "selected" : ""}`}
                  onClick={() => chooseEaten(e.id)}
                >
                  <span className={`plate plate-${e.id}`} aria-hidden />
                  <strong>{e.name}</strong>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </Screen>
  );
}
