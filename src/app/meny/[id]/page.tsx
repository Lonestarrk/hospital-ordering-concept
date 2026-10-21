"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishSuits, dishes, extras, portions, type Portion } from "@/lib/data";
import type { VoiceCommand } from "@/lib/voice";

export default function DishPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { patient, order, updateOrder } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  const k = t.dish;
  const dish = dishes.find((d) => d.id === id);
  // Rätter som inte passar patientens kost/allergier går inte att välja, inte ens via direktlänk.
  if (!patient || !dish || !dishSuits(dish, patient)) return null;

  const toggleExtra = (extra: string) => {
    const on = order.extras.includes(extra);
    updateOrder({ extras: on ? order.extras.filter((e) => e !== extra) : [...order.extras, extra] });
    announce(on ? k.removed(tm.extra(extra)) : k.added(tm.extra(extra)));
  };

  const choosePortion = (id: Portion) => {
    updateOrder({ portion: id });
    const p = portions.find((x) => x.id === id)!;
    announce(k.portion(tm.portion(p.id, p).name));
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

  const text = tm.dish(dish);

  return (
    <Screen
      step={1}
      speakText={k.speak(text.name)}
      commands={commands}
      voiceHint="”liten”, ”stor” eller ”nästa”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push("/meny")}>{k.other}</button>
          <button className="btn btn-primary btn-large" onClick={next}>
            {k.next}
          </button>
        </>
      }
    >
      <div className="dish-hero">
        <img className="dish-hero-image" src={dish.image} alt={text.imageAlt} />
        <div>
          <p className="eyebrow">{k.youChose}</p>
          <h1>{text.name}</h1>
          <p className="lead">{text.description}</p>
          <p className="allergens">
            {dish.allergens.length > 0
              ? <>{k.contains} <strong>{t.list(dish.allergens.map(tm.allergen))}</strong></>
              : k.noAllergens}
          </p>
        </div>
      </div>

      <section className="section">
        <h2>{k.hungry}</h2>
        <div className="segmented" role="radiogroup" aria-label={k.hungry}>
          {portions.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={order.portion === p.id}
              className={`segment ${order.portion === p.id ? "selected" : ""}`}
              onClick={() => choosePortion(p.id)}
            >
              <span className={`portion-dot portion-${p.id}`} aria-hidden />
              <strong>{tm.portion(p.id, p).name}</strong>
              <span>{tm.portion(p.id, p).hint}</span>
            </button>
          ))}
        </div>
        <p className="muted">{k.more}</p>
      </section>

      <section className="section">
        <h2>{k.wishes} <span className="optional">{t.optional}</span></h2>
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
                {on ? "✓ " : "+ "}{tm.extra(name)}
              </button>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
