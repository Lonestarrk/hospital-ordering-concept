# Beslut och bedömning – så möter vi kraven

Underlag för juryn och för teamets presentation. Varje del svarar på juryns egen fråga.

## Grinden – båda skyddsräckena (godkänt/underkänt)

| Skyddsräcke | Hur prototypen uppfyller det | Var i koden |
|---|---|---|
| **Allergener och ordinerad kost ändras aldrig automatiskt.** Systemet föreslår, människan bestämmer. | Kost och allergier kommer från vården och visas bara. Menyn filtreras – rätter som inte passar går inte att välja, inte ens via direktlänk. "Svårt att tugga" blir en signal till personalen, inte en ändring. Köksförslagen påverkar aldrig ordinationer. | `dishSuits` i `src/lib/data.ts`, `src/app/meny/[id]/page.tsx`, `src/lib/insights.ts` |
| **Patientdata går aldrig okontrollerat till en AI-modell.** | Prototypen anropar ingen AI-tjänst. Taligenkänning används **bara** när den kan köras i plattan (`processLocally`) – annars döljs mikrofonen. Ingen röst på inloggningen. Köket ser bara anonyma summor (minst 5 svar). | `src/lib/voice.ts`, `src/lib/insights.ts` |
| **Patientskärmar fungerar för alla – syn, motorik, språk.** | Svenska, engelska och arabiska (höger-till-vänster). Uppläsning på valt språk, större text, tryckytor ≥ 56 px, ett beslut per skärm, enkelt språk, hjälpknapp på varje sida, röst där det går. Färger i diagram är testade för färgblindhet. | `src/lib/i18n.ts`, `src/components/Screen.tsx` |

## De sex principerna (40 p)

### 1. Lös rätt problem: utgå från ansvaret
*Testfråga: Kan ni namnge personen som ansvarar för det här, och uppgiften de slipper?*

| Vem ansvarar | För vad | Uppgiften de slipper |
|---|---|---|
| **Dietisten** | Att patienten får rätt kost | Att stämma av varje beställning mot ordinationen – systemet visar bara det som passar. |
| **Sjuksköterskan / undersköterskan** | Att patienten äter och får näring | Att gå runt med pappersmenyn och skriva upp beställningar. De får signaler om någon äter lite eller har svårt att tugga. |
| **Kökschefen** | Menyn | Att gissa vad patienterna vill ha – de får betyg, önskerätter och förslag. |

### 2. Systemet gör jobbet, människan fattar besluten
*Testfråga: När användaren öppnar skärmen – ser de ett färdigt förslag eller ett tomt formulär?*

- **Ingrid:** menyn är redan filtrerad efter hennes kost, sorterad efter hennes smak, och en rätt är föreslagen med skälet utskrivet ("Eftersom du gav den tummen upp förra gången"). Portionen är förvald. Hon väljer.
- **Köket:** förslagen till nästa veckas meny väntar med skälet ("9 av 40 svarade För kall"). Kökschefen bestämmer.
- **Personalen:** ser bara undantagen (hjälp-signal, svårt att tugga).

### 3. *(Sidan med princip 3 saknas i underlaget vi har – fyll i när ni har texten.)*

### 4. Verifiering är arbete – räkna den
*Hur många saker måste personalen godkänna per patient?*

- **Noll** för en vanlig beställning. Kosten är redan ordinerad, och appen kan inte erbjuda något som inte passar.
- Patienten själv bekräftar **en** gång: "Stämmer det här?" – med bild och möjlighet att ändra. Inga extra "Är du säker?"-dialoger.
- Personalen agerar bara på undantag: hjälp-signal och "svårt att tugga".

### 5. Tappa aldrig sammanhanget
*Om användaren blir avbruten i 20 minuter – kommer hon tillbaka till samma ställe?*

- Ja. Plattan loggar ut efter 10 minuters inaktivitet (så att ingen annan ser hennes uppgifter) men **sparar valet**. Vid nästa inloggning: "Välkommen tillbaka! Du hade börjat välja Ugnsbakad lax" → *Fortsätt där jag var* tar henne till exakt samma sida.
- En omladdning av sidan tappar ingenting. Stegindikatorn visar alltid var hon är, och "Tillbaka" behåller hennes val.

### 6. Mät utfallet, inte leveransen
*Vilken siffra ändras för kunden om det här fungerar – och syns den inom en månad?*

| Utfall | Var det syns |
|---|---|
| **Andel måltider där patienten åt minst hälften** (näringsintag) | Kökets vy, nyckeltal |
| **Andel tummen upp** | Kökets vy, per rätt |
| **Andel beställningar utan hjälp från personalen** | *Nästa steg: räkna hjälp-signaler per beställning* |

