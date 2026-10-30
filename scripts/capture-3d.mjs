#!/usr/bin/env node
// Capture a 3D figure into a still image (site poster or README image). The capture stage page is
// written to a temporary folder at run time, so no extra HTML lives in the repository.
//
//   node scripts/capture-3d.mjs <scene> [options]
//
// Options
//   --size WxH        output pixels (default 1600x1000)
//   --css WxH         figure size in CSS px; the device scale is size/css (default 880x550, the case column)
//   --out PATH        output file (default assets/3d/<scene>.webp)
//   --png             write PNG instead of WebP
//   --quality N       WebP quality 1-100 (default 88)
//   --lang ko|en      label language (default ko)
//   --labels          keep labels and the step readout (posters are language-neutral, so off by default)
//   --time S          scene time in seconds (default: the scene's stillTime, else 2.5)
//   --view JSON       camera override, e.g. '{"yaw":0.6,"pitch":0.35}' (keys: yaw, pitch, dist, target, fov)
//   --frames N        write N PNG frames into the --out directory (default: a temp folder) for a GIF/turntable
//   --yaw-sweep       with --frames: orbit one full turn across the frames (else frames step the scene clock)
//   --duration S      with --frames and no --yaw-sweep: clock span in seconds (default 4)
//   --yaw-swing RAD   with --frames and no --yaw-sweep: also sway the camera yaw by ±RAD over one loop
//   --angle MODE      ANGLE backend: default | d3d11 | gl | swiftshader (default: try GPU, then swiftshader)
//   --chrome PATH     browser executable (default: installed Chrome, then Edge)
//
// puppeteer-core is not a dependency of this repository. Point SCENE3D_PUPPETEER_DIR (or NODE_PATH)
// at a node_modules folder that contains it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Query: ?scene=<name>&lang=ko|en&w=<css px>&h=<css px>&labels=0|1 ; __ROOT__ becomes the repository file URL.
const STAGE_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Scene stage</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">
<link rel="stylesheet" href="__ROOT__/css/site.css">
<link rel="stylesheet" href="__ROOT__/css/scholar.css">
<style>
  html, body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
  body { font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif; }
  .stage { position: relative; overflow: hidden; background: #fff; }
  .stage.no-labels .lb, .stage.no-labels .lead3d, .stage.no-labels .readout { visibility: hidden !important; }
  .stage .view3d__reset, .stage .view3d__hint { display: none !important; }
  .stage > img { display: none; }
</style>
<script>
  (function () {
    var q = new URLSearchParams(location.search);
    var lang = q.get('lang') === 'en' ? 'en' : 'ko';
    document.documentElement.lang = lang;
    if (q.has('t')) window.DECK3D_CLOCK = Number(q.get('t'));
    if (q.get('capture') === '1' && !window.SCENE3D_CAPTURE) window.SCENE3D_CAPTURE = {};
    window.SCENE3D_STAGE = {
      scene: (q.get('scene') || '').replace(/[^a-z0-9-]/g, ''),
      w: Math.max(32, Number(q.get('w')) || 880),
      h: Math.max(20, Number(q.get('h')) || 550),
      labels: q.get('labels') !== '0'
    };
  })();
</script>
</head>
<body class="td-shell">
<div id="stage" class="view3d stage"></div>
<script>
  (function () {
    var cfg = window.SCENE3D_STAGE, box = document.getElementById('stage');
    box.style.width = cfg.w + 'px';
    box.style.height = cfg.h + 'px';
    box.setAttribute('data-scene', cfg.scene);
    if (!cfg.labels) box.classList.add('no-labels');
  })();
</script>
<script src="__ROOT__/js/scene3d.js"></script>
<script>
  (function () {
    var name = window.SCENE3D_STAGE.scene;
    if (!name) return;
    var s = document.createElement('script');
    s.src = '__ROOT__/js/scenes/' + name + '.js';
    s.onerror = function () { document.body.setAttribute('data-stage-error', 'missing scene ' + name); };
    document.body.appendChild(s);
  })();
</script>
</body>
</html>
`;

function writeStage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scene3d-stage-'));
  const file = path.join(dir, 'stage.html');
  fs.writeFileSync(file, STAGE_HTML.split('__ROOT__').join(pathToFileURL(root).href), 'utf8');
  return { dir, file };
}

function parseArgs(argv) {
  const opts = { scene: '', size: [1600, 1000], css: [880, 550], png: false, quality: 88, lang: 'ko', labels: false,
    time: null, view: null, frames: 0, yawSweep: false, yawSwing: 0, duration: 4, angle: '', chrome: '', out: '' };
  const pair = (v) => { const m = /^(\d+)x(\d+)$/.exec(v || ''); if (!m) throw new Error(`expected WxH, got ${v}`); return [Number(m[1]), Number(m[2])]; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === '--size') opts.size = pair(next());
    else if (a === '--css') opts.css = pair(next());
    else if (a === '--out') opts.out = next();
    else if (a === '--png') opts.png = true;
    else if (a === '--quality') opts.quality = Number(next());
    else if (a === '--lang') opts.lang = next() === 'en' ? 'en' : 'ko';
    else if (a === '--labels') opts.labels = true;
    else if (a === '--time') opts.time = Number(next());
    else if (a === '--view') opts.view = JSON.parse(next());
    else if (a === '--frames') opts.frames = Number(next());
    else if (a === '--yaw-sweep') opts.yawSweep = true;
    else if (a === '--duration') opts.duration = Number(next());
    else if (a === '--yaw-swing') opts.yawSwing = Number(next());
    else if (a === '--angle') opts.angle = next();
    else if (a === '--chrome') opts.chrome = next();
    else if (!a.startsWith('--') && !opts.scene) opts.scene = a;
    else throw new Error(`unknown argument ${a}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(opts.scene)) throw new Error('usage: node scripts/capture-3d.mjs <scene> [options]');
  if (!fs.existsSync(path.join(root, 'js', 'scenes', `${opts.scene}.js`))) throw new Error(`no scene file js/scenes/${opts.scene}.js`);
  if (!opts.out) opts.out = opts.frames ? path.join(os.tmpdir(), 'scene3d-frames', opts.scene) : path.join('assets', '3d', `${opts.scene}.${opts.png ? 'png' : 'webp'}`);
  return opts;
}

