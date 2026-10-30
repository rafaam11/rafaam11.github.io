// News page timeline rows, media grids and hash handling (js/local-feed.js).
const test = require('node:test');
const assert = require('node:assert/strict');

const feed = require('../js/local-feed.js');
const data = require('../js/portfolio-data.js');
const media = require('../js/local-media-data.js');

const events = feed.buildModel(data.news, 'ko', media);
const photo = (id, size = 1280) => ({ id, type: 'image', path: `assets/local-review/${id}.webp`, width: size, height: size * 0.75, translations: { ko: { alt: 'a', caption: 'c' }, en: { alt: 'a', caption: 'c' } } });
const rowsOf = (html) => html.split('<li class="lf-row"').slice(1).map((chunk) => '<li class="lf-row"' + chunk.split('</li>')[0] + '</li>');

test('News is one chronological timeline grouped by year, one row per event with its anchor', () => {
  assert.equal(feed.chapters, undefined);
  assert.equal(feed.chapteredFeedHtml, undefined);
  const html = feed.feedHtml(events, { lang: 'ko' });
  assert.equal(events.length, 57);
  assert.equal(html.split('<div class="lf-feed">').length - 1, 1);
  assert.ok(!html.includes('lf-chapter'));
  const rows = rowsOf(html);
  assert.equal(rows.length, 57, 'one row per event');
  for (const event of events) assert.match(html, new RegExp(`<li class="lf-row" id="news-${event.id}" data-news-id="${event.id}">`));
  const dates = [...html.matchAll(/<time class="lf-date" datetime="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(dates.length, events.length);
  for (let i = 1; i < dates.length; i += 1) assert.ok(dates[i - 1] >= dates[i], dates[i - 1] + ' before ' + dates[i]);
  const years = [...html.matchAll(/<section class="lf-year" aria-labelledby="news-(\d{4})"><h2 id="news-\1">\1<\/h2>/g)].map((match) => match[1]);
  assert.deepEqual(years, [...new Set(events.map((event) => event.year))], 'one h2 per year, newest first');
  assert.equal(html.split('<h3 class="lf-title">').length - 1, 57, 'row titles sit one level under the year');
  assert.ok(!/<h[12] /.test(html.replace(/<h2 id="news-\d{4}">/g, '')), 'no other h1/h2 inside the feed');
});

test('timeline rows carry no avatar, clamp toggle or link-preview card', () => {
  const html = feed.feedHtml(events, { lang: 'ko', base: '../' }) + feed.feedHtml(feed.buildModel(data.news, 'en', media), { lang: 'en', base: '../../' });
  for (const removed of ['lf-preview', 'lf-avatar', 'lf-author', 'profile_square', 'lf-post-toggle', '더 보기', 'See more', 'lf-event']) assert.ok(!html.includes(removed), removed);
  assert.equal(feed.previewFor, undefined);
  assert.ok(events.every((event) => !('preview' in event)));
});

test('a row shows date, Scholar tags, title, one-line body and links', () => {
  const html = feed.feedHtml(events, { lang: 'ko' });
  const row = rowsOf(html).find((item) => item.includes('id="news-haptic-occlusion-poster-award-2024"'));
  assert.match(row, /<time class="lf-date" datetime="2024">2024<\/time>/);
  assert.match(row, /<span class="lf-tags"><span class="sc-tag">수상<\/span><span class="sc-tag">학회<\/span><\/span>/);
  assert.match(row, /<h3 class="lf-title">햅틱 교합 연구 발표·우수포스터상<\/h3><span class="lf-body">햅틱 장치를/);
  assert.match(row, /<p class="lf-links"><a href="cv\/index.html">/);
  assert.equal(feed.dateLabel({ eventDate: '2026-10-26' }, 'ko'), '10.26');
  assert.equal(feed.dateLabel({ eventDate: '2026-06' }, 'ko'), '6월');
  assert.equal(feed.dateLabel({ eventDate: '2026-06' }, 'en'), 'Jun');
  assert.equal(feed.dateLabel({ eventDate: '2020-10-23' }, 'en'), 'Oct 23');
  assert.equal(feed.dateLabel({ eventDate: '2019' }, 'en'), '2019');
});

test('a row with media shows a thumbnail and opens to the post and the media grid', () => {
  const html = feed.feedHtml(events, { lang: 'ko', base: '../' });
  const row = rowsOf(html).find((item) => item.includes('id="news-accas-occlusion-paper-2022"'));
  const first = events.find((event) => event.id === 'accas-occlusion-paper-2022').media[0];
  assert.match(row, /<details class="lf-detail"><summary class="lf-sum">/);
  assert.match(row, new RegExp(`<span class="lf-thumb"><img src="\\.\\./${first.path}" alt="${first.translations.ko.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" width="56" height="56" loading="lazy"`));
  const body = row.split('</summary>')[1].split('</details>')[0];
  assert.match(body, /^<div class="lf-more"><div class="lf-post"><p>/);
  assert.match(body, /<div class="lf-grid lf-grid--3" role="group"/);
  assert.ok(!row.split('</summary>')[0].includes('<a '), 'links stay outside the summary');
  const withMedia = rowsOf(html).filter((item) => item.includes('class="lf-thumb"')).length;
  assert.equal(withMedia, events.filter((event) => event.media.length).length, 'every event with media has a thumbnail');
});

test('a row with neither post nor media is plain, not a <details>', () => {
  const plain = { id: 'p', eventDate: '2020-01-01', year: '2020', title: 'T', categories: ['research'], links: [], media: [], body: '한 줄.', post: '' };
  const html = feed.feedHtml([plain], { lang: 'ko' });
  assert.ok(!html.includes('<details') && !html.includes('<summary'));
  assert.match(html, /<li class="lf-row" id="news-p" data-news-id="p"><div class="lf-detail"><div class="lf-sum">/);
  assert.ok(!html.includes('lf-thumb') && !html.includes('lf-links'));
  const withPost = feed.feedHtml([{ ...plain, post: '첫 문단.\n\n둘째 문단.' }], { lang: 'ko' });
  assert.match(withPost, /<details class="lf-detail"><summary class="lf-sum">[^]*<\/summary><div class="lf-more"><div class="lf-post"><p>첫 문단.<\/p><p>둘째 문단.<\/p><\/div><\/div><\/details>/);
});

test('a #news-<id> fragment opens its row; other fragments only scroll', () => {
  assert.equal(feed.hashTargetId('#news-club-mt-2018'), 'news-club-mt-2018');
  assert.equal(feed.hashTargetId('#news-%ED%95%9C'), 'news-한');
  assert.equal(feed.hashTargetId(''), '');
  assert.equal(feed.hashTargetId('#'), '');
  const details = { open: false };
  const row = { getAttribute: (name) => (name === 'data-news-id' ? 'club-mt-2018' : null), querySelector: (selector) => (selector === 'details' ? details : null) };
  const heading = { getAttribute: () => null, querySelector: () => { throw new Error('not a row'); } };
  const doc = { getElementById: (id) => ({ 'news-club-mt-2018': row, 'news-2018': heading })[id] || null };
  assert.equal(feed.openFromHash(doc, '#news-club-mt-2018'), row);
  assert.equal(details.open, true);
  assert.equal(feed.openFromHash(doc, '#news-2018'), heading, 'a year heading is returned to scroll to');
  assert.equal(feed.openFromHash(doc, '#news-missing'), null);
  assert.equal(feed.openFromHash(doc, ''), null);
  const source = require('node:fs').readFileSync(require.resolve('../js/local-feed.js'), 'utf8');
  assert.match(source, /addEventListener\('hashchange', reveal\)/, 'hash changes reopen rows too');
});

test('feed media form a grid of at most four tiles with a +N count and every image carries its size', () => {
  const six = { id: 'x', eventDate: '2019-01-01', links: [], media: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((id) => photo(id)) };
  const html6 = feed.mediaHtml(six, { lang: 'ko', base: '' });
  assert.match(html6, /<div class="lf-grid lf-grid--4"/);
  assert.equal(html6.split('<figure class="lf-tile"').length - 1, 4, 'four visible tiles');
  assert.equal(html6.split(' hidden>').length - 1, 2, 'the rest stay in the lightbox set');
  assert.match(html6, /<span class="lf-tile-more" aria-hidden="true">\+2<\/span>/);
  for (const img of html6.match(/<img [^>]*>/g)) assert.match(img, /width="1280" height="960"/);
  const three = feed.mediaHtml({ ...six, media: six.media.slice(0, 3) }, { lang: 'ko', base: '' });
  assert.match(three, /lf-grid--3/);
  assert.ok(!three.includes('lf-tile-more'));
  const one = feed.mediaHtml({ ...six, media: six.media.slice(0, 1) }, { lang: 'ko', base: '' });
  assert.match(one, /<figcaption>c<\/figcaption>/, 'a single photo shows its caption');
});

test('the media-only toggle keeps events with activity photos or videos', () => {
  const filtered = feed.filterEvents(events, { mediaOnly: true });
  assert.ok(filtered.length > 0 && filtered.every((event) => event.media.length > 0));
  assert.equal(feed.filterEvents(events, { mediaOnly: false }).length, events.length);
  assert.match(feed.lightboxHtml('en'), /<dialog class="lf-lightbox"[^>]*>.*aria-label="Previous".*aria-label="Next".*aria-label="Close"/);
});

test('Home selected activities are three small cards: thumbnail, date and title link', () => {
  assert.deepEqual(feed.selectedIds, ['quadruped-engineering-award-2020', 'ism-launcher-paper-2019', 'accas-occlusion-paper-2022']);
  const html = feed.selectedActivitiesHtml(events, { lang: 'ko', base: '' });
  assert.equal(html.split('<article class="lf-activity"').length - 1, 3);
  assert.equal(html.split('<img ').length - 1, 3);
  assert.equal(html.split('<a class="lf-activity-thumb" href="news/index.html#news-').length - 1, 3);
  assert.ok(!html.includes('<video') && !html.includes('lf-grid') && !html.includes('<figcaption'));
  for (const id of feed.selectedIds) assert.match(html, new RegExp(`<h3><a href="news/index.html#news-${id}">`));
});

test('media grids name their event for assistive technology', () => {
  const html = feed.mediaHtml({ id: 'x', title: 'DGIST 졸업', eventDate: '2023-02-16', links: [], media: ['M1', 'M2', 'M3', 'M4'].map((id) => photo(id, 4)) }, { lang: 'ko', base: '' });
  assert.match(html, /role="group" aria-label="DGIST 졸업 — 사진·영상 4개"/);
});
