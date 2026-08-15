const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dataModulePath = path.join(root, 'js', 'portfolio-data.js');
const renderModulePath = path.join(root, 'js', 'portfolio-render.js');
const i18nModulePath = path.join(root, 'js', 'site-i18n.js');
const validatorPath = path.join(root, 'scripts', 'validate-portfolio.cjs');
const contributionPercentagePattern = /(?:(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당)[\s\S]{0,80}\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*%[\s\S]{0,80}(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당))/i;

test('portfolio data and renderer modules exist', () => {
  assert.equal(fs.existsSync(dataModulePath), true, 'missing js/portfolio-data.js');
  assert.equal(fs.existsSync(renderModulePath), true, 'missing js/portfolio-render.js');
  assert.equal(fs.existsSync(i18nModulePath), true, 'missing js/site-i18n.js');
  assert.equal(fs.existsSync(validatorPath), true, 'missing scripts/validate-portfolio.cjs');
});

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');
const validator = require('../scripts/validate-portfolio.cjs');

test('locale routing maps the same semantic page to Korean and English URLs', () => {
  assert.equal(i18n.normalizeLocale('ko'), 'ko');
  assert.equal(i18n.normalizeLocale('en'), 'en');
  assert.equal(i18n.normalizeLocale('fr'), 'ko');
  assert.equal(i18n.routeHref('../', 'ko', 'projects/surgical-twin/', false), '../projects/surgical-twin/');
  assert.equal(i18n.routeHref('../', 'en', 'projects/surgical-twin/', false), '../en/projects/surgical-twin/');
  assert.equal(i18n.routeHref('../../../', 'en', 'projects/', true), '../../../en/projects/index.html');
  assert.equal(i18n.routeHref('', 'ko', '', false), './');
  assert.equal(i18n.routeHref('../', 'en', '', true), '../en/index.html');
});

test('locale UI copy exposes navigation and portfolio labels in both languages', () => {
  assert.equal(i18n.ui.ko.nav.projects, '프로젝트');
  assert.equal(i18n.ui.en.nav.projects, 'Projects');
  assert.equal(i18n.ui.ko.portfolio.owned, '담당');
  assert.equal(i18n.ui.en.portfolio.owned, 'Owned');
});

test('navigation builder keeps links inside the active locale and switches to the matching route', () => {
  let nav;
  assert.doesNotThrow(() => { nav = require('../js/nav.js'); });
  const html = nav.navigationHtml({
    base: '../../../',
    current: 'projects',
    locale: 'en',
    route: 'projects/surgical-twin/',
    isFile: false
  });

  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/projects\/"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/projects\/surgical-twin\/"[^>]*>한국어<\/a>/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/projects\/surgical-twin\/"[^>]*aria-current="true"[^>]*>EN<\/a>/);
  assert.match(html, /class="language-switch"/);
  assert.match(html, /aria-label="Choose language"/);
});

test('canonical data contains five capabilities and thirteen projects', () => {
  assert.equal(data.capabilities.length, 5);
  assert.equal(data.impactMetrics.length, 3);
  assert.equal(data.projects.length, 13);
  assert.equal(new Set(data.projects.map((project) => project.slug)).size, 13);
});

test('canonical records localize human-readable copy without duplicating structural fields', () => {
  const korean = render.localizePortfolioData(data, 'ko');
  const english = render.localizePortfolioData(data, 'en');

  assert.equal(korean.capabilities[0].title, '3D 정합 및 내비게이션 (3D Registration & Navigation)');
  assert.equal(english.capabilities[0].title, '3D Registration & Navigation');
  assert.equal(korean.projects.find((project) => project.slug === 'rtms-navigation').status, '진행 중');
  assert.equal(english.projects.find((project) => project.slug === 'rtms-navigation').status, 'Ongoing');
  assert.deepEqual(korean.projects.map((project) => project.slug), english.projects.map((project) => project.slug));
  assert.equal(data.projects[0].translations.ko.ownedRole.length > 0, true);
  assert.equal(data.projects[0].translations.en.ownedRole.length > 0, true);
});

test('every project has a valid capability, evidence state, and local route', () => {
  const capabilityKeys = new Set(data.capabilities.map((capability) => capability.key));
  const evidenceStates = new Set(['verified', 'ongoing', 'expected', 'research', 'completed']);

  for (const project of data.projects) {
    assert.equal(capabilityKeys.has(project.primaryCapability), true, `${project.slug}: invalid primary capability`);
    assert.equal(evidenceStates.has(project.evidenceState), true, `${project.slug}: invalid evidence state`);
    assert.equal(Array.isArray(project.crossCapabilities), true, `${project.slug}: missing cross capabilities`);
    assert.equal(Array.isArray(project.tech), true, `${project.slug}: missing tech list`);
    assert.equal(fs.existsSync(path.join(root, 'projects', project.slug, 'index.html')), true, `${project.slug}: missing route`);
  }
});

