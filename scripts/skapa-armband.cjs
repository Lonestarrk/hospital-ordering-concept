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
  console.log('Klart: public/armband/ och docs/armband/');
})();
