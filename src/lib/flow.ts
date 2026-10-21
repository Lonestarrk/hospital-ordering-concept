import type { ServedMeal } from "./data";

/** Vart patienten går efter introduktionen: först ett obesvarat omdöme, sedan menyn. */
export function pathAfterIntro(meals: ServedMeal[]): string {
  const pending = meals.find((m) => !m.rating && !m.skipped);
  return pending ? `/omdome?id=${pending.id}` : "/meny";
}

/** Vart patienten går när hon har bekräftat vem hon är. Nya användare får introduktionen. */
export function pathAfterWelcome(isOnboarded: boolean, meals: ServedMeal[]): string {
  return isOnboarded ? pathAfterIntro(meals) : "/intro";
}
