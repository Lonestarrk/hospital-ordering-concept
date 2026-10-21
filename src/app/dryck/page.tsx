"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import type { VoiceCommand } from "@/lib/voice";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { drinkSuits, drinks } from "@/lib/data";

export default function DrinkPage() {
  const router = useRouter();
  const { patient, order, updateOrder } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm } = useT();
  if (!patient) return null;

  const suitable = drinks.filter((d) => drinkSuits(d, patient.diet));

  const choose = (id: string) => {
    updateOrder({ drinkId: id });
    announce();
    router.push("/sammanfattning");
  };

  const back = () => router.push(order.dishId ? `/meny/${order.dishId}` : "/meny");
  const commands: VoiceCommand[] = [
    ...suitable.map((d) => ({ phrases: d.voiceWords, action: () => choose(d.id) })),
    { phrases: ["tillbaka", "ångra"], action: back },
  ];

  return (
    <Screen
      step={3}
      speakText={t.drink.speak(t.list(suitable.map((d) => tm.drink(d.id, d.name))))}
      commands={commands}
      voiceHint="”vatten” eller ”kaffe”"
      footer={
        <button className="btn btn-ghost" onClick={back}>
          {t.back}
        </button>
      }
    >
      <div className="page-head">
        <h1>{t.drink.title}</h1>
        <p className="lead">{t.drink.lead}</p>
      </div>
      <div className="drink-grid">
        {suitable.map((drink) => (
          <button
            key={drink.id}
            className={`drink ${order.drinkId === drink.id ? "selected" : ""}`}
            onClick={() => choose(drink.id)}
          >
            <span className="drink-emoji" aria-hidden>{drink.emoji}</span>
            <span>{tm.drink(drink.id, drink.name)}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}
