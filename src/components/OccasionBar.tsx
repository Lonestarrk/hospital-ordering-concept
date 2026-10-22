"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOrder, useT } from "./OrderProvider";
import { useAnnounce } from "./Screen";
import { useNow } from "./useNow";
import { occasions, type OccasionId } from "@/lib/data";
import { hhmm, minutesLeft, nextSlot } from "@/lib/clock";

/**
 * Måltiderna som en rad med knappar under sidhuvudet, på varje sida efter inloggningen.
 * Varje knapp visar när måltiden serveras och hur länge man kan beställa den.
 */
export function OccasionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { order, placedOrders, startOccasion } = useOrder();
  const { t } = useT();
  const announce = useAnnounce();
  const reference = useNow();
  const o = t.occasionPage;
  // Den måltid hon håller på att beställa markeras – bara medan hon beställer (meny, dryck, kolla, klart).
  const ordering = /^\/(meny|dryck|sammanfattning|klart)(\/|$)/.test(pathname);
  const current = ordering ? order.occasion : undefined;

  const choose = (id: OccasionId) => {
    startOccasion(id, nextSlot(id, reference).date);
    announce();
    router.push("/meny");
  };

  return (
    <nav className="occasion-bar" aria-label={o.barLabel}>
      {occasions.map((occasion) => {
        const slot = nextSlot(occasion.id, reference);
        const ordered = placedOrders.some((x) => x.occasion === occasion.id && x.date === slot.date);
        const mins = minutesLeft(slot, reference);
        const urgent = slot.day === 0 && mins <= 30;
        const status = ordered
          ? o.barOrdered
          : slot.day > 0
            ? o.barTomorrow(hhmm(slot.servedAt))
            : mins <= 3 * 60
              ? o.barLeft(Math.floor(mins / 60), mins % 60)
              : o.barToday(hhmm(slot.servedAt));
        return (
          <button
            key={occasion.id}
            className={`occasion-tab ${current === occasion.id ? "is-current" : ""} ${ordered ? "is-ordered" : ""} ${urgent ? "is-urgent" : ""}`}
            aria-current={current === occasion.id ? "true" : undefined}
            onClick={() => choose(occasion.id)}
          >
            <span className="occasion-tab-name">
              <span aria-hidden>{occasion.emoji}</span> {t.occasions[occasion.id]}
            </span>
            <span className="occasion-tab-status">{status}</span>
          </button>
        );
      })}
    </nav>
  );
}
