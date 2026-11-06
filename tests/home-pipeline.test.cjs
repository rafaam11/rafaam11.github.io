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
