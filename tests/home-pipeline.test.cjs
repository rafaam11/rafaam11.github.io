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
      assert.ok(html.includes(data.pipeline.translations ? pl.translations[locale].chip.replace(/&/g, '&amp;') : ''));
    }
    for (const pl of data.pipeline.placements) assert.ok(html.includes(`data-primary="${pl.primary}" data-spans="${pl.spans.join(' ')}"`));
    for (const st of data.pipeline.stages) { const esc = (v) => v.replace(/&/g, '&amp;'); assert.ok(html.includes(esc(st.translations[locale].title))); assert.ok(html.includes(esc(st.translations[locale].blurb))); }
    assert.ok(html.includes(`aria-label="${data.pipeline.translations[locale].label}"`));
    const svg = /<svg[\s\S]*?<\/svg>/.exec(html)[0];
    assert.match(svg, /aria-hidden="true"/);
    assert.deepEqual([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]), ['1', '2', '3', '4', '5']);
  }
});
test('pipelineMapHtml returns empty string for invalid pipeline data', () => {
  const bad = structuredClone(data); bad.pipeline.stages.pop();
  assert.equal(render.pipelineMapHtml(bad, '', true, 'ko'), '');
});
test('map CSS has focus-visible highlighting, a 760px band rule and no dimming by default', () => {
  const css = fs.readFileSync(path.join(root, 'css/scholar.css'), 'utf8');
  assert.match(css, /\.sc-map:has\([^)]*:is\(:hover, :focus-visible\)\)/);
  assert.match(css, /@media \(max-width: 760px\) \{\s*\.sc-map__band \{ display: none; \}/);
  const mapCss = css.slice(css.indexOf('/* 2026-11 home map'));
  assert.doesNotMatch(mapCss, /box-shadow|gradient|text-transform\s*:\s*uppercase|monospace/i);
  const dim = mapCss.split('\n').filter(l => /opacity/.test(l));
  assert.equal(dim.length, 2); // transition list + hover-only dimming
  assert.ok(dim.some(l => /^\.sc-map:has\(.*:hover/.test(l) && /opacity: \.45/.test(l)));
  assert.ok(!/^\.sc-map__chip \{[^}]*opacity: *0?\./.test(dim.find(l => l.startsWith('.sc-map__chip {')) || ''));
});
