"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient, useT } from "@/components/OrderProvider";
import { foodCategories, wishDishes, type TasteProfile } from "@/lib/data";
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
  const { t, tm } = useT();
  const k = t.taste;
  const [draft, setDraft] = useState<TasteProfile | null>(null);
  if (!patient) return null;

  const profile = draft ?? taste;
  const next = params.get("sen") === "meny" ? "/meny" : "/klart";
  // Tack-läget har en egen adress.
  const sent = params.has("skickat");

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

  const toggleFavorite = (id: string) => {
    const on = profile.favorites.includes(id);
    const w = wishDishes.find((x) => x.id === id)!;
    const name = tm.wish(w.id, w.name);
    setDraft({ ...profile, favorites: on ? profile.favorites.filter((f) => f !== id) : [...profile.favorites, id] });
    announce(on ? k.wishRemoved(name) : k.wishAdded(name));
  };

  const send = () => {
    setTaste(profile);
    router.replace(`/min-smak?${next === "/meny" ? "sen=meny&" : ""}skickat=1`);
    announce(k.thanksSpeak(patient.firstName));
  };

  const commands: VoiceCommand[] = sent
    ? [{ phrases: ["fortsätt", "klar", "okej", "tillbaka", "ja"], action: () => router.push(next) }]
    : [
        // Önskerätter först: "köttbullar" ska bli en önskerätt, inte kategorin kött.
        ...wishDishes.map((w) => ({ phrases: w.voiceWords, action: () => toggleFavorite(w.id) })),
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
      voiceHint="”jag gillar fisk” eller ”köttbullar”"
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

      <section className="section">
        <h2>{k.wishes} <span className="optional">{k.wishHint}</span></h2>
        <div className="wish-grid">
          {wishDishes.map((w) => {
            const on = profile.favorites.includes(w.id);
            return (
              <button
                key={w.id}
                className={`wish ${on ? "selected" : ""}`}
                aria-pressed={on}
                onClick={() => toggleFavorite(w.id)}
              >
                <span className="wish-emoji" aria-hidden>{w.emoji}</span>
                <span className="wish-name">{tm.wish(w.id, w.name)}</span>
                <span className="wish-heart" aria-hidden>{on ? "❤️" : "🤍"}</span>
              </button>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
