// News page feed cards, media grids and link previews (js/local-feed.js).
const test = require('node:test');
const assert = require('node:assert/strict');

const feed = require('../js/local-feed.js');
const data = require('../js/portfolio-data.js');
const media = require('../js/local-media-data.js');

const events = feed.buildModel(data.news, 'ko', media);
const withProjects = feed.buildModel(data.news, 'ko', media, data.projects);
const photo = (id, size = 1280) => ({ id, type: 'image', path: `assets/local-review/${id}.webp`, width: size, height: size * 0.75, translations: { ko: { alt: 'a', caption: 'c' }, en: { alt: 'a', caption: 'c' } } });

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

test('feed media form a grid of at most four tiles with a +N count and every image carries its size', () => {
  const six = { id: 'x', eventDate: '2019-01-01', links: [], media: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((id) => photo(id)) };
  const html6 = feed.mediaHtml(six, { lang: 'ko', base: '' });
  assert.match(html6, /<div class="lf-grid lf-grid--4"/);
  assert.equal(html6.split('<figure class="lf-tile"').length - 1, 4, 'four visible tiles');
  assert.equal(html6.split(' hidden>').length - 1, 2, 'the rest stay in the lightbox set');
  assert.match(html6, /<span class="lf-tile-more" aria-hidden="true">\+2<\/span>/);
  assert.ok(!html6.includes('<details'));
  for (const img of html6.match(/<img [^>]*>/g)) assert.match(img, /width="1280" height="960"/);
  const three = feed.mediaHtml({ ...six, media: six.media.slice(0, 3) }, { lang: 'ko', base: '' });
  assert.match(three, /lf-grid--3/);
  assert.ok(!three.includes('lf-tile-more'));
  const one = feed.mediaHtml({ ...six, media: six.media.slice(0, 1) }, { lang: 'ko', base: '' });
  assert.match(one, /<figcaption>c<\/figcaption>/, 'a single photo shows its caption');
  const compact = feed.mediaHtml(six, { lang: 'ko', base: '', compact: true });
  assert.equal(compact.split('<img ').length - 1, 1);
  assert.ok(!compact.includes('lf-grid'));
});

test('posts render paragraphs, fall back to the one-line body, and carry a collapsible toggle', () => {
  const base = { id: 'p', eventDate: '2020-01-01', title: 'T', categories: ['research'], links: [], media: [], preview: null, body: '한 줄.' };
  const withPost = feed.feedHtml([{ ...base, post: '첫 문단.\n\n둘째 문단.' }], { lang: 'ko' });
  assert.match(withPost, /<div class="lf-post" id="post-p"><p>첫 문단.<\/p><p>둘째 문단.<\/p><\/div>/);
  assert.match(withPost, /<button type="button" class="lf-post-toggle" aria-expanded="false" aria-controls="post-p" hidden>더 보기<\/button>/);
  assert.match(feed.feedHtml([{ ...base, post: '' }], { lang: 'ko' }), /<div class="lf-post" id="post-p"><p>한 줄.<\/p><\/div>/);
  assert.match(withPost, /<img class="lf-avatar" src="assets\/img\/profile_square.webp"/);
});

test('events without activity media preview the approved cover of their case', () => {
  const byId = Object.fromEntries(withProjects.map((event) => [event.id, event]));
  const smc = byId['smcnavi-development-2023'];
  assert.equal(smc.preview.image, 'assets/projects/surgical-navigation/surgical-navigation-hololens-poster-01.png');
  assert.equal(smc.preview.video, true);
  const html = feed.feedHtml([smc], { lang: 'ko', base: '../' });
  assert.match(html, /<a class="lf-preview" href="\.\.\/projects\/surgical-navigation\/index.html">/);
  assert.ok(!/<p class="lf-links">[^]*projects\/surgical-navigation/.test(html), 'the previewed case link is not repeated');
  assert.equal(byId['accas-occlusion-paper-2022'].preview, null, 'activity media take precedence');
  assert.equal(byId['tracking-patent-applications-2024'].preview, null, 'no case link, no preview');
  for (const event of withProjects) {
    if (!event.preview) continue;
    const project = data.projects.find((item) => event.preview.route === 'projects/' + item.slug + '/');
    const approved = [project.media.lead, project.media.poster].filter((item) => item && item.status === 'approved').map((item) => item.publicPath);
    assert.ok(approved.includes(event.preview.image), event.id + ': preview image is approved');
  }
  assert.ok(withProjects.slice(0, 17).filter((event) => event.media.length || event.preview).length >= 12, 'recent posts show a picture');
});

test('the media-only toggle keeps events with activity photos or videos', () => {
  const filtered = feed.filterEvents(withProjects, { mediaOnly: true });
  assert.ok(filtered.length > 0 && filtered.every((event) => event.media.length > 0));
  assert.equal(feed.filterEvents(withProjects, { mediaOnly: false }).length, withProjects.length);
  assert.match(feed.lightboxHtml('en'), /<dialog class="lf-lightbox"[^>]*>.*aria-label="Previous".*aria-label="Next".*aria-label="Close"/);
});

test('Home selected activities span robot building, an overseas symposium and a conference', () => {
  assert.deepEqual(feed.selectedIds, ['quadruped-engineering-award-2020', 'ism-launcher-paper-2019', 'accas-occlusion-paper-2022']);
  const html = feed.selectedActivitiesHtml(events, { lang: 'ko', base: '' });
  assert.equal(html.split('<article class="lf-activity"').length - 1, 3);
  assert.equal(html.split('<img ').length - 1, 3);
  assert.ok(!html.includes('<video'));
});

test('media grids name their event for assistive technology', () => {
  const html = feed.mediaHtml({ id: 'x', title: 'DGIST 졸업', eventDate: '2023-02-16', links: [], media: ['M1', 'M2', 'M3', 'M4'].map((id) => photo(id, 4)) }, { lang: 'ko', base: '' });
  assert.match(html, /role="group" aria-label="DGIST 졸업 — 사진·영상 4개"/);
});
