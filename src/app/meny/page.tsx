"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishCategories, dishSuits, dishes, foodCategories, meal } from "@/lib/data";
import { speak, type VoiceCommand } from "@/lib/voice";

const ORDINALS = [
  ["första", "ettan", "nummer ett"],
  ["andra", "tvåan", "nummer två"],
  ["tredje", "trean", "nummer tre"],
  ["fjärde", "fyran", "nummer fyra"],
];

export default function MenuPage() {
  const router = useRouter();
  const { patient, order, updateOrder, meals, taste } = useRequirePatient();
  const { t, tm } = useT();
  const m = t.menu;
  const announce = useAnnounce();
  if (!patient) return null;

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

  const suitable = dishes.filter((d) => dishSuits(d, patient)).sort((a, b) => score(b.id) - score(a.id));
  const hidden = dishes.filter((d) => !suitable.includes(d));

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
    { phrases: ["tillbaka"], action: () => router.push("/valkommen") },
  ];

  const mealName = tm.word(meal.name);
  const items = suitable
    .map((d, i) => `${m.ordinals[i] ?? ""}: ${tm.dish(d).name}. ${tm.dish(d).description}`)
    .join(" ");

  return (
    <Screen
      step={1}
      speakText={`${topReason ? `${m.suggestion}: ${tm.dish(top).name}. ${m.suggestionWhy(topReason)}. ` : ""}${m.speak(mealName.toLowerCase(), items)}`}
      commands={commands}
      voiceHint={suitable.slice(0, 2).map((d) => `”${d.voiceWords[0].replace("*", "")}”`).join(" eller ")}
      footer={
        <button className="btn btn-ghost" onClick={() => router.push("/valkommen")}>{t.back}</button>
      }
    >
      <div className="page-head">
        <p className="eyebrow">{m.eyebrow(mealName, meal.servedAt)}</p>
        <h1>{m.title(patient.firstName)}</h1>
        <p className="lead">{m.lead}</p>
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

      {hidden.length > 0 && <p className="muted center">{m.hidden(hidden.length)}</p>}

      <button className="taste-link" onClick={() => router.push("/min-smak?sen=meny")}>
        {m.tasteLink}
      </button>
    </Screen>
  );
}
