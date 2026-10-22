// Skapar streckkoder för Ingrids (syntetiska) armband: en bild som appens demo läser och ett
// utskrivbart armband för att prova kameran på riktigt. Kör: npm run armband
const fs = require('fs');
const bwipjs = require('bwip-js');

const PNR = '194803022328';
const text = `PNR:${PNR}`;

(async () => {
  const code128 = await bwipjs.toBuffer({ bcid: 'code128', text, scale: 4, height: 14, includetext: true, textsize: 11, paddingwidth: 12, paddingheight: 8, backgroundcolor: 'ffffff' });
  fs.writeFileSync('public/armband/ingrid-streckkod.png', code128);

  const qr = await bwipjs.toBuffer({ bcid: 'qrcode', text, scale: 6, paddingwidth: 4, paddingheight: 4, backgroundcolor: 'ffffff' });
  fs.writeFileSync('docs/armband/ingrid-qr.png', qr);
  fs.writeFileSync('docs/armband/ingrid-streckkod.png', code128);

  // Utskrivbart armband (SVG): namn, födelsedatum, Code 128 och QR.
  const svg128 = bwipjs.toSVG({ bcid: 'code128', text, height: 10, includetext: false, scale: 3 });
  const svgQr = bwipjs.toSVG({ bcid: 'qrcode', text, scale: 3 });
  const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const size = (svg) => svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
  const [w128, h128] = size(svg128);
  const [wQr, hQr] = size(svgQr);
  const band = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200" viewBox="0 0 1000 200">
  <rect x="2" y="2" width="996" height="196" rx="98" fill="#fff" stroke="#9fb7aa" stroke-width="4"/>
  <text x="110" y="78" font-family="system-ui, sans-serif" font-size="30" font-weight="700" fill="#1f2a24">ANDERSSON, Ingrid</text>
  <text x="110" y="116" font-family="system-ui, sans-serif" font-size="24" fill="#1f2a24">19480302-2328 · Avd 12 Kirurgi</text>
  <text x="110" y="150" font-family="system-ui, sans-serif" font-size="18" fill="#5b6660">Syntetisk testpatient – NFC + streckkod</text>
  <g transform="translate(470 50) scale(${290 / w128} ${100 / h128})">${inner(svg128)}</g>
  <g transform="translate(790 40) scale(${120 / wQr} ${120 / hQr})">${inner(svgQr)}</g>
</svg>`;
  fs.writeFileSync('docs/armband/ingrid-armband.svg', band);

  // Testkort för kamerainloggningen: Ingrids streckkod och QR-kod stort, plus två felfall.
  // Visas på en telefon (full ljusstyrka) eller skrivs ut och hålls framför plattans kamera.
  const big128 = bwipjs.toSVG({ bcid: 'code128', text, height: 18, includetext: false, scale: 3, paddingwidth: 10 });
  const bigQr = bwipjs.toSVG({ bcid: 'qrcode', text, scale: 4, paddingwidth: 2, paddingheight: 2 });
  const unknown = bwipjs.toSVG({ bcid: 'code128', text: 'PNR:190001019991', height: 10, includetext: false, scale: 3, paddingwidth: 10 });
  const garbage = bwipjs.toSVG({ bcid: 'code128', text: 'HEJ-123', height: 10, includetext: false, scale: 3, paddingwidth: 10 });
  const fit = (svg, x, y, w, h) => {
    const [sw, sh] = size(svg);
    const k = Math.min(w / sw, h / sh);
    return `<g transform="translate(${x + (w - sw * k) / 2} ${y + (h - sh * k) / 2}) scale(${k})">${inner(svg)}</g>`;
  };
  const font = 'font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"';
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1700" viewBox="0 0 1200 1700">
  <rect width="1200" height="1700" fill="#fbf7f2"/>
  <text x="80" y="110" ${font} font-size="56" font-weight="800" fill="#1f2a24">Testkort – logga in med streckkod</text>
  <text x="80" y="160" ${font} font-size="28" fill="#5b6660">Min måltid · syntetisk testpatient, inga riktiga uppgifter</text>

  <rect x="60" y="210" width="1080" height="860" rx="36" fill="#fff" stroke="#2f6b4f" stroke-width="4"/>
  <text x="110" y="290" ${font} font-size="40" font-weight="800" fill="#1f2a24">Ingrid Andersson</text>
  <text x="110" y="336" ${font} font-size="28" fill="#1f2a24">19480302-2328 · Rum 4, Säng B</text>
  <text x="110" y="378" ${font} font-size="24" fill="#2f6b4f" font-weight="700">Ska ge: Hej Ingrid! → Dina beställningar</text>
  <rect x="110" y="410" width="980" height="300" rx="16" fill="#fff"/>
  ${fit(big128, 110, 410, 980, 300)}
  <text x="600" y="745" ${font} font-size="24" fill="#5b6660" text-anchor="middle">Code 128 · ${text}</text>
  ${fit(bigQr, 470, 775, 260, 260)}
  <text x="600" y="1060" ${font} font-size="22" fill="#5b6660" text-anchor="middle">QR-kod · samma innehåll</text>

  <text x="80" y="1150" ${font} font-size="34" font-weight="800" fill="#1f2a24">Felfall</text>
  <rect x="60" y="1175" width="530" height="300" rx="28" fill="#fff" stroke="#e4dccf" stroke-width="3"/>
  <text x="90" y="1225" ${font} font-size="26" font-weight="700" fill="#1f2a24">Okänd patient</text>
  <text x="90" y="1260" ${font} font-size="20" fill="#5b6660">Ska ge: armbandet hör inte till avdelningen</text>
  ${fit(unknown, 90, 1280, 470, 150)}
  <text x="325" y="1455" ${font} font-size="18" fill="#5b6660" text-anchor="middle">PNR:190001019991</text>
  <rect x="610" y="1175" width="530" height="300" rx="28" fill="#fff" stroke="#e4dccf" stroke-width="3"/>
  <text x="640" y="1225" ${font} font-size="26" font-weight="700" fill="#1f2a24">Inte ett armband</text>
  <text x="640" y="1260" ${font} font-size="20" fill="#5b6660">Ska ge: koden gick inte att läsa</text>
  ${fit(garbage, 640, 1280, 470, 150)}
  <text x="875" y="1455" ${font} font-size="18" fill="#5b6660" text-anchor="middle">HEJ-123</text>

  <text x="80" y="1550" ${font} font-size="26" fill="#1f2a24">Så testar du: tryck på ”Visa streckkoden för kameran” på startsidan</text>
  <text x="80" y="1590" ${font} font-size="26" fill="#1f2a24">och håll koden 15–30 cm framför kameran. Visa den på en telefon</text>
  <text x="80" y="1630" ${font} font-size="26" fill="#1f2a24">med full ljusstyrka, eller skriv ut kortet.</text>
</svg>`;
  fs.writeFileSync('docs/armband/testkort-streckkod.svg', card);
  // Samma kort i appen, så att det kan öppnas direkt på en telefon: /armband/testkort-streckkod.svg
  fs.writeFileSync('public/armband/testkort-streckkod.svg', card);
  console.log('Klart: public/armband/ och docs/armband/');
})();
