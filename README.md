# Ingrids måltid – konceptprototyp

Tävlingsbidrag till *The Great Product Challenge*: Ingrid ligger på sjukhus och ska för
första gången beställa sin mat på en surfplatta – från inloggning till bekräftad måltid.

## Kom igång

```bash
npm install
npm run dev        # http://localhost:3000
```

Logga in med Ingrids **syntetiska** personnummer **19450120-2388** (eller tryck på
"Demo: fyll i Ingrids personnummer" längst ner på inloggningssidan).

## Användarresan

| Steg | Sida | Vad händer |
|---|---|---|
| 1 | `/` | Inloggning med personnummer på ett stort sifferblock på skärmen. Numret kontrolleras (datum och kontrollsiffra) och felen förklaras i klartext. |
| 2 | `/valkommen` | "Hej Ingrid! Stämmer det här?" – namn, rum, säng, kost och allergier. |
| 3 | `/meny` | **Foton på maten.** Bara rätter som passar hennes kost och allergier visas. Det står hur många som är dolda och varför. |
| 4 | `/meny/[id]` | Allergener, portionsstorlek ("Hur hungrig är du?") och önskemål som "Skuren i små bitar". |
| 5 | `/dryck` | Dryck som passar kosten. |
| 6 | `/sammanfattning` | "Stämmer det här?" – allt går att ändra. |
| 7 | `/klart` | Bekräftelse med tid: "Maten kommer till ditt rum ca kl 12:00". |

Hjälpmedel på varje sida: **Läs upp** (talsyntes på svenska), **Större text** och
**Hjälp**, som kallar på personalen.

## Hur vi följer reglerna

| Regel | Så här |
|---|---|
| Allergener och ordinerad kost ändras aldrig automatiskt | Kost och allergier kommer från vården och visas bara. Appen filtrerar menyn men kan aldrig ändra en ordination. Ingrid uppmanas be personalen om något inte stämmer. Rätter som inte passar går inte att välja, inte ens via direktlänk. |
| Patientdata går aldrig okontrollerat till en AI-modell | Prototypen anropar ingen AI-tjänst. All data finns lokalt i webbläsaren (sessionStorage). |
| Bara syntetisk data | Ingrid är påhittad. Personnumret är ett officiellt testpersonnummer från Skatteverket. |
| Patientskärmar ska fungera för alla | Stora tryckytor (≥ 56 px), tydliga kontraster, större text, uppläsning, hjälpknapp, enkelt språk, ett beslut per skärm. |
| Surfplattan först | Layouten är byggd för liggande surfplatta och fungerar även på mobil. |

> **Obs:** Att logga in med bara personnummer räcker inte i skarp drift. Prototypen
> visar *upplevelsen*. I verkligheten behövs en kontroll till, till exempel att
> plattan är kopplad till sängen eller att personalen bekräftar.

## Dokumentation

1. **Förstå problemet** – [docs/steg-1-problemforstaelse.md](docs/steg-1-problemforstaelse.md)
2. **Prototyp** – den här appen

## Matbilder

Fotona i `public/mat/` kommer från [Pexels](https://www.pexels.com/license/) och får användas fritt, utan krav på att fotografen anges. Kalvspettsbilden är beskuren.

| Rätt | Källa |
|---|---|
| Kalvspett med potatismos | https://www.pexels.com/photo/2739250/ |
| Ugnsbakad lax | https://www.pexels.com/photo/2374946/ |
| Kycklinggryta med ris | https://www.pexels.com/photo/21822134/ |
| Grönsakssoppa | https://www.pexels.com/photo/34314393/ |
| Pannkakor med sylt | https://www.pexels.com/photo/3225506/ |
| Fiskgratäng | https://www.pexels.com/photo/33042510/ |

Vill ni byta en bild? Lägg en ny fil i `public/mat/` och ändra `image` i `src/lib/data.ts`. I skarp drift fotograferar köket sina egna rätter.

## Skärmbilder

| | |
|---|---|
| ![Inloggning](docs/skarmbilder/1-login.png) | ![Välkommen](docs/skarmbilder/2-valkommen.png) |
| ![Meny](docs/skarmbilder/3-meny.png) | ![Rätt](docs/skarmbilder/4-ratt.png) |
| ![Sammanfattning](docs/skarmbilder/6-sammanfattning.png) | ![Klart](docs/skarmbilder/7-klart.png) |