function loadPuppeteer() {
  const dirs = [process.env.SCENE3D_PUPPETEER_DIR, ...(process.env.NODE_PATH || '').split(path.delimiter)].filter(Boolean);
  for (const dir of dirs) {
    try { return createRequire(path.join(path.resolve(dir), 'noop.js'))('puppeteer-core'); } catch { /* try the next folder */ }
  }
  try { return createRequire(import.meta.url)('puppeteer-core'); } catch { /* not installed here */ }
  throw new Error('puppeteer-core not found: set SCENE3D_PUPPETEER_DIR to a node_modules folder that contains it.');
}

function findChrome(explicit) {
  const candidates = [explicit, process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('no Chrome or Edge executable found; pass --chrome PATH');
  return found;
}

function angleFlags(mode) {
  if (mode === 'swiftshader') return ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  return ['--enable-gpu', '--ignore-gpu-blocklist', `--use-angle=${mode || 'default'}`];
}

async function renderOnce(puppeteer, executablePath, opts, angle) {
  const stage = writeStage();
  const browser = await puppeteer.launch({
    executablePath, headless: true,
    args: [...angleFlags(angle), '--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb']
  });
  try {
    const page = await browser.newPage();
    const scale = opts.size[0] / opts.css[0];
    await page.setViewport({ width: opts.css[0], height: opts.css[1], deviceScaleFactor: scale });
    const logs = [];
    page.on('console', (msg) => logs.push(msg.text()));
    page.on('pageerror', (error) => logs.push(String(error)));
    await page.evaluateOnNewDocument((time) => {
      window.SCENE3D_CAPTURE = { at: Date.now() };
      if (time !== null) window.DECK3D_CLOCK = time;
    }, opts.time);
    const url = pathToFileURL(stage.file);
    url.search = new URLSearchParams({ scene: opts.scene, lang: opts.lang, w: String(opts.css[0]), h: String(opts.css[1]), labels: opts.labels ? '1' : '0' }).toString();
    await page.goto(url.href, { waitUntil: 'load' });
    try {
      await page.waitForSelector('.view3d.live[data-scene3d-ready]', { timeout: 30000 });
    } catch (error) {
      throw new Error(`scene did not mount (${angle || 'default'}): ${logs.join(' | ') || error.message}`);
    }
    // default scene time = the scene's own still frame
    await page.evaluate(() => {
      const box = document.querySelector('.view3d');
      const opts = window.Scene3D.registry[box.dataset.scene] || {};
      if (typeof window.DECK3D_CLOCK !== 'number') window.DECK3D_CLOCK = typeof opts.stillTime === 'number' ? opts.stillTime : 2.5;
      box.__scene3d.render();
    });
    if (opts.view) await page.evaluate((view) => document.querySelector('.view3d').__scene3d.set(view), opts.view);
    const settle = () => page.evaluate(() => new Promise((resolve) => {
      document.querySelector('.view3d').__scene3d.render();
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    await settle();
    if (opts.labels) await new Promise((resolve) => setTimeout(resolve, 450));   // label fade-in
    const blank = await page.evaluate(() => {
      // a black or empty canvas means WebGL did not really draw
      const c = document.querySelector('.view3d canvas');
      const probe = document.createElement('canvas'); probe.width = 32; probe.height = 20;
      const x = probe.getContext('2d'); x.drawImage(c, 0, 0, 32, 20);
      const d = x.getImageData(0, 0, 32, 20).data; let lit = 0, dark = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 0 && (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250)) lit++; if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] < 30) dark++; }
      return lit < 4 || dark > 600;
    });
    if (blank) throw new Error(`blank or black canvas (${angle || 'default'})`);
    const box = await page.$('.view3d');
    const clip = await box.boundingBox();
    const type = opts.png || opts.frames ? 'png' : 'webp';
    const shot = (file) => page.screenshot({ path: file, type, clip, ...(type === 'webp' ? { quality: opts.quality } : {}), omitBackground: false });
    const out = path.resolve(root, opts.out);
    if (!opts.frames) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await shot(out);
      return [out];
    }
    fs.mkdirSync(out, { recursive: true });
    const files = [];
    const start = await page.evaluate(() => window.DECK3D_CLOCK);
    for (let i = 0; i < opts.frames; i++) {
      await page.evaluate((i, n, sweep, t0, span, swing) => {
        const hooks = document.querySelector('.view3d').__scene3d;
        if (sweep) hooks.orbit(i === 0 ? 0 : Math.PI * 2 / n);
        else {
          window.DECK3D_CLOCK = t0 + span * i / n;
          // the sway returns to its start on the last frame, so the loop has no seam
          if (swing) hooks.orbit(swing * (Math.sin(Math.PI * 2 * i / n) - (i ? Math.sin(Math.PI * 2 * (i - 1) / n) : 0)));
        }
      }, i, opts.frames, opts.yawSweep, start, opts.duration, opts.yawSwing);
      await settle();
      const file = path.join(out, `${opts.scene}-${String(i).padStart(3, '0')}.png`);
      await shot(file);
      files.push(file);
    }
    return files;
  } finally {
    await browser.close();
    fs.rmSync(stage.dir, { recursive: true, force: true });
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const puppeteer = loadPuppeteer();
  const executablePath = findChrome(opts.chrome);
  const modes = opts.angle ? [opts.angle] : ['default', 'swiftshader'];
  let lastError = null;
  for (const mode of modes) {
    try {
      const files = await renderOnce(puppeteer, executablePath, opts, mode);
      for (const file of files) process.stdout.write(`${path.relative(root, file)} (${fs.statSync(file).size} bytes, ANGLE ${mode})\n`);
      return;
    } catch (error) {
      lastError = error;
      process.stderr.write(`capture with ANGLE ${mode} failed: ${error.message}\n`);
    }
  }
  throw lastError;
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
