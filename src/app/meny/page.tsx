"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
import { dishSuits, dishes, meal } from "@/lib/data";
import { speak, type VoiceCommand } from "@/lib/voice";

const ORDINALS = [
  ["första", "ettan", "nummer ett"],
  ["andra", "tvåan", "nummer två"],
  ["tredje", "trean", "nummer tre"],
  ["fjärde", "fyran", "nummer fyra"],
];

export default function MenuPage() {
  const router = useRouter();
  const { patient, order, updateOrder, meals } = useRequirePatient();
  const announce = useAnnounce();
  if (!patient) return null;

  const suitable = dishes.filter((d) => dishSuits(d, patient));
  const hiddenCount = dishes.length - suitable.length;

  const hidden = dishes.filter((d) => !suitable.includes(d));
  // Senaste omdömet per rätt, så att menyn kommer ihåg vad Ingrid tycker om.
  const lastRating = (dishId: string) => meals.find((m) => m.dishId === dishId && m.rating)?.rating;

  const choose = (id: string) => {
    updateOrder({ dishId: id });
    announce();
    router.push(`/meny/${id}`);
  };

  const commands: VoiceCommand[] = [
    ...suitable.map((d) => ({ phrases: d.voiceWords, action: () => choose(d.id) })),
    ...suitable.map((d, i) => ({ phrases: ORDINALS[i] ?? [], action: () => choose(d.id) })),
    // Säger Ingrid en rätt som inte passar henne förklarar vi varför den inte finns.
    ...hidden.map((d) => ({
      phrases: d.voiceWords,
      action: () => speak(`${d.name} passar tyvärr inte din kost idag. Du kan välja ${suitable.map((s) => s.name).join(", eller ")}.`),
    })),
    { phrases: ["tillbaka"], action: () => router.push("/valkommen") },
  ];

  return (
    <Screen
      step={1}
      speakText={`Vad vill du äta till ${meal.name.toLowerCase()}? ${suitable.map((d, i) => `${ORDINALS[i]?.[0] ?? ""}: ${d.name}. ${d.description}`).join(" ")} Tryck på maten, eller tryck på mikrofonen och säg vad du vill ha.`}
      commands={commands}
      voiceHint={suitable.slice(0, 2).map((d) => `”${d.voiceWords[0].replace("*", "")}”`).join(" eller ")}
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
            <img className="dish-image" src={dish.image} alt={dish.imageAlt} />
            <div className="dish-body">
              <div className="dish-badges">
                {dish.label && <span className="dish-label">{dish.label}</span>}
                {lastRating(dish.id) === "upp" && <span className="dish-label dish-liked">👍 Du gillade den</span>}
                {lastRating(dish.id) === "ner" && <span className="dish-label dish-disliked">👎 Inte din favorit</span>}
              </div>
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
