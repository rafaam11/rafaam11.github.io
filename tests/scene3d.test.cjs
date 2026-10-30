// 3D figure contracts (docs/superpowers/specs/2026-10-30-3d-figures-design.md): data shape, renderer placement,
// page script sequence, poster and scene-file checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const validator = require('../scripts/validate-portfolio.cjs');

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
const sceneProjects = () => data.projects.filter((project) => project.scene3d);

function caseFile(slug, locale) {
  return validator.publicPortfolioFiles(root).find((file) => file.route === `projects/${slug}/` && file.locale === locale);
}

function tempRoot(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scene3d-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const relativePath of ['js/scene3d.js', 'js/vendor/three-r128.min.js', 'js/scenes', 'assets/3d']) {
    fs.cpSync(path.join(root, relativePath), path.join(dir, relativePath), { recursive: true });
  }
  return dir;
}

test('scene3d records are valid, unique, and the mandibular pilot is declared', () => {
  assert.deepEqual(render.dataErrors(data), []);
  const mandibular = data.projects.find((project) => project.slug === 'mandibular-fracture');
  assert.deepEqual(Object.keys(mandibular.scene3d).sort(), ['name', 'poster', 'translations']);
  assert.equal(mandibular.scene3d.name, 'ms-frac');
  assert.equal(mandibular.scene3d.poster, 'assets/3d/ms-frac.webp');
  for (const locale of ['ko', 'en']) {
    assert.ok(mandibular.scene3d.translations[locale].caption.trim());
    assert.ok(mandibular.scene3d.translations[locale].alt.trim());
  }
  assert.equal(data.projects.find((project) => project.slug === 'ai-build-lab').scene3d, undefined, 'AI Build Lab has no 3D figure');
  const names = sceneProjects().map((project) => project.scene3d.name);
  assert.equal(new Set(names).size, names.length);
});

test('scene3d data validation rejects malformed records', () => {
  const index = data.projects.findIndex((project) => project.slug === 'mandibular-fracture');
  const cases = [
    [(scene) => { scene.poster = 'assets/3d/other.webp'; }, /poster must be assets\/3d\/ms-frac\.webp/],
    [(scene) => { scene.poster = 'assets/3d/ms-frac.png'; }, /poster must be/],
    [(scene) => { scene.name = 'Ms Frac'; }, /lowercase slug/],
    [(scene) => { scene.extra = true; }, /allows only name, poster, and translations/],
    [(scene) => { delete scene.translations.en.caption; }, /caption/],
    [(scene) => { scene.translations.ko.alt = ' '; }, /alt/]
  ];
  for (const [mutate, expected] of cases) {
    const candidate = clone(data);
    mutate(candidate.projects[index].scene3d);
    assert.match(render.dataErrors(candidate).join('\n'), expected);
  }
  const notObject = clone(data);
  notObject.projects[index].scene3d = 'ms-frac';
  assert.match(render.dataErrors(notObject).join('\n'), /scene3d must be an object/);
  const duplicate = clone(data);
  duplicate.projects.find((project) => project.slug === 'rtms-navigation').scene3d = clone(duplicate.projects[index].scene3d);
  assert.match(render.dataErrors(duplicate).join('\n'), /duplicate scene3d name/);
  const partner = clone(data);
  partner.projects[index].scene3d.translations.en.caption = 'KAERI concept';
  assert.match(render.dataErrors(partner).join('\n'), /nonpublic partner/i);
  const home = clone(data);
  home.homeScene3d = { name: 'home-tracking', poster: 'assets/3d/home.webp', translations: { ko: { caption: 'c', alt: 'a' }, en: { caption: 'c', alt: 'a' } } };
  assert.match(render.dataErrors(home).join('\n'), /home: scene3d poster must be assets\/3d\/home-tracking\.webp/);
});

