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
  assert.equal(json.schema, 2);
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
    assert.ok(!('sourceSha256' in record) && !('sourcePath' in record), `${record.id}: no source metadata`);
    assert.match(record.derivativeSha256, /^[0-9a-f]{64}$/, `${record.id}: public derivative hash`);
    if (record.type === 'video') assert.ok(record.poster && Number.isFinite(record.duration), `${record.id}: video poster and duration`);
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
  assert.deepEqual(byId['accas-occlusion-paper-2022'].media.map((item) => item.id), ['M012', 'M013', 'M014']);
  assert.deepEqual(byId['quadruped-engineering-award-2020'].media.map((item) => item.id), ['M039', 'M036', 'M043']);
  assert.deepEqual(byId['ism-launcher-paper-2019'].media.map((item) => item.id), ['M185', 'M183', 'M172']);
  assert.ok(!('mediaIds' in feed), 'the mediaIds literal is gone; mediaIndex derives from records');
  assert.equal(typeof feed.mediaIndex, 'function');
});

test('every derivative is approved, captioned, clean and within budget', () => {
  const pipeline = require('../scripts/activity-media.cjs');
  const json = JSON.parse(read('data/activity-media.json'));
  const records = Object.values(json.media);
  assert.equal(records.filter((record) => record.approval !== 'approved-public').length, 0, 'no draft records on the branch');
  for (const record of records) {
    for (const locale of ['ko', 'en']) for (const field of ['caption', 'alt']) assert.doesNotMatch(record.translations[locale][field], /^TODO/i, `${record.id} ${locale} ${field}`);
  }
  const result = pipeline.checkRecords(json);
  assert.deepEqual(result.errors, []);
  assert.ok(result.totalBytes <= pipeline.LIMITS.maxTotalBytes, 'assets/local-review stays within budget');
  assert.ok(records.filter((record) => record.type === 'video').length <= 5, 'at most five videos');
});

test('news events, labels and activity-media evidence agree', () => {
  const feed = require('../js/local-feed.js');
  const json = JSON.parse(read('data/activity-media.json'));
  const knownCategories = new Set(['research', 'conference', 'award', 'career', 'patent', 'software', 'activity']);
  const release = (item) => item.evidence && item.evidence.path === 'data/news-software-sources.json';
  for (const item of portfolioData.news) {
    if (!release(item)) assert.ok(feed.labels[item.id], `${item.id}: has an editorial label`);
    if (feed.labels[item.id]) {
      assert.ok(knownCategories.has(feed.labels[item.id][0]), `${item.id}: known category`);
      for (const extra of feed.labels[item.id][3] || []) assert.ok(knownCategories.has(extra), `${item.id}: known extra category`);
    }
    for (const locale of ['ko', 'en']) {
      for (const field of ['body', 'post']) assert.doesNotMatch(item.translations[locale][field] || '', /박사|진학|이직|PhD|admission/i, `${item.id} ${locale} ${field}: career wording`);
    }
    if (item.evidence.path === 'data/activity-media.json') {
      const record = json.media[item.evidence.locator];
      assert.ok(record && record.approval === 'approved-public', `${item.id}: evidence record ${item.evidence.locator} is approved`);
      assert.ok(record.eventIds.includes(item.id), `${item.id}: evidence record lists the event`);
    }
  }
  for (const record of Object.values(json.media)) {
    for (const eventId of record.eventIds) assert.ok(portfolioData.news.some((item) => item.id === eventId), `${record.id}: eventId ${eventId} exists`);
  }
  assert.ok(Object.keys(feed.labels).length >= portfolioData.news.filter((item) => !release(item)).length, 'labels cover the non-release news');
  assert.deepEqual(profileHome.homeNews().map((item) => item.id), ['bus-info-v0-6-0', 'surface-guidance-research-2026', 'omfs-vr-poster-2026', 'digital-occlusion-redesign-2026'], 'Home picks are unchanged');
  const broken = { ...portfolioData.news[0], id: 'broken-event', evidence: { path: 'data/activity-media.json', locator: 'M012' } };
  assert.ok(profileHome.newsErrors([broken]).some((message) => /M012/.test(message)), 'evidence record must list the event');
  assert.ok(Object.values(feed.labels).filter((label) => label[0] === 'activity').length >= 8, 'activity events were added');
});

test('document photos that show personal data stay out, and paths cannot escape the derivative folder', () => {
  const json = JSON.parse(read('data/activity-media.json'));
  for (const id of ['M022', 'M141', 'M153', 'M154']) assert.ok(!json.media[id], `${id} (certificate with personal data) is not published`);
  for (const id of ['M022', 'M141', 'M153', 'M154']) assert.ok(!fs.existsSync(path.join(root, 'assets', 'local-review', `${id}.webp`)), `${id}.webp removed`);
  const escaped = JSON.parse(JSON.stringify(json));
  escaped.media.M012.path = 'assets/local-review/../img/x.webp';
  assert.ok(profileHome.activityMediaErrors(escaped, portfolioData.news).some((message) => /M012/.test(message)));
});

test('activity events rest on dated evidence', () => {
  const byId = Object.fromEntries(portfolioData.news.map((item) => [item.id, item]));
  assert.ok(!byId['scholarship-2019'], 'scholarship event has no publishable evidence');
  assert.ok(!byId['quadruped-build-start-2019']);
  const build = byId['quadruped-build-start-2020'];
  assert.equal(build.eventDate, '2020-04');
  assert.equal(build.evidence.path, 'data/public-cv.json');
  assert.match(byId['ism-launcher-paper-2019'].evidence.dateSource, /M183/);
  const json = JSON.parse(read('data/activity-media.json'));
  for (const record of Object.values(json.media)) assert.ok(record.eventIds.length, `${record.id} is linked to an event`);
  const english = portfolioData.news.map((item) => item.translations.en.body + ' ' + (item.translations.en.post || '')).join(' ');
  assert.doesNotMatch(english, /Kumoh Institute of Technology/, 'use the full English name of Kumoh');
});

test('News posts name no private people, carry no review wording and claim no grants', () => {
  for (const item of portfolioData.news) {
    for (const locale of ['ko', 'en']) {
      const post = item.translations[locale].post || '';
      assert.doesNotMatch(post, privatePeoplePattern, `${item.id} ${locale}: private person`);
      assert.doesNotMatch(post, honorificPattern, `${item.id} ${locale}: named third person`);
      assert.doesNotMatch(post, reviewWordingPattern, `${item.id} ${locale}: review wording`);
      assert.doesNotMatch(post, /\d+\s?%|Physical AI|등록되었|was granted/i, `${item.id} ${locale}: percentage, retroactive label or grant claim`);
      assert.ok(post.split(/\n\s*\n/).length <= 2, `${item.id} ${locale}: at most two paragraphs`);
    }
  }
});

test('News keeps only the first public release of each personal app', () => {
  const releases = portfolioData.news.filter((item) => item.evidence.path === 'data/news-software-sources.json').map((item) => item.id).sort();
  assert.deepEqual(releases, ['bus-info-v0-6-0', 'multi-cli-work-v1-0-0']);
  const sources = JSON.parse(read('data/news-software-sources.json'));
  assert.deepEqual(sources.releases.map((release) => release.tag).sort(), ['v0.6.0', 'v1.0.0']);
});
