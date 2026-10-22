"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { foodCategories, type TasteProfile } from "@/lib/data";
import { CUSTOM_PREFIX, catalog, cuisines, popularPicks, searchCatalog } from "@/lib/foodCatalog";
import type { VoiceCommand } from "@/lib/voice";

export default function TastePage() {
  return (
    <Suspense>
      <Taste />
    </Suspense>
  );
}

type Vote = "gillar" | "ogillar" | undefined;

const NEGATIONS = [" inte ", " ogillar ", " ej ", " aldrig ", " tycker illa "];

function Taste() {
  const router = useRouter();
  const params = useSearchParams();
  const { patient, taste, setTaste } = useRequirePatient();
  const announce = useAnnounce();
  const { t, tm, lang } = useT();
  const k = t.taste;
  const [draft, setDraft] = useState<TasteProfile | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  if (!patient) return null;

  const profile = draft ?? taste;
  const next = params.get("sen") === "meny" ? "/meny" : "/tillfalle";
  // Tack-läget har en egen adress.
  const sent = params.has("skickat");

  // Namn på valt språk. Rätter har svenska och engelska namn; arabiska visar det engelska.
  const cuisineName = (id: string) => {
    const c = cuisines.find((x) => x.id === id)!;
    return lang === "sv" ? c.sv : lang === "en" ? c.en : c.ar;
  };
  const favoriteName = (fav: string) => {
    if (fav.startsWith(CUSTOM_PREFIX)) return fav.slice(CUSTOM_PREFIX.length);
    const dish = catalog.find((x) => x.id === fav);
    return dish ? (lang === "sv" ? dish.sv : dish.en) : fav;
  };

  const voteOf = (id: string): Vote =>
    profile.likes.includes(id) ? "gillar" : profile.dislikes.includes(id) ? "ogillar" : undefined;

  const vote = (id: string, v: Exclude<Vote, undefined>) => {
    const c = foodCategories.find((x) => x.id === id)!;
    const name = tm.category(c.id, c.name).toLowerCase();
    const same = voteOf(id) === v;
    const likes = profile.likes.filter((c) => c !== id);
    const dislikes = profile.dislikes.filter((c) => c !== id);
    if (!same) (v === "gillar" ? likes : dislikes).push(id);
    setDraft({ ...profile, likes, dislikes });
    announce(same ? k.removed(name) : v === "gillar" ? k.liked(name) : k.disliked(name));
  };

  const toggleCuisine = (id: string) => {
    const on = profile.cuisines.includes(id);
    setDraft({ ...profile, cuisines: on ? profile.cuisines.filter((c) => c !== id) : [...profile.cuisines, id] });
    announce(on ? k.removed(cuisineName(id)) : k.liked(cuisineName(id)));
  };

  const addFavorite = (fav: string) => {
    if (!profile.favorites.includes(fav)) {
      setDraft({ ...profile, favorites: [...profile.favorites, fav] });
      announce(k.wishAdded(favoriteName(fav)));
    }
    setQuery("");
    setActive(0);
  };

  const removeFavorite = (fav: string) => {
    setDraft({ ...profile, favorites: profile.favorites.filter((f) => f !== fav) });
    announce(k.wishRemoved(favoriteName(fav)));
  };

  const suggestions = searchCatalog(query).filter((dish) => !profile.favorites.includes(dish.id));
  const typed = query.trim();
  // Finns inte rätten i listan kan den läggas till som egen önskan.
  // Är det ett kök hon skriver ("thai") visas bara köket rätter, inte "Lägg till ”thai”".
  const lower = typed.toLowerCase();
  const isCuisineWord = cuisines.some((c) => [c.id, c.sv, c.en].some((n) => n.toLowerCase().startsWith(lower)));
  const canAddCustom =
    typed.length >= 2 &&
    !(isCuisineWord && suggestions.length > 0) &&
    !suggestions.some((s) => s.sv.toLowerCase() === lower || s.en.toLowerCase() === lower);
  const options = [
    ...suggestions.map((dish) => ({ key: dish.id, label: lang === "sv" ? dish.sv : dish.en, hint: cuisineName(dish.cuisine), value: dish.id })),
    ...(canAddCustom ? [{ key: "custom", label: k.add(typed), hint: "", value: CUSTOM_PREFIX + typed }] : []),
  ];

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && options[active]) {
      e.preventDefault();
      addFavorite(options[active].value);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  const send = () => {
    setTaste(profile);
    router.replace(`/min-smak?${next === "/meny" ? "sen=meny&" : ""}skickat=1`);
    announce(k.thanksSpeak(patient.firstName));
  };

  const commands: VoiceCommand[] = sent
    ? [{ phrases: ["fortsätt", "klar", "okej", "tillbaka", "ja"], action: () => router.push(next) }]
    : [
        // Rätter först: "köttbullar" ska bli en favoriträtt, inte sorten kött.
        ...catalog.map((dish) => ({ phrases: [dish.sv.toLowerCase()], action: () => addFavorite(dish.id) })),
        ...cuisines.map((c) => ({ phrases: [`${c.id}*`], action: () => toggleCuisine(c.id) })),
        ...foodCategories.map((c) => ({
          phrases: c.voiceWords,
          action: (heard: string) =>
            vote(c.id, NEGATIONS.some((n) => ` ${heard} `.includes(n)) ? "ogillar" : "gillar"),
        })),
        { phrases: ["skicka", "klar", "spara", "färdig*"], action: send },
        { phrases: ["tillbaka", "hoppa över", "senare"], action: () => router.push(next) },
      ];

  if (sent) {
    return (
      <Screen
        speakText={k.thanksSpeak(patient.firstName)}
        commands={commands}
        voiceHint="”fortsätt”"
        footer={
          <button className="btn btn-primary btn-large footer-end" onClick={() => router.push(next)}>
            {t.continue}
          </button>
        }
      >
        <div className="done">
          <div className="done-check" aria-hidden>❤️</div>
          <h1>{k.thanks(patient.firstName)}</h1>
          <p className="lead">{k.thanksLead}</p>
          <div className="card care feedback-staff">
            <div className="care-icon" aria-hidden>👩‍🍳</div>
            <p>
              {k.thanksBody[0]}<strong>{k.thanksBody[1]}</strong>{k.thanksBody[2]}
            </p>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      speakText={k.speak(patient.firstName)}
      commands={commands}
      voiceHint="”thai”, ”korv stroganoff” eller ”jag gillar fisk”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push(next)}>{k.skip}</button>
          <button className="btn btn-primary btn-large" onClick={send}>{k.send}</button>
        </>
      }
    >
      <div className="page-head">
        <p className="eyebrow">{k.eyebrow}</p>
        <h1>{k.title(patient.firstName)}</h1>
        <p className="lead">{k.lead}</p>
      </div>

      <section className="section">
        <h2>{k.favTitle}</h2>
        <p className="muted">{k.favLead}</p>
        <div className="combo">
          <label className="visually-hidden" htmlFor="dish-search">{k.inputLabel}</label>
          <input
            id="dish-search"
            className="combo-input"
            type="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls="dish-options"
            aria-activedescendant={options[active] ? `opt-${options[active].key}` : undefined}
            placeholder={k.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          {options.length > 0 && (
            <ul id="dish-options" className="combo-list" role="listbox" aria-label={k.inputLabel}>
              {options.map((o, i) => (
                <li
                  key={o.key}
                  id={`opt-${o.key}`}
                  role="option"
                  aria-selected={i === active}
                  className={`combo-option ${i === active ? "active" : ""} ${o.key === "custom" ? "custom" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addFavorite(o.value)}
                >
                  <span>{o.key === "custom" ? "＋ " : ""}{o.label}</span>
                  {o.hint && <span className="combo-hint">{o.hint}</span>}
                </li>
              ))}
            </ul>
          )}
          {typed.length >= 2 && suggestions.length === 0 && <p className="muted combo-none">{k.noMatch}</p>}
        </div>

        {profile.favorites.length > 0 && (
          <ul className="chips fav-chips" aria-label={k.favTitle}>
            {profile.favorites.map((fav) => (
              <li key={fav}>
                <button className="chip selected" onClick={() => removeFavorite(fav)} aria-label={k.remove(favoriteName(fav))}>
                  ❤️ {favoriteName(fav)} <span aria-hidden>✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="muted popular-label">{k.popular}</p>
        <div className="chips">
          {popularPicks
            .filter((id) => !profile.favorites.includes(id))
            .map((id) => (
              <button key={id} className="chip" onClick={() => addFavorite(id)}>
                + {favoriteName(id)}
              </button>
            ))}
        </div>
      </section>

      <section className="section">
        <h2>
          {k.cuisines} <span className="optional">{k.cuisinesHint}</span>
        </h2>
        <div className="chips">
          {cuisines.map((c) => {
            const on = profile.cuisines.includes(c.id);
            return (
              <button key={c.id} className={`chip ${on ? "selected" : ""}`} aria-pressed={on} onClick={() => toggleCuisine(c.id)}>
                <span aria-hidden>{on ? "✓" : c.emoji}</span> {cuisineName(c.id)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2>{k.categories}</h2>
        <div className="taste-grid">
          {foodCategories.map((c) => {
            const v = voteOf(c.id);
            const cname = tm.category(c.id, c.name);
            return (
              <div key={c.id} className={`taste-card ${v ? `is-${v}` : ""}`}>
                <span className="taste-emoji" aria-hidden>{c.emoji}</span>
                <span className="taste-name">{cname}</span>
                <div className="taste-votes" role="group" aria-label={cname}>
                  <button
                    className={`taste-vote up ${v === "gillar" ? "selected" : ""}`}
                    aria-pressed={v === "gillar"}
                    aria-label={k.like(cname.toLowerCase())}
                    onClick={() => vote(c.id, "gillar")}
                  >
                    👍
                  </button>
                  <button
                    className={`taste-vote down ${v === "ogillar" ? "selected" : ""}`}
                    aria-pressed={v === "ogillar"}
                    aria-label={k.dislike(cname.toLowerCase())}
                    onClick={() => vote(c.id, "ogillar")}
                  >
                    👎
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
