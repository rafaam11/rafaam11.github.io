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
  assert.ok(Math.abs(cb.max.y - 44) > 0 && cb.max.y > 44, 'back rises above the seat');
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

// ---- scene batch A: ms-frac, occlusion, smcnavi, neuro --------------------------------------------------
// Widen BATCH_A (or the file list in the "ignored options" test) when more scene files adopt the shared look.
const BATCH_A = {
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
    ['align', 4.6, 9, '로봇 연동 코일 정렬', 'Coil alignment via robot', '2']] }
};
// floating content (enlarged dentition, tracker) would read as lying on a floor: these scenes opt out of the plate
const GROUND_OFF = new Set(['occlusion', 'smcnavi']);
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

for (const [name, spec] of Object.entries(BATCH_A)) {
  test(`${name}: step table, readout, labels and time purity in ko and en`, () => {
    for (const env of [ko, en]) {
      const lang = env === ko ? 'ko' : 'en';
      const opts = env.S.registry[name];
      assert.equal(opts.loop, spec.loop);
      assert.deepEqual(Array.from(opts.steps, (s) => [s.id, s.t0, s.t1]), spec.steps.map((s) => s.slice(0, 3)));
      assert.deepEqual(Array.from(opts.steps, (s) => s.label[lang]), spec.steps.map((s) => (lang === 'ko' ? s[3] : s[4])));
      assert.ok(opts.steps.every((s) => !s.planned));
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

test('batch A scene sources use the shared parts', () => {
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

test('no batch A scene file passes exposure, env, groundShadow or shadowMap', () => {
  for (const name of ['ms-frac', 'occlusion', 'smcnavi', 'neuro']) {
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
