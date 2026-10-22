"use client";

import { useT } from "./OrderProvider";
import { useNow } from "./useNow";
import { dateKey, hhmm, minutesLeft, type Slot } from "@/lib/clock";

/** Texter för när en måltid serveras och hur länge man kan beställa den. */
export function useSlotText() {
  const { t } = useT();
  const relative = (d: Date, reference: Date) => {
    const shift = (days: number) => {
      const x = new Date(reference);
      x.setDate(x.getDate() + days);
      return dateKey(x);
    };
    const day = dateKey(d);
    return day === dateKey(reference)
      ? t.when.today(hhmm(d))
      : day === shift(1)
        ? t.when.tomorrow(hhmm(d))
        : day === shift(-1)
          ? t.when.yesterday(hhmm(d))
          : hhmm(d);
  };
  return {
    /** "idag kl 12:00", "imorgon kl 08:00" eller "igår kl 17:30". */
    at: relative,
    /** "idag kl 12:00" eller "imorgon kl 12:00". */
    when: (slot: Slot, reference: Date) => relative(slot.servedAt, reference),
    /** Nedräkning till låstiden, eller sista tid om det är långt kvar. */
    countdown: (slot: Slot, reference: Date) => {
      const mins = minutesLeft(slot, reference);
      return mins > 6 * 60 ? t.countdown.until(relative(slot.deadline, reference)) : t.countdown.left(Math.floor(mins / 60), mins % 60);
    },
  };
}

/** Nedräkning som uppdateras av sig själv. Blir varnande färg de sista 30 minuterna. */
export function Countdown({ slot }: { slot: Slot }) {
  const reference = useNow();
  const { countdown } = useSlotText();
  const urgent = minutesLeft(slot, reference) <= 30;
  return (
    <p className={`countdown ${urgent ? "urgent" : ""}`} role="timer" aria-live="off">
      {countdown(slot, reference)}
    </p>
  );
}
