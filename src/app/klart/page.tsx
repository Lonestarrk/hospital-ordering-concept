"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishes, drinks, meal, portions } from "@/lib/data";

export default function DonePage() {
  const router = useRouter();
  const { patient, order, updateOrder, logout } = useRequirePatient();
  if (!patient) return null;

  const dish = dishes.find((d) => d.id === order.dishId);
  const drink = drinks.find((d) => d.id === order.drinkId);
  const portion = portions.find((p) => p.id === order.portion);

  const done = () => {
    logout();
    router.replace("/");
  };

  return (
    <Screen
      step={4}
      speakText={`Tack ${patient.firstName}! Din beställning är skickad till köket. Din mat kommer till ditt rum ungefär klockan ${meal.servedAt}. Smaklig måltid!`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => { updateOrder({ placed: false }); router.push("/sammanfattning"); }}>
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
      </div>
    </Screen>
  );
}
