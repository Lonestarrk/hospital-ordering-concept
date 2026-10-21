"use client";

import { useT } from "./OrderProvider";
import { consistencyLabels, dietLabels, type Blocker } from "@/lib/data";

/** Skälet till att en rätt inte passar, i klartext på patientens språk. */
export function useBlockerText() {
  const { t, tm } = useT();
  const b = t.menu.blocker;
  return (blocker: Blocker): string => {
    switch (blocker.kind) {
      case "allergen":
        return b.allergen(tm.allergen(blocker.allergen).toLowerCase());
      case "diet":
        return b.diet(tm.diet(blocker.tag, dietLabels[blocker.tag]).toLowerCase());
      case "consistency":
        return b.consistency(tm.consistency(blocker.consistency, consistencyLabels[blocker.consistency]).toLowerCase());
    }
  };
}
