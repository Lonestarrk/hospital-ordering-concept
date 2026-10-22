# Produktvideo – manus (ca 90 s)

`produktvideo.mp4` är inspelad direkt från prototypen, med svenska textremsor och berättarröst.
Den spelas också upp från startsidan i appen ("Se filmen om Min måltid").

Berättarrösten är syntetisk (Piper, svensk röst `sv_SE-nst-medium`, körs lokalt). Replikerna står i
`berattarrost.json`; varje scen i videon varar så länge som sin replik. Vill ni ha en mänsklig röst
kan replikerna läsas in och läggas i samma mapp som WAV-filer med samma namn.

| Bild | Berättarröst |
|---|---|
| Titelkort: *Min måltid – Ingrid, 78, väljer sin mat själv* | Det här är Ingrid. Hon är sjuttioåtta år och återhämtar sig efter en operation. Maten är något hon ser fram emot. |
| Armbandet mot plattan | Hon loggar in med sitt armband från sjukhuset. Inget att skriva, ingen telefon och inget lösenord. |
| Hennes beställningar, med kosten överst | Direkt ser hon vad hon har beställt. Nästa måltid står överst, och det som har passerat är grått. Hennes kost står alltid högst upp, och bara personalen kan ändra den. |
| Tummen upp på gårdagens middag | Hur smakade gårdagens middag? Ett tryck, och köket får veta. |
| Lunch och middag med nedräkning | Hon väljer lunch eller middag. Nedräkningen visar hur länge hon kan beställa. |
| Menyn med stora bilder | Hon bläddrar bland stora bilder i lugn och ro, och ser bara mat som passar hennes kost. |
| Ugnsbakad lax: kaffe, skuren i bitar, innehållsförteckning med allergener i fetstil | Till laxen tar hon kaffe, och ber att maten skärs i små bitar. Innehållsförteckningen visar allergenerna i fetstil. |
| "Stämmer det här?" | Innan hon beställer ser hon allt en gång till. |
| Klart-sidan | Klart. Maten kommer till rummet klockan tolv. Nu kan hon beställa mer, se sina beställningar eller logga ut. |
| Byte till arabiska via menyn i hörnet | Appen finns på svenska, engelska och arabiska, med uppläsning och större text. |
| Slutkort | Min måltid. Mat hon vill äta, vald av henne själv. |

## Spela in videon igen

1. `python3 scripts/skapa-berattarrost.py <sv_SE-nst-medium.onnx> video-ut/rost`
2. `npm run build && npx next start -p 3129`
3. `PW=$(npm root -g)/playwright node scripts/spela-in-video.cjs video-ut`
4. `node scripts/mixa-video.cjs video-ut` – skriver `docs/lansering/produktvideo.mp4` och `public/video/`.
