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

test('Home carries one Person JSON-LD block limited to current expertise', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  for (const [file, locale] of [['index.html', 'ko'], ['en/index.html', 'en']]) {
    const html = read(file);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, file);
    assert.ok(html.indexOf(blocks[0][0]) < html.indexOf('</head>'), `${file}: JSON-LD in head`);
    const person = JSON.parse(blocks[0][1]);
    assert.equal(person['@type'], 'Person');
    assert.equal(person.name, 'Jinmin Kim');
    assert.equal(person.alternateName, '김진민');
    assert.equal(person.url, locale === 'ko' ? 'https://rafaam11.github.io/' : 'https://rafaam11.github.io/en/');
    assert.deepEqual(person.sameAs, ['https://github.com/rafaam11', 'https://www.linkedin.com/in/rlawlsals']);
    assert.equal(person.worksFor.name, 'DIGITRACK Inc.');
    assert.ok(person.knowsAbout.includes('Surgical Navigation') && person.knowsAbout.includes('Optical Tracking'));
    assert.doesNotMatch(person.knowsAbout.join(' '), /Physical AI|Surgical AI|Robot Perception|Surgical Robotics/);
    assert.doesNotMatch(blocks[0][1], /@naver|mailto|Samsung|삼성|https?:\/\/(?!rafaam11\.github\.io|github\.com|www\.linkedin\.com|schema\.org)/);
  }
  for (const file of ['projects/index.html', 'cv/index.html', 'news/index.html', 'contact/index.html', 'en/cv/index.html']) {
    assert.doesNotMatch(read(file), /application\/ld\+json/, file);
  }
});

test('page titles, descriptions and footer carry the positioning', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const expected = {
    'index.html': ['김진민 · 수술 로보틱스·컴퓨터비전 R&amp;D', '수술 내비게이션, 3D 정합, 광학 추적, XR, 로봇 통합을 개발하는 R&amp;D 엔지니어 김진민의 연구와 프로젝트.'],
    'en/index.html': ['Jinmin Kim · Robotics &amp; Computer Vision R&amp;D', 'Jinmin Kim is an R&amp;D engineer in surgical navigation, 3D registration, optical tracking, XR and robot integration, growing toward surgical robotics.'],
    'projects/index.html': [null, '수술 로보틱스·내비게이션, 컴퓨터비전·3D 공간 컴퓨팅, XR, 로보틱스, AI 빌드 랩으로 묶은 프로젝트입니다.'],
    'en/projects/index.html': [null, 'Projects in surgical navigation, computer vision and 3D spatial computing, XR, robotics, and an AI build lab, each with role and public evidence.'],
    'cv/index.html': [null, '수술 로보틱스·컴퓨터비전 R&amp;D 엔지니어 김진민의 학력, 경력, 연구 실적, 특허, 수상.'],
    'en/cv/index.html': [null, 'Public CV of Jinmin Kim, robotics and computer vision R&amp;D engineer: education, experience, publications, patents, and awards.'],
    'contact/index.html': [null, '수술 내비게이션·3D 비전 공동연구와 연구 협력 문의 방법입니다.'],
    'en/contact/index.html': [null, 'How to reach Jinmin Kim about joint research in surgical navigation and 3D vision.']
  };
  for (const [file, [title, description]] of Object.entries(expected)) {
    const html = read(file);
    if (title) assert.ok(html.includes(`<title>${title}</title>`), `${file} title`);
    assert.ok(html.includes(`<meta name="description" content="${description}">`), `${file} description`);
  }
  const i18n = require('../js/site-i18n.js');
  assert.equal(i18n.ui.ko.footer, '수술 로보틱스·컴퓨터비전 R&D 엔지니어 · 대한민국 대구');
  assert.equal(i18n.ui.en.footer, 'Robotics & Computer Vision R&D Engineer · Daegu, Korea');
  const nav = read('js/nav.js');
  assert.match(nav, /수술 내비게이션 · 3D 정합 · 광학 추적 · XR — 지능형 수술을 향해\./);
  assert.match(nav, /Surgical navigation, 3D registration, optical tracking and XR — toward intelligent surgery\./);
});
