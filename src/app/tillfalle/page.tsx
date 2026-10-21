"use client";

import { useRouter } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { Countdown, useSlotText } from "@/components/Countdown";
import { useNow } from "@/components/useNow";
import { dishes, occasions, SNACK_MINUTES, type OccasionId } from "@/lib/data";
import { hhmm, nextSlot } from "@/lib/clock";
import type { VoiceCommand } from "@/lib/voice";

/** Första steget: välj måltid. Varje kort visar när den serveras och hur länge man kan beställa. */
export default function OccasionPage() {
  const router = useRouter();
  const { patient, startOccasion, placedOrders } = useRequirePatient();
  const { t, tm } = useT();
  const announce = useAnnounce();
  const reference = useNow();
  const { when } = useSlotText();
  if (!patient) return null;
  const o = t.occasionPage;

  const cards = occasions.map((occasion) => {
    const slot = nextSlot(occasion.id, reference);
    const ordered = placedOrders.find((x) => x.occasion === occasion.id && x.date === slot.date && slot.deadline);
    const orderedDish = dishes.find((d) => d.id === ordered?.dishId);
    return { occasion, slot, orderedDish };
  });

  const choose = (id: OccasionId) => {
    const slot = nextSlot(id, reference);
    startOccasion(id, slot.date);
    announce();
    router.push("/meny");
  };

  const commands: VoiceCommand[] = occasions.map((x) => ({ phrases: x.voiceWords, action: () => choose(x.id) }));

  const items = cards
    .map(({ occasion, slot }) => `${t.occasions[occasion.id]}: ${slot.deadline ? when(slot, reference) : t.when.snack(SNACK_MINUTES)}.`)
    .join(" ");

  return (
    <Screen
      step={1}
      speakText={o.speak(patient.firstName, items)}
      commands={commands}
      voiceHint="”lunch” eller ”fika”"
    >
      <div className="page-head">
        <h1>{o.title(patient.firstName)}</h1>
        <p className="lead">{o.lead}</p>
      </div>

      <div className="occasion-grid">
        {cards.map(({ occasion, slot, orderedDish }) => (
          <button key={occasion.id} className={`occasion ${orderedDish ? "is-ordered" : ""}`} onClick={() => choose(occasion.id)}>
            <img className="occasion-image" src={occasion.image} alt="" />
            <div className="occasion-body">
              <h2>
                <span aria-hidden>{occasion.emoji}</span> {t.occasions[occasion.id]}
              </h2>
              <p className="occasion-when">
                {!slot.deadline
                  ? o.snack(SNACK_MINUTES)
                  : slot.day === 0
                    ? o.served(when(slot, reference))
                    : o.closedToday(hhmm(slot.servedAt))}
              </p>
              {slot.deadline && <Countdown slot={slot} />}
              {orderedDish && <p className="occasion-ordered">{o.ordered(tm.dish(orderedDish).name)}</p>}
            </div>
          </button>
        ))}
      </div>
    </Screen>
  );
}
