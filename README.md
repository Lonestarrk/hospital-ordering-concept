# Ingrids måltid – konceptprototyp

Tävlingsbidrag till *The Great Product Challenge*: Ingrid, 78, återhämtar sig efter en
operation och ska för första gången beställa sin mat på en surfplatta – från inloggning
till bekräftad måltid.

**Leveranserna**

| Leverans | Var |
|---|---|
| 1. Produkten – en komplett resa, surfplattan först | Den här appen (`npm run dev`) |
| 2. Introduktionen | `/intro` – visas automatiskt första gången, se [beslut och bedömning](docs/beslut-och-bedomning.md#introduktion-för-nya-användare-15-p) |
| 3. Lanseringen | [60-sekundersvideo](docs/lansering/produktvideo.mp4) · [videomanus](docs/lansering/videomanus.md) · [kom igång-guide (PDF)](docs/lansering/kom-igang.pdf) |
| Underlag för juryn | [Beslut och bedömning](docs/beslut-och-bedomning.md): skyddsräcken, de sex principerna, Cagans fyra risker, testprotokoll |

## Kom igång

```bash
npm install
npm run dev        # http://localhost:3000
```

Logga in med Ingrids **syntetiska** personnummer **19480302-2328** (eller tryck på
"Demo: fyll i Ingrids personnummer" längst ner på inloggningssidan).

## Användarresan

| Steg | Sida | Vad händer |
|---|---|---|
| 1 | `/` | **Språkval** (svenska, English, العربية) och inloggning med personnummer på ett stort sifferblock. Numret kontrolleras (datum och kontrollsiffra) och felen förklaras i klartext. |
| 2 | `/valkommen` | "Hej Ingrid! Stämmer det här?" – namn, rum, säng, kost och allergier. Har hon ett påbörjat val visas *Fortsätt där jag var*. |
| – | `/intro` | **Introduktion** i tre steg första gången: titta och välj, du kan inte välja fel, hjälp finns alltid här. |
| 3 | `/meny` | **Foton på maten.** Bara rätter som passar hennes kost och allergier visas, och en rätt är föreslagen med skälet utskrivet. Det står hur många som är dolda och varför. |
| 4 | `/meny/[id]` | Allergener, portionsstorlek ("Hur hungrig är du?") och önskemål som "Skuren i små bitar". |
| 5 | `/dryck` | Dryck som passar kosten. |
| 6 | `/sammanfattning` | "Stämmer det här?" – allt går att ändra. |
| 7 | `/klart` | Bekräftelse med tid: "Maten kommer till ditt rum ca kl 12:00". |
| – | `/omdome` | **Omdöme i efterhand:** 👍 eller 👎, valfria skäl och "Hur mycket åt du?". |
| – | `/min-smak` | **Min smak:** 👍 eller 👎 på olika sorters mat och ❤️ på önskerätter. |

Hjälpmedel på varje sida: **Språk**, **Läs upp / Ljud på**, **Större text** och
**Hjälp**, som kallar på personalen.

**Ångrat sig?** Knappen **✕ Avbryt** uppe till vänster finns på alla sidor efter
inloggningen, utom på bekräftelsen där beställningen redan är skickad. Dialogen
förklarar att inget är beställt och att valet sparas. Inloggningssidan bekräftar sedan:
"Du har avslutat. Inget är beställt." Med rösten räcker det att säga "avbryt".

**Avbruten mitt i?** Plattan loggar ut efter 10 minuter utan aktivitet så att ingen annan
ser patientens uppgifter, men valet sparas. Vid nästa inloggning kan hon fortsätta exakt
där hon var. Testa direkt: `window.dispatchEvent(new Event("ingrid-idle"))`.

## Språk

Alla patientskärmar finns på **svenska, engelska och arabiska**. Arabiska visas från höger
till vänster, och uppläsningen sker på valt språk. Texterna finns i `src/lib/i18n.ts`, där
det är lätt att lägga till fler språk. Röstkommandona finns bara på svenska, så på andra
språk används tryck och uppläsning. Den arabiska texten tilltalar Ingrid i femininum. En
riktig lösning behöver anpassa tilltalet efter patienten.

## Omdöme i efterhand – tummen upp eller ner

- **Efter måltiden.** Nästa gång Ingrid loggar in frågar appen först "Hur smakade
  gårdagens middag?". Hon kan svara med 👍 eller 👎, eller hoppa över.
- **Valfria detaljer.** Hon kan välja skäl som "Som hemma", "För kall" eller "Svårt att
  tugga", och svara på *Hur mycket åt du?* (allt, hälften, lite, inget). Det sista ger
  vården tidiga signaler om undernäring.
- **Appen minns.** Menyn visar "👍 Du gillade den" eller "👎 Inte din favorit" vid rätter
  hon har betygsatt.
- **Människan beslutar.** Väljer Ingrid "Svårt att tugga" meddelas personalen, men kosten
  ändras aldrig automatiskt.
- **Röst.** Hon kan säga "tummen upp", "för kall", "jag åt allt" och "skicka".
- **Demo.** På bekräftelsesidan finns länken *"Demo: maten har serverats"*, som hoppar
  fram i tiden så att man kan betygsätta det man just beställde.

## Min smak – det Ingrid tycker om

**Ingrid (`/min-smak`).** Hon når sidan från bekräftelsen ("Vad tycker du om för mat?")
eller från länken under menyn.
- 👍 eller 👎 på sorters mat: husmanskost, fisk, kyckling, kött, vegetariskt, soppor,
  kryddig mat, pasta och ris, efterrätter.
- ❤️ på önskerätter som köttbullar, pannbiff, kåldolmar och ärtsoppa.
- Med rösten kan hon säga till exempel "jag gillar fisk", "jag tycker inte om kryddig
  mat" eller "köttbullar". Appen hör skillnad på "gillar" och "gillar inte".
- **Hennes meny anpassas direkt.** Rätter som matchar det hon gillar hamnar först och
  märks "❤️ Du gillar fisk". Sådant hon ogillar hamnar sist men döljs inte.

Svaren från omdömen och "Min smak" sparas med svenska nycklar och utan att något skickas
till en AI-tjänst. Hur sjukhuset sedan använder dem för menyplaneringen ligger utanför
prototypen – där gäller principen att systemet föreslår och människan bestämmer.

## Ljud och röst

- **Ljudläge.** Ett tryck på **Läs upp** slår på ljudet. Sedan läses varje sida upp
  automatiskt, och varje val bekräftas med en mjuk signal och tal ("Liten portion",
  "Du valde kaffe att dricka …").
- **Röstkommandon.** Tryck på den runda **🎤 Prata**-knappen och säg vad du vill.
  Bubblan visar vad appen hörde. Förstår den inte säger den vad man kan säga i stället.

| Sida | Exempel på vad Ingrid kan säga |
|---|---|
| Välkommen | "ja" · "nej, det är inte jag" |
| Meny | "laxen", "soppa", "den första". En rätt som inte passar henne ger en förklaring. |
| Rätt | "liten", "lagom", "stor" · "skär i bitar", "såsen vid sidan" · "nästa" · "tillbaka" |
| Dryck | "kaffe", "vatten", "mjölk" |
| Sammanfattning | "ja, beställ" · "ändra maten" · "ändra drycken" |
| Klart | "klar" · "ändra" |
| Omdöme | "tummen upp" / "tummen ner" · "för kall", "svårt att tugga" · "jag åt allt" · "skicka" · "hoppa över" |
| Min smak | "jag gillar fisk" · "jag tycker inte om kryddig mat" · "köttbullar" · "skicka" |
| Alla sidor | "hjälp" · "läs upp" / "upprepa" · "större text" · "tyst" · "avbryt" |

**Integritet (skyddsräcke 2).** Uppläsningen sker i enheten. Taligenkänningen används
**bara** när webbläsaren kan köra den i plattan (`processLocally`, med en svensk modell som
laddas ner en gång). Kan den inte det döljs mikrofonen, och inget ljud skickas någonsin
till en extern taltjänst eller AI-modell. Rösten finns inte heller på inloggningen.

Mikrofonen syns i webbläsare som har API:t för taligenkänning i enheten (nyare Chrome).
Om en svensk modell saknas säger appen det när man trycker på knappen och döljer den. Utan
mikrofon kan man prova kommandona i konsolen:
`window.dispatchEvent(new CustomEvent("ingrid-voice", { detail: "laxen" }))`.

## Hur vi följer reglerna

| Regel | Så här |
|---|---|
| Allergener och ordinerad kost ändras aldrig automatiskt | Kost och allergier kommer från vården och visas bara. Appen filtrerar menyn men kan aldrig ändra en ordination. Ingrid uppmanas be personalen om något inte stämmer. Rätter som inte passar går inte att välja, inte ens via direktlänk. |
| Patientdata går aldrig okontrollerat till en AI-modell | Prototypen anropar ingen AI-tjänst. Röst tolkas bara i plattan. All data finns lokalt i webbläsaren (sessionStorage). |
| Bara syntetisk data | Ingrid är påhittad. Personnumret är ett officiellt testpersonnummer från Skatteverket. |
| Patientskärmar ska fungera för alla | Svenska, engelska och arabiska, stora tryckytor (≥ 56 px), tydliga kontraster, större text, uppläsning på valt språk, hjälpknapp, enkelt språk, ett beslut per skärm. |
| Surfplattan först | Layouten är byggd för liggande surfplatta och fungerar även på mobil. |

> **Obs:** Att logga in med bara personnummer räcker inte i skarp drift. Prototypen
> visar *upplevelsen*. I verkligheten behövs en kontroll till, till exempel att
> plattan är kopplad till sängen eller att personalen bekräftar.

## Dokumentation

1. **Förstå problemet** – [docs/steg-1-problemforstaelse.md](docs/steg-1-problemforstaelse.md) · ifyllt lunchkort: [svenska](docs/lunch-mission/lunch-mission-sv.png), [English](docs/lunch-mission/lunch-mission-en.png)
2. **Prototyp** – den här appen
3. **Beslut och bedömning** – [docs/beslut-och-bedomning.md](docs/beslut-och-bedomning.md)
4. **Lansering** – [video](docs/lansering/produktvideo.mp4), [manus](docs/lansering/videomanus.md), [kom igång-guide](docs/lansering/kom-igang.pdf). Videon spelas in igen med `scripts/spela-in-video.cjs`.

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

AI-genererade bilder har vi provat (Pollinations och FLUX via Hugging Face), men utan
API-nyckel blev kvaliteten för låg eller kvoten tog slut. Med en nyckel går det att
generera bilder i en enhetlig stil.

Vill ni byta en bild? Lägg en ny fil i `public/mat/` och ändra `image` i `src/lib/data.ts`. I skarp drift fotograferar köket sina egna rätter.

## Skärmbilder

| | |
|---|---|
| ![Inloggning](docs/skarmbilder/1-login.png) | ![Välkommen](docs/skarmbilder/2-valkommen.png) |
| ![Meny](docs/skarmbilder/3-meny.png) | ![Rätt](docs/skarmbilder/4-ratt.png) |
| ![Sammanfattning](docs/skarmbilder/6-sammanfattning.png) | ![Klart](docs/skarmbilder/7-klart.png) |
| ![Röstkommando](docs/skarmbilder/8-rost.png) | ![Omdöme](docs/skarmbilder/9-omdome.png) |
| ![Tack för omdömet](docs/skarmbilder/10-omdome-tack.png) | ![Menyn minns](docs/skarmbilder/11-meny-minns.png) |
| ![Min smak](docs/skarmbilder/12-min-smak.png) | ![Menyn efter smak](docs/skarmbilder/13-meny-smak.png) |
| ![Introduktion](docs/skarmbilder/15-intro.png) | ![Avbryt](docs/skarmbilder/18-avbryt.png) |
| ![Fortsätt där du var](docs/skarmbilder/16-fortsatt.png) | ![Arabiska](docs/skarmbilder/17-arabiska.png) |
