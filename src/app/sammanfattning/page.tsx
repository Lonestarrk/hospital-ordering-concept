"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishes, drinks, meal, portions } from "@/lib/data";

export default function SummaryPage() {
  const router = useRouter();
  const { patient, order, updateOrder } = useRequirePatient();
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
    router.push("/klart");
  };

  return (
    <Screen
      step={3}
      speakText={`Stämmer det här? ${meal.name} kl ${meal.servedAt}: ${portion.name} portion ${dish.name}${order.extras.length ? `, ${order.extras.join(", ")}` : ""}. Att dricka: ${drink.name}. Tryck på Beställ för att skicka.`}
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
          <div className="summary-image" style={{ background: dish.color }} aria-hidden>{dish.emoji}</div>
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
