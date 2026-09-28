// Activity-feed media contracts: originals stay private, public derivatives stay small and clean.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('original usermedia is git-ignored and never tracked', () => {
  const lines = read('.gitignore').split(/\r?\n/).map((line) => line.trim());
  assert.ok(lines.includes('assets/usermedia/'), '.gitignore lists assets/usermedia/');
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', 'assets/usermedia'], { cwd: root, encoding: 'utf8' });
  } catch (error) {
    return; // git unavailable here; the .gitignore assertion above still protects the originals
  }
  assert.equal(tracked.trim(), '', 'no original media file is tracked');
});

const { privatePeoplePattern, honorificPattern, reviewWordingPattern } = require('./helpers/private-people.cjs');

function loadMedia() {
  const data = require('../js/local-media-data.js');
  return Object.values(data.media || data);
}

test('activity media captions speak in public voice and carry no review notes', () => {
  const records = loadMedia();
  assert.ok(records.length >= 12, 'media records present');
  for (const record of records) {
    assert.ok(!('note' in record.translations.ko) && !('note' in record.translations.en), `${record.id}: no note field`);
    for (const locale of ['ko', 'en']) {
      for (const field of ['caption', 'alt']) {
        const text = record.translations[locale][field];
        assert.ok(typeof text === 'string' && text.trim(), `${record.id} ${locale} ${field} present`);
        assert.doesNotMatch(text, reviewWordingPattern, `${record.id} ${locale} ${field}: review wording`);
        assert.doesNotMatch(text, privatePeoplePattern, `${record.id} ${locale} ${field}: private person`);
        assert.doesNotMatch(text, honorificPattern, `${record.id} ${locale} ${field}: named third person`);
      }
    }
  }
});
