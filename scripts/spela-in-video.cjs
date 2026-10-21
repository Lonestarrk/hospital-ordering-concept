// Spelar in produktvideon (ca 60 s) från den riktiga prototypen med svenska textremsor.
// Kör: npm run build && npx next start -p 3129, sedan
//   PW=$(npm root -g)/playwright node scripts/spela-in-video.cjs video-ut
// och konvertera: ffmpeg -i video-ut/*.webm -c:v libx264 -pix_fmt yuv420p -crf 27 -an docs/lansering/produktvideo.mp4
const { chromium } = require(process.env.PW);
const BASE = 'http://localhost:3129';
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: out, size: { width: 1280, height: 800 } } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.speechSynthesis.speak = () => {}; window.speechSynthesis.cancel = () => {}; });
  const wait = (ms) => p.waitForTimeout(ms);
  const overlay = async () => p.evaluate(() => {
    if (document.getElementById('vid-cap')) return;
    const st = document.createElement('style');
    st.textContent = `html{padding-top:88px}
      #vid-cap{position:fixed;left:0;right:0;top:0;height:88px;z-index:99;background:#1f2a24;color:#fff;font:600 27px/1.25 system-ui;padding:0 40px;display:flex;align-items:center;justify-content:center;text-align:center}
      .vid-tap{position:fixed;z-index:100;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,200,60,.55);border:3px solid #fff;pointer-events:none;animation:vt .6s ease-out forwards}
      @keyframes vt{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}
      #vid-card{position:fixed;inset:0;z-index:101;background:#2f6b4f;color:#fff;display:grid;place-items:center;text-align:center;font-family:system-ui}
      #vid-card h1{font-size:64px;margin:0 0 12px}#vid-card p{font-size:28px;margin:6px 0;opacity:.92}`;
    document.head.appendChild(st);
    const c = document.createElement('div'); c.id = 'vid-cap'; c.dir = 'ltr'; c.lang = 'sv'; document.body.appendChild(c);
  });
  const cap = async (text) => { await overlay(); await p.evaluate((t) => { document.getElementById('vid-cap').textContent = t; }, text); };
  const card = async (html) => p.evaluate((h) => { let c = document.getElementById('vid-card'); if (!c) { c = document.createElement('div'); c.id = 'vid-card'; c.dir = 'ltr'; c.lang = 'sv'; document.body.appendChild(c); } c.innerHTML = h; }, html);
  const uncard = async () => p.evaluate(() => document.getElementById('vid-card')?.remove());
  const tap = async (loc) => {
    const box = await loc.boundingBox();
    if (box) await p.evaluate(([x, y]) => { const d = document.createElement('div'); d.className = 'vid-tap'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 700); }, [box.x + box.width / 2, box.y + box.height / 2]);
    await wait(250); await loc.click();
  };

  await p.goto(BASE + '/?klocka=09:15'); await p.waitForLoadState('networkidle'); await overlay();
  // 0–5 s: titel
  await card('<div><h1>🍽️ Måltider</h1><p>Ingrid, 78, väljer sin mat själv – från sängen.</p><p>En prototyp för surfplatta</p></div>');
  await wait(4500); await uncard();
  // 5–12 s: inloggning
  await cap('Ingrid loggar in med sitt personnummer – stora siffror, inget BankID.');
  for (const d of '194803022328') { await tap(p.locator('.key', { hasText: new RegExp('^' + d + '$') })); await wait(120); }
  await wait(500); await tap(p.locator('.key-go'));
  await p.waitForURL('**/valkommen'); await wait(300);
  // 12–19 s: välkommen
  await cap('Appen känner redan hennes kost och allergier. Bara personalen kan ändra dem.');
  await wait(5500); await tap(p.locator('.footer .btn-primary'));
  // 19–25 s: omdöme om gårdagens middag
  await p.waitForURL('**/omdome**'); await cap('Hur smakade gårdagens middag? Ett tryck – köket får veta.');
  await wait(1200); await tap(p.locator('.thumb-up')); await wait(800); await tap(p.locator('.segment', { hasText: 'Allt' })); await wait(900);
  await tap(p.locator('.footer .btn-primary')); await wait(900); await tap(p.locator('.footer .btn-primary'));
  // 25–31 s: välj måltid
  await p.waitForURL('**/tillfalle'); await cap('Frukost, lunch, fika, middag – eller något litet. Nedräkningen visar hur länge hon kan beställa.');
  await wait(4500); await tap(p.locator('.occasion', { hasText: 'Lunch' }));
  // 31–39 s: menyn
  await p.waitForURL('**/meny'); await p.waitForLoadState('networkidle');
  await cap('Bilder på maten. Bara rätter som passar henne – och ett förslag med skälet.');
  await wait(4200); await p.mouse.wheel(0, 300); await wait(1600); await p.mouse.wheel(0, -300); await wait(800);
  await tap(p.locator('.dish', { hasText: 'Ugnsbakad lax' }));
  // 39–45 s: rätten
  await p.waitForURL('**/meny/lax'); await p.waitForLoadState('networkidle');
  await cap('Lite aptit idag? Liten portion – skuren i små bitar.');
  await wait(1400); await tap(p.locator('.segment', { hasText: 'Liten' })); await wait(900);
  await tap(p.locator('.chip', { hasText: 'Skuren i små bitar' })); await wait(1500);
  await tap(p.locator('.footer .btn-primary'));
  // 45–50 s: dryck och sammanfattning
  await p.waitForURL('**/dryck'); await cap('Något att dricka – och allt syns innan hon beställer.');
  await wait(1200); await tap(p.locator('.drink', { hasText: 'Kaffe' }));
  await p.waitForURL('**/sammanfattning'); await wait(2200); await tap(p.locator('.footer .btn-primary'));
  // 50–53 s: klart
  await p.waitForURL('**/klart'); await cap('Klart! Maten kommer till rummet kl 12:00.');
  await wait(3200);
  // 53–56 s: för alla
  await cap('Svenska · English · العربية – uppläsning och större text för alla.');
  await tap(p.locator('.topbar-actions .tool').first()); await wait(600);
  await tap(p.locator('.dialog .lang-option').nth(2)); await wait(1600);
  // 56–60 s: slutkort
  await card('<div><h1>Måltider</h1><p>Mat hon vill äta – vald av henne själv.</p><p>Systemet föreslår, människan bestämmer.</p></div>');
  await wait(4000);
  await ctx.close(); await b.close();
})();