test('shared metadata contains no contribution percentages or private partner names', () => {
  const serialized = JSON.stringify(data);
  assert.doesNotMatch(serialized, contributionPercentagePattern);
  assert.doesNotMatch(serialized, render.policy.prohibitedPartnerPattern);
  for (const privatePartner of ['울산대', '이화여대']) {
    assert.match(privatePartner, render.policy.prohibitedPartnerPattern, `${privatePartner}: missing privacy policy variant`);
  }
});

test('policy rejects arbitrary contribution percentages but permits evidence rates', () => {
  const attributed = JSON.parse(JSON.stringify(data));
  attributed.projects[0].translations.en.ownedRole += ' Contribution 47%.';
  assert.match(render.validatePortfolioData(attributed).join(' '), /contribution percentage/i);

  const measured = JSON.parse(JSON.stringify(data));
  measured.projects[0].translations.en.verifiedEvidence += ' Measured pass rate 87%.';
  assert.doesNotMatch(render.validatePortfolioData(measured).join(' '), /contribution percentage/i);
});

test('data validator accepts the canonical portfolio', () => {
  assert.deepEqual(render.validatePortfolioData(data), []);
});

test('missing Korean copy falls back to English at runtime but fails deployment validation', () => {
  const incomplete = JSON.parse(JSON.stringify(data));
  delete incomplete.projects[0].translations.ko.problemSummary;
  const localized = render.localizePortfolioData(incomplete, 'ko');

  assert.equal(localized.projects[0].problemSummary, incomplete.projects[0].translations.en.problemSummary);
  assert.match(render.validatePortfolioData(incomplete).join(' '), /missing ko translation for problemSummary/);
});

test('portfolio validator inventories all eighteen routes in both locales', () => {
  const files = validator.publicPortfolioFiles(root);
  assert.equal(files.length, 36);
  assert.equal(new Set(files.map((file) => file.relativePath)).size, 36);
  assert.deepEqual(validator.validatePortfolio(root), []);
});

