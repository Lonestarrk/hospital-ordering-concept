"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishes, drinks, meal, portions } from "@/lib/data";
import type { VoiceCommand } from "@/lib/voice";

export default function DonePage() {
  const router = useRouter();
  const { patient, order, updateOrder, logout, addServedMeal, hasTaste } = useRequirePatient();
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
      speakText={`Tack ${patient.firstName}! Din beställning är skickad till köket. ${dish && portion ? `${portion.name} portion ${dish.name}` : "Din mat"} kommer till ditt rum ungefär klockan ${meal.servedAt}. Smaklig måltid!`}
      commands={commands}
      voiceHint="”klar” eller ”ändra”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={change}>
            Ändra beställningen
          </button>
          <button className="btn btn-primary btn-large" onClick={done}>Klar</button>
        </>
      }
    >
      <div className="done">
        <div className="done-check" aria-hidden>✓</div>
        <h1>Tack {patient.firstName}!</h1>
        <p className="lead">Köket har fått din beställning.</p>

        <div className="card done-card">
          <div className="done-time">
            <span className="done-time-label">Maten kommer till ditt rum ca</span>
            <span className="done-time-value">kl {meal.servedAt}</span>
          </div>
          {dish && drink && portion && (
            <div className="done-order">
              <img className="done-image" src={dish.image} alt={dish.imageAlt} />
              <p>
                {portion.name} portion {dish.name.toLowerCase()}
                <br />
                {drink.emoji} {drink.name}
              </p>
            </div>
          )}
        </div>

        <p className="muted">Du kan ändra dig fram till kl {meal.orderBefore}.</p>
        <p className="done-wish">Smaklig måltid! 🌷</p>
        {!hasTaste && (
          <button className="card taste-invite" onClick={() => router.push("/min-smak")}>
            <span className="taste-invite-icon" aria-hidden>❤️</span>
            <span>
              <strong>Vad tycker du om för mat?</strong>
              <br />
              Hjälp köket att laga mer av det du gillar. Tar en minut.
            </span>
            <span aria-hidden>→</span>
          </button>
        )}
        <button className="demo-link" onClick={simulateServed}>
          Demo: maten har serverats – ge tummen upp eller ner
        </button>
      </div>
    </Screen>
  );
}
