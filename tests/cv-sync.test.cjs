const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { publicCvDataErrors, cvPdfErrors } = require('../scripts/validate-portfolio.cjs');
const root = path.resolve(__dirname, '..');
const cv = () => JSON.parse(fs.readFileSync(path.join(root, 'data/public-cv.json'), 'utf8'));
test('CV rejects CBCT terminology and changed patent state', () => {
  const changed = cv();
  changed.experience[0].areas[0].translations.en.items.push('4D CBCT registration');
  assert.match(publicCvDataErrors(changed).join('\n'), /4D CT/);
  const patent = cv();
  patent.patents.find(p => p.number === '10-2015-0122661').status = 'granted';
  assert.match(publicCvDataErrors(patent).join('\n'), /patent.*PDF/i);
});
test('CV source PDF hashes identify the reviewed editions', () => {
  const value = cv();
  assert.match(value.sourcePdfs?.ko?.sha256 || '', /^[a-f0-9]{64}$/);
  assert.deepEqual(cvPdfErrors(root), []);
  const os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-sync-'));
  try {
    fs.mkdirSync(path.join(temp, 'data'));
    fs.cpSync(path.join(root, 'assets/cv'), path.join(temp, 'assets/cv'), {recursive: true});
    fs.writeFileSync(path.join(temp, 'data/public-cv.json'), JSON.stringify(value));
    fs.appendFileSync(path.join(temp, 'assets/cv/jinmin-kim-cv-en.pdf'), '\n% changed edition');
    assert.match(cvPdfErrors(temp).join('\n'), /synchronization review/i);
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});
test('CV rejects duplicate patents and encoding damage, and localizes Korean headings', () => {
  const duplicate = cv();
  duplicate.patents[6] = structuredClone(duplicate.patents[5]);
  assert.match(publicCvDataErrors(duplicate).join('\n'), /patent inventory/);
  const damaged = cv();
  damaged.identity.translations.ko.summary = '????';
  assert.match(publicCvDataErrors(damaged).join('\n'), /encoding/);
  const html = require('../scripts/public-cv-summary.cjs').renderPublicCvSummary(cv(), 'ko').html;
  assert.match(html, /금오공과대학교/);
  assert.match(html, /2023\.02 - 현재/);
  assert.doesNotMatch(html, /\?{2,}|\ufffd/);
});
test('PDF comparison binds a publication year to its own bibliography entry', () => {
  const temp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cv-year-'));
  try {
    fs.mkdirSync(path.join(temp, 'data'));
    fs.cpSync(path.join(root, 'assets/cv'), path.join(temp, 'assets/cv'), {recursive: true});
    const changed = cv();
    changed.publications[1].year = '2022';
    fs.writeFileSync(path.join(temp, 'data/public-cv.json'), JSON.stringify(changed));
    const result = require('node:child_process').spawnSync('python', [path.join(root, 'scripts/check-cv-pdf-sync.py'), '--root', temp], {encoding: 'utf8'});
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /publication 2 title\/year differs/);
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});
