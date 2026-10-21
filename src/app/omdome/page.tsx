"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
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
  const { t, tm } = useT();
  const f = t.feedback;
  const [rating, setRating] = useState<Rating | undefined>();
  const [reasons, setReasons] = useState<string[]>([]);
  const [eaten, setEaten] = useState<Eaten | undefined>();

  const meal = meals.find((m) => m.id === params.get("id")) ?? meals.find((m) => !m.rating && !m.skipped);
  const dish = dishes.find((d) => d.id === meal?.dishId);
  // Efter omdömet: tillbaka till bekräftelsen om man kom därifrån, annars vidare till menyn.
  const next = params.get("sen") === "klart" ? "/klart" : "/tillfalle";
  if (!patient || !meal || !dish) return null;

  // Tack-läget har en egen adress (&skickat=1) och visar det som sparats på måltiden.
  const sent = params.has("skickat") && !!meal.rating;
  const shown = sent ? { rating: meal.rating, reasons: meal.reasons, eaten: meal.eaten } : { rating, reasons, eaten };
  const reasonList = rating === "upp" ? reasonsUp : reasonsDown;
  // Problem som sjuksköterskan ska agera på – en namngiven person, en handling.
  const hardToChew = reasonsDown.some((r) => r.tellStaff && shown.reasons.includes(r.name));
  const ateLittle = shown.eaten === "lite" || shown.eaten === "inget";
  const tellNurse = hardToChew || ateLittle;

  const rate = (r: Rating) => {
    if (r === rating) return;
    setRating(r);
    setReasons([]);
    announce(r === "upp" ? f.ratedUp : f.ratedDown);
  };

  const toggleReason = (name: string) => {
    const on = reasons.includes(name);
    setReasons(on ? reasons.filter((r) => r !== name) : [...reasons, name]);
    announce(on ? t.dish.removed(tm.reason(name)) : `${tm.reason(name)}.`);
  };

  const chooseEaten = (id: Eaten) => {
    setEaten(id);
    const e = eatenOptions.find((x) => x.id === id)!;
    announce(f.ate(tm.eaten(e.id, e.name).toLowerCase()));
  };

  const send = () => {
    if (!rating) return;
    updateMeal(meal.id, { rating, reasons, eaten });
    router.replace(`/omdome?id=${meal.id}${next === "/klart" ? "&sen=klart" : ""}&skickat=1`);
    const willTell = reasonsDown.some((r) => r.tellStaff && reasons.includes(r.name)) || eaten === "lite" || eaten === "inget";
    announce(f.thanksSpeak(patient.firstName, willTell ? patient.nurse : undefined));
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

  const dishName = tm.dish(dish).name;

  if (sent) {
    return (
      <Screen
        speakText={f.thanksSpeak(patient.firstName, tellNurse ? patient.nurse : undefined)}
        commands={commands}
        voiceHint="”fortsätt”"
        footer={
          <button className="btn btn-primary btn-large footer-end" onClick={() => router.push(next)}>
            {next === "/tillfalle" ? f.orderToday : t.continue}
          </button>
        }
      >
        <div className="done">
          <div className={`done-check ${shown.rating === "ner" ? "done-check-neutral" : ""}`} aria-hidden>
            {shown.rating === "upp" ? "👍" : "👎"}
          </div>
          <h1>{f.thanks(patient.firstName)}</h1>
          <p className="lead">{f.kitchenGets(dishName)}</p>
          {tellNurse && (
            <div className="card care feedback-staff">
              <div className="care-icon" aria-hidden>👩‍⚕️</div>
              <div>
                <h2>{f.tellNurse.title(patient.nurse)}</h2>
                {hardToChew && <p>… {f.tellNurse.chew}</p>}
                {ateLittle && <p>… {f.tellNurse.ate}</p>}
                <p className="care-note">{f.tellNurse.escalation}</p>
              </div>
            </div>
          )}
          {shown.rating === "upp" && <p className="muted">{f.nextTime}</p>}
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      speakText={f.speak(patient.firstName, tm.word(meal.label), dishName)}
      commands={commands}
      voiceHint="”tummen upp” eller ”tummen ner”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={skip}>{f.skip}</button>
          <button className="btn btn-primary btn-large" onClick={send} disabled={!rating}>
            {f.send}
          </button>
        </>
      }
    >
      <div className="feedback-head">
        <img className="feedback-image" src={dish.image} alt={tm.dish(dish).imageAlt} />
        <div>
          <p className="eyebrow">{tm.word(meal.label)}</p>
          <h1>{f.howWas}</h1>
          <p className="lead">{dishName}</p>
          <p className="muted">{f.hint}</p>
        </div>
      </div>

      <div className="thumbs" role="radiogroup" aria-label={f.howWas}>
        <button
          role="radio"
          aria-checked={rating === "upp"}
          className={`thumb thumb-up ${rating === "upp" ? "selected" : ""}`}
          onClick={() => rate("upp")}
        >
          <span className="thumb-icon" aria-hidden>👍</span>
          {f.good}
        </button>
        <button
          role="radio"
          aria-checked={rating === "ner"}
          className={`thumb thumb-down ${rating === "ner" ? "selected" : ""}`}
          onClick={() => rate("ner")}
        >
          <span className="thumb-icon" aria-hidden>👎</span>
          {f.notGood}
        </button>
      </div>
      {!rating && <p className="muted feedback-pick">{f.pickFirst}</p>}

      {rating && (
        <>
          <section className="section">
            <h2>
              {rating === "upp" ? f.whatGood : f.whatBad} <span className="optional">{t.optional}</span>
            </h2>
            <div className="chips">
              {reasonList.map(({ name }) => {
                const on = reasons.includes(name);
                return (
                  <button key={name} className={`chip ${on ? "selected" : ""}`} aria-pressed={on} onClick={() => toggleReason(name)}>
                    {on ? "✓ " : "+ "}{tm.reason(name)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section">
            <h2>{f.howMuch} <span className="optional">{t.optional}</span></h2>
            <div className="segmented segmented-4" role="radiogroup" aria-label={f.howMuch}>
              {eatenOptions.map((e) => (
                <button
                  key={e.id}
                  role="radio"
                  aria-checked={eaten === e.id}
                  className={`segment segment-compact ${eaten === e.id ? "selected" : ""}`}
                  onClick={() => chooseEaten(e.id)}
                >
                  <span className={`plate plate-${e.id}`} aria-hidden />
                  <strong>{tm.eaten(e.id, e.name)}</strong>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </Screen>
  );
}
