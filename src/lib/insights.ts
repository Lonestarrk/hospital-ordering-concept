// Sammanställning för köket. Syntetiska svar från andra patienter på avdelningen läggs
// ihop med svaren som lämnats i den här prototypen. Allt är anonymt: köket ser bara
// summor, och en rätt visas först när den har minst MIN_GROUP svar.

import {
  dishes,
  foodCategories,
  reasonsDown,
  wishDishes,
  type Eaten,
  type ServedMeal,
  type TasteProfile,
} from "./data";

export const MIN_GROUP = 5;

type DishStat = {
  served: number;
  up: number;
  down: number;
  eaten: Record<Eaten, number>;
  reasons: Record<string, number>;
};

// Syntetiska svar från 46 patienter på avdelning 12 de senaste fyra veckorna.
const syntheticDishStats: Record<string, DishStat> = {
  kalvspett: { served: 42, up: 33, down: 6, eaten: { allt: 26, halften: 10, lite: 4, inget: 2 }, reasons: { "Som hemma": 14, "God smak": 12, "För torr": 3 } },
  lax: { served: 38, up: 31, down: 4, eaten: { allt: 25, halften: 8, lite: 4, inget: 1 }, reasons: { "God smak": 15, "Lagom portion": 6, "För torr": 3 } },
  kycklinggryta: { served: 35, up: 17, down: 14, eaten: { allt: 12, halften: 11, lite: 8, inget: 4 }, reasons: { "Smakade inte": 6, "För salt": 5, "God smak": 7 } },
  soppa: { served: 40, up: 22, down: 12, eaten: { allt: 20, halften: 12, lite: 6, inget: 2 }, reasons: { "För kall": 9, "Varm och fin": 4, "Lagom portion": 8 } },
  pannkakor: { served: 30, up: 26, down: 2, eaten: { allt: 24, halften: 4, lite: 2, inget: 0 }, reasons: { "Som hemma": 11, "God smak": 10 } },
  fiskgratang: { served: 28, up: 12, down: 13, eaten: { allt: 9, halften: 8, lite: 7, inget: 4 }, reasons: { "Smakade inte": 7, "För torr": 4, "Svårt att tugga": 3 } },
};

const syntheticCategoryVotes: Record<string, { likes: number; dislikes: number }> = {
  husmanskost: { likes: 34, dislikes: 2 },
  fisk: { likes: 21, dislikes: 9 },
  kyckling: { likes: 18, dislikes: 5 },
  kott: { likes: 22, dislikes: 6 },
  vegetariskt: { likes: 9, dislikes: 12 },
  soppor: { likes: 19, dislikes: 7 },
  kryddigt: { likes: 4, dislikes: 27 },
  pasta: { likes: 15, dislikes: 4 },
  sott: { likes: 30, dislikes: 3 },
};

const syntheticWishes: Record<string, number> = {
  kottbullar: 18, pannbiff: 11, pytt: 10, kaldolmar: 9, artsoppa: 8, raggmunk: 7,
  kalops: 6, makaroner: 5, fiskbullar: 4, ugnspannkaka: 4, laxpudding: 3, kroppkakor: 2,
};

const SYNTHETIC_RESPONDENTS = 46;

export type DishInsight = {
  id: string;
  name: string;
  image: string;
  served: number;
  upShare: number;
  ateMostShare: number;
  topReason?: { name: string; count: number };
};

export type Suggestion = {
  kind: "behall" | "se-over" | "lagg-till" | "atgarda" | "mer-av";
  title: string;
  detail: string;
};

export type Insights = {
  respondents: number;
  ratings: number;
  upShare: number;
  ateMostShare: number;
  dishes: DishInsight[];
  categories: { id: string; name: string; emoji: string; likes: number; dislikes: number }[];
  wishes: { id: string; name: string; emoji: string; votes: number; onMenu: boolean }[];
  suggestions: Suggestion[];
};

const pct = (n: number) => `${Math.round(n * 100)} %`;

