"use client";

import { useT } from "./OrderProvider";
import { useNow } from "./useNow";
import { SNACK_MINUTES } from "@/lib/data";
import { dateKey, hhmm, minutesLeft, type Slot } from "@/lib/clock";

/** Texter för när en måltid serveras och hur länge man kan beställa den. */
export function useSlotText() {
  const { t } = useT();
  const relative = (d: Date, reference: Date) => {
    const tomorrow = new Date(reference);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateKey(d) === dateKey(reference)
      ? t.when.today(hhmm(d))
      : dateKey(d) === dateKey(tomorrow)
        ? t.when.tomorrow(hhmm(d))
        : hhmm(d);
  };
  return {
    /** "idag kl 12:00", "imorgon kl 08:00" eller "om ca 30 minuter". */
    when: (slot: Slot, reference: Date) => (slot.deadline ? relative(slot.servedAt, reference) : t.when.snack(SNACK_MINUTES)),
    /** Nedräkning till låstiden, eller sista tid om det är långt kvar. */
    countdown: (slot: Slot, reference: Date) => {
      if (!slot.deadline) return t.countdown.anytime;
      const mins = minutesLeft(slot, reference);
      return mins > 6 * 60 ? t.countdown.until(relative(slot.deadline, reference)) : t.countdown.left(Math.floor(mins / 60), mins % 60);
    },
  };
}

/** Nedräkning som uppdateras av sig själv. Blir varnande färg de sista 30 minuterna. */
export function Countdown({ slot }: { slot: Slot }) {
  const reference = useNow();
  const { countdown } = useSlotText();
  const urgent = !!slot.deadline && minutesLeft(slot, reference) <= 30;
  return (
    <p className={`countdown ${urgent ? "urgent" : ""}`} role="timer" aria-live="off">
      {countdown(slot, reference)}
    </p>
  );
}
