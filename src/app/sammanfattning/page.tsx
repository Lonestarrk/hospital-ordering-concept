"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import type { VoiceCommand } from "@/lib/voice";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishes, drinks, meal, portions } from "@/lib/data";

export default function SummaryPage() {
  const router = useRouter();
  const { patient, order, updateOrder } = useRequirePatient();
  const announce = useAnnounce();
  if (!patient) return null;

  const dish = dishes.find((d) => d.id === order.dishId);
  const drink = drinks.find((d) => d.id === order.drinkId);
  const portion = portions.find((p) => p.id === order.portion);

  if (!dish || !drink || !portion) {
    return (
      <Screen step={3} speakText="Något saknas i din beställning. Tryck på Börja om.">
        <div className="page-head">
          <h1>Något saknas</h1>
          <button className="btn btn-primary" onClick={() => router.push("/meny")}>Välj mat</button>
        </div>
      </Screen>
    );
  }

  const place = () => {
    updateOrder({ placed: true });
    announce();
    router.push("/klart");
  };

  const commands: VoiceCommand[] = [
    { phrases: ["ändra mat*", "annan mat", "maten", "byt mat*"], action: () => router.push(`/meny/${dish.id}`) },
    { phrases: ["ändra dryck*", "drycken", "annan dryck", "byt dryck*"], action: () => router.push("/dryck") },
    { phrases: ["tillbaka", "ändra"], action: () => router.push("/dryck") },
    { phrases: ["ja", "beställ*", "bekräfta", "skicka", "stämmer", "japp"], action: place },
  ];

  return (
    <Screen
      step={3}
      speakText={`Du valde ${drink.name} att dricka. Så här ser din beställning ut: ${portion.name} portion ${dish.name}${order.extras.length ? `, ${order.extras.join(", ")}` : ""}, och ${drink.name}. Den kommer kl ${meal.servedAt}. Stämmer det? Säg ja, eller tryck på Beställ.`}
      commands={commands}
      voiceHint="”ja”, ”ändra maten” eller ”ändra drycken”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/dryck")}>← Tillbaka</button>
          <button className="btn btn-primary btn-large" onClick={place}>Beställ ✓</button>
        </>
      }
    >
      <div className="page-head">
        <h1>Stämmer det här?</h1>
        <p className="lead">{meal.name} {meal.day.toLowerCase()} kl {meal.servedAt} till {patient.room}, {patient.bed}.</p>
      </div>

      <div className="card summary">
        <div className="summary-row">
          <img className="summary-image" src={dish.image} alt="" />
          <div className="summary-text">
            <span className="summary-key">Mat</span>
            <strong>{dish.name}</strong>
            <span>{portion.name} portion{order.extras.length > 0 && ` · ${order.extras.join(" · ")}`}</span>
          </div>
          <button className="btn btn-small" onClick={() => router.push(`/meny/${dish.id}`)}>Ändra</button>
        </div>
        <div className="summary-row">
          <div className="summary-image" style={{ background: "#E3EEF5" }} aria-hidden>{drink.emoji}</div>
          <div className="summary-text">
            <span className="summary-key">Dryck</span>
            <strong>{drink.name}</strong>
          </div>
          <button className="btn btn-small" onClick={() => router.push("/dryck")}>Ändra</button>
        </div>
      </div>

      <p className="muted center">✓ Allt passar din kost. Du kan ändra fram till kl {meal.orderBefore}.</p>
    </Screen>
  );
}