export function buildInsights(
  history: Record<string, ServedMeal[]>,
  tastes: Record<string, TasteProfile>,
): Insights {
  // Lägg ihop syntetiska svar med svaren från prototypen.
  const stats: Record<string, DishStat> = JSON.parse(JSON.stringify(syntheticDishStats));
  for (const meals of Object.values(history)) {
    for (const m of meals) {
      if (!m.rating) continue;
      const s = (stats[m.dishId] ??= { served: 0, up: 0, down: 0, eaten: { allt: 0, halften: 0, lite: 0, inget: 0 }, reasons: {} });
      s.served += 1;
      s[m.rating === "upp" ? "up" : "down"] += 1;
      if (m.eaten) s.eaten[m.eaten] += 1;
      for (const r of m.reasons) s.reasons[r] = (s.reasons[r] ?? 0) + 1;
    }
  }

  const categoryVotes: Record<string, { likes: number; dislikes: number }> = JSON.parse(JSON.stringify(syntheticCategoryVotes));
  const wishes: Record<string, number> = { ...syntheticWishes };
  for (const t of Object.values(tastes)) {
    t.likes.forEach((c) => (categoryVotes[c].likes += 1));
    t.dislikes.forEach((c) => (categoryVotes[c].dislikes += 1));
    t.favorites.forEach((w) => (wishes[w] = (wishes[w] ?? 0) + 1));
  }

  const dishInsights: DishInsight[] = dishes
    .filter((d) => (stats[d.id]?.served ?? 0) >= MIN_GROUP)
    .map((d) => {
      const s = stats[d.id];
      const rated = s.up + s.down;
      const eatenTotal = Object.values(s.eaten).reduce((a, b) => a + b, 0);
      const [topName, topCount] = Object.entries(s.reasons).sort((a, b) => b[1] - a[1])[0] ?? [];
      return {
        id: d.id,
        name: d.name,
        image: d.image,
        served: s.served,
        upShare: rated ? s.up / rated : 0,
        ateMostShare: eatenTotal ? (s.eaten.allt + s.eaten.halften) / eatenTotal : 0,
        topReason: topName ? { name: topName, count: topCount } : undefined,
      };
    })
    .sort((a, b) => b.upShare - a.upShare);

  const allStats = Object.values(stats);
  const up = allStats.reduce((a, s) => a + s.up, 0);
  const down = allStats.reduce((a, s) => a + s.down, 0);
  const eatenAll = allStats.reduce((a, s) => a + s.eaten.allt + s.eaten.halften, 0);
  const eatenTotal = allStats.reduce((a, s) => a + Object.values(s.eaten).reduce((x, y) => x + y, 0), 0);

  const categories = foodCategories
    .map((c) => ({ ...c, ...categoryVotes[c.id] }))
    .sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes));

  const wishList = wishDishes
    .map((w) => ({ id: w.id, name: w.name, emoji: w.emoji, votes: wishes[w.id] ?? 0, onMenu: dishes.some((d) => d.id === w.id) }))
    .filter((w) => w.votes > 0)
    .sort((a, b) => b.votes - a.votes);

  // Enkla, förklarbara regler – förslag, inte beslut.
  const suggestions: Suggestion[] = [];
  for (const d of dishInsights) {
    const s = stats[d.id];
    const cold = s.reasons["För kall"] ?? 0;
    if (cold / s.served >= 0.15) {
      suggestions.push({ kind: "atgarda", title: `${d.name} kommer fram för kall`, detail: `${cold} av ${s.served} patienter svarade "För kall". Se över transport och värmevagn innan rätten byts ut.` });
    }
    if (d.upShare >= 0.75) {
      suggestions.push({ kind: "behall", title: `Behåll ${d.name.toLowerCase()}`, detail: `${pct(d.upShare)} gav tummen upp och ${pct(d.ateMostShare)} åt minst hälften.` });
    } else if (d.upShare < 0.55) {
      const [complaint, complaintCount] =
        Object.entries(s.reasons)
          .filter(([r]) => reasonsDown.some((x) => x.name === r))
          .sort((a, b) => b[1] - a[1])[0] ?? [];
      suggestions.push({ kind: "se-over", title: `Se över ${d.name.toLowerCase()}`, detail: `Bara ${pct(d.upShare)} gav tummen upp${complaint ? `. Vanligaste klagomålet: "${complaint}" (${complaintCount})` : ""}. Justera receptet eller byt mot en önskerätt.` });
    }
  }
  wishList.filter((w) => !w.onMenu).slice(0, 3).forEach((w) =>
    suggestions.push({ kind: "lagg-till", title: `Lägg till ${w.name.toLowerCase()}`, detail: `Önskad av ${w.votes} patienter.` }),
  );
  const disliked = categories.filter((c) => c.dislikes > c.likes * 2);
  disliked.forEach((c) =>
    suggestions.push({ kind: "mer-av", title: `Mindre ${c.name.toLowerCase()}`, detail: `${c.dislikes} patienter tycker inte om ${c.name.toLowerCase()}, ${c.likes} gör det. Erbjud alltid ett milt alternativ.` }),
  );

  return {
    respondents: SYNTHETIC_RESPONDENTS + Object.keys(tastes).length,
    ratings: up + down,
    upShare: up + down ? up / (up + down) : 0,
    ateMostShare: eatenTotal ? eatenAll / eatenTotal : 0,
    dishes: dishInsights,
    categories,
    wishes: wishList,
    suggestions,
  };
}
