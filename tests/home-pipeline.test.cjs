const test = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = require('../js/portfolio-data.js'); const render = require('../js/portfolio-render.js');
test('Korean pages show 현재 instead of present', () => {
  assert.equal(render.displayPeriod('2023.07 – present', 'ko'), '2023.07 – 현재');
  assert.equal(render.displayPeriod('2023.07 – present', 'en'), '2023.07 – present');
  assert.equal(render.displayPeriod('2021.12 – 2023.02', 'ko'), '2021.12 – 2023.02');
  for (const f of ['index.html', 'projects/index.html']) assert.doesNotMatch(fs.readFileSync(path.join(root, f), 'utf8'), / – present/);
});
test('every case shell title matches its data title', () => {
  for (const p of data.projects) for (const [locale, prefix] of [['ko', ''], ['en', 'en/']]) {
    const html = fs.readFileSync(path.join(root, prefix + 'projects', p.slug, 'index.html'), 'utf8');
    const title = /<title>([^<]*)<\/title>/.exec(html)[1].replace(/&amp;/g, '&');
    assert.ok(title.startsWith(p.translations[locale].title), `${locale} ${p.slug}: ${title}`);
  }
});
test('pipeline thumbnails: five WebP files within budget and valid', () => {
  const { pipelineThumbErrors } = require('../scripts/validate-portfolio.cjs');
  let total = 0;
  for (let n = 1; n <= 5; n++) {
    const buf = fs.readFileSync(path.join(root, 'assets/pipeline', `stage-${n}.webp`));
    assert.equal(buf.toString('ascii', 0, 4), 'RIFF'); assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
    assert.ok(buf.length <= 90 * 1024, `stage-${n} size`); total += buf.length;
  }
  assert.ok(total <= 300 * 1024);
  assert.deepEqual(pipelineThumbErrors(root), []);
});
test('pipeline thumbnail validator rejects missing files and EXIF chunks', () => {
  const { pipelineThumbErrors } = require('../scripts/validate-portfolio.cjs');
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pipe-'));
  try {
    assert.ok(pipelineThumbErrors(tmp).some(e => /missing pipeline thumbnail/.test(e)));
    fs.mkdirSync(path.join(tmp, 'assets/pipeline'), { recursive: true });
    for (let n = 1; n <= 5; n++) fs.copyFileSync(path.join(root, 'assets/pipeline', `stage-${n}.webp`), path.join(tmp, 'assets/pipeline', `stage-${n}.webp`));
    assert.deepEqual(pipelineThumbErrors(tmp), []);
    // Append an EXIF chunk and fix the RIFF size.
    const f = path.join(tmp, 'assets/pipeline/stage-2.webp');
    const buf = fs.readFileSync(f);
    const chunk = Buffer.concat([Buffer.from('EXIF'), Buffer.from([4, 0, 0, 0]), Buffer.from('abcd')]);
    const out = Buffer.concat([buf, chunk]); out.writeUInt32LE(out.length - 8, 4);
    fs.writeFileSync(f, out);
    assert.ok(pipelineThumbErrors(tmp).some(e => /EXIF chunk/.test(e)));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('pipeline data passes validation', () => {
  assert.deepEqual(render.pipelineErrors(data), []);
  assert.deepEqual(render.validatePortfolioData(data), []);
});
test('pipelineErrors rejects broken pipelines', () => {
  const bad = (mutate) => { const c = structuredClone(data); mutate(c); return render.pipelineErrors(c).join('\n'); };
  assert.match(bad((c) => { c.pipeline.stages.pop(); }), /exactly 5/);
  assert.match(bad((c) => { c.pipeline.placements.pop(); }), /life-careverse is missing/);
  assert.match(bad((c) => { c.pipeline.tools.push({ slug: 'unmanned-forklift', translations: { ko: { chip: 'x' }, en: { chip: 'x' } } }); }), /unmanned-forklift is placed more than once/);
  assert.match(bad((c) => { c.pipeline.placements[0].primary = 5; }), /primary must be one of spans/);
  assert.match(bad((c) => { c.pipeline.placements[0].spans = [1, 2, 6]; }), /spans must be ascending/);
  assert.match(bad((c) => { c.pipeline.stages[0].translations.en.blurb = 'x'.repeat(71); }), /exceeds 70/);
});
test('pipeline does not change the PDF source digest', () => {
  const pdf = require('../scripts/portfolio-pdf-source.cjs');
  const evidence = { items: [] }, cv = JSON.parse(fs.readFileSync(path.join(root, 'data/public-cv.json'), 'utf8'));
  const without = structuredClone(data); delete without.pipeline;
  const d = (p) => pdf.pdfSourceDigest(pdf.canonicalPdfSource(p, evidence, cv));
  assert.equal(d(data), d(without));
});
const i18n = require('../js/site-i18n.js');
test('pipelineMapHtml renders 5 stages, 8 chips and a tools chip in ko and en', () => {
  for (const [locale, base] of [['ko', ''], ['en', ''], ['ko', '../'], ['en', '../']]) {
    const html = render.pipelineMapHtml(data, base, true, locale);
    assert.equal((html.match(/<li class="sc-map__stage"/g) || []).length, 5);
    assert.equal((html.match(/data-primary="/g) || []).length, 8);
    assert.equal((html.match(/data-spans=""/g) || []).length, 1);
    assert.equal((html.match(/class="sc-map__chip"/g) || []).length, 9);
    for (const pl of data.pipeline.placements.concat(data.pipeline.tools)) {
      const project = data.projects.find(p => p.slug === pl.slug);
      const href = i18n.routeHref(base, locale, project.route, true);
      assert.ok(html.includes(`href="${href}"`), `${locale} ${pl.slug} href`);
      assert.ok(html.includes(pl.translations[locale].chip.replace(/&/g, '&amp;')));
    }
    for (const pl of data.pipeline.placements) assert.ok(html.includes(`data-primary="${pl.primary}" data-spans="${pl.spans.join(' ')}"`));
    for (const st of data.pipeline.stages) { const esc = (v) => v.replace(/&/g, '&amp;'); assert.ok(html.includes(esc(st.translations[locale].title))); assert.ok(html.includes(esc(st.translations[locale].blurb))); }
    assert.ok(html.includes(`aria-labelledby="pipeline-title"`));
    assert.ok(html.includes(`<h2 id="pipeline-title" class="sc-visually-hidden">${data.pipeline.translations[locale].label}</h2>`));
    const svg = /<svg[\s\S]*?<\/svg>/.exec(html)[0];
    assert.match(svg, /aria-hidden="true"/);
    assert.deepEqual([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]), ['1', '2', '3', '4', '5']);
  }
});
test('pipelineMapHtml returns empty string for invalid pipeline data', () => {
  const bad = structuredClone(data); bad.pipeline.stages.pop();
  assert.equal(render.pipelineMapHtml(bad, '', true, 'ko'), '');
});
test('map CSS has focus-visible highlighting, a 900px band rule and no dimming by default', () => {
  const css = fs.readFileSync(path.join(root, 'css/scholar.css'), 'utf8');
  assert.match(css, /\.sc-map:has\([^)]*:is\(:hover, :focus-visible\)\)/);
  assert.match(css, /@media \(max-width: 900px\) \{\s*\.sc-map__band \{ display: none; \}/);
  const mapCss = css.slice(css.indexOf('/* 2026-11 home map'));
  assert.doesNotMatch(mapCss, /box-shadow|gradient|text-transform\s*:\s*uppercase|monospace/i);
  const dim = mapCss.split('\n').filter(l => /opacity/.test(l));
  assert.ok(dim.some(l => /^\.sc-map:has\(.*:hover/.test(l) && /opacity: \.45/.test(l)));
  const chipLine = mapCss.split('\n').find(l => l.startsWith('.td-shell .sc-map__chip {'));
  assert.ok(chipLine, 'default chip rule exists');
  assert.doesNotMatch(chipLine, /[{;\s]opacity\s*:/, 'default chip is not dimmed (transition: opacity is allowed)');
});
test('home has no 3D figure or selected-activity cards', () => {
  for (const f of ['index.html', 'en/index.html']) {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    assert.doesNotMatch(html, /view3d|data-scene3d|home-tracking|local-feed|lf-activity/, f);
  }
  assert.equal(data.homeScene3d, undefined);
  assert.equal(fs.existsSync(path.join(root, 'js/scenes/home-tracking.js')), false);
  assert.equal(require('../js/local-feed.js').selectedActivitiesHtml, undefined);
});

test('Home main order, one-sentence lede, technical areas, three tiles and three news items', () => {
  const profile = require('../scripts/profile-home.cjs');
  const lede = { ko: '3D 공간에서 해부학 구조, 수술 도구, 센서, 카메라, XR 기기, 로봇을 하나의 좌표계로 연결해 온 엔지니어입니다.', en: 'I connect anatomy, surgical instruments, sensors, cameras, XR devices, and robots in one 3D coordinate space.' };
  for (const [locale, file] of [['ko', 'index.html'], ['en', 'en/index.html']]) {
    const html = /<main[^>]*>([\s\S]*?)<\/main>/.exec(fs.readFileSync(path.join(root, file), 'utf8'))[1];
    const names = ['class="sc-intro"', 'class="sc-map"', 'class="sc-intro__info"', 'id="implementation-title"', 'sc-project-list--tiles', 'id="publications-title"', 'id="news-title"', 'class="sc-contact"'];
    const at = names.map((name) => html.indexOf(name));
    assert.ok(at.every((i, k) => i >= 0 && (k === 0 || i > at[k - 1])), `${locale} order ${at}`);
    assert.equal(/<p class="sc-intro__lede">([^<]*)<\/p>/.exec(html)[1], lede[locale]);
    assert.doesNotMatch(html, /sc-intro__statement/);
    assert.match(html, locale === 'ko' ? /<h2 id="implementation-title">기술 영역<\/h2>/ : /<h2 id="implementation-title">Technical areas<\/h2>/);
    const tiles = [...html.matchAll(/<li class="sc-project sc-project--tile" data-project="([^"]+)">([\s\S]*?)<\/li>/g)];
    assert.equal(tiles.length, 3);
    for (const [, slug, body] of tiles) {
      const p = data.projects.find((q) => q.slug === slug); const thesis = (p.web[locale] || {}).thesis || p.translations[locale].thesis;
      assert.ok(body.includes(`<p class="sc-project__summary">${thesis.replace(/&/g, '&amp;')}</p>`), `${locale} ${slug} summary`);
    }
    assert.equal((html.match(/data-news-id=/g) || []).length, 3);
    assert.equal(profile.homeNews().length, 3);
  }
});

test('home heading order has no skipped levels', () => {
  for (const [locale, file] of [['ko', 'index.html'], ['en', 'en/index.html']]) {
    const html = /<main[^>]*>([\s\S]*?)<\/main>/.exec(fs.readFileSync(path.join(root, file), 'utf8'))[1];
    const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    assert.deepEqual(levels.slice(0, 7), [1, 2, 3, 3, 3, 3, 3], locale);
    assert.equal(levels[7], 2, locale);
    levels.forEach((level, i) => { if (i) assert.ok(level <= levels[i - 1] + 1, `${locale} heading jump at ${i}: ${levels.join('')}`); });
    assert.match(html, locale === 'ko' ? /id="pipeline-title" class="sc-visually-hidden">기술 파이프라인</ : /id="pipeline-title" class="sc-visually-hidden">Technical pipeline</);
  }
  const css = fs.readFileSync(path.join(root, 'css/scholar.css'), 'utf8');
  assert.match(css, /\.sc-visually-hidden \{[^}]*position: absolute;[^}]*width: 1px;[^}]*height: 1px;[^}]*margin: -1px;[^}]*overflow: hidden;[^}]*clip: rect\(0 0 0 0\);[^}]*white-space: nowrap;[^}]*border: 0;/);
});
test('map chips carry hidden stage labels, tools chips none', () => {
  for (const locale of ['ko', 'en']) {
    const html = render.pipelineMapHtml(data, '', true, locale);
    for (const pl of data.pipeline.placements) {
      const chip = pl.translations[locale].chip.replace(/&/g, '&amp;');
      const label = locale === 'ko' ? ` (${pl.spans.join('·')}단계)` : ` (stages ${pl.spans.join(', ')})`;
      assert.ok(html.includes(`${chip}<span class="sc-visually-hidden">${label}</span></a>`), `${locale} ${pl.slug}`);
    }
    const tools = /<p class="sc-map__tools">[\s\S]*<\/p>/.exec(html)[0];
    assert.doesNotMatch(tools, /sc-visually-hidden/);
    assert.equal((html.match(/<span class="sc-visually-hidden">/g) || []).length, 8);
  }
});
test('pipeline copy is included in the public safety scans', () => {
  const validator = require('../scripts/validate-portfolio.cjs');
  const run = (mutate) => { const c = structuredClone(data); mutate(c); return [validator.portfolioDataErrors(c).join('\n'), render.validatePortfolioData(c).join('\n')]; };
  for (const out of run((c) => { c.pipeline.placements[0].translations.en.chip = 'Contribution 47%'; })) assert.match(out, /contribution percentage/i);
  for (const out of run((c) => { c.pipeline.stages[0].translations.ko.blurb = 'C:\\Users\\x\\a.png'; })) assert.match(out, /private source path/i);
  for (const out of run((c) => { c.pipeline.translations.en.label = 'Genoray pipeline'; })) assert.match(out, /nonpublic partner/i);
});
test('map CSS pins the hover rules for every stage and dimming only under :has', () => {
  const css = fs.readFileSync(path.join(root, 'css/scholar.css'), 'utf8');
  for (let n = 1; n <= 5; n++) {
    assert.ok(css.includes(`.sc-map:has(.sc-map__chip[data-spans~="${n}"]:is(:hover, :focus-visible)) .sc-map__stage[data-n="${n}"] { border-color`), `chip->stage border ${n}`);
    assert.ok(css.includes(`.sc-map__stage[data-n="${n}"] .sc-map__title { color`), `chip->title ${n}`);
    assert.ok(css.includes(`.sc-map:has(.sc-map__stage[data-n="${n}"]:hover):not(:has(.sc-map__chip:hover)) .sc-map__chip[data-spans~="${n}"] {`), `stage->chip ${n}`);
  }
  const dims = css.split('\n').filter((l) => /opacity:\s*\.45/.test(l));
  assert.ok(dims.length >= 1);
  for (const l of dims) assert.match(l, /^\.sc-map:has\(/);
});
test('home projects block stays a tile block and pipeline thumb sources are approved images', () => {
  const profile = fs.readFileSync(path.join(root, 'scripts/profile-home.cjs'), 'utf8');
  assert.match(profile, /data-portfolio="home-projects" data-tile="true"/);
  for (const f of ['index.html', 'en/index.html']) assert.match(fs.readFileSync(path.join(root, f), 'utf8'), /data-portfolio="home-projects" data-tile="true"/, f);
  const thumbs = fs.readFileSync(path.join(root, 'scripts/pipeline-thumbs.cjs'), 'utf8');
  const srcs = [...thumbs.matchAll(/src:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.ok(srcs.length >= 5, 'found thumb sources');
  const approved = new Set();
  (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { if (v.publicPath) approved.add(v.publicPath); Object.values(v).forEach(walk); } })(data.projects);
  for (const src of srcs) assert.ok(approved.has(src), `unapproved thumb source ${src}`);
});
