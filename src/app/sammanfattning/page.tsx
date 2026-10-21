"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import type { VoiceCommand } from "@/lib/voice";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishes, drinks, meal, portions } from "@/lib/data";

export default function SummaryPage() {
  const router = useRouter();
  const { patient, order, updateOrder } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  const u = t.summary;
  if (!patient) return null;

  const dish = dishes.find((d) => d.id === order.dishId);
  const drink = drinks.find((d) => d.id === order.drinkId);
  const portion = portions.find((p) => p.id === order.portion);

  if (!dish || !drink || !portion) {
    return (
      <Screen step={3} speakText={u.missing}>
        <div className="page-head">
          <h1>{u.missing}</h1>
          <button className="btn btn-primary" onClick={() => router.push("/meny")}>{u.chooseFood}</button>
        </div>
      </Screen>
    );
  }

  const place = () => {
    updateOrder({ placed: true });
    announce();
    router.push("/klart");
  };

  const dishName = tm.dish(dish).name;
  const drinkName = tm.drink(drink.id, drink.name);
  const portionName = tm.portion(portion.id, portion).name;
  const extras = order.extras.map(tm.extra);
  const where = `${tm.word(patient.room)}, ${tm.word(patient.bed)}`;

  const commands: VoiceCommand[] = [
    { phrases: ["ändra mat*", "annan mat", "maten", "byt mat*"], action: () => router.push(`/meny/${dish.id}`) },
    { phrases: ["ändra dryck*", "drycken", "annan dryck", "byt dryck*"], action: () => router.push("/dryck") },
    { phrases: ["tillbaka", "ändra"], action: () => router.push("/dryck") },
    { phrases: ["ja", "beställ*", "bekräfta", "skicka", "stämmer", "japp"], action: place },
  ];

  return (
    <Screen
      step={3}
      speakText={u.speak({
        drink: drinkName,
        order: t.and([u.portionDish(portionName, dishName), ...extras, drinkName]),
        time: meal.servedAt,
      })}
      commands={commands}
      voiceHint="”ja”, ”ändra maten” eller ”ändra drycken”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/dryck")}>{t.back}</button>
          <button className="btn btn-primary btn-large" onClick={place}>{u.order}</button>
        </>
      }
    >
      <div className="page-head">
        <h1>{u.title}</h1>
        <p className="lead">{u.lead(tm.word(meal.name), meal.servedAt, where)}</p>
      </div>

      <div className="card summary">
        <div className="summary-row">
          <img className="summary-image" src={dish.image} alt="" />
          <div className="summary-text">
            <span className="summary-key">{u.food}</span>
            <strong>{dishName}</strong>
            <span>{[u.portion(portionName), ...extras].join(" · ")}</span>
          </div>
          <button className="btn btn-small" onClick={() => router.push(`/meny/${dish.id}`)}>{u.change}</button>
        </div>
        <div className="summary-row">
          <div className="summary-image" style={{ background: "#E3EEF5" }} aria-hidden>{drink.emoji}</div>
          <div className="summary-text">
            <span className="summary-key">{u.drink}</span>
            <strong>{drinkName}</strong>
          </div>
          <button className="btn btn-small" onClick={() => router.push("/dryck")}>{u.change}</button>
        </div>
      </div>

      <p className="muted center">{u.allSuits(meal.orderBefore)}</p>
    </Screen>
  );
}