test('localized pages never rewrite parent traversal into external asset URLs', () => {
  for (const file of validator.publicPortfolioFiles(root)) {
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    assert.doesNotMatch(html, /https?:\/\/[^"\s]*\/\.\.\//, `${file.relativePath}: malformed external URL`);
  }
});

test('renderers produce the five-card atlas and thirteen-card capability chapters in both locales', () => {
  const atlas = render.capabilityAtlasHtml(data, '', false, 'en');
  const chapters = render.projectChaptersHtml(data, '../../', false, 'en');
  const koreanAtlas = render.capabilityAtlasHtml(data, '', false, 'ko');

  assert.equal((atlas.match(/class="capability-card/g) || []).length, 5);
  assert.equal((chapters.match(/class="project-chapter/g) || []).length, 5);
  assert.equal((chapters.match(/class="project-card/g) || []).length, 13);
  assert.equal((render.capabilityDetailsHtml(data, '../../', false, 'en').match(/class="capability-detail"/g) || []).length, 5);
  assert.match(atlas, /3D Registration &amp; Navigation/);
  assert.match(koreanAtlas, /3D 정합 및 내비게이션/);
  assert.doesNotMatch(chapters, /Featured|More Projects/);
  assert.match(chapters, /href="\.\.\/\.\.\/en\/projects\/unmanned-forklift\//);
});

test('mountAll fills supported portfolio mount points', () => {
  const atlasNode = { innerHTML: '' };
  const chaptersNode = { innerHTML: '' };
  const detailsNode = { innerHTML: '' };
  const fakeDocument = {
    querySelectorAll(selector) {
      if (selector === '[data-portfolio="capability-atlas"]') return [atlasNode];
      if (selector === '[data-portfolio="project-chapters"]') return [chaptersNode];
      if (selector === '[data-portfolio="capability-details"]') return [detailsNode];
      return [];
    },
    body: { getAttribute: (name) => name === 'data-lang' ? 'en' : '' }
  };

  render.mountAll(fakeDocument, data);

  assert.match(atlasNode.innerHTML, /capability-card/);
  assert.match(chaptersNode.innerHTML, /project-card/);
  assert.match(detailsNode.innerHTML, /What I solve/);
});

test('mountAll skips a malformed project while preserving valid content', () => {
  const malformed = JSON.parse(JSON.stringify(data));
  delete malformed.projects[0].translations.ko.ownedRole;
  delete malformed.projects[0].translations.en.ownedRole;
  const chaptersNode = { innerHTML: '' };
  const fakeDocument = {
    querySelectorAll(selector) { return selector === '[data-portfolio="project-chapters"]' ? [chaptersNode] : []; },
    body: { getAttribute: (name) => name === 'data-lang' ? 'en' : '' },
    location: { protocol: 'https:' }
  };
  const originalWarn = console.warn;
  console.warn = () => {};
  try { render.mountAll(fakeDocument, malformed); } finally { console.warn = originalWarn; }
  assert.equal((chaptersNode.innerHTML.match(/class="project-card/g) || []).length, 12);
  assert.doesNotMatch(chaptersNode.innerHTML, /portfolio-error/);
});

test('renderers create explicit index pages for file protocol', () => {
  assert.match(render.capabilityAtlasHtml(data, '', true, 'ko'), /projects\/surgical-twin\/index\.html/);
  assert.match(render.projectChaptersHtml(data, '../', true, 'ko'), /href="\.\.\/projects\/surgical-twin\/index\.html"/);
  assert.match(render.capabilityDetailsHtml(data, '../../', true, 'en'), /\.\.\/\.\.\/en\/projects\/surgical-twin\/index\.html/);
});

test('authored local directory links have explicit file protocol fallbacks', () => {
  const koreanFiles = ['index.html', 'projects/index.html', 'research/index.html', 'cv/index.html', 'contact/index.html']
    .concat(data.projects.map((project) => `projects/${project.slug}/index.html`));
  const files = koreanFiles.concat(koreanFiles.map((file) => `en/${file}`));
  for (const file of files) {
    const html = read(file);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      assert.equal(href.endsWith('/'), false, `${file}: directory link lacks index.html fallback: ${href}`);
    }
  }
});

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('every portfolio route has paired Korean and English static metadata', () => {
  const routes = [
    { route: '', file: 'index.html' },
    { route: 'projects/', file: 'projects/index.html' },
    { route: 'research/', file: 'research/index.html' },
    { route: 'cv/', file: 'cv/index.html' },
    { route: 'contact/', file: 'contact/index.html' }
  ].concat(data.projects.map((project) => ({
    route: `projects/${project.slug}/`,
    file: `projects/${project.slug}/index.html`
  })));

  assert.equal(routes.length, 18);
  for (const page of routes) {
    const englishFile = path.join('en', page.file);
    assert.equal(fs.existsSync(path.join(root, englishFile)), true, `${englishFile}: missing English counterpart`);
    const korean = read(page.file);
    const english = read(englishFile);
    const koreanUrl = `https://rafaam11.github.io/${page.route}`;
    const englishUrl = `https://rafaam11.github.io/en/${page.route}`;

    assert.match(korean, /<html lang="ko">/, `${page.file}: wrong html lang`);
    assert.match(korean, /data-lang="ko"/, `${page.file}: missing Korean locale`);
    assert.match(korean, new RegExp(`data-route="${page.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${page.file}: wrong semantic route`);
    assert.match(korean, new RegExp(`<link rel="canonical" href="${koreanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(korean, new RegExp(`hreflang="en" href="${englishUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));

    assert.match(english, /<html lang="en">/, `${englishFile}: wrong html lang`);
    assert.match(english, /data-lang="en"/, `${englishFile}: missing English locale`);
    assert.match(english, new RegExp(`data-route="${page.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${englishFile}: wrong semantic route`);
    assert.match(english, new RegExp(`<link rel="canonical" href="${englishUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(english, new RegExp(`hreflang="ko" href="${koreanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));

    assert.equal(korean.indexOf('site-i18n.js') < korean.indexOf('nav.js'), true, `${page.file}: i18n must load before nav`);
    assert.equal(english.indexOf('site-i18n.js') < english.indexOf('nav.js'), true, `${englishFile}: i18n must load before nav`);
  }
});

test('English case studies use English-only diagram variants', () => {
  const diagrams = [
    ['nav-digitaltwin-pipeline-en.svg', 'en/projects/surgical-twin/index.html'],
    ['hololens-ar-concept-en.svg', 'en/projects/life-careverse/index.html'],
    ['forklift-sim-to-real-en.svg', 'en/projects/unmanned-forklift/index.html']
  ];
  for (const [diagram, page] of diagrams) {
    const diagramPath = path.join(root, 'assets', 'diagrams', diagram);
    assert.equal(fs.existsSync(diagramPath), true, `${diagram}: missing English diagram`);
    const svg = fs.readFileSync(diagramPath, 'utf8');
    for (const match of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
      assert.doesNotMatch(match[1], /[가-힣]/, `${diagram}: Korean SVG text remains`);
    }
    assert.match(read(page), new RegExp(diagram.replace('.', '\\.')), `${page}: does not use ${diagram}`);
  }
});

test('navigation leads with Projects and Capabilities', () => {
  const nav = require('../js/nav.js');
  const html = nav.navigationHtml({ base: '', current: 'home', locale: 'en', route: '', isFile: true });
  const projectsIndex = html.indexOf('Projects');
  const capabilitiesIndex = html.indexOf('Capabilities');
  const cvIndex = html.indexOf('>CV<');
  const contactIndex = html.indexOf('Contact');

  assert.equal(projectsIndex >= 0, true);
  assert.equal(projectsIndex < capabilitiesIndex, true);
  assert.equal(capabilitiesIndex < cvIndex, true);
  assert.equal(cvIndex < contactIndex, true);
  assert.match(html, /href="en\/projects\/index\.html"/);
  assert.match(nav.footerHtml('en'), /3D Spatial Computing · Research Engineer/);
});

test('Home implements the Pure Capability Atlas hierarchy', () => {
  const html = read('index.html');
  const english = read('en/index.html');
  assert.match(html, /data-portfolio="capability-atlas"/);
  assert.match(html, /불확실한 3D 공간 문제를 팀이 검증하고 신뢰하며 확장할 수 있는 시스템으로 만듭니다\./);
  assert.match(html, /3–4개월 → 1–2주/);
  assert.match(html, /주 단위 → 월 단위/);
  assert.match(html, /4–5개 micro-PoC/);
  assert.match(english, /I turn uncertain 3D spatial problems into systems teams can test, trust, and extend\./);
  assert.match(html, /profile_square\.webp/);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'img', 'profile_square.webp')), true);
  assert.equal(html.indexOf('data-portfolio="capability-atlas"') < html.indexOf('검증된 변화'), true);
  assert.equal(html.indexOf('site-i18n.js') < html.indexOf('portfolio-data.js'), true);
  assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true);
});

test('Projects uses capability chapters without Featured hierarchy', () => {
  const html = read('projects/index.html');
  const english = read('en/projects/index.html');
  assert.match(html, /data-portfolio="project-chapters"/);
  assert.match(html, new RegExp(`${data.projects.length}개 프로젝트`));
  assert.match(english, /Thirteen projects/);
  assert.match(english, /content="Thirteen 3D spatial computing projects/);
  assert.doesNotMatch(html, />Featured</);
  assert.doesNotMatch(html, />More Projects</);
  assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true);
  for (const project of data.projects) {
    assert.match(html, new RegExp(`href="${project.slug}/index\\.html"`), `${project.slug}: missing static fallback link`);
  }
});

test('Research route is presented as Capabilities', () => {
  const html = read('research/index.html');
  const english = read('en/research/index.html');
  assert.match(html, /data-page="capabilities"/);
  assert.match(html, /<title>역량 \(Capabilities\) · Jinmin Kim<\/title>/);
  assert.match(html, /data-portfolio="capability-details"/);
  assert.match(html, /해결하는 문제/);
  assert.match(html, /검증 방법/);
  assert.match(english, /What I solve/);
  assert.match(english, /How I validate/);
  assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true);
});

test('site stylesheet defines the approved atlas and chapter components', () => {
  const css = read('css/site.css');
  for (const className of ['.hero-kicker', '.hero-statement', '.capability-atlas', '.capability-card', '.impact-strip', '.work-principles', '.project-chapter', '.project-grid', '.project-card', '.language-switch', '.language-option']) {
    assert.match(css, new RegExp(className.replace('.', '\\.')));
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.language-option\.active/);
  assert.match(css, /@media \(max-width: 767\.98px\)[\s\S]*\.language-switch/);
});

test('CV frames current experience as owned decisions and evidenced change', () => {
  const html = read('cv/index.html');
  const english = read('en/cv/index.html');
  assert.match(html, /실무형 테크니컬 리드 IC/);
  assert.match(html, />담당 \(Owned\)</);
  assert.match(html, />변화 \(Changed\)</);
  assert.match(html, />근거 \(Evidence\)</);
  assert.match(html, /3–4개월 → 1–2주/);
  assert.match(html, /주 단위 → 월 단위/);
  assert.match(english, /Hands-on technical-lead IC/);
  assert.doesNotMatch(html, /\b\d{1,3}(?:\.\d+)?\s*%/);
});

test('English CV has English-only visible and accessible copy', () => {
  const english = read('en/cv/index.html');
  const visibleText = english
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visibleText, /[가-힣]/, 'English CV contains visible Korean copy');
  for (const match of english.matchAll(/\b(?:alt|aria-label|title)="([^"]*)"/g)) {
    assert.doesNotMatch(match[1], /[가-힣]/, `English CV accessibility copy is not English: ${match[1]}`);
  }
});

test('Contact speaks to senior R&D hiring without overpromising', () => {
  const html = read('contact/index.html');
  const english = read('en/contact/index.html');
  assert.match(html, /시니어 R&amp;D 팀/);
  assert.match(html, /실무형 테크니컬 리드 IC/);
  assert.match(english, /senior R&amp;D teams/i);
  assert.match(english, /hands-on technical-lead IC/i);
  assert.doesNotMatch(html, /end-to-end/i);
  assert.doesNotMatch(html, /1–2일/);
  assert.doesNotMatch(html, /within (?:one|two|1|2) business days/i);
});

test('all project details use the Decision Timeline attribution contract', () => {
  const requiredLabels = ['Uncertainty', 'Probe', 'Evidence', 'Decision', 'Integration', 'Verified Outcome', 'My Decisions', 'Team Result', 'Current Status'];
  for (const project of data.projects) {
    const html = read(`en/projects/${project.slug}/index.html`);
    for (const label of requiredLabels) assert.match(html, new RegExp(label), `${project.slug}: missing ${label}`);
    assert.match(html, /class="decision-timeline"/, `${project.slug}: missing decision timeline`);
    assert.match(html, new RegExp(project.period.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${project.slug}: period differs from canonical data`);
    assert.doesNotMatch(html, contributionPercentagePattern, `${project.slug}: contains contribution percentage`);
  }
});

test('all Korean project details preserve the localized decision and attribution contract', () => {
  const requiredLabels = ['불확실성', '탐색', '근거', '결정', '통합', '검증된 결과', '내가 내린 결정', '팀 결과', '현재 상태'];
  for (const project of data.projects) {
    const html = read(`projects/${project.slug}/index.html`);
    for (const label of requiredLabels) assert.match(html, new RegExp(label), `${project.slug}: missing ${label}`);
    assert.match(html, /class="decision-timeline"/, `${project.slug}: missing decision timeline`);
  }
});

test('thin case studies stay within their canonical ownership boundaries', () => {
  const distance = read('en/projects/ar-distance-meter/index.html');
  assert.match(distance, /Vuforia/);
  assert.match(distance, /marker/i);
  assert.doesNotMatch(distance, /AR Foundation|Plane Tracking|plane tracking/);

  const cArm = read('en/projects/c-arm-navigation/index.html');
  assert.match(cArm, /bounded|partial/i);
  assert.match(cArm, /assigned (?:portion|subset|contribution|functionality)/i);

  const twin = read('en/projects/radioactive-digital-twin/index.html');
  assert.match(twin, /initial Isaac Sim environment/i);
  assert.match(twin, /hand(?:ed )?off|handoff/i);
  assert.match(twin, /Robot integration, route rehearsal, field validation, and safety claims are explicitly outside this case/i);

  const orthognathic = read('en/projects/orthognathic-ar/index.html');
  assert.match(orthognathic, /HoloLens/);
  assert.match(orthognathic, /partial research contribution/i);

  const oralFacial = read('en/projects/oral-facial-ar/index.html');
  assert.match(oralFacial, /supporting AR navigation/i);
  assert.match(oralFacial, /partial early-career contribution/i);
});

test('AI-assisted case studies state the human and agent boundary', () => {
  const html = read('en/projects/llm-wiki/index.html');
  assert.match(html, /data-ai-assisted="true"/);
  assert.match(html, /Human-owned/);
  assert.match(html, /AI-assisted/);
  assert.match(html, /PR review/);
  assert.match(html, /planning SSOT/);
});

test('case-study stylesheet defines decision and attribution components', () => {
  const css = read('css/case-study.css');
  for (const className of ['.decision-timeline', '.decision-step', '.decision-label', '.attribution-grid', '.limitation-note', '.case-pager']) {
    assert.match(css, new RegExp(className.replace('.', '\\.')));
  }
});
