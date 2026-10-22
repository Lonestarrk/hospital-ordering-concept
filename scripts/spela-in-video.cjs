// Spelar in produktvideon från den riktiga prototypen, med svenska textremsor och berättarröst.
//
// 1. Berättarrösten (en WAV per scen + tider.json):
//      python3 scripts/skapa-berattarrost.py <sv_SE-nst-medium.onnx> video-ut/rost
// 2. Starta appen: npm run build && npx next start -p 3129
// 3. Spela in – varje scen varar minst så länge som sin replik:
//      PW=$(npm root -g)/playwright node scripts/spela-in-video.cjs video-ut
//    Skriver video-ut/*.webm och video-ut/tidslinje.json (scenernas ordning).
// 4. Lägg på rösten och gör MP4 + WebM: node scripts/mixa-video.cjs video-ut
const { chromium } = require(process.env.PW);
const BASE = 'http://localhost:3129';
(async () => {
  const out = process.argv[2];
  const fs = require('fs');
  const path = require('path');
  const voice = JSON.parse(fs.readFileSync(path.join(out, 'rost', 'tider.json'), 'utf8'));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: out, size: { width: 1280, height: 800 } } });
  const p = await ctx.newPage();
  const t0 = Date.now();
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

  // En scen: repliken börjar när scenen börjar, och scenen varar minst så länge repliken tar.
  // Varje scen får en egen färg i en liten ruta i hörnet. mixa-video.cjs letar upp när färgen
  // byts i videon, så att rösten hamnar exakt rätt även om inspelningens klocka driver.
  const timeline = {};
  let sceneIndex = 0;
  const marker = async (i) => p.evaluate((n) => {
    let m = document.getElementById('vid-marker');
    if (!m) { m = document.createElement('div'); m.id = 'vid-marker'; m.style.cssText = 'position:fixed;left:0;top:0;width:16px;height:16px;z-index:200'; document.body.appendChild(m); }
    m.style.background = `rgb(${40 + 18 * n}, 42, 36)`;
  }, i);
  const scene = async (name, fn) => {
    const start = Date.now();
    timeline[name] = (start - t0) / 1000;
    sceneIndex += 1;
    await marker(sceneIndex);
    await fn();
    const rest = voice[name] * 1000 + 450 - (Date.now() - start);
    if (rest > 0) await wait(rest);
  };

  await p.goto(BASE + '/?klocka=09:15'); await p.waitForLoadState('networkidle'); await overlay(); await marker(0);
  await card('<div><h1>🍽️ Min måltid</h1><p>Ingrid, 78, väljer sin mat själv – från sängen.</p><p>En prototyp för surfplatta</p></div>');
  await wait(600);

  await scene('titel', async () => {});
  await uncard();

  await scene('inloggning', async () => {
    await cap('Ingrid håller sitt armband mot plattan – inget att skriva, inget lösenord.');
    await wait(4000); await tap(p.locator('.demo-link').first());
    await p.waitForURL('**/tillfalle');
  });

  await scene('bestallningar', async () => {
    await cap('Lunch och middag väntar på hennes beslut. Kosten står alltid överst – bara personalen kan ändra den.');
  });

  await scene('omdome', async () => {
    await tap(p.locator('.order-row .btn-primary'));
    await p.waitForURL('**/omdome**'); await cap('Hur smakade gårdagens middag? Ett tryck – köket får veta.');
    await wait(900); await tap(p.locator('.thumb-up')); await wait(700); await tap(p.locator('.segment', { hasText: 'Allt' })); await wait(700);
    await tap(p.locator('.footer .btn-primary'));
  });

  await scene('maltider', async () => {
    await tap(p.locator('.footer .btn-primary'));
    await p.waitForURL('**/tillfalle'); await cap('44 minuter kvar att beställa lunch.');
  });

  await scene('meny', async () => {
    await tap(p.locator('.order-row.is-ghost', { hasText: 'Lunch' }).locator('.btn'));
    await p.waitForURL('**/meny'); await p.waitForLoadState('networkidle');
    await cap('Stora bilder på maten. Hon ser bara rätter som passar hennes kost.');
    await wait(1800); await p.mouse.wheel(0, 300); await wait(1600); await p.mouse.wheel(0, -300);
  });

  await scene('ratten', async () => {
    await tap(p.locator('.dish', { hasText: 'Ugnsbakad lax' }));
    await p.waitForURL('**/meny/lax'); await p.waitForLoadState('networkidle');
    await cap('Laxen, med en kopp kaffe. Allergenerna står i fetstil i innehållsförteckningen.');
    await wait(2500); await tap(p.locator('.drink-choice', { hasText: 'Kaffe' }));
  });

  await scene('kolla', async () => {
    await tap(p.locator('.footer .btn-primary'));
    await p.waitForURL('**/sammanfattning'); await cap('Allt syns innan hon beställer.');
  });

  await scene('klart', async () => {
    await tap(p.locator('.footer .btn-primary'));
    await p.waitForURL('**/tillfalle**'); await cap('Beställt! Den nya beställningen glider in bland de andra. Maten kommer kl 12:00.');
  });

  await scene('sprak', async () => {
    await cap('Svenska · English · العربية – två tryck i menyn i hörnet.');
    await tap(p.locator('.tool-menu')); await wait(600);
    await tap(p.locator('.menu-item').first()); await wait(700);
    await tap(p.locator('.dialog .lang-option').nth(2));
  });

  await scene('slut', async () => {
    await card('<div><h1>Min måltid</h1><p>Mat hon vill äta – vald av henne själv.</p><p>Systemet föreslår, människan bestämmer.</p></div>');
  });
  await wait(800);

  fs.writeFileSync(path.join(out, 'tidslinje.json'), JSON.stringify(Object.keys(timeline), null, 2));
  await ctx.close(); await b.close();
})();
