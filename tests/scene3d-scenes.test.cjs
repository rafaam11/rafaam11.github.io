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
      assert.equal(b.getAttribute('aria-label'), CIRCLED[i] + ' ' + steps[i].label[lang], 'accessible name contains the visible glyph (WCAG 2.5.3)');
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

test('ms-frac declares the four steps and leaves the readout to the step bar', () => {
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

test('matLib: seven kinds with the library defaults, fresh instances, unknown kinds throw', () => {
  const { S, THREE } = ko;
  const want = {
    steel: [0x9aa5b4, 0.3, 0.6], anodized: [0x2b313b, 0.4, 0.35], plastic: [0xe4e9f0, 0.45, 0.05], skin: [0xe7bf9f, 0.7, 0],
    bone: [0xe5d6ba, 0.72, 0], 'visor-glass': [0x0a0f18, 0.08, 0.3], 'emissive-marker': [0xf4f6f8, 0.22, 0.05]
  };
  assert.equal(typeof S.matLib, 'function');
  for (const [kind, [color, rough, metal]] of Object.entries(want)) {
    const a = S.matLib(THREE, kind), b = S.matLib(THREE, kind);
    assert.notEqual(a, b, `${kind} is a new instance per call`);
    assert.equal(a.color.getHex(), color, `${kind} colour`);
    assert.equal(a.roughness, rough, `${kind} roughness`);
    assert.equal(a.metalness, metal, `${kind} metalness`);
    assert.equal(a.userData.lib, kind);
  }
  assert.equal(S.matLib(THREE, 'emissive-marker').emissive.getHex(), 0x2a2a2a);
  const o = S.matLib(THREE, 'steel', { color: 0x123456, opacity: 0.5 });
  assert.equal(o.color.getHex(), 0x123456);
  assert.equal(o.opacity, 0.5);
  assert.equal(o.transparent, true);
  assert.throws(() => S.matLib(THREE, 'chrome'), /chrome/);
});

test('prepareMaterials linearizes once, honours gltf, flags shadows and returns the opaque bbox', () => {
  const { S, THREE } = ko;
  const group = new THREE.Group();
  const grey = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const solid = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 30), grey);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
  group.add(solid, glass);
  const expected = new THREE.Color(0x808080).convertSRGBToLinear().getHex();
  const bb = S.prepareMaterials(group, 1);
  assert.equal(grey.color.getHex(), expected);
  S.prepareMaterials(group, 1);
  assert.equal(grey.color.getHex(), expected, 'second call does not convert again');
  assert.equal(solid.castShadow, true);
  assert.equal(glass.castShadow, false, 'transparent meshes cast no shadow');
  assert.ok(!bb.isEmpty());
  assert.equal(bb.getSize(new THREE.Vector3()).x, 10, 'bbox ignores transparent meshes');
  const g2 = new THREE.Group(), m2 = new THREE.MeshStandardMaterial({ color: 0x808080, envMapIntensity: 1 });
  g2.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m2));
  S.prepareMaterials(g2, 0.5, { gltf: true });
  assert.equal(m2.color.getHex(), 0x808080, 'gltf colours stay as loaded');
  assert.equal(m2.userData.lin, true);
  assert.equal(m2.envMapIntensity, 0.5);
  S.prepareMaterials(g2, 0.5, { gltf: true });
  assert.equal(m2.envMapIntensity, 0.5, 'envK applied once');
});

test('floorPlate fades from a light grey centre to the page white at the rim', () => {
  const { S, THREE } = ko;
  const plate = S.floorPlate(THREE, new THREE.Vector3(5, 0, 7), -3, 100);
  assert.equal(plate.userData.kind, 'floor-plate');
  assert.equal(plate.geometry.type, 'BufferGeometry', 'honest geometry type');
  assert.equal(plate.material.toneMapped, false);
  assert.equal(plate.material.vertexColors, true);
  assert.equal(plate.userData.noShadow, true);
  assert.equal(plate.position.y, -3);
  const c = plate.geometry.attributes.color, mid = new THREE.Color(0xeef2f6).convertSRGBToLinear();
  assert.ok(Math.abs(c.getX(0) - mid.r) < 1e-3 && Math.abs(c.getY(0) - mid.g) < 1e-3 && Math.abs(c.getZ(0) - mid.b) < 1e-3, 'centre vertex');
  const last = c.count - 1;
  assert.deepEqual([c.getX(last), c.getY(last), c.getZ(last)], [1, 1, 1]);
});

