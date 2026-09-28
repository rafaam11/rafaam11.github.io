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

const profileHome = require('../scripts/profile-home.cjs');
const portfolioData = require('../js/portfolio-data.js');

test('activity media SSOT lives in data/activity-media.json and the public bundle carries only public fields', () => {
  const json = JSON.parse(read('data/activity-media.json'));
  assert.equal(json.schema, 1);
  const records = Object.values(json.media);
  assert.ok(records.length >= 12, 'records migrated');
  for (const record of records) {
    assert.equal(json.media[record.id], record, `${record.id}: key matches id`);
    assert.match(record.path, /^assets\/local-review\//, `${record.id}: derivative path`);
    assert.ok(Number.isInteger(record.width) && Number.isInteger(record.height), `${record.id}: width/height`);
    assert.ok(Array.isArray(record.eventIds), `${record.id}: eventIds`);
    assert.ok(Number.isInteger(record.order), `${record.id}: order`);
    assert.match(record.takenAt || '', /^\d{4}(-\d{2}){0,2}$/, `${record.id}: takenAt`);
    assert.ok(['approved-public', 'draft'].includes(record.approval), `${record.id}: approval`);
    assert.match(record.sourceSha256, /^[0-9a-f]{64}$/, `${record.id}: source sha`);
    if (record.type === 'video') assert.ok(record.poster && record.clip && Number.isFinite(record.clip.start) && Number.isFinite(record.clip.duration), `${record.id}: video poster and clip`);
  }
  assert.deepEqual(profileHome.activityMediaErrors(json, portfolioData.news), []);
  const broken = JSON.parse(JSON.stringify(json));
  broken.media.M012.eventIds = ['no-such-event'];
  assert.ok(profileHome.activityMediaErrors(broken, portfolioData.news).some((message) => /no-such-event/.test(message)), 'unknown eventId is reported');
  const bundle = read('js/local-media-data.js');
  assert.match(bundle, /Generated from data\/activity-media\.json/);
  for (const record of loadMedia()) {
    for (const key of ['sourcePath', 'sourceSha256', 'takenAtSource', 'clip', 'crop', 'approval']) assert.ok(!(key in record), `${record.id}: ${key} stays out of the public bundle`);
    assert.ok(Array.isArray(record.eventIds) && Number.isInteger(record.width), `${record.id}: public fields present`);
  }
  assert.deepEqual(profileHome.freshnessErrors(), [], 'generated bundle is fresh');
});

test('local feed attaches media from record eventIds in order', () => {
  const feed = require('../js/local-feed.js');
  const media = require('../js/local-media-data.js');
  const events = feed.buildModel(portfolioData.news, 'ko', media);
  const byId = Object.fromEntries(events.map((event) => [event.id, event]));
  assert.deepEqual(byId['accas-occlusion-paper-2022'].media.map((item) => item.id), ['M012']);
  assert.deepEqual(byId['quadruped-engineering-award-2020'].media.map((item) => item.id), ['M039', 'M043']);
  assert.deepEqual(byId['ism-launcher-paper-2019'].media.map((item) => item.id), ['M185']);
  assert.ok(!('mediaIds' in feed), 'the mediaIds literal is gone; mediaIndex derives from records');
  assert.equal(typeof feed.mediaIndex, 'function');
});
