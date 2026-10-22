"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishes, drinks, occasions, portions } from "@/lib/data";
import { hhmm, isOpen, minutesLeft, slotFor } from "@/lib/clock";
import { useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import type { VoiceCommand } from "@/lib/voice";

export default function DonePage() {
  const router = useRouter();
  const { patient, order, signOut, addServedMeal, hasTaste, reopenOrder, clearOrder } = useRequirePatient();
  const { t, tm } = useT();
  const reference = useNow();
  const { when } = useSlotText();
  const o = t.done;
  if (!patient) return null;
  const slot = order.occasion && order.date ? slotFor(order.occasion, order.date, reference) : undefined;
  // Ändra går bara fram till låstiden.
  const canChange = !!slot && isOpen(slot, reference) && !!slot.deadline;

  const dish = dishes.find((d) => d.id === order.dishId);
  const drink = drinks.find((d) => d.id === order.drinkId);
  const portion = portions.find((p) => p.id === order.portion);

  // Klar loggar ut helt, som Avbryt – plattan kan gå vidare till nästa patient.
  const done = () => {
    signOut();
    router.replace("/");
  };
  // Demo: hoppa fram till efter måltiden och ge omdöme på det Ingrid just beställde.
  const simulateServed = () => {
    if (!order.dishId) return;
    const id = `maltid-${Date.now()}`;
    const label = occasions.find((x) => x.id === order.occasion)?.name ?? "Lunch";
    addServedMeal({ id, dishId: order.dishId, label, reasons: [] });
    router.push(`/omdome?id=${id}&sen=klart`);
  };
  const change = () => {
    reopenOrder();
    router.push("/sammanfattning");
  };
  const more = () => {
    clearOrder();
    router.push("/tillfalle");
  };
  const commands: VoiceCommand[] = [
    ...(canChange ? [{ phrases: ["ändra*", "ångra"], action: change }] : []),
    { phrases: ["mer", "något mer", "beställ mer", "en till"], action: more },
    { phrases: ["beställningar", "översikt", "visa", "vad har jag beställt"], action: more },
    { phrases: ["smak*", "tycker om", "gillar", "önska*"], action: () => router.push("/min-smak") },
    { phrases: ["klar", "tack", "färdig*", "logga ut", "hej då"], action: done },
  ];

  const what = dish && portion ? t.summary.portionDish(tm.portion(portion.id, portion).name, tm.dish(dish).name) : o.yourFood;
  const whenText = slot ? when(slot, reference) : "";
  const mins = slot ? minutesLeft(slot, reference) : 0;

  return (
    <Screen step={5} speakText={o.speak(patient.firstName, what, whenText)} commands={commands} voiceHint="”klar” eller ”beställ mer”">
      {/* Tack och tid som en splash överst, som tonar ut efter 3 sekunder. Tiden står kvar i kvittot nedanför. */}
      <section className="done-splash" role="status">
        <div className="done-splash-check" aria-hidden>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div>
          <h1>{o.thanks(patient.firstName)}</h1>
          <p>{o.arrivesWhen(whenText)}</p>
        </div>
        {dish && <img className="done-splash-image" src={dish.image} alt={tm.dish(dish).imageAlt} />}
      </section>

      <h2 className="done-what-now">{o.whatNow}</h2>
      <div className="done-choices">
        <button className="done-choice" onClick={more}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="done-choice-title">{o.more}</span>
          <span className="done-choice-body">{o.moreBody}</span>
        </button>
        <button className="done-choice is-primary" onClick={done}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span className="done-choice-title">{o.finishTitle}</span>
          <span className="done-choice-body">{o.finishBody}</span>
        </button>
      </div>

      {/* Till översikten – se allt som är beställt, utan att logga ut. */}
      <button className="done-taste done-overview" onClick={more}>
        <span className="done-taste-icon" aria-hidden>📋</span>
        <span className="done-taste-text">
          <strong>{o.overview}</strong>
          <span>{o.overviewBody}</span>
        </span>
        <span className="done-taste-arrow" aria-hidden>›</span>
      </button>

      {/* Beställningen som samma kort som på Dina beställningar: bilden i full höjd, låstiden längst ner. */}
      <div className="order-row is-next done-order">
        {dish && <span className="order-image"><img src={dish.image} alt="" /></span>}
        <div className="order-body">
          <p className="order-when">
            {order.occasion && <strong>{t.occasions[order.occasion]}</strong>}
            {order.occasion && " · "}
            {t.myOrders.arrives(whenText)}
          </p>
          <p className="order-dish">{what}</p>
          {drink && <p className="order-drink">{tm.drink(drink.id, drink.name)}</p>}
        </div>
        {canChange && slot?.deadline && (
          <div className="order-actions">
            <button className="btn btn-ghost order-action order-change" onClick={change}>
              <span>{t.summary.change}</span>
              <span className="order-change-until">{t.myOrders.changeUntil(hhmm(slot.deadline))}</span>
            </button>
          </div>
        )}
        {canChange && slot?.deadline ? (
          <p className={`order-bar order-lock ${mins <= 30 ? "urgent" : ""}`} role="timer" aria-live="off">
            {t.myOrders.locksIn(Math.floor(mins / 60), mins % 60)}
          </p>
        ) : (
          slot?.deadline && <p className="order-bar order-status">{t.myOrders.locked}</p>
        )}
      </div>

      {!hasTaste && (
        <button className="done-taste done-ask" onClick={() => router.push("/min-smak")}>
          <span className="done-taste-icon" aria-hidden>❤️</span>
          <span className="done-taste-text">
            <strong>{o.tasteTitle}</strong>
            <span>{o.tasteBody}</span>
          </span>
          <span className="done-taste-arrow" aria-hidden>›</span>
        </button>
      )}

      <button className="demo-link" onClick={simulateServed}>
        {o.demoServed}
      </button>
    </Screen>
  );
}
