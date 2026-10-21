// Tider för måltider: när de serveras, när beställningen låses och hur lång tid som är kvar.
// För demo kan klockan ställas med ?klocka=HH:MM i adressen (sparas för fliken).

import { LOCK_HOURS, SNACK_MINUTES, occasions, type OccasionId } from "./data";

const OFFSET_KEY = "ingrid-clock-offset";

/** Läser ?klocka=HH:MM och sparar skillnaden mot riktig tid. Anropas en gång vid start. */
export function initDemoClock() {
  if (typeof window === "undefined") return;
  try {
    const param = new URLSearchParams(window.location.search).get("klocka");
    if (param === "") {
      sessionStorage.removeItem(OFFSET_KEY);
    } else if (param && /^\d{1,2}:\d{2}$/.test(param)) {
      const [h, m] = param.split(":").map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      sessionStorage.setItem(OFFSET_KEY, String(target.getTime() - Date.now()));
    }
  } catch {
    // Utan lagring används riktig tid.
  }
}

export function demoClockActive(): boolean {
  try {
    return !!Number(sessionStorage.getItem(OFFSET_KEY));
  } catch {
    return false;
  }
}

export function now(): Date {
  let offset = 0;
  try {
    offset = Number(sessionStorage.getItem(OFFSET_KEY)) || 0;
  } catch {
    // Riktig tid.
  }
  return new Date(Date.now() + offset);
}

/** Datum som "ÅÅÅÅ-MM-DD" i lokal tid. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** En beställningsbar tidpunkt för en måltid. */
export type Slot = {
  occasion: OccasionId;
  /** Datum ("ÅÅÅÅ-MM-DD") som måltiden serveras. */
  date: string;
  /** 0 = idag, 1 = imorgon. */
  day: number;
  servedAt: Date;
  /** Sista tid att beställa eller ändra. Saknas för tilltugg. */
  deadline?: Date;
};

function at(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m);
}

/** Tidpunkten för en måltid ett visst datum. */
export function slotFor(occasion: OccasionId, date: string, reference = now()): Slot {
  const o = occasions.find((x) => x.id === occasion)!;
  const day = Math.round((at(date, "12:00").getTime() - at(dateKey(reference), "12:00").getTime()) / 86_400_000);
  if (!o.servedAt) {
    return { occasion, date, day, servedAt: new Date(reference.getTime() + SNACK_MINUTES * 60_000) };
  }
  const servedAt = at(date, o.servedAt);
  return { occasion, date, day, servedAt, deadline: new Date(servedAt.getTime() - LOCK_HOURS * 3_600_000) };
}

/** Nästa tidpunkt som fortfarande går att beställa: idag om låstiden inte har passerat, annars imorgon. */
export function nextSlot(occasion: OccasionId, reference = now()): Slot {
  const today = slotFor(occasion, dateKey(reference), reference);
  if (!today.deadline || reference < today.deadline) return today;
  const tomorrow = new Date(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return slotFor(occasion, dateKey(tomorrow), reference);
}

/** Är beställningen fortfarande öppen? */
export function isOpen(slot: Slot, reference = now()): boolean {
  return !slot.deadline || reference < slot.deadline;
}

/** Minuter kvar till låstiden (avrundat nedåt). */
export function minutesLeft(slot: Slot, reference = now()): number {
  if (!slot.deadline) return Infinity;
  return Math.max(0, Math.floor((slot.deadline.getTime() - reference.getTime()) / 60_000));
}
