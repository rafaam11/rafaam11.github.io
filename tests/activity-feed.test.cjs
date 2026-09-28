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

test('chapters run from the latest career stage back to the first', () => {
  assert.deepEqual(feed.chapters.map((chapter) => chapter.id), ['digitrack', 'dgist', 'kumoh']);
  for (const chapter of feed.chapters) {
    for (const locale of ['ko', 'en']) {
      assert.ok(chapter[locale].title && chapter[locale].lede, `${chapter.id} ${locale} copy`);
      assert.doesNotMatch(chapter[locale].title + chapter[locale].lede, /박사|진학|이직|PhD|admission/i);
    }
  }
  const html = feed.chapteredFeedHtml(events, { lang: 'ko' });
  const marks = positions(html, ['id="chapter-digitrack"', 'id="chapter-dgist"', 'id="chapter-kumoh"']);
  assert.ok(marks.every((value, index) => value !== -1 && (index === 0 || value > marks[index - 1])), JSON.stringify(marks));
  assert.equal(html.split('<section class="lf-chapter"').length - 1, 3);
  assert.equal(html.split('class="lf-chapter-lede"').length - 1, 3);
  assert.equal(html.split('data-news-id=').length - 1, events.length, 'every event rendered once');
});

test('every event belongs to exactly one chapter, including boundary dates', () => {
  const ids = new Set(feed.chapters.map((chapter) => chapter.id));
  for (const event of events) assert.ok(ids.has(feed.chapterFor(event)), event.id);
  const byId = Object.fromEntries(events.map((event) => [event.id, feed.chapterFor(event)]));
  assert.equal(byId['digitrack-researcher-2023'], 'digitrack');
  assert.equal(byId['dgist-masters-degree-2023'], 'dgist');
  assert.equal(byId['mandibular-conference-award-2023'], 'dgist');
  assert.equal(byId['dgist-masters-start-2021'], 'dgist');
  assert.equal(byId['kumoh-bachelors-degree-2021'], 'kumoh');
  assert.equal(byId['motion-control-internship-2021'], 'kumoh');
  assert.equal(byId['multi-cli-work-v1-29-0'], 'digitrack');
});

test('filters hide chapters that have no matching events', () => {
  const activities = feed.chapteredFeedHtml(feed.filterEvents(events, { type: 'activity' }), { lang: 'en' });
  assert.ok(!activities.includes('id="chapter-digitrack"'), 'no DIGITRACK-era activity events');
  assert.ok(activities.includes('id="chapter-kumoh"'));
  const year2019 = feed.chapteredFeedHtml(feed.filterEvents(events, { year: '2019' }), { lang: 'en' });
  assert.deepEqual(['digitrack', 'dgist', 'kumoh'].filter((id) => year2019.includes(`id="chapter-${id}"`)), ['kumoh']);
  const empty = feed.chapteredFeedHtml([], { lang: 'ko' });
  assert.match(empty, /lf-empty/);
});

test('media beyond three photos fold into a details element and every image carries its size', () => {
  const photo = (id) => ({ id, type: 'image', path: `assets/local-review/${id}.webp`, width: 1280, height: 960, translations: { ko: { alt: 'a', caption: 'c' }, en: { alt: 'a', caption: 'c' } } });
  const four = { id: 'x', eventDate: '2019-01-01', links: [], media: ['M1', 'M2', 'M3', 'M4'].map(photo) };
  const three = { ...four, media: four.media.slice(0, 3) };
  const html4 = feed.mediaHtml(four, { lang: 'ko', base: '' });
  assert.equal(html4.split('<details class="lf-more">').length - 1, 1);
  assert.ok(html4.indexOf('M4.webp') > html4.indexOf('<details class="lf-more">'), '4th photo is inside details');
  assert.ok(html4.indexOf('M3.webp') < html4.indexOf('<details class="lf-more">'), 'first three stay visible');
  assert.match(html4, /<summary>사진 1장 더<\/summary>/);
  assert.match(feed.mediaHtml(four, { lang: 'en', base: '' }), /<summary>1 more photo<\/summary>/);
  assert.ok(!feed.mediaHtml(three, { lang: 'ko', base: '' }).includes('<details'));
  for (const img of html4.match(/<img [^>]*>/g)) assert.match(img, /width="1280" height="960"/);
  const compact = feed.mediaHtml(four, { lang: 'ko', base: '', compact: true });
  assert.equal(compact.split('<img ').length - 1, 1);
  assert.ok(!compact.includes('<details'));
});

test('event titles sit one level below chapter headings', () => {
  const html = feed.chapteredFeedHtml(events.slice(0, 5), { lang: 'ko' });
  assert.match(html, /<section class="lf-chapter"[^>]*><h2 id="chapter-/);
  assert.match(html, /<article class="lf-event-content"[^>]*><h3 id="title-/);
});

test('Home selected activities span robot building, an overseas symposium and a conference', () => {
  assert.deepEqual(feed.selectedIds, ['quadruped-engineering-award-2020', 'ism-launcher-paper-2019', 'accas-occlusion-paper-2022']);
  const html = feed.selectedActivitiesHtml(events, { lang: 'ko', base: '' });
  assert.equal(html.split('<article class="lf-activity"').length - 1, 3);
  assert.equal(html.split('<img ').length - 1, 3);
  assert.ok(!html.includes('<video'));
});
