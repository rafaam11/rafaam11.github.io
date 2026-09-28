// News page chapters and expandable media (js/local-feed.js).
const test = require('node:test');
const assert = require('node:assert/strict');

const feed = require('../js/local-feed.js');
const data = require('../js/portfolio-data.js');
const media = require('../js/local-media-data.js');

const events = feed.buildModel(data.news, 'ko', media);

function positions(html, markers) {
  return markers.map((marker) => html.indexOf(marker));
}

test('News lists every event in one chronological list without chapters', () => {
  assert.equal(feed.chapters, undefined);
  assert.equal(feed.chapteredFeedHtml, undefined);
  const html = feed.feedHtml(events, { lang: 'ko' });
  assert.equal(html.split('<ol class="lf-feed">').length - 1, 1);
  assert.ok(!html.includes('lf-chapter'));
  const dates = [...html.matchAll(/<time datetime="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(dates.length, events.length);
  for (let i = 1; i < dates.length; i += 1) assert.ok(dates[i - 1] >= dates[i], dates[i - 1] + ' before ' + dates[i]);
  assert.match(html, /<article class="lf-event-content"[^>]*><h2 id="title-/);
});

test('media beyond three photos fold into a details element and every image carries its size', () => {
  const photo = (id) => ({ id, type: 'image', path: `assets/local-review/${id}.webp`, width: 1280, height: 960, translations: { ko: { alt: 'a', caption: 'c' }, en: { alt: 'a', caption: 'c' } } });
  const four = { id: 'x', eventDate: '2019-01-01', links: [], media: ['M1', 'M2', 'M3', 'M4'].map(photo) };
  const three = { ...four, media: four.media.slice(0, 3) };
  const html4 = feed.mediaHtml(four, { lang: 'ko', base: '' });
  assert.equal(html4.split('<details class="lf-more">').length - 1, 1);
  assert.ok(html4.indexOf('M4.webp') > html4.indexOf('<details class="lf-more">'), '4th photo is inside details');
  assert.ok(html4.indexOf('M3.webp') < html4.indexOf('<details class="lf-more">'), 'first three stay visible');
  assert.match(html4, /<summary[^>]*>사진 1장 더<\/summary>/);
  assert.match(feed.mediaHtml(four, { lang: 'en', base: '' }), /<summary[^>]*>1 more photo<\/summary>/);
  assert.ok(!feed.mediaHtml(three, { lang: 'ko', base: '' }).includes('<details'));
  for (const img of html4.match(/<img [^>]*>/g)) assert.match(img, /width="1280" height="960"/);
  const compact = feed.mediaHtml(four, { lang: 'ko', base: '', compact: true });
  assert.equal(compact.split('<img ').length - 1, 1);
  assert.ok(!compact.includes('<details'));
});

test('Home selected activities span robot building, an overseas symposium and a conference', () => {
  assert.deepEqual(feed.selectedIds, ['quadruped-engineering-award-2020', 'ism-launcher-paper-2019', 'accas-occlusion-paper-2022']);
  const html = feed.selectedActivitiesHtml(events, { lang: 'ko', base: '' });
  assert.equal(html.split('<article class="lf-activity"').length - 1, 3);
  assert.equal(html.split('<img ').length - 1, 3);
  assert.ok(!html.includes('<video'));
});

test('folded photos name their event for assistive technology', () => {
  const photo = (id) => ({ id, type: 'image', path: `assets/local-review/${id}.webp`, width: 4, height: 3, translations: { ko: { alt: 'a', caption: 'c' }, en: { alt: 'a', caption: 'c' } } });
  const html = feed.mediaHtml({ id: 'x', title: 'DGIST 졸업', eventDate: '2023-02-16', links: [], media: ['M1', 'M2', 'M3', 'M4'].map(photo) }, { lang: 'ko', base: '' });
  assert.match(html, /<summary aria-label="DGIST 졸업 — 사진 1장 더">사진 1장 더<\/summary>/);
});
