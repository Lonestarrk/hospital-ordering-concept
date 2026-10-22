"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishBlockers, dishes, dishNutrition, drinkSuits, drinks, extras } from "@/lib/data";
import { useBlockerText } from "@/components/useBlockerText";
import type { VoiceCommand } from "@/lib/voice";

export default function DishPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { patient, order, updateOrder, lang } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  const k = t.dish;
  const blockerText = useBlockerText();
  const dish = dishes.find((d) => d.id === id);
  if (!patient || !dish) return null;

  // Rätter som inte passar patientens kost går inte att beställa, inte ens via direktlänk.
  const blockers = dishBlockers(dish, patient);
  if (blockers.length > 0) {
    const m = t.menu;
    return (
      <Screen
        speakText={`${m.blockedTitle}. ${blockers.map(blockerText).join(". ")}. ${m.blockedLead}`}
        footer={<button className="btn btn-primary btn-large" onClick={() => router.push("/meny")}>{m.backToMenu}</button>}
      >
        <div className="dish-hero">
          <img className="dish-hero-image blocked-image" src={dish.image} alt={tm.dish(dish).imageAlt} />
          <div>
            <p className="eyebrow">🚫 {m.notOrderable}</p>
            <h1>{tm.dish(dish).name}</h1>
            <p className="lead">{m.blockedTitle}</p>
            <ul className="blockers">
              {blockers.map((b, i) => <li key={i}>{blockerText(b)}</li>)}
            </ul>
            <p className="muted">{m.blockedLead}</p>
          </div>
        </div>
      </Screen>
    );
  }

  const toggleExtra = (extra: string) => {
    const on = order.extras.includes(extra);
    updateOrder({ extras: on ? order.extras.filter((e) => e !== extra) : [...order.extras, extra] });
    announce(on ? k.removed(tm.extra(extra)) : k.added(tm.extra(extra)));
  };

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

  // Önskemål som "såsen vid sidan" gäller bara lagad mat.
  const hasExtras = order.occasion === "lunch" || order.occasion === "middag";

  const commands: VoiceCommand[] = [
    ...(hasExtras ? extras : []).map((e) => ({ phrases: e.voiceWords, action: () => toggleExtra(e.name) })),
    ...suitableDrinks.map((d) => ({ phrases: d.voiceWords, action: () => chooseDrink(d.id) })),
    { phrases: ["nästa", "klar", "fortsätt", "gå vidare", "kolla"], action: next },
    { phrases: ["tillbaka", "annan mat", "byt*", "ångra"], action: () => router.push("/meny") },
  ];

  const text = tm.dish(dish);
  // Näringsvärde per portion, med decimaltecken efter språket.
  const nutrition = dishNutrition[dish.id];
  const n = k.nutrition;
  const num = (value: number, decimals = 0) =>
    value.toLocaleString(lang === "ar" ? "ar" : lang === "en" ? "en-GB" : "sv-SE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const nutritionRows: [string, string, boolean][] = nutrition
    ? [
        // Samma ordning som på en näringsdeklaration på förpackningar.
        [n.energy, `${num(nutrition.kcal)} kcal`, false],
        [n.fat, `${num(nutrition.fat)} g`, false],
        [n.carbs, `${num(nutrition.carbs)} g`, false],
        [n.sugar, `${num(nutrition.sugar)} g`, true],
        [n.fiber, `${num(nutrition.fiber)} g`, false],
        [n.protein, `${num(nutrition.protein)} g`, false],
        [n.salt, `${num(nutrition.salt, 1)} g`, false],
      ]
    : [];

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
      {/* Rätten, näringsvärdet och önskemål till vänster, drycken som en lista till höger. På mobil: rätten, drycken, önskemål, näringsvärde. */}
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

        {hasExtras && (
          <section className="section dish-wishes">
            <h2>{k.wishes} <span className="optional">{t.optional}</span></h2>
            <div className="chips">
              {extras.map(({ name }) => {
                const on = order.extras.includes(name);
                return (
                  <button
                    key={name}
                    className={`chip ${on ? "selected" : ""}`}
                    aria-pressed={on}
                    onClick={() => toggleExtra(name)}
                  >
                    {on ? "✓ " : "+ "}{tm.extra(name)}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {nutrition && (
          <section className="section dish-nutrition">
            <h2>{k.nutrition.title}</h2>
            <dl className="nutrition-list">
              {nutritionRows.map(([label, value, sub]) => (
                <div key={label} className={`nutrition-row ${sub ? "is-sub" : ""}`}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="muted nutrition-note">{k.nutrition.note}</p>
          </section>
        )}
      </div>
    </Screen>
  );
}
