"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishes, drinks, meal, portions } from "@/lib/data";
import type { VoiceCommand } from "@/lib/voice";

export default function DonePage() {
  const router = useRouter();
  const { patient, order, updateOrder, logout, addServedMeal, hasTaste } = useRequirePatient();
  const { t, tm } = useT();
  const o = t.done;
  if (!patient) return null;

  const dish = dishes.find((d) => d.id === order.dishId);
  const drink = drinks.find((d) => d.id === order.drinkId);
  const portion = portions.find((p) => p.id === order.portion);

  const done = () => {
    logout();
    router.replace("/");
  };
  // Demo: hoppa fram till efter måltiden och ge omdöme på det Ingrid just beställde.
  const simulateServed = () => {
    if (!order.dishId) return;
    const id = `lunch-${Date.now()}`;
    addServedMeal({ id, dishId: order.dishId, label: "Dagens lunch", reasons: [] });
    router.push(`/omdome?id=${id}&sen=klart`);
  };
  const change = () => {
    updateOrder({ placed: false });
    router.push("/sammanfattning");
  };
  const commands: VoiceCommand[] = [
    { phrases: ["ändra*", "ångra"], action: change },
    { phrases: ["smak*", "tycker om", "gillar", "önska*"], action: () => router.push("/min-smak") },
    { phrases: ["klar", "tack", "färdig*", "logga ut", "hej då"], action: done },
  ];

  return (
    <Screen
      step={4}
      speakText={o.speak(
        patient.firstName,
        dish && portion ? t.summary.portionDish(tm.portion(portion.id, portion).name, tm.dish(dish).name) : o.yourFood,
        meal.servedAt,
      )}
      commands={commands}
      voiceHint="”klar” eller ”ändra”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={change}>
            {o.change}
          </button>
          <button className="btn btn-primary btn-large" onClick={done}>{o.finish}</button>
        </>
      }
    >
      <div className="done">
        <div className="done-check" aria-hidden>✓</div>
        <h1>{o.thanks(patient.firstName)}</h1>
        <p className="lead">{o.kitchenGot}</p>

        <div className="card done-card">
          <div className="done-time">
            <span className="done-time-label">{o.arrives}</span>
            <span className="done-time-value">{t.at(meal.servedAt)}</span>
          </div>
          {dish && drink && portion && (
            <div className="done-order">
              <img className="done-image" src={dish.image} alt={tm.dish(dish).imageAlt} />
              <p>
                {t.summary.portionDish(tm.portion(portion.id, portion).name, tm.dish(dish).name)}
                <br />
                {drink.emoji} {tm.drink(drink.id, drink.name)}
              </p>
            </div>
          )}
        </div>

        <p className="muted">{o.canChange(meal.orderBefore)}</p>
        <p className="done-wish">{o.enjoy}</p>
        {!hasTaste && (
          <button className="card taste-invite" onClick={() => router.push("/min-smak")}>
            <span className="taste-invite-icon" aria-hidden>❤️</span>
            <span>
              <strong>{o.tasteTitle}</strong>
              <br />
              {o.tasteBody}
            </span>
            <span aria-hidden>{t.next}</span>
          </button>
        )}
        <button className="demo-link" onClick={simulateServed}>
          {o.demoServed}
        </button>
      </div>
    </Screen>
  );
}
