// Ritar appens ikoner (PNG) från public/ikoner/ikon.svg. Kör:
//   PW=$(npm root -g)/playwright node scripts/skapa-ikoner.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');

const svg = fs.readFileSync(path.join(__dirname, '../public/ikoner/ikon.svg'), 'utf8');
// "maskable": ikonen fyller hela ytan och motivet ryms i den säkra cirkeln (80 %).
const maskable = svg.replace('rx="112"', 'rx="0"').replace('<circle', '<g transform="translate(51 51) scale(0.8)"><circle').replace('</svg>', '</g></svg>');
const targets = [
  ['ikon-192.png', 192, svg],
  ['ikon-512.png', 512, svg],
  ['ikon-maskable-512.png', 512, maskable],
  ['apple-touch-icon.png', 180, maskable],
];

(async () => {
  const browser = await chromium.launch();
  for (const [file, size, source] of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0">${source.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await page.screenshot({ path: path.join(__dirname, '../public/ikoner', file), omitBackground: true });
    await page.close();
  }
  await browser.close();
  console.log('Klart: public/ikoner/');
})();