test('lighting comes from the shared LOOK constants, not scene options', () => {
  const engine = read('js/scene3d.js');
  assert.doesNotMatch(engine, /opts\.(exposure|env|groundShadow)\b/);
  assert.match(engine, /toneMappingExposure = LOOK\.exposure/);
  assert.match(engine, /HemisphereLight\([^)]*LOOK\.hemi/);
  assert.match(engine, /DirectionalLight\([^)]*LOOK\.key/);
  assert.match(engine, /DirectionalLight\([^)]*LOOK\.fill/);
  assert.match(engine, /DirectionalLight\([^)]*LOOK\.rim/);
  assert.match(engine, /opacity: LOOK\.groundShadow/);
  assert.deepEqual(JSON.parse(JSON.stringify(ko.S.LOOK)), { exposure: 0.92, hemi: 0.08, key: 1.45, fill: 0.22, rim: 0.4, groundShadow: 0.2 });
});

test('chair and pointer helpers sit where their contracts say', () => {
  const { S, THREE } = ko;
  const chair = S.chair(THREE);
  const cb = new THREE.Box3().setFromObject(chair);
  assert.ok(cb.min.y >= -0.01 && cb.min.y <= 0.5, `chair floor at y=0 (${cb.min.y})`);
  assert.equal(chair.userData.seatY, 44);
  assert.ok(cb.max.y > 44, 'back rises above the seat');
  const p = S.pointer(THREE);
  const pb = new THREE.Box3().setFromObject(p.root);
  assert.ok(pb.min.y >= -0.5, `tip at the origin (${pb.min.y})`);
  assert.ok(pb.max.y > 25, 'default length about 30');
  let inside = false;
  for (let o = p.marker; o; o = o.parent) if (o === p.root) inside = true;
  assert.ok(inside, 'marker is a descendant of root');
  const long = new THREE.Box3().setFromObject(S.pointer(THREE, { len: 50 }).root);
  assert.ok(long.max.y > pb.max.y + 15);
});

test('every registered scene still builds with the refined library parts', () => {
  for (const name of Object.keys(ko.S.registry)) assert.doesNotThrow(() => buildScene(ko, name), name);
  const { S, THREE } = ko;
  const cam = S.skadiCam(THREE);
  assert.deepEqual(Array.from(cam.lenses.map((l) => l.position.x)), [-21, 21]);
  const size = new THREE.Box3().setFromObject(cam.head).getSize(new THREE.Vector3());
  assert.ok(size.x >= 53.9 && size.x <= 56, `bar width ${size.x}`);
  const kinds = new Set();
  S.person(THREE, { gear: 'quest' }).root.traverse((o) => { if (o.material && o.material.userData.lib) kinds.add(o.material.userData.lib); });
  assert.ok(kinds.has('visor-glass') && kinds.has('skin'));
});

