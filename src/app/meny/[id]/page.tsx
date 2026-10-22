"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishSuits, dishes, drinkSuits, drinks } from "@/lib/data";
import { ingredientsFor } from "@/lib/ingredients";
import type { VoiceCommand } from "@/lib/voice";

export default function DishPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { patient, order, updateOrder, lang } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  const k = t.dish;
  const dish = dishes.find((d) => d.id === id);
  // Rätter som patienten inte tål visas aldrig – inte heller via en direktlänk. Då går man tillbaka till menyn.
  const allowed = !!patient && !!dish && dishSuits(dish, patient);
  useEffect(() => {
    if (patient && !allowed) router.replace("/meny");
  }, [patient, allowed, router]);
  if (!patient || !dish || !allowed) return null;

  // Drycken väljs här, bredvid maten – ingen egen sida för dryck.
  const suitableDrinks = drinks.filter((d) => drinkSuits(d, patient.diet));
  const chooseDrink = (id: string) => {
    updateOrder({ drinkId: id });
    const d = drinks.find((x) => x.id === id)!;
    announce(k.drinkChosen(tm.drink(d.id, d.name)));
  };
  const hasDrink = !!order.drinkId && suitableDrinks.some((d) => d.id === order.drinkId);

  const next = () => {
    if (!hasDrink) return;
    announce();
    router.push("/sammanfattning");
  };

  const commands: VoiceCommand[] = [
    ...suitableDrinks.map((d) => ({ phrases: d.voiceWords, action: () => chooseDrink(d.id) })),
    { phrases: ["nästa", "klar", "fortsätt", "gå vidare", "kolla"], action: next },
    { phrases: ["tillbaka", "annan mat", "byt*", "ångra"], action: () => router.push("/meny") },
  ];

  const text = tm.dish(dish);
  // Innehållsförteckning på valt språk, allergener i fetstil.
  const ingredients = ingredientsFor(dish.id, lang);

  return (
    <Screen
      speakText={k.speak(text.name)}
      commands={commands}
      voiceHint="”vatten”, ”kaffe” eller ”nästa”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/meny")}>{k.other}</button>
          <button className="btn btn-primary btn-large" onClick={next} disabled={!hasDrink}>
            {hasDrink ? t.continue : k.pickDrink}
          </button>
        </>
      }
    >
      {/* Rätten och innehållet till vänster, drycken som en lista till höger. På mobil: rätten, drycken, innehåll. */}
      <div className="dish-layout">
        <div className="dish-hero">
          <img className="dish-hero-image" src={dish.image} alt={text.imageAlt} />
          <div>
            <p className="eyebrow">{k.youChose}</p>
            <h1>{text.name}</h1>
            <p className="lead">{text.description}</p>
            <p className="allergens">
              {dish.allergens.length > 0
                ? <>{k.contains} <strong>{t.list(dish.allergens.map(tm.allergen))}</strong></>
                : k.noAllergens}
            </p>
          </div>
        </div>

        <section className="section dish-drinks">
          <h2>{t.drink.title}</h2>
          <div className="drink-list" role="radiogroup" aria-label={t.drink.title}>
            {suitableDrinks.map((d) => (
              <button
                key={d.id}
                role="radio"
                aria-checked={order.drinkId === d.id}
                className={`drink-choice ${order.drinkId === d.id ? "selected" : ""}`}
                onClick={() => chooseDrink(d.id)}
              >
                <span className="drink-choice-emoji" aria-hidden>{d.emoji}</span>
                <span>{tm.drink(d.id, d.name)}</span>
              </button>
            ))}
          </div>
        </section>

        {ingredients && (
          <section className="section dish-ingredients">
            <h2>{k.ingredients.title}</h2>
            <p className="ingredients-list">
              {ingredients.map((item, i) => (
                <span key={item.name}>
                  {item.allergen ? <strong>{item.name}</strong> : item.name}
                  {i < ingredients.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
            <p className="muted ingredients-note">{k.ingredients.note}</p>
          </section>
        )}
      </div>
    </Screen>
  );
}
