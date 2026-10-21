# Beslut och bedömning – så möter vi kraven

Underlag för juryn och för teamets presentation. Varje del svarar på juryns egen fråga.

## Grinden – båda skyddsräckena (godkänt/underkänt)

| Skyddsräcke | Hur prototypen uppfyller det | Var i koden |
|---|---|---|
| **Allergener och ordinerad kost ändras aldrig automatiskt.** Systemet föreslår, människan bestämmer. | Kostavvikelser (allergier, specialkost, konsistens som timbal) kommer från vården och visas bara. Menyn med 20 rätter filtreras – Ingrid ser de 10 hon tål. De dolda kan visas med skälet, men går inte att beställa, inte ens via direktlänk. "Svårt att tugga" blir en signal till personalen, inte en ändring. | `dishSuits` i `src/lib/data.ts`, `src/app/meny/[id]/page.tsx` |
| **Patientdata går aldrig okontrollerat till en AI-modell.** | Prototypen anropar ingen AI-tjänst. Taligenkänning används **bara** när den kan köras i plattan (`processLocally`) – annars döljs mikrofonen. Ingen röst på inloggningen. | `src/lib/voice.ts` |
| **Patientskärmar fungerar för alla – syn, motorik, språk.** | Svenska, engelska och arabiska (höger-till-vänster). Uppläsning på valt språk, större text, tryckytor ≥ 56 px, ett beslut per skärm, enkelt språk, hjälpknapp på varje sida, röst där det går. Färger i diagram är testade för färgblindhet. | `src/lib/i18n.ts`, `src/components/Screen.tsx` |

## De sex principerna (40 p)

### 1. Lös rätt problem: utgå från ansvaret
*Testfråga: Kan ni namnge personen som ansvarar för det här, och uppgiften de slipper?*

| Vem ansvarar | För vad | Uppgiften de slipper |
|---|---|---|
| **Dietisten** | Att patienten får rätt kost | Att stämma av varje beställning mot ordinationen. Systemet visar bara det som passar, och ingen skriver om en kost. |
| **Sjuksköterskan (Anna)** | Att patienten äter och får näring | Att gå runt med pappersmenyn och skriva upp beställningar. Hon får bara de undantag hon ska agera på (se princip 3). |

### 2. Systemet gör jobbet, människan fattar besluten
*Testfråga: När användaren öppnar skärmen – ser hon ett färdigt förslag eller ett tomt formulär?*

