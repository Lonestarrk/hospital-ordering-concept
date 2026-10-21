"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishSuits, dishes, extras, portions, type Portion } from "@/lib/data";
import type { VoiceCommand } from "@/lib/voice";

export default function DishPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { patient, order, updateOrder } = useRequirePatient();
  const announce = useAnnounce();
  const dish = dishes.find((d) => d.id === id);
  // Rätter som inte passar patientens kost/allergier går inte att välja, inte ens via direktlänk.
  if (!patient || !dish || !dishSuits(dish, patient)) return null;

  const toggleExtra = (extra: string) => {
    const on = order.extras.includes(extra);
    updateOrder({ extras: on ? order.extras.filter((e) => e !== extra) : [...order.extras, extra] });
    announce(on ? `${extra}, borttaget.` : `${extra}, tillagt.`);
  };

  const choosePortion = (id: Portion) => {
    updateOrder({ portion: id });
    announce(`${portions.find((p) => p.id === id)?.name} portion.`);
  };

  const next = () => {
    announce();
    router.push("/dryck");
  };

  const commands: VoiceCommand[] = [
    ...extras.map((e) => ({ phrases: e.voiceWords, action: () => toggleExtra(e.name) })),
    { phrases: ["liten", "lilla", "lite"], action: () => choosePortion("liten") },
    { phrases: ["lagom", "normal*", "vanlig*", "mellan*"], action: () => choosePortion("lagom") },
    { phrases: ["stor", "stora", "mycket", "hungrig"], action: () => choosePortion("stor") },
    { phrases: ["nästa", "dryck*", "klar", "fortsätt", "gå vidare", "dricka"], action: next },
    { phrases: ["tillbaka", "annan mat", "byt*", "ångra"], action: () => router.push("/meny") },
  ];

  return (
    <Screen
      step={1}
      speakText={`Du har valt ${dish.name}. Hur stor portion vill du ha? Säg liten, lagom eller stor. Du kan också be om att maten skärs i små bitar. Säg nästa när du är klar.`}
      commands={commands}
      voiceHint="”liten”, ”stor” eller ”nästa”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/meny")}>← Välj annan mat</button>
          <button className="btn btn-primary btn-large" onClick={next}>
            Välj dryck →
          </button>
        </>
      }
    >
      <div className="dish-hero">
        <img className="dish-hero-image" src={dish.image} alt={dish.imageAlt} />
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
              onClick={() => choosePortion(p.id)}
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
          {extras.map(({ name }) => {
            const on = order.extras.includes(name);
            return (
              <button
                key={name}
                className={`chip ${on ? "selected" : ""}`}
                aria-pressed={on}
                onClick={() => toggleExtra(name)}
              >
                {on ? "✓ " : "+ "}{name}
              </button>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
