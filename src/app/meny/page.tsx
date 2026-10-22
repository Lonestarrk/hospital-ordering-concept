"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishSuits, dishes } from "@/lib/data";
import { slotFor } from "@/lib/clock";
import { Countdown, useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import type { VoiceCommand } from "@/lib/voice";

const ORDINALS = [
  ["första", "ettan", "nummer ett"],
  ["andra", "tvåan", "nummer två"],
  ["tredje", "trean", "nummer tre"],
  ["fjärde", "fyran", "nummer fyra"],
];

export default function MenuPage() {
  const router = useRouter();
  const { patient, order, updateOrder, meals } = useRequirePatient();
  const { t, tm } = useT();
  const m = t.menu;
  const announce = useAnnounce();
  const reference = useNow();
  const { when } = useSlotText();
  // Menyn hör alltid till en vald måltid – utan den börjar man med att välja måltid.
  useEffect(() => {
    if (patient && !order.occasion) router.replace("/tillfalle");
  }, [patient, order.occasion, router]);
  if (!patient || !order.occasion || !order.date) return null;
  const occasion = order.occasion;
  const slot = slotFor(occasion, order.date, reference);
  const forOccasion = dishes.filter((d) => d.occasions.includes(occasion));

  // Senaste omdömet per rätt, så att menyn kommer ihåg vad Ingrid tycker om.
  const lastRating = (dishId: string) => meals.find((x) => x.dishId === dishId && x.rating)?.rating;
  // Bara rätter som passar hennes kost, allergier och konsistens visas – de andra finns inte på menyn.
  // Rätter hon gav tummen upp kommer först, de med tummen ner sist.
  const score = (dishId: string) => (lastRating(dishId) === "upp" ? 1 : lastRating(dishId) === "ner" ? -1 : 0);
  const suitable = forOccasion.filter((d) => dishSuits(d, patient)).sort((a, b) => score(b.id) - score(a.id));

  // Förslaget: en rätt hon gav tummen upp förra gången.
  const top = suitable[0];
  const topReason = top && lastRating(top.id) === "upp" ? m.whyLiked : undefined;

  const choose = (id: string) => {
    updateOrder({ dishId: id });
    announce();
    router.push(`/meny/${id}`);
  };

  const commands: VoiceCommand[] = [
    ...suitable.map((d) => ({ phrases: d.voiceWords, action: () => choose(d.id) })),
    ...suitable.map((d, i) => ({ phrases: ORDINALS[i] ?? [], action: () => choose(d.id) })),
    { phrases: ["tillbaka", "annan måltid"], action: () => router.push("/tillfalle") },
  ];

  const mealName = t.occasions[occasion];
  const items = suitable
    .map((d, i) => `${m.ordinals[i] ?? ""}: ${tm.dish(d).name}. ${tm.dish(d).description}`)
    .join(" ");

  return (
    <Screen
      speakText={`${topReason ? `${m.suggestion}: ${tm.dish(top).name}. ${m.suggestionWhy(topReason)}. ` : ""}${m.speak(mealName.toLowerCase(), items)}`}
      commands={commands}
      voiceHint={suitable.slice(0, 2).map((d) => `”${d.voiceWords[0].replace("*", "")}”`).join(" eller ")}
      footer={
        <button className="btn btn-ghost" onClick={() => router.push("/tillfalle")}>{t.back}</button>
      }
    >
      <div className="page-head">
        <p className="eyebrow">{m.eyebrow(mealName, when(slot, reference))}</p>
        <h1>{m.title(patient.firstName, mealName.toLowerCase())}</h1>
        <p className="lead">{m.lead}</p>
        <Countdown slot={slot} />
      </div>

      <div className="dish-grid">
        {suitable.map((dish) => {
          const text = tm.dish(dish);
          const suggested = dish === top && !!topReason;
          return (
            <button
              key={dish.id}
              className={`dish ${order.dishId === dish.id ? "selected" : ""} ${suggested ? "suggested" : ""}`}
              onClick={() => choose(dish.id)}
            >
              <span className="dish-thumb"><img className="dish-image" src={dish.image} alt={text.imageAlt} loading="lazy" decoding="async" /></span>
              <div className="dish-body">
                {suggested && (
                  <span className="dish-suggestion">⭐ {m.suggestion} · {m.suggestionWhy(topReason!)}</span>
                )}
                <div className="dish-badges">
                  {text.label && <span className="dish-label">{text.label}</span>}
                  {lastRating(dish.id) === "upp" && <span className="dish-label dish-liked">{m.liked}</span>}
                  {lastRating(dish.id) === "ner" && <span className="dish-label dish-disliked">{m.disliked}</span>}
                </div>
                <h2>{text.name}</h2>
                <p>{text.description}</p>
              </div>
            </button>
          );
        })}
      </div>

    </Screen>
  );
}