test('case renderer puts the 3D figure inside Approach after the lead and shifts the gallery numbers', () => {
  for (const [locale, figure] of [['ko', '그림'], ['en', 'Figure']]) {
    const html = render.caseStudyHtml(data, 'mandibular-fracture', '../../', false, locale);
    const figures = html.match(/<figure\b[\s\S]*?<\/figure>/g);
    assert.match(figures[0], new RegExp(`${figure} 1\\.`));
    assert.match(figures[1], /class="sc-figure sc-figure3d"/);
    assert.match(figures[1], new RegExp(`${figure} 2\\.`));
    assert.match(figures[1], /<div class="view3d" data-scene="ms-frac"><img src="\.\.\/\.\.\/assets\/3d\/ms-frac\.webp" alt="[^"]+" width="1600" height="1000" loading="lazy" decoding="async"><\/div>/);
    const labels = [...html.matchAll(/sc-figure__label">[^<]*?(\d+)\./g)].map((match) => Number(match[1]));
    assert.deepEqual(labels, labels.map((_, i) => i + 1), `${locale}: consecutive figure numbers`);
    // the figure is inside the Approach section, never a direct child of the article (js/local-projects.js lead rule)
    const approachStart = html.indexOf(locale === 'ko' ? '<h2>접근</h2>' : '<h2>Approach</h2>');
    const approachEnd = html.indexOf('</section>', approachStart);
    const at = html.indexOf('sc-figure3d');
    assert.ok(approachStart > 0 && at > approachStart && at < approachEnd, `${locale}: 3D figure inside Approach`);
  }
  for (const slug of ['ai-build-lab', 'rtms-navigation']) {
    assert.doesNotMatch(render.caseStudyHtml(data, slug, '', false, 'ko'), /view3d|sc-figure3d/, `${slug} has no 3D figure`);
  }
});

test('story layout places the 3D figure in the overview section and shifts story figure numbers', () => {
  const candidate = clone(data);
  const story = candidate.projects.find((project) => Array.isArray(project.storySections) && project.storySections.length && project.caseLayout !== 'product-console');
  const before = render.caseStudyHtml(candidate, story.slug, '', false, 'en');
  story.scene3d = { name: 'story-test', poster: 'assets/3d/story-test.webp', translations: { ko: { caption: '개념', alt: '개념도' }, en: { caption: 'Concept', alt: 'Concept figure' } } };
  const after = render.caseStudyHtml(candidate, story.slug, '', false, 'en');
  const count = (html) => [...html.matchAll(/sc-figure__label">Figure (\d+)\./g)].map((match) => Number(match[1]));
  assert.equal(count(after).length, count(before).length + 1);
  assert.deepEqual(count(after), count(after).map((_, i) => i + 1));
  const overview = after.indexOf('<h2>Project overview</h2>');
  assert.ok(overview > 0 && after.indexOf('sc-figure3d') > overview && after.indexOf('sc-figure3d') < after.indexOf('</section>', overview));
  const consoleCase = candidate.projects.find((project) => project.caseLayout === 'product-console');
  consoleCase.scene3d = { name: 'console-test', poster: 'assets/3d/console-test.webp', translations: story.scene3d.translations };
  assert.doesNotMatch(render.caseStudyHtml(candidate, consoleCase.slug, '', false, 'en'), /sc-figure3d/, 'product-console placement is not wired yet');
});

test('only pages with a declared scene load scene3d.js and their scene, right after the renderer', () => {
  for (const locale of ['ko', 'en']) {
    const file = caseFile('mandibular-fracture', locale);
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    assert.deepEqual(validator.pageDependencyErrors(file, html), [], `${file.relativePath}`);
    const base = locale === 'en' ? '../../../' : '../../';
    const engine = `<script src="${base}js/scene3d.js"></script>`;
    const scene = `<script src="${base}js/scenes/ms-frac.js"></script>`;
    assert.ok(html.includes(`<script src="${base}js/portfolio-render.js"></script>${engine}${scene}<script src="${base}js/nav.js"></script>`));
    assert.match(validator.pageDependencyErrors(file, html.replace(scene, '')).join('\n'), /missing required local script.*ms-frac\.js/);
    assert.match(validator.pageDependencyErrors(file, html.replace(engine + scene, scene + engine)).join('\n'), /exact parsed script sequence/);
    assert.match(validator.pageDependencyErrors(file, html.replace(engine, `<script defer src="${base}js/scene3d.js"></script>`)).join('\n'), /classic executable script/);
    assert.match(html, new RegExp(`<article class="td-case-fallback">[\\s\\S]*<img src="${base.replace(/\./g, '\\.')}assets/3d/ms-frac\\.webp" alt="[^"]+"`), 'no-JS fallback shows the poster');
  }
  const plain = caseFile('ai-build-lab', 'ko');
  const plainHtml = fs.readFileSync(plain.absolutePath, 'utf8');
  assert.deepEqual(validator.pageDependencyErrors(plain, plainHtml), []);
  const injected = plainHtml.replace('<script src="../../js/nav.js"></script>', '<script src="../../js/scene3d.js"></script><script src="../../js/scenes/ms-frac.js"></script><script src="../../js/nav.js"></script>');
  assert.match(validator.pageDependencyErrors(plain, injected).join('\n'), /unexpected local script dependency \.\.\/\.\.\/js\/scene3d\.js/);
  // Home is enabled by data (homeScene3d) in a later step; the hook resolves it already.
  const home = { page: 'home', route: '' };
  assert.equal(validator.pageScene3dName(home), '');
  assert.equal(validator.pageScene3dName(home, { ...data, homeScene3d: { name: 'home-tracking' } }), 'home-tracking');
  assert.equal(validator.pageScene3dName(caseFile('mandibular-fracture', 'en')), 'ms-frac');
});

test('scene assets: engine, vendor, scene files, and metadata-free WebP posters', (t) => {
  assert.deepEqual(validator.scene3dAssetErrors(root), []);
  assert.deepEqual(fs.readdirSync(path.join(root, 'js', 'vendor')), ['three-r128.min.js']);
  assert.match(read('js/vendor/three-r128.min.js').slice(0, 200), /@license[\s\S]*Three\.js Authors[\s\S]*MIT/);

  const dir = tempRoot(t);
  assert.deepEqual(validator.scene3dAssetErrors(dir), []);
  const poster = path.join(dir, 'assets', '3d', 'ms-frac.webp');
  const clean = fs.readFileSync(poster);
  const chunk = Buffer.concat([Buffer.from('EXIF'), Buffer.from([4, 0, 0, 0]), Buffer.from('test')]);
  const withExif = Buffer.concat([clean, chunk]);
  withExif.writeUInt32LE(withExif.length - 8, 4);
  fs.writeFileSync(poster, withExif);
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /metadata-stripped \(EXIF chunk\)/);
  fs.writeFileSync(poster, Buffer.from('not a webp'));
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /decodable WebP/);
  fs.rmSync(poster);
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /missing poster assets\/3d\/ms-frac\.webp/);
  fs.writeFileSync(poster, clean);
  fs.writeFileSync(path.join(dir, 'assets', '3d', 'stray.webp'), clean);
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /assets\/3d\/stray\.webp: undeclared 3D poster/);
  fs.rmSync(path.join(dir, 'assets', '3d', 'stray.webp'));
  fs.writeFileSync(path.join(dir, 'js', 'vendor', 'GLTFLoader.js'), '// loader');
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /unexpected vendor file/);
  fs.rmSync(path.join(dir, 'js', 'vendor', 'GLTFLoader.js'));
  fs.writeFileSync(path.join(dir, 'js', 'scenes', 'orphan.js'), '// orphan');
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /orphan\.js: scene is not declared/);
  fs.rmSync(path.join(dir, 'js', 'scenes', 'orphan.js'));
  fs.rmSync(path.join(dir, 'js', 'scenes', 'ms-frac.js'));
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /missing js\/scenes\/ms-frac\.js/);
});