// ---- scene batches A and B: ms-frac, occlusion, smcnavi, neuro, sgrt-poc, fk-safety, omfsvr, skadi --------------------------------------------------
const BATCH = {
  'ms-frac': { loop: 8, readout: /^$/, steps: [
    ['features', 0, 1.8, '치아·골절 단면 특징점', 'Tooth and fracture features', undefined],
    ['optimize', 1.8, 4.8, '골절편 위치 최적화', 'Fragment pose optimization', undefined],
    ['reduce', 4.8, 5.5, '교합 기준 정복', 'Occlusion-based reduction', undefined],
    ['distance', 5.5, 7, '표면 거리 비교', 'Surface-distance check', undefined]] },
  occlusion: { loop: 11, readout: /^$/, steps: [
    ['landmarks', 0, 2.4, '치아 랜드마크', 'Tooth landmarks', '1'],
    ['align', 2.4, 7.5, '교합 정렬', 'Occlusal alignment', '2'],
    ['evaluate', 7.6, 9.6, '교합 평가', 'Occlusion evaluation', '3']] },
  smcnavi: { loop: 9, readout: /하악 개구|Mandible opening/, steps: [
    ['chain', 0, 4, '환자–CT 좌표 체인', 'Patient–CT transform chain', '1'],
    ['track', 4.5, 7.5, '도구·하악 추적', 'Tool and mandible tracking', '2']] },
  neuro: { loop: 11, readout: /ICP|표적|target/, steps: [
    ['register', 0, 4.2, '랜드마크·ICP 정합', 'Landmark + ICP registration', '1'],
    ['align', 4.6, 9, '로봇 연동 코일 정렬', 'Coil alignment via robot', '2']] },
  omfsvr: { loop: 8, readout: /^$/, steps: [
    ['session', 0, 3.6, '3인 상담 세션', 'Three-user session', '1'],
    ['sync', 4, 7.6, '모델·페이지 동기화', 'Shared model pose and page', '2']] },
  'sgrt-poc': { loop: 13, readout: /^(들숨|날숨|Inhalation|Exhalation)$/, steps: [
    ['roi', 0, 3, '흉부 ROI 깊이', 'Chest ROI depth', '1'],
    ['wave', 3, 8, '호흡 파형', 'Respiratory waveform', '2'],
    ['gating', 8, 11.5, '게이팅(계획)', 'Gating (planned)', '3', true]] },
  // t0/t1 come from sampling sim() at 1/60 s: ph 1 = [4.70, 5.12), ph 2 = [5.12, 5.47), ph 3 = [5.47, 12) (the latch never releases); every t1 sits inside its ph
  'fk-safety': { loop: 12, readout: /^$/, steps: [
    ['warn', 4, 4.9, '경고 구역 감속', 'Warning zone: slow down', '1'],
    ['stop', 4.9, 5.3, '정지 구역 정지', 'Stop zone: stop', '2'],
    ['estop', 5.3, 6.1, 'E-STOP 래칭', 'E-STOP latched', '3']] }
};
// floating content (enlarged dentition, trackers) would read as lying on a floor: these scenes opt out of the plate
// omfsvr draws its own room floor (plan ruling 7)
const GROUND_OFF = new Set(['occlusion', 'smcnavi', 'omfsvr', 'skadi']);
const LABEL_CLASSES = new Set(['s', 's c', 's n', 's o', 's r', 's g']);

function snapshot(built) {
  const pos = new built.scene.position.constructor();
  const anchors = Object.keys(built.api.anchors || {}).sort().map((k) => {
    const o = built.api.anchors[k];
    o.updateWorldMatrix(true, false);
    o.getWorldPosition(pos);
    return `${k}:${pos.x.toFixed(3)},${pos.y.toFixed(3)},${pos.z.toFixed(3)}`;
  });
  return JSON.stringify({ readout: built.readout(), ph: built.ph(), anchors });
}

