"use client";

import { useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishSuits, dishes, meal } from "@/lib/data";

export default function MenuPage() {
  const router = useRouter();
  const { patient, order, updateOrder } = useRequirePatient();
  if (!patient) return null;

  const suitable = dishes.filter((d) => dishSuits(d, patient));
  const hiddenCount = dishes.length - suitable.length;

  const choose = (id: string) => {
    updateOrder({ dishId: id });
    router.push(`/meny/${id}`);
  };

  return (
    <Screen
      step={1}
      speakText={`Vad vill du äta till ${meal.name.toLowerCase()}? Du kan välja mellan: ${suitable.map((d) => d.name).join(", ")}. Tryck på den mat du vill ha.`}
      footer={
        <button className="btn btn-ghost" onClick={() => router.push("/valkommen")}>← Tillbaka</button>
      }
    >
      <div className="page-head">
        <p className="eyebrow">{meal.name} · serveras kl {meal.servedAt}</p>
        <h1>Vad vill du äta, {patient.firstName}?</h1>
        <p className="lead">Tryck på maten du vill ha.</p>
      </div>

      <div className="dish-grid">
        {suitable.map((dish) => (
          <button
            key={dish.id}
            className={`dish ${order.dishId === dish.id ? "selected" : ""}`}
            onClick={() => choose(dish.id)}
          >
            <div className="dish-image" style={{ background: dish.color }} aria-hidden>
              <span>{dish.emoji}</span>
            </div>
            <div className="dish-body">
              {dish.label && <span className="dish-label">{dish.label}</span>}
              <h2>{dish.name}</h2>
              <p>{dish.description}</p>
              <span className="dish-ok">✓ Passar dig</span>
            </div>
          </button>
        ))}
      </div>

      {hiddenCount > 0 && (
        <p className="muted center">
          {hiddenCount} rätter visas inte eftersom de inte passar din kost eller allergi.
        </p>
      )}
    </Screen>
  );
}
