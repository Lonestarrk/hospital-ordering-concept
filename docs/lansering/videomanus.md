# Produktvideo – manus (ca 2 min)

`produktvideo.mp4` är inspelad direkt från prototypen, med svenska textremsor och berättarröst.
Den spelas också upp från startsidan i appen ("Se filmen om Min måltid").

Berättarrösten är syntetisk, i stil med en naturdokumentär (Piper, svensk röst `sv_SE-nst-medium`, körs lokalt, med lugnare tempo och lite djupare ton), och under den ligger en mycket svag ljudmatta. Replikerna står i
`berattarrost.json`; varje scen i videon varar så länge som sin replik. Vill ni ha en mänsklig röst
kan replikerna läsas in och läggas i samma mapp som WAV-filer med samma namn.

| Bild | Berättarröst |
|---|---|
| Titelkort: *Min måltid – Ingrid, 78, väljer sin mat själv* | Här, på avdelning tolv, möter vi Ingrid. Sjuttioåtta år gammal, och på väg tillbaka efter en operation. Och som för de flesta av oss, är det maten som lyser upp dagen. |
| Armbandet mot plattan | Hon lyfter handleden mot plattan. Armbandet hon fick vid inskrivningen räcker. Inga lösenord. Inga krångliga steg. |
| Dina beställningar: lunch och middag obeställda, gårdagens middag i grått, kosten överst | Och genast visar sig hennes dag. Lunch och middag väntar fortfarande på hennes beslut. Gårdagens middag ligger kvar, lite blekare. Och överst, alltid synlig, hennes kost. Den kan bara personalen ändra. |
| Tummen upp på gårdagens middag | Men först, en fråga om gårdagen. Smakade middagen? Ett enda tryck, och köket får veta. |
| Tillbaka på översikten – 44 minuter kvar för lunch | Nu närmar sig lunchen. Klockan tickar. Fyrtiofyra minuter återstår innan köket stänger beställningen. |
| Menyn med stora bilder | Framför henne breder menyn ut sig. Bara rätter som passar hennes kost får plats här. |
| Ugnsbakad lax med kaffe, innehållsförteckning med allergener i fetstil | Hon väljer laxen. Till den, en kopp kaffe. Innehållsförteckningen visar allergenerna i fetstil, så att ingenting kommer som en överraskning. |
| "Stämmer det här?" | Ett sista ögonkast. Stämmer allt? |
| Tillbaka på Dina beställningar: "Beställt!" och det nya kortet glider in | Det gör det. Beställningen glider på plats bland de andra, och klockan tolv kommer maten till hennes rum. |
| Byte till arabiska via menyn i hörnet | Och om nästa patient hellre läser arabiska, räcker det med två tryck. |
| Slutkort | Min måltid. Mat hon vill äta, vald av henne själv. |

## Spela in videon igen

1. `python3 scripts/skapa-berattarrost.py <sv_SE-nst-medium.onnx> video-ut/rost`
2. `npm run build && npx next start -p 3129`
3. `PW=$(npm root -g)/playwright node scripts/spela-in-video.cjs video-ut`
4. `node scripts/mixa-video.cjs video-ut` – skriver `docs/lansering/produktvideo.mp4` och `public/video/`.
