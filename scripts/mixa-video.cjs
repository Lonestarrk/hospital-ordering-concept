// Lägger berättarrösten på produktvideon och gör filerna för appen och docs.
// Kör efter spela-in-video.cjs: node scripts/mixa-video.cjs video-ut
// Kräver ffmpeg. Varje replik (video-ut/rost/<scen>.wav) börjar där scenen börjar i videon.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = process.argv[2];
const order = JSON.parse(fs.readFileSync(path.join(dir, 'tidslinje.json'), 'utf8'));
const webm = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));

// Läs färgen i hörnrutan för varje bildruta (25 per sekund) och hitta när varje scen börjar.
const FPS = 25;
const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', path.join(dir, webm), '-vf', `fps=${FPS},crop=8:8:4:4,scale=1:1`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
const colorOf = (n) => 40 + 18 * n;
// Scenerna kommer i ordning: nästa scen räknas som påbörjad när dess färg syns i tre bildrutor i rad.
const starts = {};
let next = 0;
let run = 0;
for (let frame = 0; frame * 3 < raw.length && next < order.length; frame++) {
  const red = raw[frame * 3];
  const isNext = raw[frame * 3 + 1] < 80 && Math.abs(red - colorOf(next + 1)) <= 7;
  run = isNext ? run + 1 : 0;
  if (run === 3) {
    starts[order[next]] = (frame - 2) / FPS;
    next += 1;
    run = 0;
  }
}
const missing = order.filter((name) => starts[name] === undefined);
if (missing.length) throw new Error(`Hittade inte scenerna i videon: ${missing.join(', ')}`);
console.log('Scenerna börjar (s):', starts);
const scenes = order.map((name) => [name, starts[name]]);

const inputs = ['-i', path.join(dir, webm)];
const delays = [];
scenes.forEach(([scene, start], i) => {
  inputs.push('-i', path.join(dir, 'rost', `${scene}.wav`));
  // Repliken börjar en kort stund efter att scenen har börjat, så att bilden hinner byta först.
  const ms = Math.round((start + 0.25) * 1000);
  delays.push(`[${i + 1}:a]adelay=${ms}|${ms},aresample=48000[a${i}]`);
});
// Markörrutan i hörnet beskärs bort (16 px), och bilden skalas tillbaka till 1280 × 800.
const mix = `[0:v]crop=1264:790:16:10,scale=1280:800,setsar=1[video];${delays.join(';')};${scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${scenes.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[voice]`;

const ffmpeg = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
ffmpeg([...inputs, '-filter_complex', mix, '-map', '[video]', '-map', '[voice]', '-c:v', 'libx264', '-profile:v', 'main', '-level', '3.2',
  '-pix_fmt', 'yuv420p', '-crf', '27', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', 'docs/lansering/produktvideo.mp4']);
fs.copyFileSync('docs/lansering/produktvideo.mp4', 'public/video/produktvideo.mp4');
ffmpeg(['-i', 'public/video/produktvideo.mp4', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-c:a', 'libopus', '-b:a', '64k', 'public/video/produktvideo.webm']);
ffmpeg(['-ss', '2', '-i', 'public/video/produktvideo.mp4', '-frames:v', '1', '-q:v', '4', 'public/video/produktvideo-poster.jpg']);
console.log('Klart: docs/lansering/produktvideo.mp4 och public/video/');
