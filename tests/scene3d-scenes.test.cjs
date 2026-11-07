// 3D figure step buttons, the held-last-step time model and the per-scene step contract, run headless
// (tests/helpers/scene-harness.cjs: three.js + engine + scenes in a vm with a fake DOM; no browser).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadScene3d, buildScene } = require('./helpers/scene-harness.cjs');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const ko = loadScene3d('ko');
const en = loadScene3d('en');

const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
const KO_MAX = 14, EN_MAX = 28;

test('stepClock holds the last step, replays from t0 on pick, and jumps under reduced motion', () => {
  const steps = [{ t0: 0, t1: 2 }, { t0: 2, t1: 5 }];
  const c = ko.S.layout.stepClock(steps);
  assert.equal(c.index, 1);
  assert.equal(c.playing, false);
  assert.equal(c.time(0, false), 5);
  c.play(0, 1000);
  assert.equal(c.index, 0);
  assert.equal(c.playing, true);
  assert.equal(c.time(1000, false), 0);
  assert.equal(c.time(2000, false), 1);
  assert.equal(c.time(9000, false), 2);
  assert.equal(c.playing, false);
  assert.equal(c.time(12000, false), 2, 'held at t1');
  c.play(0, 20000);
  assert.equal(c.time(20500, false), 0.5);
  c.play(1, 21500);
  assert.equal(c.time(21500, false), 2, 'picking another step while playing restarts at its t0');
  c.play(0, 30000);
  assert.equal(c.time(31000, true), 2, 'reduced motion: the step t1, no playback');
  assert.equal(c.playing, false);
});

test('stepBar builds an accessible numbered button row in both languages', () => {
  const steps = [
    { id: 'a', t0: 0, t1: 1, label: { ko: '첫째 단계', en: 'First' } },
    { id: 'b', t0: 1, t1: 2, label: { ko: '둘째 단계', en: 'Second' } },
    { id: 'c', t0: 2, t1: 3, label: { ko: '셋째 단계(계획)', en: 'Third (planned)' }, planned: true }
  ];
  for (const env of [ko, en]) {
    const lang = env === ko ? 'ko' : 'en';
    const picked = [];
    const bar = env.S.stepBar(env.document, steps, (i) => picked.push(i));
    const el = bar.el;
    assert.equal(el.tagName, 'div');
    assert.ok(el.classList.contains('view3d__steps'));
    assert.equal(el.getAttribute('role'), 'group');
    assert.equal(el.getAttribute('aria-label'), lang === 'ko' ? '단계' : 'Steps');
    const buttons = el.querySelectorAll('button');
    assert.equal(buttons.length, steps.length);
    const labelEl = el.querySelector('.view3d__step-label');
    assert.ok(labelEl);
    assert.equal(labelEl.getAttribute('aria-live'), 'polite');
    buttons.forEach((b, i) => {
      assert.ok(b.classList.contains('view3d__step'));
      assert.equal(b.textContent, CIRCLED[i]);
      assert.equal(b.getAttribute('type'), 'button');
      assert.equal(b.getAttribute('aria-label'), steps[i].label[lang]);
      assert.equal(b.getAttribute('title'), steps[i].label[lang]);
      assert.equal(b.classList.contains('is-planned'), !!steps[i].planned);
    });
    const pressed = () => buttons.map((b) => b.getAttribute('aria-pressed'));
    assert.deepEqual(pressed(), ['false', 'false', 'true'], 'starts on the last step');
    assert.equal(labelEl.textContent, steps[2].label[lang]);
    buttons[0].click();
    assert.deepEqual(picked, [0]);
    bar.set(0);
    assert.deepEqual(pressed(), ['true', 'false', 'false']);
    assert.equal(labelEl.textContent, steps[0].label[lang]);
  }
});

function checkSteps(name, opts) {
  const steps = opts.steps;
  assert.ok(Array.isArray(steps) && steps.length >= 2 && steps.length <= 6, `${name}: 2-6 steps`);
  assert.equal(typeof opts.loop, 'number', `${name}: loop`);
  assert.equal(opts.stillTime, undefined, `${name}: step scenes have no stillTime`);
  const ids = new Set();
  steps.forEach((s, i) => {
    assert.match(s.id, /^[a-z0-9-]+$/, `${name}: id`);
    assert.ok(!ids.has(s.id), `${name}: duplicate id ${s.id}`); ids.add(s.id);
    assert.ok(s.t0 >= 0 && s.t0 < s.t1, `${name}/${s.id}: 0 <= t0 < t1`);
    if (i) assert.ok(steps[i - 1].t1 <= s.t0, `${name}/${s.id}: steps do not overlap`);
    for (const lang of ['ko', 'en']) {
      const text = s.label[lang];
      assert.ok(typeof text === 'string' && text.length > 0, `${name}/${s.id}: ${lang} label`);
      assert.ok([...text].length <= (lang === 'ko' ? KO_MAX : EN_MAX), `${name}/${s.id}: ${lang} label "${text}" is over budget`);
      assert.ok(![...text].some((ch) => CIRCLED.includes(ch)), `${name}/${s.id}: no circled digits in a label`);
      assert.equal(/\((계획|planned)\)/.test(text), !!s.planned, `${name}/${s.id}: planned <-> "(계획)/(planned)" in ${lang}`);
    }
  });
  assert.ok(steps[steps.length - 1].t1 < opts.loop, `${name}: last t1 < loop`);
}