test('scene scripts are scanned for partner names, contribution percentages, and model or network loads', (t) => {
  const dir = tempRoot(t);
  const scene = path.join(dir, 'js', 'scenes', 'ms-frac.js');
  const original = fs.readFileSync(scene, 'utf8');
  for (const [inject, expected] of [
    ["// built with KAERI\n", /ms-frac\.js: contains a nonpublic partner/],
    ["// 동산병원 협력\n", /ms-frac\.js: contains a nonpublic partner/],
    ["// role: simulator 80%\n", /ms-frac\.js: contains a contribution percentage/],
    ["new THREE.GLTFLoader();\n", /must be procedural/],
    ["fetch('model.bin');\n", /must be procedural/]
  ]) {
    fs.writeFileSync(scene, inject + original);
    assert.match(validator.scene3dAssetErrors(dir).join('\n'), expected, inject);
  }
  fs.writeFileSync(scene, original);
  const engine = path.join(dir, 'js', 'scene3d.js');
  fs.appendFileSync(engine, '\n// Hyundai\n');
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /js\/scene3d\.js: contains a nonpublic partner/);
  fs.writeFileSync(engine, read('js/scene3d.js') + '\n' + '/* pad */'.repeat(60000));
  assert.match(validator.scene3dAssetErrors(dir).join('\n'), /3D scene scripts total \d+ bytes; the budget is 409600/);
});

