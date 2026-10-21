"use client";

import Link from "next/link";
import { useOrder } from "@/components/OrderProvider";
import { buildInsights, MIN_GROUP, type Suggestion } from "@/lib/insights";

const pct = (n: number) => `${Math.round(n * 100)} %`;

const suggestionMeta: Record<Suggestion["kind"], { icon: string; label: string }> = {
  "lagg-till": { icon: "➕", label: "Lägg till" },
  "se-over": { icon: "🔍", label: "Se över" },
  atgarda: { icon: "🌡️", label: "Åtgärda" },
  "mer-av": { icon: "⚖️", label: "Anpassa" },
  behall: { icon: "✅", label: "Behåll" },
};
const ORDER: Suggestion["kind"][] = ["atgarda", "se-over", "lagg-till", "mer-av", "behall"];

export default function KitchenPage() {
  const { history, tastes, hydrated } = useOrder();
  if (!hydrated) return null;
  const data = buildInsights(history, tastes);
  const maxWish = Math.max(...data.wishes.map((w) => w.votes), 1);
  const maxCat = Math.max(...data.categories.map((c) => Math.max(c.likes, c.dislikes)), 1);
  const suggestions = [...data.suggestions].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

  return (
    <div className="kitchen">
      <header className="kitchen-head">
        <div>
          <p className="eyebrow">Kökets vy · Avdelning 12 · senaste 4 veckorna</p>
          <h1>Vad patienterna tycker om</h1>
          <p className="muted">
            🔒 Sammanställt och anonymt – inga namn eller personnummer. En rätt visas först när
            minst {MIN_GROUP} patienter har svarat. Syntetisk demodata plus svaren från prototypen.
          </p>
        </div>
        <Link className="btn btn-ghost kitchen-back" href="/">← Patientvyn</Link>
      </header>

      <section className="kpis" aria-label="Nyckeltal">
        <div className="kpi"><span className="kpi-value">{data.respondents}</span><span className="kpi-label">patienter har svarat</span></div>
        <div className="kpi"><span className="kpi-value">{data.ratings}</span><span className="kpi-label">omdömen om måltider</span></div>
        <div className="kpi"><span className="kpi-value">{pct(data.upShare)}</span><span className="kpi-label">gav tummen upp 👍</span></div>
        <div className="kpi"><span className="kpi-value">{pct(data.ateMostShare)}</span><span className="kpi-label">åt minst hälften av maten</span></div>
      </section>

      <section className="kitchen-section">
        <h2>Förslag till nästa veckas meny</h2>
        <p className="muted">Systemet föreslår – kökschefen och dietisten bestämmer. Kostordinationer påverkas aldrig.</p>
        <div className="suggestions">
          {suggestions.map((s) => (
            <article key={s.title} className={`suggestion s-${s.kind}`}>
              <span className="suggestion-tag"><span aria-hidden>{suggestionMeta[s.kind].icon}</span> {suggestionMeta[s.kind].label}</span>
              <h3>{s.title}</h3>
              <p>{s.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="kitchen-cols">
        <section className="kitchen-section card">
          <h2>Rätterna på menyn – andel tummen upp</h2>
          <ul className="bars" aria-label="Andel tummen upp per rätt">
            {data.dishes.map((d) => (
              <li key={d.id} className="bar-row" title={`${d.name}: ${pct(d.upShare)} tummen upp av ${d.served} serverade. ${pct(d.ateMostShare)} åt minst hälften.`}>
                <img src={d.image} alt="" className="bar-thumb" />
                <div className="bar-main">
                  <div className="bar-label"><span>{d.name}</span><strong>{pct(d.upShare)}</strong></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${d.upShare * 100}%` }} /></div>
                  <div className="bar-meta">
                    {d.served} serverade · {pct(d.ateMostShare)} åt minst hälften
                    {d.topReason && <> · oftast ”{d.topReason.name}”</>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="kitchen-section card">
          <h2>Mest önskade rätter</h2>
          <ul className="bars" aria-label="Antal önskningar per rätt">
            {data.wishes.map((w) => (
              <li key={w.id} className="bar-row compact" title={`${w.name}: önskad av ${w.votes} patienter`}>
                <span className="bar-emoji" aria-hidden>{w.emoji}</span>
                <div className="bar-main">
                  <div className="bar-label"><span>{w.name}</span><strong>{w.votes}</strong></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(w.votes / maxWish) * 100}%` }} /></div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="kitchen-section card">
        <h2>Smakprofil på avdelningen</h2>
        <div className="legend" aria-hidden>
          <span><i className="swatch like" /> 👍 Gillar</span>
          <span><i className="swatch dislike" /> 👎 Gillar inte</span>
        </div>
        <ul className="diverging" aria-label="Antal patienter som gillar och inte gillar varje sorts mat">
          {data.categories.map((c) => (
            <li key={c.id} className="div-row" title={`${c.name}: ${c.likes} gillar, ${c.dislikes} gillar inte`}>
              <div className="div-side left">
                <span className="div-value">{c.dislikes}</span>
                <div className="div-bar dislike" style={{ width: `${(c.dislikes / maxCat) * 100}%` }} />
              </div>
              <div className="div-name"><span aria-hidden>{c.emoji}</span> {c.name}</div>
              <div className="div-side right">
                <div className="div-bar like" style={{ width: `${(c.likes / maxCat) * 100}%` }} />
                <span className="div-value">{c.likes}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