test('every scene with steps follows the step schema and label budgets', () => {
  const withSteps = Object.entries(ko.S.registry).filter(([, o]) => o.steps);
  assert.ok(withSteps.length >= 1);
  for (const [name, opts] of withSteps) checkSteps(name, opts);
});

test('ms-frac declares the four planned steps and leaves the readout to the step bar', () => {
  const opts = ko.S.registry['ms-frac'];
  assert.equal(opts.loop, 8);
  assert.deepEqual(Array.from(opts.steps, (s) => [s.id, s.t0, s.t1]), [['features', 0, 1.8], ['optimize', 1.8, 4.8], ['reduce', 4.8, 5.5], ['distance', 5.5, 7]]);
  assert.deepEqual(Array.from(opts.steps, (s) => s.label.ko), ['치아·골절 단면 특징점', '골절편 위치 최적화', '교합 기준 정복', '표면 거리 비교']);
  assert.deepEqual(Array.from(opts.steps, (s) => s.label.en), ['Tooth and fracture features', 'Fragment pose optimization', 'Occlusion-based reduction', 'Surface-distance check']);
  assert.ok(opts.steps.every((s) => !s.planned));
  for (const env of [ko, en]) {
    const built = buildScene(env, 'ms-frac');
    for (const s of opts.steps) {
      built.tick(s.t1);
      assert.equal(built.readout(), '', `readout stays empty at t=${s.t1}`);
    }
    for (const l of built.labels) {
      assert.ok([...l.text].length <= (env === ko ? KO_MAX : EN_MAX), `label "${l.text}" within budget`);
    }
  }
  assert.doesNotMatch(read('js/scenes/ms-frac.js'), /stillTime|read\.textContent/);
});

test('harness builds and ticks every registered scene', () => {
  const names = Object.keys(ko.S.registry).sort();
  assert.deepEqual(Array.from(names), ['fk-safety', 'ms-frac', 'neuro', 'occlusion', 'omfsvr', 'sgrt-poc', 'skadi', 'smcnavi']);
  for (const name of names) {
    const built = buildScene(ko, name);
    for (const t of [0.5, 3, 6]) built.tick(t);
    assert.ok(built.labels.length >= 1, `${name} has labels`);
  }
});

test('engine wires the step bar into layout, lifecycle and the time model', () => {
  const engine = read('js/scene3d.js');
  assert.match(engine, /obstacle\(stepsBar\)/, 'labels avoid the step bar');
  assert.match(engine, /steps \? 56 : readout \? 34 : 8/, 'bottom margin 56 with steps, 34 with a readout only');
  assert.match(engine, /classList\.add\('has-steps'\)/);
  assert.ok((engine.match(/classList\.remove\('has-steps'\)/g) || []).length >= 2, 'has-steps is removed on release and on a failed mount');
  assert.doesNotMatch(engine, /Math\.sin\(s \* 0\.25\)/, 'sway follows wall-clock seconds, not scene time');
  assert.match(engine, /Math\.sin\(wall \* 0\.25\)/);
  assert.match(engine, /stepClock/);
  assert.match(engine, /stepBar: stepBar/);
});

test('step bar CSS: live only, printed away, 24px targets, pressed/planned/focus states', () => {
  const css = read('css/scholar.css');
  const lines = css.split(/\r?\n/);
  const hide = lines.find((l) => /^\.view3d\.live > img, \.view3d:not\(\.live\) :is\(/.test(l));
  assert.ok(hide && /\.view3d__steps/.test(hide) && /\.view3d__hint/.test(hide), 'hidden until live');
  const print = lines.find((l) => /^@media print \{.*\.view3d canvas/.test(l));
  assert.ok(print && /\.view3d__steps/.test(print) && /\.view3d__hint/.test(print), 'hidden in print');
  const esc = (s) => s.replace(/[.[\]"=():-]/g, '\\$&');
  const rule = (selector) => { const m = new RegExp(`^${esc(selector)} \\{([^}]*)\\}`, 'm').exec(css); return m ? m[1] : ''; };
  assert.match(rule('.view3d__step[aria-pressed="true"]'), /var\(--sc-link\)/);
  assert.match(rule('.view3d__step.is-planned'), /border-style: dashed/);
  assert.match(rule('.view3d__step:focus-visible'), /outline: 2px solid/);
  const step = rule('.view3d__step');
  assert.ok(/min-width: 1\.5rem/.test(step) && /height: 1\.5rem/.test(step), 'targets are at least 1.5rem');
  assert.match(rule('.view3d.has-steps .readout'), /bottom: \d/, 'readout sits on the line above the bar');
  assert.match(rule('.view3d__step-label'), /text-overflow: ellipsis/);
  assert.match(rule('.view3d__steps'), /position: absolute/);
});

test('capture script: --step, step-aware default time, stage hides the step bar', () => {
  const capture = read('scripts/capture-3d.mjs');
  assert.match(capture, /a === '--step'/);
  assert.match(capture, /--step[^\n]*--time|--time[^\n]*--step/, 'combining --step and --time is rejected');
  assert.match(capture, /has \$\{[^}]*\} steps/);
  assert.match(capture, /steps\[steps\.length - 1\]\.t1|steps\.at\(-1\)\.t1/);
  assert.match(capture, /\.stage \.view3d__steps/);
});
