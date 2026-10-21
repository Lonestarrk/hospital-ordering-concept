"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishSuits, dishes, extras, portions } from "@/lib/data";

export default function DishPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { patient, order, updateOrder } = useRequirePatient();
  const dish = dishes.find((d) => d.id === id);
  // Rätter som inte passar patientens kost/allergier går inte att välja, inte ens via direktlänk.
  if (!patient || !dish || !dishSuits(dish, patient)) return null;

  const toggleExtra = (extra: string) =>
    updateOrder({
      extras: order.extras.includes(extra)
        ? order.extras.filter((e) => e !== extra)
        : [...order.extras, extra],
    });

  return (
    <Screen
      step={1}
      speakText={`Du har valt ${dish.name}. Hur stor portion vill du ha? Liten, lagom eller stor. Du kan också välja önskemål, till exempel att maten skärs i små bitar. Tryck sedan på Välj dryck.`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/meny")}>← Välj annan mat</button>
          <button className="btn btn-primary btn-large" onClick={() => router.push("/dryck")}>
            Välj dryck →
          </button>
        </>
      }
    >
      <div className="dish-hero">
        <div className="dish-hero-image" style={{ background: dish.color }} aria-hidden>
          <span>{dish.emoji}</span>
        </div>
        <div>
          <p className="eyebrow">Du har valt</p>
          <h1>{dish.name}</h1>
          <p className="lead">{dish.description}</p>
          <p className="allergens">
            {dish.allergens.length > 0
              ? <>Innehåller: <strong>{dish.allergens.join(", ")}</strong></>
              : "Innehåller inga av de vanliga allergenerna"}
          </p>
        </div>
      </div>

      <section className="section">
        <h2>Hur hungrig är du?</h2>
        <div className="segmented" role="radiogroup" aria-label="Portionsstorlek">
          {portions.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={order.portion === p.id}
              className={`segment ${order.portion === p.id ? "selected" : ""}`}
              onClick={() => updateOrder({ portion: p.id })}
            >
              <span className={`portion-dot portion-${p.id}`} aria-hidden />
              <strong>{p.name}</strong>
              <span>{p.hint}</span>
            </button>
          ))}
        </div>
        <p className="muted">Du kan alltid be om mer om du blir hungrig.</p>
      </section>

      <section className="section">
        <h2>Något vi ska tänka på? <span className="optional">(om du vill)</span></h2>
        <div className="chips">
          {extras.map((extra) => {
            const on = order.extras.includes(extra);
            return (
              <button
                key={extra}
                className={`chip ${on ? "selected" : ""}`}
                aria-pressed={on}
                onClick={() => toggleExtra(extra)}
              >
                {on ? "✓ " : "+ "}{extra}
              </button>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
