# Produktvideo – manus (ca 80 s)

`produktvideo.mp4` är inspelad direkt från prototypen – **appen på engelska, med engelsk
berättarröst och engelska textremsor**, för visning för personer som inte talar svenska.
Den spelas också upp från startsidan i appen ("Se filmen om Min måltid").

Berättarrösten är syntetisk och skapas lokalt med Kokoro (öppen modell, röst `bm_george` –
en lugn brittisk mansröst i stil med en naturdokumentär). Den efterliknar ingen verklig person.
Replikerna står i `berattarrost.json`; varje scen varar så länge som sin replik. Vill ni ha en
mänsklig röst kan replikerna läsas in och läggas som WAV-filer med samma namn.

| Bild | Berättarröst |
|---|---|
| Titelkort: *My Meal – Ingrid, 78, chooses her own food* | Here, on Ward Twelve, we meet Ingrid. Seventy-eight years old, and recovering from surgery. And, like most of us, she finds that a good meal can brighten the whole day. |
| Armbandet mot plattan | She raises her wrist to the tablet. The hospital wristband she was given on arrival is all she needs. No passwords. No fuss. |
| Your orders: lunch och middag obeställda, gårdagens middag i grått, kosten överst | At once, her day comes into view. Lunch and dinner are still waiting for her decision, and the clock is ticking: forty-four minutes left to order lunch. At the very top, always in sight, her diet. Only the staff can change it. |
| Menyn med stora bilder – bara rätter hon tål | Before her, the menu unfolds. Only dishes that suit her diet are allowed here. Nothing she cannot eat. |
| Oven-baked salmon med kaffe, ingredienser med allergener i fetstil | She settles on the salmon. With it, a cup of coffee. The list of ingredients shows every allergen in bold, so nothing comes as a surprise. |
| "Is this right?" | One last look. Is everything right? |
| Tillbaka på Your orders: "Ordered!" och det nya kortet glider in | It is. The order slides into place among the others, and at noon, lunch will arrive at her bedside. |
| Byte till arabiska via menyn i hörnet | And should the next patient prefer Arabic, it takes just two taps. |
| Slutkort | My Meal. Food she wants to eat, chosen by herself. |

## Spela in videon igen

1. `pip install kokoro-onnx soundfile` och hämta modellfilerna (se `scripts/skapa-berattarrost.py`)
2. `python3 scripts/skapa-berattarrost.py <modellmapp> video-ut/rost`
3. `npm run build && npx next start -p 3129`
4. `PW=$(npm root -g)/playwright node scripts/spela-in-video.cjs video-ut`
5. `node scripts/mixa-video.cjs video-ut` – skriver `docs/lansering/produktvideo.mp4` och `public/video/`.
