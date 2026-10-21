"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT, type Order } from "@/components/OrderProvider";
import { Countdown, useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import { dishes, occasions, SNACK_MINUTES, type OccasionId } from "@/lib/data";
import { hhmm, isOpen, nextSlot, slotFor } from "@/lib/clock";
import type { VoiceCommand } from "@/lib/voice";

/**
 * Första sidan efter inloggningen: hennes beställningar (nästa överst, passerade gråade)
 * och måltiderna hon kan beställa. Varje kort visar när den serveras och hur länge man kan beställa.
 */
export default function OccasionPage() {
  const router = useRouter();
  const { patient, startOccasion, placedOrders, meals } = useRequirePatient();
  const { t, tm } = useT();
  const announce = useAnnounce();
  const reference = useNow();
  const { when, at } = useSlotText();
  if (!patient) return null;
  const o = t.occasionPage;
  const m = t.myOrders;

  const cards = occasions.map((occasion) => {
    const slot = nextSlot(occasion.id, reference);
    const ordered = placedOrders.find((x) => x.occasion === occasion.id && x.date === slot.date && slot.deadline);
    const orderedDish = dishes.find((d) => d.id === ordered?.dishId);
    return { occasion, slot, orderedDish };
  });

  const choose = (id: OccasionId) => {
    const slot = nextSlot(id, reference);
    startOccasion(id, slot.date);
    announce();
    router.push("/meny");
  };

  // Beställningarna i tidsordning: kommande först (nästa överst), sedan de som har passerat.
  const servedAt = (order: Order) => {
    const slot = slotFor(order.occasion!, order.date!, reference);
    return slot.deadline ? slot.servedAt : new Date((order.placedAt ?? reference.getTime()) + SNACK_MINUTES * 60_000);
  };
  const rows = placedOrders
    .filter((x) => x.occasion && x.date && x.dishId)
    .map((order) => {
      const slot = slotFor(order.occasion!, order.date!, reference);
      const time = servedAt(order);
      return {
        order,
        slot,
        time,
        past: time <= reference,
        dish: dishes.find((d) => d.id === order.dishId)!,
        meal: meals.find((x) => x.id === order.mealId),
      };
    });
  const upcoming = rows.filter((r) => !r.past).sort((a, b) => a.time.getTime() - b.time.getTime());
  const past = rows.filter((r) => r.past).sort((a, b) => b.time.getTime() - a.time.getTime());

  const commands: VoiceCommand[] = occasions.map((x) => ({ phrases: x.voiceWords, action: () => choose(x.id) }));

  const items = cards
    .map(({ occasion, slot }) => `${t.occasions[occasion.id]}: ${slot.deadline ? when(slot, reference) : t.when.snack(SNACK_MINUTES)}.`)
    .join(" ");
  const ordersText = upcoming.length
    ? m.speak(upcoming.map((r) => `${t.occasions[r.order.occasion!]} ${at(r.time, reference)}, ${tm.dish(r.dish).name}.`).join(" "))
    : m.speakNone;

  return (
    <Screen
      step={1}
      speakText={`${m.hello(patient.firstName)} ${ordersText} ${o.speak(patient.firstName, items)}`}
      commands={commands}
      voiceHint="”lunch” eller ”fika”"
      heading={<h1>{m.hello(patient.firstName)}</h1>}
    >

      <section className="section my-orders" aria-labelledby="my-orders-title">
        <h2 id="my-orders-title">{m.title}</h2>
        {rows.length === 0 ? (
          <p className="muted">{m.none}</p>
        ) : (
          <ol className="order-list">
            {[...upcoming, ...past].map(({ order, slot, time, past, dish, meal }, i) => {
              const open = !past && isOpen(slot, reference) && !!slot.deadline;
              const isNext = !past && i === 0;
              return (
                <li key={`${order.occasion}-${order.date}`} className={`order-row ${past ? "is-past" : ""} ${isNext ? "is-next" : ""}`}>
                  <img className="order-image" src={dish.image} alt="" />
                  <div className="order-body">
                    <p className="order-when">
                      {isNext && <span className="badge badge-next">{m.next}</span>}
                      <strong>{t.occasions[order.occasion!]}</strong> · {past ? m.was(at(time, reference)) : m.arrives(at(time, reference))}
                    </p>
                    <p className="order-dish">{tm.dish(dish).name}</p>
                    {!past && slot.deadline && (
                      <p className="order-status">{open ? m.canChange(hhmm(slot.deadline)) : m.locked}</p>
                    )}
                  </div>
                  {open && (
                    <button className="btn btn-ghost order-action" onClick={() => choose(order.occasion!)}>
                      {t.done.change}
                    </button>
                  )}
                  {past && meal && !meal.rating && !meal.skipped && (
                    <button className="btn btn-primary order-action" onClick={() => router.push(`/omdome?id=${meal.id}`)}>
                      👍 👎 {m.rate}
                    </button>
                  )}
                  {past && meal?.rating && (
                    <span className="order-rated">{meal.rating === "upp" ? "👍" : "👎"} {m.rated}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="section" aria-labelledby="order-more-title">
        <h2 id="order-more-title">{o.title(patient.firstName)}</h2>
        <p className="lead">{o.lead}</p>
        <div className="occasion-grid">
          {cards.map(({ occasion, slot, orderedDish }) => (
            <button key={occasion.id} className={`occasion ${orderedDish ? "is-ordered" : ""}`} onClick={() => choose(occasion.id)}>
              <img className="occasion-image" src={occasion.image} alt="" />
              <div className="occasion-body">
                <h3>
                  <span aria-hidden>{occasion.emoji}</span> {t.occasions[occasion.id]}
                </h3>
                <p className="occasion-when">
                  {!slot.deadline
                    ? o.snack(SNACK_MINUTES)
                    : slot.day === 0
                      ? o.served(when(slot, reference))
                      : o.closedToday(hhmm(slot.servedAt))}
                </p>
                {slot.deadline && <Countdown slot={slot} />}
                {orderedDish && <p className="occasion-ordered">{o.ordered(tm.dish(orderedDish).name)}</p>}
              </div>
            </button>
          ))}
        </div>
      </section>
    </Screen>
  );
}
