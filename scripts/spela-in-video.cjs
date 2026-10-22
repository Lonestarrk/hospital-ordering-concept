// Spelar in produktvideon (ca 60 s) från den riktiga prototypen med svenska textremsor.
// Kör: npm run build && npx next start -p 3129, sedan
//   PW=$(npm root -g)/playwright node scripts/spela-in-video.cjs video-ut
// och konvertera: ffmpeg -i video-ut/*.webm -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.2 -crf 27 -movflags +faststart -an docs/lansering/produktvideo.mp4
// (kopiera sedan till public/video/produktvideo.mp4 och gör en WebM-reserv:
//  ffmpeg -i public/video/produktvideo.mp4 -c:v libvpx-vp9 -b:v 0 -crf 40 -an public/video/produktvideo.webm – filmen spelas från startsidan).
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
  await card('<div><h1>🍽️ Min måltid</h1><p>Ingrid, 78, väljer sin mat själv – från sängen.</p><p>En prototyp för surfplatta</p></div>');
  await wait(4500); await uncard();
  // 5–11 s: inloggning med armbandet
  await cap('Ingrid håller sitt armband mot plattan – inget att skriva, inget BankID.');
  await wait(1800); await tap(p.locator('.demo-link').first());
  await p.waitForURL('**/tillfalle'); await wait(300);
  // 11–19 s: hennes beställningar och kosten i sidhuvudet
  await cap('Direkt ser hon sina beställningar – nästa överst, det som har passerat i grått. Kosten står alltid överst.');
  await wait(5500); await tap(p.locator('.order-row .btn-primary'));
  // 19–25 s: omdöme om gårdagens middag
  await p.waitForURL('**/omdome**'); await cap('Hur smakade gårdagens middag? Ett tryck – köket får veta.');
  await wait(1200); await tap(p.locator('.thumb-up')); await wait(800); await tap(p.locator('.segment', { hasText: 'Allt' })); await wait(900);
  await tap(p.locator('.footer .btn-primary')); await wait(900); await tap(p.locator('.footer .btn-primary'));
  // 25–31 s: välj måltid
  await p.waitForURL('**/tillfalle'); await cap('Lunch eller middag. Nedräkningen visar hur länge hon kan beställa.');
  await wait(4500); await tap(p.locator('.occasion-tab', { hasText: 'Lunch' }));
  // 31–39 s: menyn
  await p.waitForURL('**/meny'); await p.waitForLoadState('networkidle');
  await cap('Stora bilder på maten. Hon ser bara rätter som passar hennes kost.');
  await wait(4200); await p.mouse.wheel(0, 300); await wait(1600); await p.mouse.wheel(0, -300); await wait(800);
  await tap(p.locator('.dish', { hasText: 'Ugnsbakad lax' }));
  // 39–47 s: rätten – dryck, önskemål och näringsvärde på samma sida
  await p.waitForURL('**/meny/lax'); await p.waitForLoadState('networkidle');
  await cap('Något att dricka till – och skuren i små bitar. Näringsvärdet syns direkt.');
  await wait(1600); await tap(p.locator('.drink-choice', { hasText: 'Kaffe' })); await wait(900);
  await tap(p.locator('.chip', { hasText: 'Skuren i små bitar' })); await wait(1600);
  await tap(p.locator('.footer .btn-primary'));
  // 47–51 s: allt syns innan hon beställer
  await p.waitForURL('**/sammanfattning'); await cap('Allt syns innan hon beställer.');
  await wait(2400); await tap(p.locator('.footer .btn-primary'));
  // 50–53 s: klart
  await p.waitForURL('**/klart'); await cap('Klart! Maten kommer till rummet kl 12:00. Hon kan beställa mer, se sina beställningar – eller logga ut.');
  await wait(3200);
  // 53–56 s: för alla
  await cap('Svenska · English · العربية – uppläsning och större text i menyn i hörnet.');
  await tap(p.locator('.tool-menu')); await wait(500);
  await tap(p.locator('.menu-item').first()); await wait(600);
  await tap(p.locator('.dialog .lang-option').nth(2)); await wait(1600);
  // 56–60 s: slutkort
  await card('<div><h1>Min måltid</h1><p>Mat hon vill äta – vald av henne själv.</p><p>Systemet föreslår, människan bestämmer.</p></div>');
  await wait(4000);
  await ctx.close(); await b.close();
})();
