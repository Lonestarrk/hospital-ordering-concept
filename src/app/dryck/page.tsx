"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { drinkSuits, drinks } from "@/lib/data";

export default function DrinkPage() {
  const router = useRouter();
  const { patient, order, updateOrder } = useRequirePatient();
  if (!patient) return null;

  const suitable = drinks.filter((d) => drinkSuits(d, patient.diet));

  const choose = (id: string) => {
    updateOrder({ drinkId: id });
    router.push("/sammanfattning");
  };

  return (
    <Screen
      step={2}
      speakText={`Vad vill du dricka? Du kan välja: ${suitable.map((d) => d.name).join(", ")}.`}
      footer={
        <button className="btn btn-ghost" onClick={() => router.push(order.dishId ? `/meny/${order.dishId}` : "/meny")}>
          ← Tillbaka
        </button>
      }
    >
      <div className="page-head">
        <h1>Vad vill du dricka?</h1>
        <p className="lead">Tryck på en dryck.</p>
      </div>
      <div className="drink-grid">
        {suitable.map((drink) => (
          <button
            key={drink.id}
            className={`drink ${order.drinkId === drink.id ? "selected" : ""}`}
            onClick={() => choose(drink.id)}
          >
            <span className="drink-emoji" aria-hidden>{drink.emoji}</span>
            <span>{drink.name}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}
