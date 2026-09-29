const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');

const clone = () => structuredClone(data);

test('project groups show a technology line on Projects but not on Home', () => {
  for (const locale of ['ko', 'en']) {
    const groups = render.projectGroupsHtml(data, '../', true, locale);
    assert.equal((groups.match(/class="sc-project__tech"/g) || []).length, data.projects.length);
    assert.match(groups, /3D Slicer, Open3D|Python, Open3D, OpenCV/);
    assert.doesNotMatch(groups, /sc-project__facts/);
    assert.doesNotMatch(render.homeProjectGalleryHtml(data, './', true, locale), /sc-project__tech/);
  }
});

test('tier slugs set the order of cases inside a group', () => {
  const value = clone();
  const tier = value.tiers[0];
  const members = value.projects.filter((project) => project.tier === tier.key).map((project) => project.slug);
  tier.slugs = members.slice().reverse();
  assert.deepEqual(render.validatePortfolioData(value), []);
  const html = render.projectGroupsHtml(value, '../', true, 'en');
  const section = html.split('<section').find((part) => part.includes(`data-tier="${tier.key}"`));
  assert.deepEqual([...section.matchAll(/data-project="([^"]+)"/g)].map((match) => match[1]), tier.slugs);
  tier.slugs = members.slice(1);
  assert.match(render.validatePortfolioData(value).join('\n'), /slugs/);
});

test('capabilities name current expertise, not research direction', () => {
  const titles = data.capabilities.map((capability) => [capability.translations.ko.title, capability.translations.en.title]);
  assert.deepEqual(titles.slice(0, 4), [
    ['수술 내비게이션·광학 추적', 'Surgical Navigation & Optical Tracking'],
    ['3D 정합·컴퓨터비전', '3D Registration & Computer Vision'],
    ['XR·공간 컴퓨팅', 'XR & Spatial Computing'],
    ['로봇 비전·센서 통합', 'Robot Vision & Sensor Integration']
  ]);
  const xr = data.capabilities.find((capability) => capability.key === 'xr-engineering');
  for (const method of ['OpenXR', 'Galaxy XR', 'HoloLens 2']) assert.ok(xr.methods.includes(method), method);
  // Overclaims the owner ruled out: robot-assisted surgery development, SLAM, fusion-algorithm or Physical AI expertise.
  assert.doesNotMatch(JSON.stringify({ capabilities: data.capabilities, tiers: data.tiers, projects: data.projects }),
    /SLAM|sensor-fusion algorithm|Physical AI expert|robot-assisted surg|로봇 보조 수술/i);
});

test('case eyebrows carry the new group names', () => {
  const tierLabel = Object.fromEntries(data.tiers.map((tier) => [tier.key, tier.translations]));
  for (const project of data.projects) {
    for (const locale of ['ko', 'en']) {
      assert.ok(project.translations[locale].eyebrow.startsWith(tierLabel[project.tier][locale].label + ' · '), `${project.slug} ${locale}`);
    }
  }
});

test('Home hero separates the current role from the research direction', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const pages = { ko: fs.readFileSync(path.join(root, 'index.html'), 'utf8'), en: fs.readFileSync(path.join(root, 'en/index.html'), 'utf8') };
  assert.match(pages.ko, /<p class="sc-intro__role">수술 로보틱스·컴퓨터비전 R&amp;D 엔지니어<\/p>/);
  assert.match(pages.en, /<p class="sc-intro__role">Robotics &amp; Computer Vision R&amp;D Engineer<\/p>/);
  const cv = JSON.parse(fs.readFileSync(path.join(root, 'data/public-cv.json'), 'utf8'));
  for (const locale of ['ko', 'en']) {
    const html = pages[locale];
    const order = ['sc-intro__role', 'sc-intro__keywords', 'sc-intro__lede', 'sc-intro__statement', 'sc-intro__affiliation', 'sc-intro__links', 'sc-intro__direction'].map((name) => html.indexOf(`class="${name}"`));
    assert.ok(order.every((index, i) => index > 0 && (i === 0 || index > order[i - 1])), `${locale} hero order ${order}`);
    const direction = html.match(/<p class="sc-intro__direction">([\s\S]*?)<\/p>/)[1];
    for (const term of cv.interests[locale]) assert.ok(direction.includes(term), `${locale} direction ${term}`);
    // Research-direction terms stay out of the current-expertise list.
    const expertise = html.match(/<dl class="sc-capabilities">[\s\S]*?<\/dl>/)[0];
    assert.doesNotMatch(expertise, /Physical AI|Surgical AI|Robot Perception|로봇 인지/);
    assert.match(html, locale === 'ko' ? /<h2 id="implementation-title">현재 전문성<\/h2>/ : /<h2 id="implementation-title">Current expertise<\/h2>/);
    assert.match(html, locale === 'ko' ? /㈜디지트랙 연구원 · 소프트웨어 R&amp;D/ : /Research Engineer · Software R&amp;D, DIGITRACK Inc\./);
    assert.doesNotMatch(html, /hero-kicker/);
    // Selected publications link to their case pages when the CV names one.
    assert.match(html, /data-portfolio="home-highlights"|publications-title/);
    assert.match(html.match(/<section aria-labelledby="publications-title">[\s\S]*?<\/section>/)[0], /projects\/mandibular-fracture\//);
  }
});