for (const [name, spec] of Object.entries(BATCH)) {
  test(`${name}: step table, readout, labels and time purity in ko and en`, () => {
    for (const env of [ko, en]) {
      const lang = env === ko ? 'ko' : 'en';
      const opts = env.S.registry[name];
      assert.equal(opts.loop, spec.loop);
      assert.deepEqual(Array.from(opts.steps, (s) => [s.id, s.t0, s.t1]), spec.steps.map((s) => s.slice(0, 3)));
      assert.deepEqual(Array.from(opts.steps, (s) => s.label[lang]), spec.steps.map((s) => (lang === 'ko' ? s[3] : s[4])));
      assert.deepEqual(Array.from(opts.steps, (s) => !!s.planned), spec.steps.map((s) => !!s[6]));
      const built = buildScene(env, name);
      spec.steps.forEach((s) => {
        built.tick(s[2]);
        if (s[5]) assert.equal(String(built.ph()), s[5], `${name}/${s[0]}: ph at t1`);
        assert.match(built.readout(), spec.readout, `${name}/${s[0]}: readout`);
        assert.ok(![...built.readout()].some((ch) => CIRCLED.includes(ch)), 'no circled digits in the readout');
        for (const st of opts.steps) assert.ok(!built.readout().includes(st.label[lang]), 'readout does not repeat a step label');
      });
      const lastT1 = spec.steps[spec.steps.length - 1][2], firstT0 = spec.steps[0][1];
      built.tick(lastT1); const a = snapshot(built);
      built.tick(firstT0); built.tick(lastT1);
      assert.equal(snapshot(built), a, `${name}: state depends on time only`);
      assert.ok(built.labels.length >= 1);
      for (const l of built.labels) {
        assert.ok(LABEL_CLASSES.has(l.cls), `${name}: class "${l.cls}"`);
        assert.ok([...l.text].length <= (lang === 'ko' ? KO_MAX : EN_MAX), `${name}: label "${l.text}" over budget`);
        assert.ok(![...l.text].some((ch) => CIRCLED.includes(ch)), 'no circled digits in a label');
      }
      assert.equal(built.lights, 0, 'scenes add no lights');
    }
  });

  test(`${name}: unified camera, shared look and no ignored options`, () => {
    const opts = ko.S.registry[name];
    assert.equal(opts.fov, 30);
    assert.ok(opts.pitch >= 0.35 && opts.pitch <= 0.45, `pitch ${opts.pitch}`);
    assert.ok(opts.autoYaw === undefined || (opts.autoYaw >= 0.01 && opts.autoYaw <= 0.06));
    for (const key of ['exposure', 'env', 'groundShadow', 'shadowMap', 'stillTime']) assert.ok(!(key in opts), `${name}: option ${key}`);
    if (GROUND_OFF.has(name)) assert.strictEqual(opts.ground, false, `${name}: floating content, no floor`);
    else assert.ok(!('ground' in opts), `${name}: option ground`);
    const src = read(`js/scenes/${name}.js`);
    assert.match(src, /matLib\(/);
    assert.doesNotMatch(src, /0x9aa5b4/);
  });
}

test('scene sources use the shared parts', () => {
  assert.match(read('js/scenes/neuro.js'), /D\.chair\(/);
  assert.match(read('js/scenes/neuro.js'), /D\.pointer\(/);
  assert.match(read('js/scenes/smcnavi.js'), /D\.pointer\(/);
  const fit = ko.S.registry.occlusion.fit.box;
  assert.ok(fit[1][0] - fit[0][0] >= 30 && fit[1][0] - fit[0][0] <= 70, 'occlusion fit box is in cm');
  assert.doesNotMatch(read('js/scenes/occlusion.js'), /Units mm/);
});

test('smcnavi phase 1 shows the patient-CT links, phase 2 the pointer links', () => {
  const built = buildScene(ko, 'smcnavi');
  const links = built.scene.children.filter((o) => o.userData && o.userData.link);
  assert.equal(links.length, 4, 'four tagged chain links');
  const shown = () => links.filter((o) => o.visible).map((o) => o.userData.link).sort().join();
  built.tick(4); assert.equal(shown(), 'camRef,refCt');
  built.tick(7.5); assert.equal(shown(), 'camPtr,ptrTip');
});

test('neuro readout counts ICP iterations and targets', () => {
  const k = buildScene(ko, 'neuro'), e = buildScene(en, 'neuro');
  k.tick(4.2); assert.match(k.readout(), /^ICP 반복 \d$/);
  k.tick(9); assert.match(k.readout(), /^표적 \d$/);
  e.tick(4.2); assert.match(e.readout(), /^ICP iteration \d$/);
  e.tick(9); assert.match(e.readout(), /^target \d$/);
});

test('no scene file passes exposure, env, groundShadow or shadowMap', () => {
  for (const name of ['ms-frac', 'occlusion', 'smcnavi', 'neuro', 'sgrt-poc', 'fk-safety', 'omfsvr', 'skadi']) {
    assert.doesNotMatch(read(`js/scenes/${name}.js`), /\b(exposure|env|groundShadow|shadowMap)\s*:/, name);
  }
});

test('engine mount: floor plate at bbox min.y - 0.4, radius about 3R, contact shadow 0.1 above; ground:false adds neither', () => {
  const { S, THREE } = ko;
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(60, 80, 100), new THREE.MeshStandardMaterial()));
  group.position.set(10, 50, -20);
  const scene = new THREE.Scene(); scene.add(group); scene.updateMatrixWorld(true);
  const bb = S.prepareMaterials(scene, 1);
  const R = Math.max(40, bb.getSize(new THREE.Vector3()).length() / 2);
  const on = S.addFloor(THREE, scene, bb, {}, true);
  assert.ok(on.plate && on.shadow);
  assert.ok(Math.abs(on.plate.position.y - (bb.min.y - 0.4)) < 1e-9);
  on.plate.geometry.computeBoundingBox();
  assert.ok(Math.abs(on.plate.geometry.boundingBox.max.x - R * 3) < 1e-6, 'radius = 3R');
  assert.ok(Math.abs(on.shadow.position.y - on.plate.position.y - 0.1) < 1e-9, 'shadow plane 0.1 above');
  assert.ok(scene.children.includes(on.plate) && scene.children.includes(on.shadow));
  const noShadowMap = S.addFloor(THREE, new THREE.Scene(), bb, {}, false);
  assert.ok(noShadowMap.plate && !noShadowMap.shadow);
  const scene2 = new THREE.Scene();
  const off = S.addFloor(THREE, scene2, bb, { ground: false }, true);
  assert.equal(off.plate, null); assert.equal(off.shadow, null);
  assert.equal(scene2.children.length, 0);
});

test('floorPlate eases out: monotone toward the page white, flattening at the rim', () => {
  const { S, THREE } = ko;
  const plate = S.floorPlate(THREE, new THREE.Vector3(), 0, 100), c = plate.geometry.attributes.color, p = plate.geometry.attributes.position;
  const byR = new Map();
  for (let i = 0; i < c.count; i++) byR.set(Math.round(Math.hypot(p.getX(i), p.getY(i))), c.getX(i));
  const rs = [...byR.keys()].sort((a, b) => a - b);
  assert.ok(rs.length >= 6, 'intermediate rings exist');
  let prev = -1;
  for (const r of rs) { assert.ok(byR.get(r) >= prev - 1e-9, 'monotone toward white'); prev = byR.get(r); }
  assert.ok(byR.get(rs[rs.length - 1]) - byR.get(rs[rs.length - 2]) < byR.get(rs[2]) - byR.get(rs[1]), 'ramp flattens toward the rim');
});

// ---- batch B specifics ------------------------------------------------------------------------------------
test('step counts across all eight scenes', () => {
  const counts = {};
  for (const [name, o] of Object.entries(ko.S.registry)) counts[name] = o.steps ? o.steps.length : 0;
  assert.deepEqual(counts, { 'ms-frac': 4, neuro: 2, occlusion: 3, smcnavi: 2, omfsvr: 2, 'sgrt-poc': 3, 'fk-safety': 3, skadi: 0 });
});

test('all eight scene sources use the material library', () => {
  for (const name of Object.keys(ko.S.registry)) assert.match(read(`js/scenes/${name}.js`), /matLib\(/, name);
});

test('skadi: continuous clock, unified camera, shared pointer, floor off (floating tracker)', () => {
  const opts = ko.S.registry.skadi;
  assert.equal(opts.steps, undefined);
  assert.equal(typeof opts.stillTime, 'number');
  assert.equal(opts.fov, 30);
  assert.ok(opts.pitch >= 0.35 && opts.pitch <= 0.45, `pitch ${opts.pitch}`);
  assert.ok(opts.autoYaw === undefined || (opts.autoYaw >= 0.01 && opts.autoYaw <= 0.06));
  for (const key of ['exposure', 'env', 'groundShadow', 'shadowMap']) assert.ok(!(key in opts), key);
  assert.strictEqual(opts.ground, false);
  assert.match(read('js/scenes/skadi.js'), /D\.pointer\(THREE, \{ len: 44, marker: 3 \}\)/);
  for (const env of [ko, en]) {
    const built = buildScene(env, 'skadi');
    built.tick(2.5);
    assert.match(built.readout(), /6DoF/);
    assert.equal(built.lights, 0);
    for (const l of built.labels) assert.ok([...l.text].length <= (env === ko ? KO_MAX : EN_MAX), l.text);
  }
});

test('sgrt-poc: dashed gating window only in the planned step, shared chair', () => {
  const src = read('js/scenes/sgrt-poc.js');
  assert.doesNotMatch(src, /gating signal|게이트 신호|derived from it/i);
  assert.match(src, /D\.chair\(/);
  assert.match(src, /LineDashedMaterial/);
  assert.match(src, /computeLineDistances/);
  for (const env of [ko, en]) {
    const lang = env === ko ? 'ko' : 'en';
    const built = buildScene(env, 'sgrt-poc');
    const gate = built.labels.find((l) => /게이팅|Gating/.test(l.text));
    assert.ok(gate && gate.ph === '3', 'gating label shows in ph 3 only');
    assert.match(gate.text, lang === 'ko' ? /\(계획\)/ : /\(planned\)/);
    const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    let dashed = null, wave = null;
    built.scene.traverse((o) => { if (o.userData && o.userData.gate) dashed = o; if (o.userData && o.userData.wave) wave = o; });
    assert.ok(dashed && dashed.material.isLineDashedMaterial, 'dashed gating line is tagged userData.gate');
    assert.ok(wave, 'waveform line is tagged userData.wave');
    built.tick(8); assert.equal(shown(dashed), false, 'hidden before the planned step (ph 2)');
    built.tick(11.5); assert.equal(String(built.ph()), '3'); assert.equal(shown(dashed), true);
    built.tick(3); assert.equal(shown(dashed), false);
    assert.equal(shown(wave), false, 'no waveform in ph 1');
    built.tick(8); assert.equal(shown(wave), true);
  }
});

test('fk-safety: per-sensor zones, E-STOP with the person in the innermost zone, safety LiDAR x3', () => {
  const src = read('js/scenes/fk-safety.js');
  assert.doesNotMatch(src, /bumper|범퍼|three-zone|three-tier|세 겹|3단/i);
  const k = buildScene(ko, 'fk-safety'), e = buildScene(en, 'fk-safety');
  assert.ok(k.labels.some((l) => l.text === '센서별 경고·정지 구역'));
  assert.ok(e.labels.some((l) => l.text === 'Per-sensor warn/stop zones'));
  assert.ok(k.labels.some((l) => l.text === '안전 2D LiDAR') && e.labels.some((l) => l.text === 'Safety 2D LiDAR'));
  assert.ok(k.labels.some((l) => l.text === '마스트 LiDAR') && e.labels.some((l) => l.text === 'Mast LiDAR'));
  assert.ok(k.api.anchors.zones, 'zones anchor');
  let safety = 0;
  k.scene.traverse((o) => { if (o.userData && o.userData.safetyLidar) safety += 1; });
  assert.equal(safety, 3);
  const seen = {};
  for (let i = 0; i <= 720; i++) { k.tick(i / 60); (seen[k.ph()] = seen[k.ph()] || new Set()).add(k.readout()); }
  assert.deepEqual(Object.keys(seen).sort(), ['0', '1', '2', '3']);
  // phases advance in order within one loop and the E-STOP latch holds to the end of it (no reset, no release)
  const order = [];
  for (let i = 0; i < 12 * 60; i++) { k.tick(i / 60); const p = Number(k.ph()); if (order[order.length - 1] !== p) order.push(p); }
  assert.deepEqual(order, [0, 1, 2, 3], 'fk-safety phase order over one loop');
  for (const t of [6.1, 8, 10, 11.99]) { k.tick(t); assert.equal(String(k.ph()), '3', `latched at ${t}`); }
  for (const ph of ['1', '2', '3']) assert.deepEqual([...seen[ph]], [''], `ph ${ph} has an empty readout`);
  assert.deepEqual([...seen['0']], ['정상 주행']);
  assert.doesNotMatch(src, /리셋|[Rr]eset/);
  const worker = k.scene.children.find((o) => o.userData && o.userData.worker);
  assert.ok(worker, 'worker tagged');
  k.tick(6.1);
  assert.equal(String(k.ph()), '3');
  assert.ok(Math.abs(worker.position.x) < 46 + 12, `person x ${worker.position.x}: innermost zone`);
});

test('HoloLens in any scene string carries its period', () => {
  for (const env of [ko, en]) {
    for (const name of Object.keys(env.S.registry)) {
      const built = buildScene(env, name);
      const strings = built.labels.map((l) => l.text + ' ' + l.small).concat((built.opts.steps || []).map((s) => s.label.ko + ' ' + s.label.en));
      for (const str of strings) if (/HoloLens|홀로렌즈/.test(str)) assert.match(str, /\(2024–2025\)/, `${name}: ${str}`);
    }
  }
  const data = require('../js/portfolio-data.js');
  const nav = data.projects.find((p) => p.slug === 'surgical-navigation').scene3d.translations;
  assert.match(nav.ko.caption, /\(2024–2025\)/);
  assert.match(nav.en.caption, /\(2024–2025\)/);
});

test('neuro: no readout fragment during landmarks, patient marker label', () => {
  const k = buildScene(ko, 'neuro');
  k.tick(1); assert.equal(k.readout(), '');
  assert.ok(k.labels.some((l) => l.text === '환자 마커'));
  assert.ok(buildScene(en, 'neuro').labels.some((l) => l.text === 'Patient marker'));
});

test('floor radius is computed once in the engine', () => {
  assert.equal((read('js/scene3d.js').match(/Math\.max\(40, /g) || []).length, 1);
});