Ett färdigt förslag. Måltidsvalet visar redan vad som går att beställa och hur länge – stängda måltider är flyttade till nästa dag. Menyn är redan filtrerad efter kost och allergier och sorterad efter
Ingrids smak. En rätt är föreslagen med skälet utskrivet ("Eftersom du gav den tummen upp
förra gången"), och portionen är förvald. Ingrid väljer.

### 3. Varje problem är en handling, aldrig en varning
*Testfråga: För varje signal – vem får den, vilken enda handling löser den, och vad händer om den ignoreras?*

| Signal | Vem får den | Handlingen | Om ingen agerar |
|---|---|---|---|
| Ingrid **åt lite** eller **inget** | Anna | Titta till Ingrid och erbjuda något extra, t.ex. näringsdryck | Före kl 15 går det vidare till avdelningens dietist |
| Maten var **svår att tugga** | Anna | Bedöma, tillsammans med dietisten, om kosten ska ändras | Före kl 15 går det vidare till dietisten |
| **Fel i personnumret** | Ingrid | En knapp: *Rätta de fyra sista siffrorna* / *Börja om* | Inget – hon kan inte gå vidare med fel nummer |
| **Låstiden passerar** medan hon väljer | Ingrid | En knapp: *Beställ till imorgon i stället* | Inget – beställningen kan inte skickas för en stängd måltid |
| **Numret hittas inte** | Ingrid | En knapp: *Skriv numret igen*. Texten hänvisar också till larmknappen vid sängen. | Inget – hon kommer inte vidare med fel nummer |

Inga röda märken eller varningar som Ingrid måste tolka själv. Allergin visas som det som
redan är gjort ("✓ Utan selleri"), inte som en ⚠-varning.

### 4. Verifiering är arbete – räkna den
*Testfråga: Hur många saker måste en sjuksköterska godkänna per patient och dag, och ser hon varför?*

- **Noll godkännanden** för vanliga beställningar. Kosten är redan ordinerad, och appen kan inte erbjuda något som inte passar.
- Anna agerar bara på undantagen i tabellen ovan, och varje undantag talar om varför det kom till henne.
- **Det som går att ångra sker direkt, med en ångra-knapp. Inga bekräftelsedialoger:**
  - **Avbryt:** Ingrid loggas ut direkt. Inloggningen visar "Du har avslutat. Inget är beställt. Det du hade valt är sparat." med knappen **Ångra – fortsätt där jag var**, som gäller i 2 minuter.
  - **Beställningen:** kan ändras fram till låstiden (två timmar före servering) via *Ändra beställningen*.
  - **Avbeställ:** på första sidan avbeställs en måltid direkt, utan "Är du säker?". Raden "Lunch är avbeställd" har knappen **↩ Ångra**, som lägger tillbaka beställningen.
- **Det som inte går att ångra** (en ändrad kostordination) föreslås bara, och en människa beslutar.
- **Inga siffror som låtsas vara exakta:** "ca 30 minuter" för tilltugg, "ungefär två minuter". Nedräkningen räknar mot en fast låstid och är därför exakt.

### 5. Tappa aldrig sammanhanget
*Testfråga: Om användaren blir avbruten i 20 minuter – kommer hon tillbaka till exakt samma läge?*

- **Ja.** Plattan loggar ut efter 10 minuter utan aktivitet, för att skydda hennes uppgifter, men valet sparas. Vid nästa inloggning: "Välkommen tillbaka! Du hade börjat välja Ugnsbakad lax" → *Fortsätt där jag var* tar henne till exakt samma sida.
- **Varje skärm och läge har en egen adress:**
  - `/meny/lax` för rätten
  - `/omdome?id=…&skickat=1` för tack-sidan efter omdömet
  - `/min-smak?skickat=1` för tack-sidan efter "Min smak"

  En omladdning tappar ingenting.
- Inga dialoger i dialoger.

### 6. Mät utfallet, inte leveransen
*Testfråga: Vilken siffra ändras för kunden om det här fungerar – och syns den inom en månad?*

| Utfall för kunden | Hur det mäts |
|---|---|
| **Patienterna äter mer** | Andel måltider där patienten åt minst hälften, från *Hur mycket åt du?* efter varje måltid |
| **Ingen skriver om en kost** | Antal kostordinationer som skrivs in manuellt i beställningen. Målet är noll, eftersom appen läser ordinationen direkt. |
| **Patienterna klarar sig själva** | Andel beställningar som görs utan att personalen behövde hjälpa till |

### "En chattruta ovanpå ett formulär är inte AI-native"

Vi har ingen chattruta och inget formulär. Systemet gör jobbet innan Ingrid ser skärmen: det
filtrerar efter kost och allergier, föreslår med skäl, minns vad hon gillar och för vidare
problem till rätt person. Allt räknas fram i appen, så ingen patientdata skickas till en
AI-modell.

## Cagans fyra risker (30 p)

| Risk | Fråga | Vårt svar | Hur vi minskar risken |
|---|---|---|---|
| **Värde** | Kommer Ingrid vilja använda det? | Uppgiften säger att patienter tycker om att bläddra bland bilder – valet är en del av dagen, inte friktion. | Bilder på maten, förslag, "Min smak", ingen tidspress. Mäts med tummen upp och hur mycket som äts. |
| **Användbarhet** | Klarar hon det första gången? | Inloggning med armbandet mot plattan – inget att skriva, inget BankID. Efter inloggningen ser hon direkt sina beställningar, och kosten står i sidhuvudet. En sak per skärm, och varje sida säger vad man gör. | Test med personer utanför teamet (protokoll nedan), helst 70+. |
| **Genomförbarhet** | Går det att bygga på riktigt? | Webbapp som fungerar på vanliga plattor. Armbandet läses med NFC (Web NFC i Chrome på Android), med streckkoden framför plattans kamera (alla webbläsare, även iPad, och bilden tolkas i plattan) eller med en inkopplad NFC- eller streckkodsläsare. Många sjukhus har redan streckkod på armbanden, så det fungerar utan nya armband. Kost och allergier antas finnas i sjukhusets system (enligt reglerna). | Ingen AI behövs. Taligenkänning bara i enheten. Integration med kost- och kökssystem är nästa steg. |
| **Affärsmässig hållbarhet** | Fungerar det för sjukhuset? | Mindre tid för personalen, mindre matsvinn (portionsval, data om vad som äts), nöjdare patienter. | Skyddsräckena inbyggda, pappersmenyn finns kvar som reserv. |

## Introduktion för nya användare (15 p)
*Kan en ny användare komma igång utan hjälp?*

**Ingen separat guide.** Ingrid kommer direkt till maten, och varje sida förklarar sig själv.
En introduktion man måste klicka sig igenom är ännu ett steg innan det hon vill göra.

1. **Språkval** är det första som syns på inloggningen.
2. **Lugnande text på inloggningen:**
   - "Det tar ungefär två minuter."
   - "Du kan inte göra fel – allt går att ändra."
   - "Vill du ha texten uppläst eller större? Knapparna finns uppe i hörnet."
   - "Behöver du hjälp? Använd larmknappen vid sängen."
3. **Varje sida säger vad man gör**, till exempel:
   - "Tryck på maten du vill ha."
   - "Tryck på en tumme. Vill du inte svara nu kan du hoppa över."
   - "Tryck på Ändra om något inte stämmer – annars på Beställ."
4. **Stegindikator** (Mat → Dryck → Kolla → Klart) på varje sida.
5. **Fel förklaras med en knapp** som löser dem.
6. **Sängkort** vid sängen (se kom igång-guiden, sida 2).

## Lansering (15 p)
*Skulle videon och guiden hjälpa sjukhuset att införa det?*

- **60-sekundersvideo:** `docs/lansering/produktvideo.mp4`, med manus för berättarröst i `docs/lansering/videomanus.md`.
- **Kom igång-guide:** `docs/lansering/kom-igang.pdf` – sida 1 för avdelningens personal (fyra steg, vem som gör vad, vanliga frågor), sida 2 ett sängkort för patienten på svenska, engelska och arabiska.

## "Fler funktioner betyder inte en bättre produkt"

**Kärnresan** – det vi visar först och längst – är: *språk → armbandet → mina beställningar → välj måltid →
meny med bilder → portion → dryck → stämmer det här? → klart*.

Omdöme och "Min smak" är **stöd** som gör kärnresan bättre över tid: menyn minns vad
Ingrid gillar. Visa dem kort, efter kärnresan. Personal, dietister och kök är sekundära
användare – för dem bygger vi inga egna skärmar, men principerna styr hur Ingrids resa
fungerar (systemet föreslår, människan bestämmer).

## Testa med någon utanför teamet

**Vem:** helst någon som är 70+ och inte har använt appen. **Hur:** ge plattan, säg bara
"Beställ lunch till dig själv", och hjälp inte till. Anteckna.

| # | Uppgift | Lyckades utan hjälp? | Tid | Var tvekade hen? |
|---|---|---|---|---|
| 1 | Välj ett annat språk och sedan tillbaka till svenska | | | |
| 2 | Logga in med armbandet (demoknappen) och säg vad du har beställt | | | |
| 3 | Beställ en liten portion av något du gillar, skuret i bitar | | | |
| 4 | Ändra drycken innan du beställer | | | |
| 5 | Avbryt och fortsätt sedan där du var | | | |
| 6 | Gör texten större och få sidan uppläst | | | |

**Frågor efteråt:** Vad var lättast? Vad var svårast? Kände du dig osäker någon gång? Skulle du
vilja använda det här om du låg på sjukhus?

## Vad vi har lärt oss (hittills)

- **Inloggningen är den största tröskeln.** BankID kräver telefon och kod. Först bytte vi till personnummer på ett stort sifferblock. Sedan bytte vi till armbandet, som är både enklare och säkrare: ingen kan logga in genom att skriva någon annans nummer.
- **Det första hon vill veta är vad som redan är beställt.** Därför visar första sidan hennes beställningar, med nästa måltid överst. Välkomstsidan tog vi bort, och kosten står i stället i sidhuvudet på varje sida.
- **Röst är bra för motoriken men en risk för skyddsräcket.** Webbläsarens standardläge kan skicka ljud till en extern tjänst. Vi tillåter därför bara igenkänning i enheten.
- **Den snabbaste beställningen är inte målet.** Vi lade till bilder, förslag och tid att bläddra i stället för att korta ner flödet.
- *Fyll i: vad lärde ni er när ni testade med någon utanför teamet?*
