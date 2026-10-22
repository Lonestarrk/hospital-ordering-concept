"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT, type Order } from "@/components/OrderProvider";
import { Countdown, useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import { dishes, drinks, occasions, type OccasionId } from "@/lib/data";
import { hhmm, isOpen, minutesLeft, nextSlot, slotFor } from "@/lib/clock";
import type { VoiceCommand } from "@/lib/voice";

/**
 * Första sidan efter inloggningen: hennes beställningar (nästa överst, passerade gråade)
 * och måltiderna hon kan beställa. Varje kort visar när den serveras och hur länge man kan beställa.
 */
export default function OccasionPage() {
  const router = useRouter();
  const { patient, startOccasion, placedOrders, meals, cancelOrder, restoreOrder, hasTaste, addServedMeal, order: current } =
    useRequirePatient();
  const { t, tm } = useT();
  const announce = useAnnounce();
  const reference = useNow();
  const { when, at } = useSlotText();
  // Den senast avbeställda – så att den går att ångra.
  const [cancelled, setCancelled] = useState<Order | null>(null);
  // Nyss lagd beställning (?ny=lunch-2026-10-22): den glider in och markeras, och en bekräftelse visas.
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("ny");
    if (!key) return;
    setFresh(key);
    // Adressen rensas, så att en omladdning inte visar bekräftelsen igen.
    window.history.replaceState(null, "", "/tillfalle");
    const timer = setTimeout(() => document.querySelector(".order-row.is-new")?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 400);
    return () => clearTimeout(timer);
  }, []);
  if (!patient) return null;
  const o = t.occasionPage;
  const m = t.myOrders;

  const cards = occasions.map((occasion) => ({ occasion, slot: nextSlot(occasion.id, reference) }));

  const choose = (id: OccasionId) => {
    const slot = nextSlot(id, reference);
    startOccasion(id, slot.date);
    announce();
    router.push("/meny");
  };

  // Beställningarna i tidsordning: kommande först (nästa överst), sedan de som har passerat.
  const servedAt = (order: Order) => slotFor(order.occasion!, order.date!, reference).servedAt;
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
  const mealName = (order: Order) => t.occasions[order.occasion!];
  const dishName = (order: Order) => tm.dish(dishes.find((d) => d.id === order.dishId)!).name;
  // Avbeställning sker direkt och kan ångras – ingen fråga "Är du säker?".
  const cancel = (order: Order) => {
    cancelOrder(order);
    setCancelled(order);
    announce(m.cancelled(mealName(order), dishName(order)));
  };
  const undoCancel = () => {
    if (!cancelled) return;
    restoreOrder(cancelled);
    announce(m.restored(mealName(cancelled)));
    setCancelled(null);
  };
  // Måltider går att avbeställa fram till låstiden.
  const cancellable = (r: { past: boolean; slot: ReturnType<typeof slotFor> }) => !r.past && isOpen(r.slot, reference);

  const upcoming = rows.filter((r) => !r.past).sort((a, b) => a.time.getTime() - b.time.getTime());
  const past = rows.filter((r) => r.past).sort((a, b) => b.time.getTime() - a.time.getTime());
  // Skuggor: kommande måltider som inte är beställda än, insorterade i tidsordning.
  const ghosts = cards
    .filter(({ occasion, slot }) => !placedOrders.some((x) => x.occasion === occasion.id && x.date === slot.date))
    .map(({ occasion, slot }) => ({ ghost: true as const, occasion, slot, time: slot.servedAt }));
  const nextKey = upcoming[0] && `${upcoming[0].order.occasion}-${upcoming[0].order.date}`;
  const timeline = [
    ...[...upcoming.map((r) => ({ ghost: false as const, ...r })), ...ghosts].sort((a, b) => a.time.getTime() - b.time.getTime()),
    ...past.map((r) => ({ ghost: false as const, ...r })),
  ];

  const commands: VoiceCommand[] = [
    ...(cancelled ? [{ phrases: ["ångra", "ångra det"], action: undoCancel }] : []),
    ...upcoming
      .filter(cancellable)
      .map((r) => ({ phrases: [`avbeställ ${mealName(r.order).toLowerCase()}*`], action: () => cancel(r.order) })),
    ...occasions.map((x) => ({ phrases: x.voiceWords, action: () => choose(x.id) })),
  ];

  const items = cards
    .map(({ occasion, slot }) => `${t.occasions[occasion.id]}: ${when(slot, reference)}.`)
    .join(" ");
  const ordersText = upcoming.length
    ? m.speak(upcoming.map((r) => `${t.occasions[r.order.occasion!]} ${at(r.time, reference)}, ${tm.dish(r.dish).name}.`).join(" "))
    : m.speakNone;
  const freshRow = fresh ? upcoming.find((r) => `${r.order.occasion}-${r.order.date}` === fresh) : undefined;
  // Demo: hoppa fram till efter måltiden och ge omdöme på det hon just beställde.
  const simulateServed = () => {
    if (!current.placed || !current.dishId) return;
    const id = `maltid-${Date.now()}`;
    const label = occasions.find((x) => x.id === current.occasion)?.name ?? "Lunch";
    addServedMeal({ id, dishId: current.dishId, label, reasons: [] });
    router.push(`/omdome?id=${id}`);
  };
  const ghostText = ghosts.length ? ` ${m.notOrderedSpeak(t.and(ghosts.map((g) => t.occasions[g.occasion.id].toLowerCase())))}` : "";

  return (
    <Screen
      speakText={
        freshRow
          ? t.done.speak(patient.firstName, tm.dish(freshRow.dish).name, at(freshRow.time, reference))
          : `${ordersText}${ghostText} ${o.speak(patient.firstName, items)}`
      }
      commands={commands}
      voiceHint="”lunch”, ”middag” eller ”avbeställ lunch”"
    >

      <section className="section my-orders" aria-labelledby="my-orders-title">
        <h1 id="my-orders-title" className="my-orders-title">{m.title}</h1>
        {freshRow && (
          <div className="order-placed" role="status">
            <span className="order-placed-check" aria-hidden>✓</span>
            <p>{t.done.ordered(t.occasions[freshRow.order.occasion!], at(freshRow.time, reference))}</p>
          </div>
        )}
        {cancelled && (
          <div className="notice order-cancelled" role="status">
            <p>
              ✓ {m.cancelled(mealName(cancelled), dishName(cancelled))} {m.cancelledNote}
            </p>
            <button className="btn btn-small btn-ghost" onClick={undoCancel}>↩ {m.undo}</button>
          </div>
        )}
        {rows.length === 0 && !cancelled && <p className="muted">{m.none}</p>}
        {timeline.length > 0 && (
          <ol className="order-list">
            {timeline.map((entry) => {
              if (entry.ghost) {
                const { occasion, slot } = entry;
                return (
                  <li key={`ghost-${occasion.id}-${slot.date}`} className="order-row is-ghost">
                    <span className="order-image order-ghost-icon" aria-hidden>{occasion.emoji}</span>
                    <div className="order-body">
                      <p className="order-when">
                        <strong>{t.occasions[occasion.id]}</strong> · {at(slot.servedAt, reference)}
                      </p>
                      <p className="order-dish order-ghost-text">{m.notOrdered}</p>
                    </div>
                    <div className="order-actions">
                      <button className="btn btn-ghost order-action order-ghost-action" onClick={() => choose(occasion.id)}>
                        {m.order}
                      </button>
                    </div>
                    <div className="order-bar">
                      <Countdown slot={slot} />
                    </div>
                  </li>
                );
              }
              const { order, slot, time, past, dish, meal } = entry;
              const open = !past && isOpen(slot, reference);
              const canCancel = cancellable({ past, slot });
              const isNext = `${order.occasion}-${order.date}` === nextKey;
              return (
                <li
                  key={`${order.occasion}-${order.date}`}
                  className={`order-row ${past ? "is-past" : ""} ${isNext ? "is-next" : ""} ${fresh === `${order.occasion}-${order.date}` ? "is-new" : ""}`}
                >
                  <span className="order-image"><img src={dish.image} alt="" /></span>
                  <div className="order-body">
                    <p className="order-when">
                      {fresh === `${order.occasion}-${order.date}` && <span className="badge badge-new">{m.isNew}</span>}
                      {isNext && <span className="badge badge-next">{m.next}</span>}
                      <strong>{t.occasions[order.occasion!]}</strong> · {past ? m.was(at(time, reference)) : m.arrives(at(time, reference))}
                    </p>
                    <p className="order-dish">{tm.dish(dish).name}</p>
                    {/* Drycken under rätten, som på Kolla. */}
                    {(() => {
                      const drink = drinks.find((d) => d.id === order.drinkId);
                      return drink && <p className="order-drink">{tm.drink(drink.id, drink.name)}</p>;
                    })()}
                  </div>
                  {(open || canCancel) && (
                    <div className="order-actions">
                      {open && (
                        <button className="btn btn-ghost order-action order-change" onClick={() => choose(order.occasion!)}>
                          <span>{t.summary.change}</span>
                          <span className="order-change-until">{m.changeUntil(hhmm(slot.deadline))}</span>
                        </button>
                      )}
                      {canCancel && (
                        <button
                          className="btn btn-ghost order-action order-cancel"
                          onClick={() => cancel(order)}
                          aria-label={m.cancelAria(t.occasions[order.occasion!], tm.dish(dish).name)}
                        >
                          ✕ {m.cancel}
                        </button>
                      )}
                    </div>
                  )}
                  {past && meal && !meal.rating && (
                    <button className="btn btn-primary order-action" onClick={() => router.push(`/omdome?id=${meal.id}`)}>
                      👍 👎 {m.rate}
                    </button>
                  )}
                  {past && meal?.rating && (
                    <span className="order-rated">{meal.rating === "upp" ? "👍" : "👎"} {m.rated}</span>
                  )}
                  {/* Låstiden som en list längs kortets underkant, till höger om bilden. */}
                  {!past && !open && <p className="order-bar order-status">{m.locked}</p>}
                  {open && (() => {
                    const mins = minutesLeft(slot, reference);
                    return (
                      <p className={`order-bar order-lock ${mins <= 30 ? "urgent" : ""}`} role="timer" aria-live="off">
                        {m.locksIn(Math.floor(mins / 60), mins % 60)}
                      </p>
                    );
                  })()}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="lead occasion-hint">{o.lead}</p>

      {/* Vad hon tycker om för mat – syns tills hon har svarat. */}
      {!hasTaste && (
        <button className="done-taste done-ask" onClick={() => router.push("/min-smak")}>
          <span className="done-taste-icon" aria-hidden>❤️</span>
          <span className="done-taste-text">
            <strong>{t.done.tasteTitle}</strong>
            <span>{t.done.tasteBody}</span>
          </span>
          <span className="done-taste-arrow" aria-hidden>›</span>
        </button>
      )}

      {current.placed && current.dishId && (
        <button className="demo-link" onClick={simulateServed}>
          {t.done.demoServed}
        </button>
      )}
    </Screen>
  );
}