## Cagans fyra risker (30 p)

| Risk | Fråga | Vårt svar | Hur vi minskar risken |
|---|---|---|---|
| **Värde** | Kommer Ingrid vilja använda det? | Uppgiften säger att patienter tycker om att bläddra bland bilder – valet är en del av dagen, inte friktion. | Bilder på maten, förslag, "Min smak", ingen tidspress. Mäts med tummen upp och hur mycket som äts. |
| **Användbarhet** | Klarar hon det första gången? | Inloggning med personnummer i stället för BankID, en sak per skärm, introduktion i tre steg. | Test med personer utanför teamet (protokoll nedan), helst 70+. |
| **Genomförbarhet** | Går det att bygga på riktigt? | Webbapp som fungerar på vanliga plattor. Kost och allergier antas finnas i sjukhusets system (enligt reglerna). | Ingen AI behövs. Taligenkänning bara i enheten. Integration med kost- och kökssystem är nästa steg. |
| **Affärsmässig hållbarhet** | Fungerar det för sjukhuset? | Mindre tid för personalen, mindre matsvinn (portionsval, data om vad som äts), nöjdare patienter. | Anonym sammanställning (GDPR), skyddsräckena inbyggda, pappersmenyn finns kvar som reserv. |

## Introduktion för nya användare (15 p)
*Kan en ny användare komma igång utan hjälp?*

1. **Språkval** är det första som syns på inloggningen.
2. **Lugnande text:** "Det tar ungefär två minuter. Du kan inte göra fel – allt går att ändra."
3. **Introduktion i tre steg** första gången (`/intro`): *Titta och välj → Du kan inte välja fel → Hjälp finns alltid här*. Knapparna i hörnet pulserar i sista steget så att hon vågar prova dem. Går alltid att hoppa över och visas bara en gång.
4. **Stegindikator** (Mat → Dryck → Kolla → Klart) på varje sida.
5. **Sängkort** vid sängen (se kom igång-guiden, sida 2).

## Lansering (15 p)
*Skulle videon och guiden hjälpa sjukhuset att införa det?*

- **60-sekundersvideo:** `docs/lansering/produktvideo.mp4`, med manus för berättarröst i `docs/lansering/videomanus.md`.
- **Kom igång-guide:** `docs/lansering/kom-igang.pdf` – sida 1 för avdelningens personal (fyra steg, vem som gör vad, vanliga frågor), sida 2 ett sängkort för patienten på svenska, engelska och arabiska.

## "Fler funktioner betyder inte en bättre produkt"

**Kärnresan** – det vi visar först och längst – är: *språk → personnummer → stämmer det här? →
introduktion → meny med bilder → portion → dryck → stämmer det här? → klart*.

Omdöme, "Min smak" och kökets vy är **stöd** som gör kärnresan bättre över tid: menyn minns vad
Ingrid gillar, och köket lagar mer av det som äts. Visa dem kort, efter kärnresan.

## Testa med någon utanför teamet

**Vem:** helst någon som är 70+ och inte har använt appen. **Hur:** ge plattan, säg bara
"Beställ lunch till dig själv", och hjälp inte till. Anteckna.

| # | Uppgift | Lyckades utan hjälp? | Tid | Var tvekade hen? |
|---|---|---|---|---|
| 1 | Välj ett annat språk och sedan tillbaka till svenska | | | |
| 2 | Logga in (personnummer **19480302-2328**) | | | |
| 3 | Beställ en liten portion av något du gillar, skuret i bitar | | | |
| 4 | Ändra drycken innan du beställer | | | |
| 5 | Be om hjälp | | | |
| 6 | Gör texten större och få sidan uppläst | | | |

**Frågor efteråt:** Vad var lättast? Vad var svårast? Kände du dig osäker någon gång? Skulle du
vilja använda det här om du låg på sjukhus?

## Vad vi har lärt oss (hittills)

- **Inloggningen är den största tröskeln.** BankID kräver telefon och kod. Vi bytte till personnummer på ett stort sifferblock.
- **Röst är bra för motoriken men en risk för skyddsräcket.** Webbläsarens standardläge kan skicka ljud till en extern tjänst. Vi tillåter därför bara igenkänning i enheten.
- **Grönt och rött går inte att skilja åt för många färgblinda.** Diagrammen använder blått och orange.
- **Den snabbaste beställningen är inte målet.** Vi lade till bilder, förslag och tid att bläddra i stället för att korta ner flödet.
- *Fyll i: vad lärde ni er när ni testade med någon utanför teamet?*