test('engine keeps the scrolling-page input and lifecycle contract', () => {
  const engine = read('js/scene3d.js');
  assert.doesNotMatch(engine, /addEventListener\(\s*['"]wheel/, 'no wheel zoom');
  assert.doesNotMatch(engine, /requestFullscreen|expanded3d|SSAO/);
  assert.match(engine, /IntersectionObserver/);
  assert.match(engine, /forceContextLoss\(\)/);
  assert.match(engine, /MAX_LIVE = 2/);
  assert.match(engine, /prefers-reduced-motion: reduce/);
  assert.match(engine, /vendor\/three-r128\.min\.js/);
  assert.match(engine, /root\.Deck3D = api/);
  const css = read('css/scholar.css');
  assert.match(css, /\.view3d canvas \{[^}]*touch-action: pan-y/);
  assert.match(css, /\.sc-figure3d \.view3d \{[^}]*aspect-ratio: 16 \/ 10/);
  assert.match(css, /@media print \{[^\n]*\.view3d canvas[^\n]*display: none[^\n]*\.view3d > img \{ display: block/);
});

test('Scene3D.t picks labels by document language and the scene registers through the queue', () => {
  const source = read('js/scene3d.js');
  const sceneSource = read('js/scenes/ms-frac.js');
  for (const [lang, expected] of [['en', 'Reset'], ['ko', '원위치'], ['en-US', 'Reset']]) {
    const listeners = [];
    const context = {
      document: { documentElement: { lang }, readyState: 'loading', currentScript: null, addEventListener: () => {}, querySelectorAll: () => [] },
      addEventListener: (type) => listeners.push(type), URL, Map, Set, Math, Object, Array, Number, String
    };
    context.window = context;
    vm.runInNewContext(source, context);
    vm.runInNewContext(sceneSource, context);
    const S = context.Scene3D;
    assert.equal(context.Deck3D, S);
    assert.equal(S.t({ ko: '원위치', en: 'Reset' }), expected);
    assert.equal(S.t('plain'), 'plain');
    assert.equal(typeof S.registry['ms-frac'].build, 'function', 'scene queued before three.js exists');
    assert.equal(S.threeState, 0, 'three.js is not loaded until a figure nears the viewport');
    assert.ok(listeners.includes('load'), 'figures are observed from the window load event');
  }
});
