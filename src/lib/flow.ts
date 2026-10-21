import type { ServedMeal } from "./data";

/** Vart patienten går när hon har bekräftat vem hon är: först ett obesvarat omdöme, sedan menyn. */
export function pathAfterWelcome(meals: ServedMeal[]): string {
  const pending = meals.find((m) => !m.rating && !m.skipped);
  return pending ? `/omdome?id=${pending.id}` : "/meny";
}
