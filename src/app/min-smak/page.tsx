"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, useAnnounce } from "@/components/Screen";
import { useRequirePatient } from "@/components/OrderProvider";
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
  const [draft, setDraft] = useState<TasteProfile | null>(null);
  const [sent, setSent] = useState(false);
  if (!patient) return null;

  const profile = draft ?? taste;
  const next = params.get("sen") === "meny" ? "/meny" : "/klart";

  const voteOf = (id: string): Vote =>
    profile.likes.includes(id) ? "gillar" : profile.dislikes.includes(id) ? "ogillar" : undefined;

  const vote = (id: string, v: Exclude<Vote, undefined>) => {
    const name = foodCategories.find((c) => c.id === id)?.name.toLowerCase();
    const same = voteOf(id) === v;
    const likes = profile.likes.filter((c) => c !== id);
    const dislikes = profile.dislikes.filter((c) => c !== id);
    if (!same) (v === "gillar" ? likes : dislikes).push(id);
    setDraft({ ...profile, likes, dislikes });
    announce(same ? `${name}, borttaget.` : v === "gillar" ? `Du gillar ${name}.` : `Du tycker inte om ${name}.`);
  };

  const toggleFavorite = (id: string) => {
    const on = profile.favorites.includes(id);
    const name = wishDishes.find((w) => w.id === id)?.name;
    setDraft({ ...profile, favorites: on ? profile.favorites.filter((f) => f !== id) : [...profile.favorites, id] });
    announce(on ? `${name}, borttagen.` : `${name}, tillagd som önskerätt.`);
  };

  const send = () => {
    setTaste(profile);
    setSent(true);
    announce(`Tack ${patient.firstName}! Köket får veta vad du tycker om.`);
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
        speakText={`Tack ${patient.firstName}! Köket får veta vad du tycker om. Svaren blir en del av underlaget när de planerar menyn – utan ditt namn.`}
        commands={commands}
        voiceHint="”fortsätt”"
        footer={
          <button className="btn btn-primary btn-large footer-end" onClick={() => router.push(next)}>
            Fortsätt →
          </button>
        }
      >
        <div className="done">
          <div className="done-check" aria-hidden>❤️</div>
          <h1>Tack {patient.firstName}!</h1>
          <p className="lead">Köket får veta vad du tycker om.</p>
          <div className="card care feedback-staff">
            <div className="care-icon" aria-hidden>👩‍🍳</div>
            <p>
              Dina svar läggs ihop med andra patienters – <strong>utan ditt namn</strong> – och hjälper
              köket att planera menyn. Rätter du gillar visas först på din meny.
            </p>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      speakText={`Vad tycker du om för mat, ${patient.firstName}? Säg till exempel: jag gillar fisk, eller jag tycker inte om kryddig mat. Du kan också önska rätter, till exempel köttbullar eller pannbiff. Säg skicka när du är klar.`}
      commands={commands}
      voiceHint="”jag gillar fisk” eller ”köttbullar”"
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => router.push(next)}>Hoppa över</button>
          <button className="btn btn-primary btn-large" onClick={send}>Skicka ✓</button>
        </>
      }
    >
      <div className="page-head">
        <p className="eyebrow">Min smak</p>
        <h1>Vad tycker du om, {patient.firstName}?</h1>
        <p className="lead">Hjälp köket att laga mat som du och andra patienter tycker om. Allt är frivilligt.</p>
      </div>

      <section className="section">
        <h2>Vilken sorts mat gillar du?</h2>
        <div className="taste-grid">
          {foodCategories.map((c) => {
            const v = voteOf(c.id);
            return (
              <div key={c.id} className={`taste-card ${v ? `is-${v}` : ""}`}>
                <span className="taste-emoji" aria-hidden>{c.emoji}</span>
                <span className="taste-name">{c.name}</span>
                <div className="taste-votes" role="group" aria-label={c.name}>
                  <button
                    className={`taste-vote up ${v === "gillar" ? "selected" : ""}`}
                    aria-pressed={v === "gillar"}
                    aria-label={`Jag gillar ${c.name.toLowerCase()}`}
                    onClick={() => vote(c.id, "gillar")}
                  >
                    👍
                  </button>
                  <button
                    className={`taste-vote down ${v === "ogillar" ? "selected" : ""}`}
                    aria-pressed={v === "ogillar"}
                    aria-label={`Jag tycker inte om ${c.name.toLowerCase()}`}
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
        <h2>Önska dina favoriträtter <span className="optional">(tryck på hjärtat)</span></h2>
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
                <span className="wish-name">{w.name}</span>
                <span className="wish-heart" aria-hidden>{on ? "❤️" : "🤍"}</span>
              </button>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
