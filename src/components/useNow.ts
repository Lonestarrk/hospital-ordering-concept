"use client";

import { useEffect, useState } from "react";
import { now } from "@/lib/clock";

/** Aktuell tid som uppdateras var 15:e sekund – för nedräkningar. */
export function useNow(): Date {
  const [time, setTime] = useState(() => now());
  useEffect(() => {
    const timer = setInterval(() => setTime(now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  return time;
}
