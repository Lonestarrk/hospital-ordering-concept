"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishBlockers, dishCategories, dishSuits, dishes, foodCategories } from "@/lib/data";
import { slotFor } from "@/lib/clock";
import { Countdown, useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import { useBlockerText } from "@/components/useBlockerText";
import { speak, type VoiceCommand } from "@/lib/voice";

const ORDINALS = [
  ["första", "ettan", "nummer ett"],
  ["andra", "tvåan", "nummer två"],
  ["tredje", "trean", "nummer tre"],
  ["fjärde", "fyran", "nummer fyra"],
];

export default function MenuPage() {
  return (
    <Suspense>
      <Menu />
    </Suspense>
  );
}

function Menu() {
  const router = useRouter();
  const params = useSearchParams();
  // Dolda rätter visas bara på begäran – läget står i adressen (?dolda=1).
  const showHidden = params.has("dolda");
  const blockerText = useBlockerText();
  const { patient, order, updateOrder, meals, taste } = useRequirePatient();
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
  const likedCategory = (dishId: string) =>
    foodCategories.find((c) => (dishCategories[dishId] ?? []).includes(c.id) && taste.likes.includes(c.id));
  // Rätter som matchar Ingrids smak visas först, sådant hon inte gillar sist – inget döljs.
  const score = (dishId: string) =>
    (dishCategories[dishId] ?? []).reduce(
      (sum, c) => sum + (taste.likes.includes(c) ? 1 : 0) - (taste.dislikes.includes(c) ? 1 : 0),
      0,
    ) + (lastRating(dishId) === "upp" ? 2 : lastRating(dishId) === "ner" ? -2 : 0);

  const suitable = forOccasion.filter((d) => dishSuits(d, patient)).sort((a, b) => score(b.id) - score(a.id));
  const hidden = forOccasion.filter((d) => !suitable.includes(d));

  // Förslaget: den rätt som passar henne bäst – bara om vi kan förklara varför.
  const top = suitable[0];
  const topReason =
    top && score(top.id) > 0
      ? lastRating(top.id) === "upp"
        ? m.whyLiked
        : likedCategory(top.id) && m.whyCategory(tm.category(likedCategory(top.id)!.id, likedCategory(top.id)!.name).toLowerCase())
      : undefined;

  const choose = (id: string) => {
    updateOrder({ dishId: id });
    announce();
    router.push(`/meny/${id}`);
  };

  const commands: VoiceCommand[] = [
    ...suitable.map((d) => ({ phrases: d.voiceWords, action: () => choose(d.id) })),
    ...suitable.map((d, i) => ({ phrases: ORDINALS[i] ?? [], action: () => choose(d.id) })),
    // Säger Ingrid en rätt som inte passar henne förklarar vi varför den inte finns.
    ...hidden.map((d) => ({
      phrases: d.voiceWords,
      action: () => speak(`${d.name} passar tyvärr inte din kost idag. Du kan välja ${suitable.map((x) => x.name).join(", eller ")}.`),
    })),
    { phrases: ["visa dolda", "visa de andra", "visa alla"], action: () => router.replace("/meny?dolda=1") },
    { phrases: ["dölj"], action: () => router.replace("/meny") },
    { phrases: ["tillbaka", "annan måltid"], action: () => router.push("/tillfalle") },
  ];

  const mealName = t.occasions[occasion];
  const items = suitable
    .map((d, i) => `${m.ordinals[i] ?? ""}: ${tm.dish(d).name}. ${tm.dish(d).description}`)
    .join(" ");

  return (
    <Screen
      step={2}
      speakText={`${topReason ? `${m.suggestion}: ${tm.dish(top).name}. ${m.suggestionWhy(topReason)}. ` : ""}${m.speak(mealName.toLowerCase(), items)}`}
      commands={commands}
      voiceHint={suitable.slice(0, 2).map((d) => `”${d.voiceWords[0].replace("*", "")}”`).join(" eller ")}
      footer={
        <button className="btn btn-ghost" onClick={() => router.push("/tillfalle")}>{t.back}</button>
      }
    >
      <div className="page-head">
        <p className="eyebrow">{m.eyebrow(mealName, when(slot, reference))}</p>
        <h1>{occasion === "tilltugg" ? m.titleSnack(patient.firstName) : m.title(patient.firstName, mealName.toLowerCase())}</h1>
        <p className="lead">{m.lead}</p>
        {slot.deadline && <Countdown slot={slot} />}
      </div>

      <div className="dish-grid">
        {suitable.map((dish) => {
          const text = tm.dish(dish);
          const liked = likedCategory(dish.id);
          const suggested = dish === top && !!topReason;
          return (
            <button
              key={dish.id}
              className={`dish ${order.dishId === dish.id ? "selected" : ""} ${suggested ? "suggested" : ""}`}
              onClick={() => choose(dish.id)}
            >
              <img className="dish-image" src={dish.image} alt={text.imageAlt} />
              <div className="dish-body">
                {suggested && (
                  <span className="dish-suggestion">⭐ {m.suggestion} · {m.suggestionWhy(topReason!)}</span>
                )}
                <div className="dish-badges">
                  {text.label && <span className="dish-label">{text.label}</span>}
                  {lastRating(dish.id) === "upp" && <span className="dish-label dish-liked">{m.liked}</span>}
                  {lastRating(dish.id) === "ner" && <span className="dish-label dish-disliked">{m.disliked}</span>}
                  {liked && (
                    <span className="dish-label dish-taste">{m.tasteBadge(tm.category(liked.id, liked.name).toLowerCase())}</span>
                  )}
                </div>
                <h2>{text.name}</h2>
                <p>{text.description}</p>
                <span className="dish-ok">{m.suits}</span>
              </div>
            </button>
          );
        })}
      </div>

      {hidden.length > 0 && (
        <section className="hidden-dishes" aria-labelledby="hidden-title">
          <p className="muted center">{m.hidden(hidden.length)}</p>
          <button
            className="taste-link"
            aria-expanded={showHidden}
            onClick={() => router.replace(showHidden ? "/meny" : "/meny?dolda=1")}
          >
            {showHidden ? m.hideHidden : `👁 ${m.showHidden(hidden.length)}`}
          </button>

          {showHidden && (
            <>
              <h2 id="hidden-title" className="hidden-title">{m.hiddenTitle}</h2>
              <p className="muted">{m.hiddenLead}</p>
              <ul className="dish-grid blocked-grid">
                {hidden.map((dish) => {
                  const text = tm.dish(dish);
                  return (
                    // Inte en knapp: dolda rätter går inte att välja.
                    <li key={dish.id} className="dish blocked" aria-disabled="true">
                      <img className="dish-image" src={dish.image} alt={text.imageAlt} />
                      <div className="dish-body">
                        <span className="dish-label dish-blocked">🚫 {m.notOrderable}</span>
                        <h3>{text.name}</h3>
                        <p>{text.description}</p>
                        <ul className="blockers">
                          {dishBlockers(dish, patient).map((b, i) => <li key={i}>{blockerText(b)}</li>)}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}

      <button className="taste-link" onClick={() => router.push("/min-smak?sen=meny")}>
        {m.tasteLink}
      </button>
    </Screen>
  );
}
