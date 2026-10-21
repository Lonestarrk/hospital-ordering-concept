"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import type { VoiceCommand } from "@/lib/voice";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { Countdown, useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import { dishes, drinks, portions } from "@/lib/data";
import { hhmm, isOpen, nextSlot, slotFor } from "@/lib/clock";

export default function SummaryPage() {
  const router = useRouter();
  const { patient, order, updateOrder, placeOrder } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  const reference = useNow();
  const { when } = useSlotText();
  const u = t.summary;
  if (!patient) return null;

  const dish = dishes.find((d) => d.id === order.dishId);
  const drink = drinks.find((d) => d.id === order.drinkId);
  const portion = portions.find((p) => p.id === order.portion);

  if (!dish || !drink || !portion || !order.occasion || !order.date) {
    return (
      <Screen step={4} speakText={u.missing}>
        <div className="page-head">
          <h1>{u.missing}</h1>
          <button className="btn btn-primary" onClick={() => router.push("/tillfalle")}>{u.chooseFood}</button>
        </div>
      </Screen>
    );
  }

  const occasion = order.occasion;
  const slot = slotFor(occasion, order.date, reference);
  // Låstiden kan passera medan hon väljer. Då erbjuds samma beställning till nästa tillfälle.
  const open = isOpen(slot, reference);
  const next = nextSlot(occasion, reference);
  const moveToNext = () => updateOrder({ date: next.date });

  const place = () => {
    if (!open) return;
    placeOrder();
    announce();
    router.push("/klart");
  };

  const dishName = tm.dish(dish).name;
  const noDrink = drink.id === "ingen";
  const drinkName = tm.drink(drink.id, drink.name);
  const portionName = tm.portion(portion.id, portion).name;
  const extras = order.extras.map(tm.extra);
  const where = `${tm.word(patient.room)}, ${tm.word(patient.bed)}`;
  const mealName = t.occasions[occasion];

  const commands: VoiceCommand[] = [
    { phrases: ["ändra mat*", "annan mat", "maten", "byt mat*"], action: () => router.push(`/meny/${dish.id}`) },
    { phrases: ["ändra dryck*", "drycken", "annan dryck", "byt dryck*"], action: () => router.push("/dryck") },
    { phrases: ["imorgon"], action: moveToNext },
    { phrases: ["tillbaka", "ändra"], action: () => router.push("/dryck") },
    { phrases: ["ja", "beställ*", "bekräfta", "skicka", "stämmer", "japp"], action: place },
  ];

  return (
    <Screen
      step={4}
      speakText={
        open
          ? u.speak({ order: t.and([u.portionDish(portionName, dishName), ...extras, ...(noDrink ? [] : [drinkName])]), when: when(slot, reference) })
          : `${u.closedTitle}. ${u.closedBody(when(next, reference))}`
      }
      commands={commands}
      voiceHint="”ja”, ”ändra maten” eller ”ändra drycken”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/dryck")}>{t.back}</button>
          <button className="btn btn-primary btn-large" onClick={place} disabled={!open}>{u.order}</button>
        </>
      }
    >
      <div className="page-head">
        <h1>{u.title}</h1>
        <p className="lead">{u.lead(mealName, when(slot, reference), where)}</p>
        <p className="muted">{u.hint}</p>
        {open && slot.deadline && <Countdown slot={slot} />}
      </div>

      {!open && (
        <div className="card closed-card" role="alert">
          <h2>⏰ {u.closedTitle}</h2>
          <p>{u.closedBody(when(next, reference))}</p>
          <button className="btn btn-primary" onClick={moveToNext}>{u.closedAction}</button>
        </div>
      )}

      {/* Maten och drycken som samma kort som på Dina beställningar: bilden i full höjd till vänster. */}
      <div className="summary">
        <div className="order-row">
          <span className="order-image"><img src={dish.image} alt="" /></span>
          <div className="order-body">
            <span className="summary-key">{u.food}</span>
            <p className="order-dish">{dishName}</p>
            <p className="order-drink">{[u.portion(portionName), ...extras].join(" · ")}</p>
          </div>
          <div className="order-actions">
            <button className="btn btn-ghost order-action" onClick={() => router.push(`/meny/${dish.id}`)}>{u.change}</button>
          </div>
        </div>
        <div className="order-row">
          <span className="order-image summary-drink" aria-hidden>{drink.emoji}</span>
          <div className="order-body">
            <span className="summary-key">{u.drink}</span>
            <p className="order-dish">{drinkName}</p>
          </div>
          <div className="order-actions">
            <button className="btn btn-ghost order-action" onClick={() => router.push("/dryck")}>{u.change}</button>
          </div>
        </div>
      </div>

      <p className="muted center">{slot.deadline ? u.allSuits(hhmm(slot.deadline)) : u.allSuitsSnack}</p>
    </Screen>
  );
}
