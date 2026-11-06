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
