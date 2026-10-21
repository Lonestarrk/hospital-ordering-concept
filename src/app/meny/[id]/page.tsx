"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { dishBlockers, dishes, extras, portions, type Portion } from "@/lib/data";
import { useBlockerText } from "@/components/useBlockerText";
import type { VoiceCommand } from "@/lib/voice";

export default function DishPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { patient, order, updateOrder } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  const k = t.dish;
  const blockerText = useBlockerText();
  const dish = dishes.find((d) => d.id === id);
  if (!patient || !dish) return null;

  // Rätter som inte passar patientens kost går inte att beställa, inte ens via direktlänk.
  const blockers = dishBlockers(dish, patient);
  if (blockers.length > 0) {
    const m = t.menu;
    return (
      <Screen
        speakText={`${m.blockedTitle}. ${blockers.map(blockerText).join(". ")}. ${m.blockedLead}`}
        footer={<button className="btn btn-primary btn-large" onClick={() => router.push("/meny")}>{m.backToMenu}</button>}
      >
        <div className="dish-hero">
          <img className="dish-hero-image blocked-image" src={dish.image} alt={tm.dish(dish).imageAlt} />
          <div>
            <p className="eyebrow">🚫 {m.notOrderable}</p>
            <h1>{tm.dish(dish).name}</h1>
            <p className="lead">{m.blockedTitle}</p>
            <ul className="blockers">
              {blockers.map((b, i) => <li key={i}>{blockerText(b)}</li>)}
            </ul>
            <p className="muted">{m.blockedLead}</p>
          </div>
        </div>
      </Screen>
    );
  }

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

  // Önskemål som "såsen vid sidan" gäller bara lagad mat.
  const hasExtras = order.occasion === "lunch" || order.occasion === "middag";

  const commands: VoiceCommand[] = [
    ...(hasExtras ? extras : []).map((e) => ({ phrases: e.voiceWords, action: () => toggleExtra(e.name) })),
    { phrases: ["liten", "lilla", "lite"], action: () => choosePortion("liten") },
    { phrases: ["lagom", "normal*", "vanlig*", "mellan*"], action: () => choosePortion("lagom") },
    { phrases: ["stor", "stora", "mycket", "hungrig"], action: () => choosePortion("stor") },
    { phrases: ["nästa", "dryck*", "klar", "fortsätt", "gå vidare", "dricka"], action: next },
    { phrases: ["tillbaka", "annan mat", "byt*", "ångra"], action: () => router.push("/meny") },
  ];

  const text = tm.dish(dish);

  return (
    <Screen
      step={2}
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

      {hasExtras && (
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
      )}
    </Screen>
  );
}
