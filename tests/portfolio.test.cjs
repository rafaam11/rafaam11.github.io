const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
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
  assert.deepEqual(
    { ko: i18n.ui.ko.portfolio.owned, en: i18n.ui.en.portfolio.owned },
    { ko: '내 범위', en: 'My scope' }
  );
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
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/projects\/surgical-twin\/"[^>]*aria-current="page"[^>]*>EN<\/a>/);
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
  assert.match(html, /불확실한 3D 공간을, 검증 가능한 시스템으로\./);
  assert.match(english, /Turn spatial uncertainty into systems teams can trust\./);
  for (const metric of ['약 3–4개월 → 1–2주', '약 주 1회 → 월 1회', '약 4–5개 micro-PoC']) assert.match(html, new RegExp(metric));
  for (const metric of ['Approx\\. 3–4 months → 1–2 weeks', 'Approx\\. weekly → monthly', 'Approx\\. 4–5 micro-PoCs']) assert.match(english, new RegExp(metric));
  for (const page of [html, english]) {
    assert.match(page, /profile_square\.webp/);
    assert.equal(page.indexOf('ss-evidence-strip') < page.indexOf('data-portfolio="capability-atlas"'), true);
    assert.equal(page.indexOf('data-portfolio="capability-atlas"') < page.indexOf('ss-outcomes'), true);
    assert.equal(page.indexOf('site-i18n.js') < page.indexOf('portfolio-data.js'), true);
    assert.equal(page.indexOf('portfolio-data.js') < page.indexOf('portfolio-render.js'), true);
  }
  assert.equal(fs.existsSync(path.join(root, 'assets', 'img', 'profile_square.webp')), true);
});

test('Home outcome sections use neutral evidence framing without losing estimated first labels', () => {
  const outcomes = [
    ['index.html', read('index.html'), '예상'],
    ['en/index.html', read('en/index.html'), 'Estimated']
  ];
  for (const [file, html, expectedEstimate] of outcomes) {
    const section = sectionAt(html, 'ss-outcomes');
    assert.match(section, /<p class="ss-eyebrow">OUTCOME EVIDENCE<\/p>/, `${file}: outcomes must use the neutral OUTCOME EVIDENCE kicker`);
    assert.doesNotMatch(section, /PROVEN OUTCOMES/, `${file}: outcomes must not claim PROVEN OUTCOMES`);
    const firstOutcome = section.match(/<article\b[^>]*\bclass="[^"]*\bss-outcome\b[^"]*"[^>]*>[\s\S]*?<\/article>/)?.[0];
    assert.ok(firstOutcome, `${file}: missing first outcome article`);
    assert.match(firstOutcome, new RegExp(expectedEstimate), `${file}: first outcome label must retain ${expectedEstimate}`);
  }
});

test('bilingual Home evidence slides expose an identical hook and nesting contract', () => {
  const homes = [
    ['index.html', read('index.html')],
    ['en/index.html', read('en/index.html')]
  ];
  for (const [file, html] of homes) {
    const evidence = sectionAt(html, 'ss-evidence-strip');
    const eyebrow = evidence.match(/<p\b[^>]*\bclass="[^"]*\bss-eyebrow\b[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1];
    assert.ok(eyebrow, `${file}: evidence strip needs an eyebrow`);
    if (file === 'en/index.html') {
      assert.match(eyebrow, /^EVIDENCE REGISTRATION\s*·\s*PUBLIC EVIDENCE$/, `${file}: evidence eyebrow must use neutral PUBLIC EVIDENCE`);
      assert.doesNotMatch(eyebrow, /PUBLIC PROOF/, `${file}: evidence eyebrow must not claim PUBLIC PROOF while slides are Ongoing`);
    } else {
      assert.match(eyebrow, /공개 가능한 근거/, `${file}: Korean evidence eyebrow must retain 공개 가능한 근거`);
    }
    const slides = evidence.match(/<article\b(?=[^>]*\bclass="[^"]*\bss-evidence-slide\b[^"]*")[\s\S]*?<\/article>/g) || [];
    for (let index = 0; index < slides.length; index++) {
      const image = slides[index].match(/<img\b[^>]*>/i)?.[0];
      assert.ok(image, `${file}: slide ${index + 1} is missing an evidence image`);
      assert.match(image, /\bwidth="[1-9]\d*"/, `${file}: slide ${index + 1} evidence image needs a positive numeric width`);
      assert.match(image, /\bheight="[1-9]\d*"/, `${file}: slide ${index + 1} evidence image needs a positive numeric height`);
    }
    const outcomes = sectionAt(html, 'ss-outcomes');
    const outcomeArticles = outcomes.match(/<article\b(?=[^>]*\bclass="[^"]*\bss-outcome\b[^"]*")[\s\S]*?<\/article>/g) || [];
    assert.equal(outcomeArticles.length, 3, `${file}: exactly three .ss-outcome articles required`);
    for (let index = 0; index < outcomeArticles.length; index++) {
      assert.match(
        outcomeArticles[index],
        /<strong\b[^>]*\bclass="[^"]*\bss-outcome__value\b[^"]*"[^>]*>[\s\S]*?<\/strong>\s*<p\b[^>]*\bclass="[^"]*\bss-outcome__label\b[^"]*"[^>]*>/,
        `${file}: outcome ${index + 1} must use value strong followed by block p label`
      );
    }
  }
  const signatures = [];
  for (const [file, html] of homes) {
    const evidence = sectionAt(html, 'ss-evidence-strip');
    const slides = evidence.match(/<article\b(?=[^>]*\bclass="[^"]*\bss-evidence-slide\b[^"]*")[\s\S]*?<\/article>/g) || [];
    assert.equal(slides.length, 3, `${file}: exactly three .ss-evidence-slide elements required`);
    const controls = evidence.match(/<button\b(?=[^>]*\bclass="[^"]*\bss-evidence-control\b[^"]*")[^>]*>/g) || [];
    assert.equal(controls.length, 3, `${file}: exactly three evidence controls required`);
    const nesting = [];
    for (let index = 1; index <= 3; index++) {
      const slide = slides[index - 1];
      assert.match(slide, /\bdata-ss-evidence-slide(?:\s|=|>)/, `${file}: slide ${index} missing data-ss-evidence-slide`);
      assert.match(slide, new RegExp(`\\bdata-ss-slide="${index}"`), `${file}: slide ${index} has the wrong numeric data-ss-slide`);
      assert.match(slide, new RegExp(`\\bdata-ss-state="${index === 1 ? 'active' : 'inactive'}"`), `${file}: slide ${index} has the wrong initial state`);
      assert.match(slide, new RegExp(`\\bid="ss-evidence-slide-${index}"`), `${file}: slide ${index} has the wrong ID`);
      const control = controls.find((button) => new RegExp(`\\bdata-ss-target="${index - 1}"`).test(button));
      assert.ok(control, `${file}: missing control target ${index - 1}`);
      assert.match(control, new RegExp(`\\baria-controls="ss-evidence-slide-${index}"`), `${file}: target ${index - 1} must control slide ${index}`);
      assert.match(control, new RegExp(`\\baria-pressed="${index === 1 ? 'true' : 'false'}"`), `${file}: target ${index - 1} must expose pressed state`);
      assert.doesNotMatch(control, /\baria-selected=/, `${file}: selector buttons must not use aria-selected outside a tab pattern`);
      assert.match(slide, /<h3\b[^>]*\bclass="[^"]*\bss-evidence-slide__title\b[^"]*"[^>]*>/, `${file}: slide ${index} title must be a level-three heading`);
      assert.doesNotMatch(slide, /<strong\b[^>]*\bclass="[^"]*\bss-evidence-slide__title\b/, `${file}: slide ${index} title must not be a non-heading strong element`);
      nesting.push(/<figure\b[\s\S]*?<picture\b[\s\S]*?<img\b[\s\S]*?<\/picture>[\s\S]*?<figcaption\b[\s\S]*?<\/figcaption>[\s\S]*?<\/figure>/.test(slide));
    }
    assert.deepEqual(nesting, [true, true, true], `${file}: each slide must retain figure > picture > img, figcaption nesting`);
    signatures.push(nesting.join(','));
  }
  assert.equal(signatures[0], signatures[1], 'Home locales must expose the same evidence figure/picture/figcaption nesting signature');
});

test('bilingual Home evidence strips provide one localized autoplay stop control', () => {
  const homes = [
    ['index.html', '자동 전환 중지'],
    ['en/index.html', 'Stop automatic transitions']
  ];
  for (const [file, label] of homes) {
    const evidence = sectionAt(read(file), 'ss-evidence-strip');
    const stopButtons = evidence.match(/<button\b(?=[^>]*\bclass="[^"]*\bss-evidence-stop\b[^"]*")(?=[^>]*\bdata-ss-evidence-stop(?:\s|=|>))[^>]*>[\s\S]*?<\/button>/g) || [];
    assert.equal(stopButtons.length, 1, `${file}: evidence strip needs exactly one explicit autoplay stop button`);
    assert.match(stopButtons[0], new RegExp(`>\\s*${label}\\s*<`), `${file}: stop button needs visible localized automatic-transition text`);
  }
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

test('authored Projects no-JS fallback labels mirror every canonical localized project title', () => {
  const pages = [
    ['projects/index.html', 'ko'],
    ['en/projects/index.html', 'en']
  ];
  const errors = [];

  for (const [file, locale] of pages) {
    const list = read(file).match(/<ul\b(?=[^>]*\bclass="[^"]*\bfallback-project-list\b[^"]*")[^>]*>([\s\S]*?)<\/ul>/);
    if (!list) {
      errors.push(`${file}: missing no-JS fallback project list`);
      continue;
    }

    const links = [...list[1].matchAll(/<a\b[^>]*\bhref="([^"/]+)\/index\.html"[^>]*>([\s\S]*?)<\/a>/g)];
    const labelsBySlug = new Map(
      links.map((match) => [
        match[1],
        match[2].replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
      ])
    );
    const expectedSlugs = data.projects.map((project) => project.slug).sort();
    const actualSlugs = [...labelsBySlug.keys()].sort();
    if (links.length !== expectedSlugs.length || JSON.stringify(actualSlugs) !== JSON.stringify(expectedSlugs)) {
      errors.push(`${file}: fallback list must expose every canonical project slug exactly once`);
    }

    errors.push(...data.projects.flatMap((project) => {
      const actual = labelsBySlug.get(project.slug);
      const expected = project.translations[locale].title;
      return actual === expected ? [] : [`${file}: ${project.slug}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
    }));
  }
  assert.deepEqual(errors, [], `stale no-JS fallback titles:\n${errors.join('\n')}`);
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

// Stage 1: Spatial Signal shell and Home contracts. These are intentionally
// observable contracts: HTML/CSS may be inspected statically, while the motion
// module is driven through a deterministic DOM and clock below.
const spatialSignalPath = path.join(root, 'js', 'spatial-signal.js');
const spatialSignalCssPath = path.join(root, 'css', 'spatial-signal.css');

function publicPortfolioHtmlFiles() {
  return validator.publicPortfolioFiles(root).map((file) => ({
    relativePath: file.relativePath,
    html: fs.readFileSync(file.absolutePath, 'utf8')
  }));
}

function sectionAt(html, className) {
  const start = html.indexOf(`<section class="${className}`);
  assert.notEqual(start, -1, `missing ${className} section`);
  const end = html.indexOf('</section>', start);
  assert.notEqual(end, -1, `${className}: missing closing section`);
  return html.slice(start, end + '</section>'.length);
}

function cssAtRuleBody(css, atRule) {
  const match = atRule.exec(css);
  assert.ok(match, `missing ${atRule}`);
  const openingBrace = css.indexOf('{', match.index);
  let depth = 0;
  for (let index = openingBrace; index < css.length; index++) {
    if (css[index] === '{') depth++;
    if (css[index] === '}' && --depth === 0) return css.slice(openingBrace + 1, index);
  }
  assert.fail(`unterminated ${atRule}`);
}

function cssRuleBodies(css, selector) {
  return [...css.matchAll(/(?:^|})\s*([^@}{][^{]+)\{([^{}]*)\}/gm)]
    .filter((match) => match[1].split(',').some((candidate) => candidate.trim() === selector))
    .map((match) => match[2]);
}

function resetsAllPadding(ruleBody) {
  return /\bpadding\s*:\s*0(?:\s+0){0,3}\s*;?/.test(ruleBody)
    || (/\bpadding-block\s*:\s*0\s*;?/.test(ruleBody) && /\bpadding-inline\s*:\s*0\s*;?/.test(ruleBody))
    || ['top', 'right', 'bottom', 'left'].every((side) => new RegExp(`\\bpadding-${side}\\s*:\\s*0\\s*;?`).test(ruleBody));
}

function freshSpatialSignal() {
  assert.equal(fs.existsSync(spatialSignalPath), true, 'missing js/spatial-signal.js');
  delete require.cache[spatialSignalPath];
  return require(spatialSignalPath);
}

function fakeElement(attributes = {}) {
  const listeners = new Map();
  const values = { ...attributes };
  const classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
  const element = {
    children: [],
    dataset: {},
    style: {},
    tabIndex: 0,
    classList: {
      add(...names) { names.forEach((name) => classes.add(name)); },
      remove(...names) { names.forEach((name) => classes.delete(name)); },
      contains(name) { return classes.has(name); },
      toggle(name, force) {
        const enabled = force === undefined ? !classes.has(name) : Boolean(force);
        if (enabled) classes.add(name); else classes.delete(name);
        return enabled;
      }
    },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : null; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(values, name); },
    setAttribute(name, value) {
      values[name] = String(value);
      if (name === 'class') {
        classes.clear();
        String(value).split(/\s+/).filter(Boolean).forEach((className) => classes.add(className));
      }
      if (name.startsWith('data-')) element.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = String(value);
    },
    removeAttribute(name) { delete values[name]; },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatch(type, event = {}) { listeners.get(type)?.forEach((listener) => listener({ type, currentTarget: element, ...event })); },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
    contains(candidate) { return candidate === element || element.children.includes(candidate); },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  Object.entries(values).forEach(([name, value]) => {
    if (name.startsWith('data-')) element.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = String(value);
  });
  return element;
}

function createEvidenceDom({ reducedMotion = false, narrowViewport = false } = {}) {
  const slides = [0, 1, 2].map((index) => {
    const slide = fakeElement({ 'data-ss-evidence-slide': '', 'data-ss-slide': String(index + 1) });
    const link = fakeElement({ href: `/projects/${index + 1}/` });
    link.tabIndex = 0;
    slide.querySelectorAll = (selector) => /a|button|input|select|textarea|\[tabindex\]/.test(selector) ? [link] : [];
    slide.querySelector = (selector) => /a|\[href\]/.test(selector) ? link : null;
    slide.link = link;
    return slide;
  });
  const controls = [0, 1, 2].map((index) => fakeElement({
    class: 'ss-evidence-control',
    'data-ss-evidence-control': '',
    'data-ss-target': String(index)
  }));
  const stopButton = fakeElement({
    class: 'ss-evidence-stop',
    'data-ss-evidence-stop': '',
    type: 'button'
  });
  const strip = fakeElement({
    class: 'ss-evidence-strip',
    'data-ss-evidence-strip': '',
    'data-ss-state': 'idle',
    'data-ss-interval': '4800'
  });
  strip.children = [...slides, ...controls, stopButton];
  strip.querySelectorAll = (selector) => {
    if (selector.includes('data-ss-evidence-slide') || /figure|\[role="tab"\]/.test(selector)) return slides;
    if (selector.includes('data-ss-evidence-control')) return controls;
    if (selector.includes('data-ss-evidence-stop')) return [stopButton];
    return [];
  };
  strip.querySelector = (selector) => /slide|figure/.test(selector) ? slides[0] : null;

  const documentListeners = new Map();
  function mediaQuery(matches) {
    const listeners = new Set();
    return {
      matches,
      addEventListener(type, listener) { if (type === 'change') listeners.add(listener); },
      removeEventListener(type, listener) { if (type === 'change') listeners.delete(listener); },
      dispatch(nextMatches) {
        this.matches = nextMatches;
        listeners.forEach((listener) => listener({ matches: nextMatches, currentTarget: this }));
      },
      listenerCount() { return listeners.size; }
    };
  }
  const motionQuery = mediaQuery(reducedMotion);
  const narrowQuery = mediaQuery(narrowViewport);
  const document = {
    hidden: false,
    defaultView: {
      matchMedia(query) {
        if (/prefers-reduced-motion/.test(query)) return motionQuery;
        if (/max-width:\s*720px/.test(query)) return narrowQuery;
        throw new Error(`unexpected media query: ${query}`);
      }
    },
    querySelector(selector) { return /evidence-strip/.test(selector) ? strip : null; },
    querySelectorAll(selector) { return /evidence-strip/.test(selector) ? [strip] : []; },
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, new Set());
      documentListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { documentListeners.get(type)?.delete(listener); },
    dispatch(type) { documentListeners.get(type)?.forEach((listener) => listener({ type, currentTarget: document })); },
    listenerCount(type) { return documentListeners.get(type)?.size || 0; }
  };
  return { document, strip, slides, controls, stopButton, motionQuery, narrowQuery };
}

function withFakeClock(callback) {
  const previous = {
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    setInterval: global.setInterval,
    clearInterval: global.clearInterval,
    window: global.window
  };
  const jobs = new Map();
  let nextId = 1;
  const schedule = (callback, delay, interval) => {
    const id = nextId++;
    jobs.set(id, { callback, delay, interval });
    return id;
  };
  global.setTimeout = (fn, delay) => schedule(fn, delay, false);
  global.clearTimeout = (id) => jobs.delete(id);
  global.setInterval = (fn, delay) => schedule(fn, delay, true);
  global.clearInterval = (id) => jobs.delete(id);
  try {
    return callback({
      pending: () => [...jobs.values()],
      runNext() {
        const [id, job] = jobs.entries().next().value || [];
        assert.notEqual(id, undefined, 'expected a scheduled transition');
        if (!job.interval) jobs.delete(id);
        job.callback();
      }
    });
  } finally {
    global.setTimeout = previous.setTimeout;
    global.clearTimeout = previous.clearTimeout;
    global.setInterval = previous.setInterval;
    global.clearInterval = previous.clearInterval;
    if (previous.window === undefined) delete global.window; else global.window = previous.window;
  }
}

test('Stage 1 loads Pretendard before the final local Spatial Signal stylesheet and adds a main anchor to every portfolio route', () => {
  const pages = publicPortfolioHtmlFiles();
  assert.equal(pages.length, 36);
  for (const { relativePath, html } of pages) {
    const stylesheets = [...html.matchAll(/<link\b[^>]*>/gi)]
      .filter((match) => /\brel="stylesheet"/i.test(match[0]))
      .map((match) => match[0].match(/\bhref="([^"]+)"/i)?.[1])
      .filter(Boolean);
    const siteCss = stylesheets.findIndex((href) => href.endsWith('css/site.css'));
    const spatialCss = stylesheets.findIndex((href) => href.endsWith('css/spatial-signal.css'));
    const pretendardCss = stylesheets
      .map((href, index) => ({ href, index }))
      .filter(({ href }) => /pretendardvariable-dynamic-subset\.css(?:[?#].*)?$/i.test(href));
    assert.ok(siteCss >= 0, `${relativePath}: missing css/site.css stylesheet link`);
    assert.equal(pretendardCss.length, 1, `${relativePath}: must load exactly one Pretendard Variable dynamic-subset stylesheet`);
    assert.ok(spatialCss > siteCss, `${relativePath}: spatial-signal.css must trail site.css as a stylesheet link`);
    assert.ok(pretendardCss[0].index < spatialCss, `${relativePath}: Pretendard dynamic subset must load before spatial-signal.css`);
    assert.equal(spatialCss, stylesheets.length - 1, `${relativePath}: spatial-signal.css must be the final authored stylesheet`);
    const main = html.match(/<main\b[^>]*\bid="main-content"[^>]*>/);
    assert.ok(main, `${relativePath}: missing main#main-content`);
    assert.match(main[0], /\btabindex="-1"/, `${relativePath}: main#main-content must be programmatically focusable for skip navigation`);
  }
});

test('all portfolio routes defer the retained Font Awesome script', () => {
  const fontAwesomeUrl = 'https://use.fontawesome.com/releases/v6.3.0/js/all.js';
  const violations = [];
  const pages = publicPortfolioHtmlFiles();
  assert.equal(pages.length, 36);
  for (const { relativePath, html } of pages) {
    const scripts = [...html.matchAll(/<script\b[^>]*>/gi)]
      .map((match) => match[0])
      .filter((tag) => new RegExp(`\\bsrc="${fontAwesomeUrl.replace(/[./]/g, '\\$&')}"`, 'i').test(tag));
    if (scripts.length !== 1) {
      violations.push(`${relativePath}: must retain exactly one Font Awesome v6.3.0 script`);
      continue;
    }
    if (!/\bdefer\b/i.test(scripts[0])) violations.push(`${relativePath}: Font Awesome script must include boolean defer`);
    if (!/\bcrossorigin(?:\s|=|>)/i.test(scripts[0])) violations.push(`${relativePath}: Font Awesome script must retain crossorigin`);
  }
  assert.deepEqual(violations, [], 'Font Awesome must not parser-block public portfolio routes');
});

test('Stage 1 common shell resets legacy body offsets on every portfolio route', () => {
  const pages = publicPortfolioHtmlFiles();
  assert.equal(pages.length, 36);
  const violations = [];
  for (const { relativePath, html } of pages) {
    const body = html.match(/<body\b[^>]*>/)?.[0];
    if (!body) {
      violations.push(`${relativePath}: missing body element`);
      continue;
    }
    const classes = body.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/) || [];
    if (!classes.includes('ss-shell')) violations.push(`${relativePath}: body must include ss-shell`);
    if ((relativePath === 'index.html' || relativePath === 'en/index.html') && !classes.includes('ss-home')) {
      violations.push(`${relativePath}: Home body must retain ss-home`);
    }
  }
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const shellRules = cssRuleBodies(css, '.ss-shell');
  if (!shellRules.length) violations.push('css/spatial-signal.css: missing .ss-shell body rule');
  else if (!shellRules.some(resetsAllPadding)) violations.push('css/spatial-signal.css: .ss-shell must reset all legacy body padding to zero');
  assert.deepEqual(violations, [], 'common shell must remove the legacy resume offsets');
});

test('Spatial Signal reserves the empty shared nav mount before JavaScript inserts navigation', () => {
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const violations = [];
  const baseRules = cssRuleBodies(css, '.ss-shell #site-nav');
  if (!baseRules.some((body) => /\bmin-height\s*:\s*84px\b/.test(body))) {
    violations.push('base .ss-shell #site-nav must reserve min-height: 84px before nav insertion');
  }
  const narrowRules = cssRuleBodies(cssAtRuleBody(css, /@media\s*\(max-width:\s*720px\)/), '.ss-shell #site-nav');
  if (!narrowRules.some((body) => /\bmin-height\s*:\s*80px\b/.test(body))) {
    violations.push('narrow .ss-shell #site-nav must reserve min-height: 80px before nav insertion');
  }
  assert.deepEqual(violations, [], 'the shared nav mount must not introduce insertion CLS');
});

test('Spatial Signal reserves the shared main viewport before JavaScript pushes the footer', () => {
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const violations = [];
  const baseRules = cssRuleBodies(css, '.ss-shell #main-content');
  if (!baseRules.some((body) => /\bmin-height\s*:\s*calc\(100vh\s*-\s*84px\)/.test(body))) {
    violations.push('base .ss-shell #main-content must reserve min-height: calc(100vh - 84px)');
  }
  const narrowRules = cssRuleBodies(cssAtRuleBody(css, /@media\s*\(max-width:\s*720px\)/), '.ss-shell #main-content');
  if (!narrowRules.some((body) => /\bmin-height\s*:\s*calc\(100vh\s*-\s*80px\)/.test(body))) {
    violations.push('narrow .ss-shell #main-content must reserve min-height: calc(100vh - 80px)');
  }
  assert.deepEqual(violations, [], 'the shared main must keep the footer below the initial viewport');
});

test('Stage 1 Home files provide the required shared shell, section order, and progressive-enhancement scripts', () => {
  for (const file of ['index.html', 'en/index.html']) {
    const html = read(file);
    assert.match(html, /<body\b[^>]*\bclass="[^"]*\bss-home\b[^"]*"/, `${file}: body must be ss-home`);
    const main = html.match(/<main\b[^>]*\bid="main-content"[^>]*>/);
    assert.ok(main, `${file}: missing main shell`);
    assert.match(main[0], /\bclass="page ss-home-main"/, `${file}: main shell must retain its class`);
    assert.match(main[0], /\btabindex="-1"/, `${file}: main shell must be a skip-focus target`);
    const order = ['ss-hero', 'ss-evidence-strip', 'ss-capabilities', 'ss-outcomes', 'ss-decision-loop', 'ss-contact-cta']
      .map((className) => html.indexOf(`<section class="${className}`));
    assert.equal(order.every((index) => index >= 0), true, `${file}: missing Home section`);
    assert.equal(order.every((index, position) => position === 0 || order[position - 1] < index), true, `${file}: wrong Home section order`);
    assert.match(html, /ss-hero[\s\S]*aria-labelledby="home-title"/, `${file}: hero must label home-title`);
    assert.match(html, /ss-registration-trace[^>]*aria-hidden="true"/, `${file}: missing decorative registration trace`);
    assert.match(html, /ss-registration-trace[^>]*data-ss-state/, `${file}: registration trace needs state hook`);
    assert.match(html, /data-ss-evidence-strip[^>]*data-ss-state="idle"[^>]*data-ss-interval="4800"/, `${file}: evidence strip needs initial timing state`);
    assert.match(sectionAt(html, 'ss-capabilities'), /data-portfolio="capability-atlas"/, `${file}: missing capability mount`);
    assert.equal((sectionAt(html, 'ss-outcomes').match(/<article\b/g) || []).length, 3, `${file}: outcomes must retain three claims`);
    assert.equal((sectionAt(html, 'ss-decision-loop').match(/<article\b/g) || []).length, 3, `${file}: decision loop must retain three ordered principles`);
    const contactCta = sectionAt(html, 'ss-contact-cta');
    assert.match(contactCta, /(?:contact\/index\.html|contact\/)/, `${file}: CTA must link to Contact`);
    assert.match(contactCta, /(?:projects\/index\.html|projects\/)/, `${file}: CTA must link to Projects`);
    assert.match(html, /profile_square\.webp/, `${file}: missing 176px profile trust anchor`);
    assert.equal(html.indexOf('site-i18n.js') < html.indexOf('nav.js'), true, `${file}: i18n must load before nav`);
    assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true, `${file}: data must load before renderer`);
    assert.equal(html.indexOf('nav.js') < html.indexOf('spatial-signal.js'), true, `${file}: Spatial Signal must load last`);
  }
});

test('Stage 1 Home evidence slides retain ordered localized diagrams, copy, states, and no-JS reachability', () => {
  const variants = [
    ['index.html', ['nav-digitaltwin-pipeline.svg', 'hololens-ar-concept.svg', 'forklift-sim-to-real.svg'], ['Surgical Twin', 'Life Careverse', 'Unmanned Forklift']],
    ['en/index.html', ['nav-digitaltwin-pipeline-en.svg', 'hololens-ar-concept-en.svg', 'forklift-sim-to-real-en.svg'], ['Surgical Twin', 'Life Careverse', 'Unmanned Forklift']]
  ];
  const slugs = ['surgical-twin', 'life-careverse', 'unmanned-forklift'];
  const states = ['Verified|검증됨', 'Ongoing|진행 중', 'Ongoing|진행 중'];
  for (const [file, diagrams, projects] of variants) {
    const evidence = sectionAt(read(file), 'ss-evidence-strip');
    const figures = evidence.match(/<figure\b[\s\S]*?<\/figure>/g) || [];
    assert.equal(figures.length, 3, `${file}: exactly three evidence figures required`);
    let cursor = -1;
    for (let index = 0; index < diagrams.length; index++) {
      const diagramAt = evidence.indexOf(diagrams[index]);
      assert.ok(diagramAt > cursor, `${file}: ${diagrams[index]} must preserve evidence order`);
      cursor = diagramAt;
      const figure = figures[index];
      const slideRegion = evidence.slice(diagramAt, index + 1 < diagrams.length ? evidence.indexOf(diagrams[index + 1]) : evidence.length);
      assert.match(figure, new RegExp(diagrams[index].replace('.', '\\.')), `${file}: evidence figure ${index + 1} uses the wrong diagram`);
      assert.match(figure, /<picture\b[\s\S]*?<img\b[^>]*\balt="[^"]+"[^>]*>[\s\S]*?<\/picture>[\s\S]*?<figcaption\b/, `${file}: ${diagrams[index]} must be picture/img with localized alt followed by figcaption`);
      assert.match(slideRegion, new RegExp(projects[index]), `${file}: ${diagrams[index]} missing project label`);
      assert.match(slideRegion, new RegExp(`projects\/${slugs[index]}`), `${file}: ${diagrams[index]} missing project link`);
      assert.match(slideRegion, new RegExp(states[index]), `${file}: ${diagrams[index]} has the wrong evidence state label`);
      if (file.startsWith('en/')) assert.doesNotMatch(figure, /[가-힣]/, `${file}: evidence accessibility copy must be English`);
    }
    assert.equal((evidence.match(/<figcaption\b/g) || []).length, 3, `${file}: exactly three evidence captions required`);
    assert.doesNotMatch(evidence, /<figure\b[^>]*\bhidden\b/, `${file}: meaningful no-JS slides cannot be hidden`);
  }
});

test('Stage 1 navigation has one named primary nav, skip target, semantic language group, and page current states', () => {
  const nav = require('../js/nav.js');
  const html = nav.navigationHtml({ base: '', current: 'projects', locale: 'en', route: 'projects/', isFile: true });
  assert.match(html, /^<a class="ss-skip-link" href="#main-content">/, 'skip link must lead navigation output');
  assert.equal((html.match(/<nav\b/g) || []).length, 1, 'navigation output must contain one primary nav');
  assert.match(html, /<nav\b[^>]*\bss-site-nav\b[^>]*aria-label="[^"]+"/, 'primary nav needs a unique accessible name');
  assert.match(html, /(?:role="group"[^>]*aria-label|aria-label[^>]*role="group")/, 'language links need an explicitly named group');
  assert.match(html, /<a\b[^>]*data-route="projects\/"[^>]*aria-current="page"|<a\b[^>]*aria-current="page"[^>]*data-route="projects\/"/, 'active language route must announce current page');
  assert.equal((html.match(/aria-current="page"/g) || []).length, 2, 'active navigation page and active language each require aria-current="page"');
  assert.equal((html.match(/aria-label="[^"]*navigation[^"]*"/gi) || []).length <= 1, true, 'navigation names must not be duplicated');
});

test('Stage 1 footer keeps positioning and contact channels under Spatial Signal classes', () => {
  const nav = require('../js/nav.js');
  const html = nav.footerHtml('en');
  assert.match(html, /\bss-site-footer\b/, 'footer output requires Spatial Signal descendants');
  for (const value of ['github.com', 'linkedin.com', 'mailto:', '3D Spatial Computing · Research Engineer']) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `footer missing ${value}`);
  }
  assert.match(html, /©|&copy;/, 'footer missing copyright');
});

test('SpatialSignal is a CommonJS/browser UMD mount API', () => {
  const module = freshSpatialSignal();
  assert.equal(typeof module.mount, 'function');
});

test('SpatialSignal mount is a safe no-op without a supported strip and is idempotent per strip', () => {
  const SpatialSignal = freshSpatialSignal();
  assert.doesNotThrow(() => SpatialSignal.mount({ querySelectorAll: () => [], querySelector: () => null }));
  withFakeClock((clock) => {
    const { document, strip } = createEvidenceDom();
    const first = SpatialSignal.mount(document);
    const second = SpatialSignal.mount(document);
    assert.equal(clock.pending().length, 1, 'repeated mount must not duplicate the timer');
    assert.equal(strip.listenerCount('pointerdown'), 1, 'repeated mount must not duplicate strip listeners');
    assert.equal(document.listenerCount('visibilitychange'), 1, 'repeated mount must not duplicate document listeners');
    assert.equal(first, second, 'repeated mount should return the existing controller when present');
  });
});

test('SpatialSignal advances one evidence slide every 4,800ms and completes without looping', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock((clock) => {
    const { document, strip, slides } = createEvidenceDom();
    SpatialSignal.mount(document);
    assert.equal(strip.getAttribute('data-ss-state'), 'running');
    assert.equal(slides[0].getAttribute('data-ss-state'), 'active');
    assert.equal(slides[1].getAttribute('data-ss-state'), 'inactive');
    assert.deepEqual(clock.pending().map((job) => job.delay), [4800]);
    clock.runNext();
    assert.equal(slides[1].getAttribute('data-ss-state'), 'active');
    assert.equal(slides[0].getAttribute('data-ss-state'), 'visited');
    assert.deepEqual(clock.pending().map((job) => job.delay), [4800]);
    clock.runNext();
    assert.equal(slides[2].getAttribute('data-ss-state'), 'active');
    assert.equal(strip.getAttribute('data-ss-state'), 'complete');
    assert.equal(clock.pending().length, 0, 'completed strip must not loop or leave a timer');
  });
});

test('SpatialSignal pauses for hover, focus, and document visibility then resumes only when clear', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock((clock) => {
    const { document, strip } = createEvidenceDom();
    SpatialSignal.mount(document);
    strip.dispatch('pointerenter');
    assert.equal(strip.getAttribute('data-ss-state'), 'paused');
    assert.equal(clock.pending().length, 0);
    strip.dispatch('focusin');
    strip.dispatch('pointerleave');
    assert.equal(strip.getAttribute('data-ss-state'), 'paused', 'focus must keep the strip paused after hover leaves');
    strip.dispatch('focusout');
    assert.equal(strip.getAttribute('data-ss-state'), 'running');
    document.hidden = true;
    document.dispatch('visibilitychange');
    assert.equal(strip.getAttribute('data-ss-state'), 'paused');
    document.hidden = false;
    document.dispatch('visibilitychange');
    assert.equal(strip.getAttribute('data-ss-state'), 'running');
  });
});

test('SpatialSignal pointer, touch, and keyboard user actions stop permanently and never resume', () => {
  const SpatialSignal = freshSpatialSignal();
  for (const [eventName, event] of [['pointerdown', {}], ['touchstart', {}], ['keydown', { key: 'ArrowRight' }]]) {
    withFakeClock((clock) => {
      const { document, strip, slides } = createEvidenceDom();
      SpatialSignal.mount(document);
      strip.dispatch(eventName, event);
      assert.equal(strip.getAttribute('data-ss-state'), 'stopped', `${eventName}: user action must stop playback`);
      assert.equal(clock.pending().length, 0, `${eventName}: user action must clear timer`);
      document.hidden = true;
      document.dispatch('visibilitychange');
      document.hidden = false;
      document.dispatch('visibilitychange');
      strip.dispatch('pointerleave');
      assert.equal(strip.getAttribute('data-ss-state'), 'stopped', `${eventName}: stopped playback must not resume`);
      assert.equal(clock.pending().length, 0, `${eventName}: stopped playback must remain timer-free`);
      assert.equal(slides[0].getAttribute('data-ss-state'), 'active');
    });
  }
});

test('SpatialSignal honors reduced motion without scheduling a transition', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock((clock) => {
    const { document, strip, slides } = createEvidenceDom({ reducedMotion: true });
    SpatialSignal.mount(document);
    assert.equal(strip.getAttribute('data-ss-state'), 'static');
    assert.equal(slides[0].getAttribute('data-ss-state'), 'active');
    assert.equal(clock.pending().length, 0);
  });
});

test('SpatialSignal keeps every wide evidence card exposed and keyboard-reachable', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock(() => {
    const { document, slides } = createEvidenceDom();
    SpatialSignal.mount(document);
    for (const slide of slides) {
      assert.equal(slide.getAttribute('aria-hidden'), 'false');
      assert.equal(slide.link.getAttribute('tabindex'), null);
    }
  });
});

test('SpatialSignal hides only narrow inactive evidence cards and cleans up its viewport listener', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock(() => {
    const { document, slides, narrowQuery } = createEvidenceDom();
    const controller = SpatialSignal.mount(document);
    assert.equal(narrowQuery.listenerCount(), 1, 'mount must observe the narrow viewport query');
    narrowQuery.dispatch(true);
    assert.equal(slides[0].getAttribute('aria-hidden'), 'false');
    for (const slide of slides.slice(1)) {
      assert.equal(slide.getAttribute('aria-hidden'), 'true');
      assert.equal(slide.link.getAttribute('tabindex'), '-1');
    }
    controller.destroy();
    assert.equal(narrowQuery.listenerCount(), 0, 'destroy must remove the narrow viewport listener');
  });
});

test('SpatialSignal stop button click latches stopped playback and pressed state', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock((clock) => {
    const { document, strip, stopButton } = createEvidenceDom();
    SpatialSignal.mount(document);
    assert.equal(stopButton.getAttribute('aria-pressed'), 'false');
    stopButton.dispatch('click');
    assert.equal(strip.getAttribute('data-ss-state'), 'stopped');
    assert.equal(clock.pending().length, 0, 'stop click must clear the autoplay timer');
    assert.equal(stopButton.getAttribute('aria-pressed'), 'true');
    strip.dispatch('pointerleave');
    assert.equal(strip.getAttribute('data-ss-state'), 'stopped', 'explicitly stopped playback must not resume');
  });
});

test('SpatialSignal selector target two selects slide three, presses its control, and stops playback', () => {
  const SpatialSignal = freshSpatialSignal();
  withFakeClock((clock) => {
    const { document, strip, slides, controls } = createEvidenceDom();
    SpatialSignal.mount(document);
    controls[2].dispatch('click');
    assert.equal(slides[2].getAttribute('data-ss-state'), 'active');
    assert.equal(controls[2].getAttribute('aria-pressed'), 'true');
    assert.equal(controls[0].getAttribute('aria-pressed'), 'false');
    assert.equal(strip.getAttribute('data-ss-state'), 'stopped');
    assert.equal(clock.pending().length, 0, 'selector click must clear the autoplay timer');
  });
});

test('Spatial Signal CSS defines scoped tokens, accessible interaction safeguards, and one-pass motion limits', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const homeRule = css.match(/\.ss-home\s*\{([^}]*)\}/);
  assert.ok(homeRule, 'missing .ss-home body rule');
  assert.equal(resetsAllPadding(homeRule[1]), true, '.ss-home must reset all legacy resume-shell padding to zero');
  const tokens = {
    '--ss-canvas': '#F7F6F2', '--ss-surface': '#FFFFFF', '--ss-ink': '#202522', '--ss-muted': '#66706B',
    '--ss-line': '#D8DDD7', '--ss-signal': '#007E7A', '--ss-signal-deep': '#005C5A', '--ss-spatial-blue': '#2E6FAE'
  };
  for (const [token, value] of Object.entries(tokens)) assert.match(css, new RegExp(`${token}:\\s*${value}`, 'i'));
  assert.doesNotMatch(css, /@import\b/i, 'spatial-signal.css must not create a chained stylesheet request with @import');
  assert.match(css, /Pretendard Variable[\s\S]*Pretendard[\s\S]*Inter[\s\S]*Segoe UI[\s\S]*sans-serif/, 'offline font fallback stack is required');
  assert.match(css, /:focus-visible/, 'visible keyboard focus is required');
  assert.match(css, /(?:min-(?:width|height|inline-size|block-size)|width|height)\s*:\s*44px/i, '44px touch target rule is required');
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, 'reduced motion override is required');
  assert.match(css, /@media\s*\(max-width:\s*[^)]+\)/, 'narrow viewport rule is required');
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient|marquee|animation(?:-iteration-count)?\s*:\s*infinite/i, 'Stage 1 forbids gradients, marquees, and loops');
  for (const selector of css.match(/(?:^|})\s*([^@}{][^{]+)\{/gm) || []) {
    const normalized = selector.replace(/^[^\n]*}/, '').trim();
    if (!normalized || normalized === ':root') continue;
    assert.match(normalized, /ss-|\[data-ss-state\]/, `new selector is not Spatial Signal scoped: ${normalized}`);
  }
});

test('Spatial Signal CSS resets every Home heading to the sans case-preserving system', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const headingRule = [...css.matchAll(/(?:^|})\s*([^{}]+)\{([^{}]*)\}/gm)].find((match) =>
    [1, 2, 3, 4, 5, 6].every((level) => new RegExp(`\\.ss-home\\s+h${level}(?:\\s|,|$)`).test(match[1]))
  );
  assert.ok(headingRule, 'missing one ss-scoped rule covering .ss-home h1 through h6');
  assert.match(headingRule[2], /font-family:\s*var\(--ss-font-sans\)/, 'Home heading reset must use var(--ss-font-sans)');
  assert.match(headingRule[2], /text-transform:\s*none/, 'Home heading reset must disable legacy uppercase');
});

test('Spatial Signal hero title preserves Korean words with safe overflow wrapping', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const heroTitleRule = css.match(/(?:^|})\s*\.ss-hero__title\s*\{([^}]*)\}/m);
  assert.ok(heroTitleRule, 'missing base .ss-hero__title rule');
  assert.match(heroTitleRule[1], /word-break:\s*keep-all/, 'hero title must keep Korean words intact');
  assert.match(heroTitleRule[1], /overflow-wrap:\s*break-word/, 'hero title must wrap an otherwise overflowing token');
  assert.doesNotMatch(heroTitleRule[1], /overflow-wrap:\s*anywhere/, 'hero title must not split Korean words with overflow-wrap: anywhere');
});

test('Spatial Signal CSS hides the Bootstrap navigation toggler at desktop widths', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  assert.match(
    css,
    /@media\s*\(min-width:\s*768px\)\s*\{[\s\S]*?\.ss-site-nav\s+\.navbar-toggler\s*\{[\s\S]*?display:\s*none/,
    'desktop media rule must set .ss-site-nav .navbar-toggler to display: none'
  );
});

test('Spatial Signal CSS hides only enhanced non-active evidence slides on narrow screens', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  assert.match(
    css,
    /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\[data-ss-evidence-strip\]\[data-ss-state\]:not\(\[data-ss-state="idle"\]\)\s+\.ss-evidence-slide:not\(\[data-ss-state="active"\]\)\s*\{[\s\S]*?display:\s*none/,
    'narrow enhanced strip must hide only non-active slides after leaving idle'
  );
});

test('Spatial Signal CSS keeps the explicit autoplay stop control touch-sized and state-visible', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const stopRule = css.match(/\.ss-evidence-stop\s*\{([^}]*)\}/);
  assert.ok(stopRule, 'missing .ss-evidence-stop rule');
  assert.match(stopRule[1], /(?:min-(?:width|height|inline-size|block-size)|width|height)\s*:\s*44px/i, 'autoplay stop control needs a 44px touch target');
  for (const state of ['idle', 'static', 'complete']) {
    assert.match(
      css,
      new RegExp(`\\[data-ss-evidence-strip\\]\\[data-ss-state="${state}"\\]\\s+\\.ss-evidence-stop\\s*\\{[\\s\\S]*?display\\s*:\\s*none`),
      `${state}: autoplay stop control must be hidden`
    );
  }
  for (const state of ['running', 'paused', 'stopped']) {
    assert.match(
      css,
      new RegExp(`\\[data-ss-evidence-strip\\]\\[data-ss-state="${state}"\\]\\s+\\.ss-evidence-stop\\s*\\{[\\s\\S]*?display\\s*:\\s*(?:inline-flex|flex|block)`),
      `${state}: autoplay stop control must remain visible`
    );
  }
});

test('Spatial Signal narrow evidence controls wrap selectors and reserve a stop-control row', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const narrow = cssAtRuleBody(css, /@media\s*\(max-width:\s*720px\)/);
  const controls = cssRuleBodies(narrow, '.ss-evidence-controls');
  assert.equal(controls.length, 1, 'narrow viewport must define one .ss-evidence-controls rule');
  assert.match(controls[0], /flex-wrap\s*:\s*wrap/, 'narrow evidence controls must wrap selector buttons');
  const stop = cssRuleBodies(narrow, '.ss-evidence-stop');
  assert.equal(stop.length, 1, 'narrow viewport must define one .ss-evidence-stop rule');
  assert.match(
    stop[0],
    /(?:flex-basis\s*:\s*100%|flex\s*:\s*[^;]*\b100%|(?:width|inline-size)\s*:\s*100%)/,
    'narrow stop control must reserve a full evidence-controls row'
  );
});

test('Spatial Signal technical labels map to the 13px label or 14px small token', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const labels = [
    ['registration coordinate', '.ss-registration-trace__node'],
    ['trust location', '.ss-trust-anchor__location'],
    ['evidence state', '.ss-evidence-slide__state'],
    ['evidence project', '.ss-evidence-slide__project'],
    ['evidence control', '.ss-evidence-control'],
    ['capability number', '.ss-home .capability-number'],
    ['capability label', '.ss-home .capability-label'],
    ['capability meta', '.ss-home .capability-meta'],
    ['capability method pill', '.ss-home .capability-methods span'],
    ['capability validation', '.ss-home .capability-validation strong']
  ];
  const violations = labels.flatMap(([label, selector]) => {
    const sizes = cssRuleBodies(css, selector)
      .flatMap((body) => [...body.matchAll(/font-size\s*:\s*(var\(--ss-type-(?:label|small)\))/g)].map((match) => match[1]));
    return sizes.length ? [] : `${label}: missing label/small token for ${selector}`;
  });
  assert.deepEqual(violations, [], 'technical labels must remain readable at 13px or larger');
});

test('bilingual Home registration traces retain the same decorative empty-span sequence', () => {
  const expected = [
    'ss-registration-trace__grid',
    'ss-registration-trace__node',
    'ss-registration-trace__segment',
    'ss-registration-trace__node',
    'ss-registration-trace__segment',
    'ss-registration-trace__node',
    'ss-registration-trace__segment',
    'ss-registration-trace__node'
  ];
  for (const file of ['index.html', 'en/index.html']) {
    const html = read(file);
    const trace = html.match(/<div\b[^>]*\bclass="ss-registration-trace"[^>]*aria-hidden="true"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(trace, `${file}: registration trace must be aria-hidden`);
    const spans = [...trace[1].matchAll(/<span\b[^>]*\bclass="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g)];
    assert.deepEqual(spans.map((span) => span[1]), expected, `${file}: registration trace child classes differ`);
    for (const span of spans) assert.equal(span[2].trim(), '', `${file}: decorative trace span must not contain visible text`);
  }
});

// Stage 2 contracts: these fixtures deliberately use hand-derived, visibly distinct
// short and detailed copy so a renderer cannot satisfy the card contract by reusing
// the detailed case-study fields.
const stage2VisualKeys = [
  'nav-digitaltwin-pipeline',
  'hololens-ar-concept',
  'forklift-sim-to-real',
  'coordinate-signal',
  'decision-signal',
  'simulation-signal',
  'research-protocol'
];

const stage2VisualKeyBySlug = {
  'surgical-twin': 'nav-digitaltwin-pipeline',
  'rtms-navigation': 'coordinate-signal',
  'mandibular-fracture': 'coordinate-signal',
  'c-arm-navigation': 'research-protocol',
  'unmanned-forklift': 'forklift-sim-to-real',
  'quadruped-robot': 'decision-signal',
  'radioactive-digital-twin': 'simulation-signal',
  'life-careverse': 'hololens-ar-concept',
  'orthognathic-ar': 'coordinate-signal',
  'oral-facial-ar': 'research-protocol',
  'ar-distance-meter': 'coordinate-signal',
  'respiratory-surface-guidance': 'coordinate-signal',
  'llm-wiki': 'decision-signal'
};

function stage2Fixture() {
  const fixture = JSON.parse(JSON.stringify(data));
  fixture.capabilities.forEach((capability, index) => {
    for (const locale of ['ko', 'en']) {
      capability.translations[locale].cardSummary = `${locale} card summary ${index + 1}`;
      capability.translations[locale].cardValidation = `${locale} card validation ${index + 1}`;
    }
  });
  fixture.projects.forEach((project, index) => {
    project.visualKey = stage2VisualKeyBySlug[project.slug];
    for (const locale of ['ko', 'en']) {
      project.translations[locale].cardProblem = `${locale} card problem ${index + 1}`;
      project.translations[locale].cardOwnedRole = `${locale} card owned role ${index + 1}`;
      project.translations[locale].cardEvidence = `${locale} card evidence ${index + 1}`;
      project.translations[locale].visualAlt = `${locale} visual alt ${index + 1}`;
      project.translations[locale].visualCaption = `${locale} visual caption ${index + 1}`;
    }
  });
  return fixture;
}

function hasStage2EvidenceStatePill(html, state, label) {
  for (const match of html.matchAll(/<span\b([^>]*)>([^<]*)<\/span>/g)) {
    const attributes = match[1];
    const classAttributes = attributes.match(/(?:^|\s)class="[^"]*"/g) || [];
    const classValue = attributes.match(/(?:^|\s)class="([^"]*)"/)?.[1];
    const stateValue = attributes.match(/(?:^|\s)data-state="([^"]*)"/)?.[1];
    if (match[2] !== label || stateValue !== state || classAttributes.length !== 1 || !classValue) continue;
    const tokens = new Set(classValue.trim().split(/\s+/));
    if (tokens.has('status-pill') && tokens.has('status-pill--' + state) && tokens.has('ss-status')) return true;
  }
  return false;
}

function hasStage2ClassHook(html, hook) {
  return [...html.matchAll(/<[A-Za-z][^>]*\bclass="([^"]*)"[^>]*>/g)]
    .some((match) => match[1].trim().split(/\s+/).includes(hook));
}

function svgColorToSixDigits(color) {
  const upper = color.toUpperCase();
  if (upper.length === 4) return '#' + upper.slice(1).split('').map((character) => character + character).join('');
  return upper;
}

function hasSimpleSvgXmlShape(svg) {
  const document = svg.trim().replace(/^<\?xml\b[^?]*\?>\s*/i, '');
  if (!/^<svg\b[^>]*>[\s\S]*<\/svg>$/.test(document)) return false;
  if ((document.match(/<svg\b/gi) || []).length !== 1 || (document.match(/<\/svg\s*>/gi) || []).length !== 1) return false;
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(document)) return false;
  const tags = document.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<[^>]+>/g) || [];
  const stack = [];
  for (const tag of tags) {
    if (tag.startsWith('<!--') || tag.startsWith('<![CDATA[') || tag.startsWith('<?')) continue;
    const closing = tag.match(/^<\/([A-Za-z_][\w:.-]*)\s*>$/);
    if (closing) {
      if (stack.pop() !== closing[1]) return false;
      continue;
    }
    const opening = tag.match(/^<([A-Za-z_][\w:.-]*)(?:\s+[^<>]*)?\/?\s*>$/);
    if (!opening) return false;
    const attributes = tag.slice(opening[1].length + 1, tag.endsWith('/>') ? -2 : -1);
    if (/(?:^|\s)[\w:.-]+\s*=\s*(?!["'])/.test(attributes)) return false;
    if (!tag.endsWith('/>')) stack.push(opening[1]);
  }
  return stack.length === 0;
}

function stage2NonFontGeometrySignature(svg) {
  return (svg.match(/<\/?[A-Za-z_][\w:.-]*(?:\s+[^<>]*?)?\/?\s*>/g) || [])
    .map((tag) => tag
      .replace(/\s+font-(?:family|size|weight|style|variant|stretch)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+\/>$/, '/>')
      .replace(/\s+>$/, '>'))
    .join('\n');
}

const stage2ApprovedSvgPalette = new Set([
  '#F7F6F2', '#FFFFFF', '#202522', '#66706B', '#D8DDD7', '#007E7A', '#005C5A', '#2E6FAE'
]);

test('Stage 2 canonical data supplies distinct localized card and visual fields for every record', () => {
  for (const capability of data.capabilities) {
    for (const locale of ['ko', 'en']) {
      const translation = capability.translations[locale];
      assert.equal(typeof translation.cardSummary, 'string', `${capability.key}: missing ${locale} cardSummary`);
      assert.equal(typeof translation.cardValidation, 'string', `${capability.key}: missing ${locale} cardValidation`);
      assert.notEqual(translation.cardSummary, translation.summary, `${capability.key}: ${locale} cardSummary must not duplicate detailed summary`);
      assert.notEqual(translation.cardValidation, translation.validation, `${capability.key}: ${locale} cardValidation must not duplicate detailed validation`);
    }
  }
  assert.deepEqual(Object.fromEntries(data.projects.map((project) => [project.slug, project.visualKey])), stage2VisualKeyBySlug);
  for (const project of data.projects) {
    for (const locale of ['ko', 'en']) {
      const translation = project.translations[locale];
      for (const field of ['cardProblem', 'cardOwnedRole', 'cardEvidence', 'visualAlt', 'visualCaption']) {
        assert.equal(typeof translation[field], 'string', `${project.slug}: missing ${locale} ${field}`);
        assert.notEqual(translation[field], '', `${project.slug}: empty ${locale} ${field}`);
      }
      assert.notEqual(translation.cardProblem, translation.problemSummary, `${project.slug}: ${locale} cardProblem must stay distinct from detail copy`);
      assert.notEqual(translation.cardOwnedRole, translation.ownedRole, `${project.slug}: ${locale} cardOwnedRole must stay distinct from detail copy`);
      assert.notEqual(translation.cardEvidence, translation.verifiedEvidence, `${project.slug}: ${locale} cardEvidence must stay distinct from detail copy`);
    }
  }
});

test('Stage 2 card evidence keeps renderer-owned labels out of localized values', () => {
  const renderedLabelPrefix = {
    ko: /^\s*근거\s*:/i,
    en: /^\s*evidence\s*:/i
  };
  const violations = [];
  for (const project of data.projects) {
    for (const locale of ['ko', 'en']) {
      const evidence = project.translations[locale].cardEvidence;
      if (renderedLabelPrefix[locale].test(evidence)) {
        violations.push(`${project.slug} ${locale}: cardEvidence must not repeat its rendered ${locale === 'ko' ? '근거:' : 'Evidence:'} label`);
      }
    }
  }
  assert.deepEqual(violations, [], 'localized card evidence label-prefix violations');
});

test('Stage 2 Life Careverse visual metadata describes the mapped surgeon-view evidence asset', () => {
  const project = data.projects.find((item) => item.slug === 'life-careverse');
  assert.ok(project, 'Life Careverse project is missing');
  assert.equal(project.visualKey, 'hololens-ar-concept');

  const expectations = {
    ko: [
      /(?:술자|집도의)(?:의)?\s*시야/,
      /실제\s*환자/,
      /추적(?:된|되는)?\s*수술\s*도구/,
      /(?:가상\s*환자[\s\S]*(?:오버레이|정렬)|(?:오버레이|정렬)[\s\S]*가상\s*환자)/
    ],
    en: [
      /surgeon(?:'s)?\s+view/i,
      /real\s+patient/i,
      /tracked\s+surgical\s+tool/i,
      /(?:virtual[-\s]patient[\s\S]*(?:overlay|align)|(?:overlay|align)[\s\S]*virtual[-\s]patient)/i
    ]
  };
  for (const locale of ['ko', 'en']) {
    const translation = project.translations[locale];
    for (const expected of expectations[locale]) {
      assert.match(translation.visualAlt, expected, locale + ': visual alt must describe the actual surgeon-view diagram');
    }
  }
  assert.match(project.translations.ko.visualCaption, /공개\s*근거\s*다이어그램/, 'Korean caption must identify public evidence');
  assert.match(project.translations.ko.visualCaption, /제품\s*스크린샷이\s*아닌/, 'Korean caption must exclude a product screenshot');
  assert.match(project.translations.en.visualCaption, /public evidence diagram/i, 'English caption must identify public evidence');
  assert.match(project.translations.en.visualCaption, /not a product screenshot/i, 'English caption must exclude a product screenshot');
});

test('Stage 2 validation rejects missing card copy and an unknown or missing project visual key', () => {
  const incompleteCapability = stage2Fixture();
  delete incompleteCapability.capabilities[0].translations.ko.cardSummary;
  assert.match(render.validatePortfolioData(incompleteCapability).join(' '), /missing ko translation for cardSummary/);

  const incompleteProject = stage2Fixture();
  delete incompleteProject.projects[0].translations.en.visualCaption;
  assert.match(render.validatePortfolioData(incompleteProject).join(' '), /missing en translation for visualCaption/);

  const invalidVisual = stage2Fixture();
  invalidVisual.projects[0].visualKey = 'unapproved-visual';
  assert.match(render.validatePortfolioData(invalidVisual).join(' '), /invalid visual key/);

  const missingVisual = stage2Fixture();
  delete missingVisual.projects[0].visualKey;
  assert.match(render.validatePortfolioData(missingVisual).join(' '), /missing required string visualKey/);

  assert.deepEqual(render.validatePortfolioData(data), []);
});

test('Stage 2 localization exposes card copy and visual metadata without changing renderer signatures', () => {
  const fixture = stage2Fixture();
  fixture.capabilities[0].translations.en.cardSummary = 'Card <summary> & signal.';
  fixture.capabilities[0].translations.en.cardValidation = 'Card validation only.';
  fixture.projects[0].translations.en.cardProblem = 'Problem <signal>.';
  fixture.projects[0].translations.en.cardOwnedRole = 'Owned & scoped.';
  fixture.projects[0].translations.en.cardEvidence = 'Evidence <checked>.';
  fixture.projects[0].translations.en.visualAlt = 'Visual <alt>.';
  fixture.projects[0].translations.en.visualCaption = 'Caption & proof.';

  const localized = render.localizePortfolioData(fixture, 'en');
  assert.equal(localized.capabilities[0].cardSummary, 'Card <summary> & signal.');
  assert.equal(localized.capabilities[0].cardValidation, 'Card validation only.');
  assert.deepEqual(
    {
      visualKey: localized.projects[0].visualKey,
      cardProblem: localized.projects[0].cardProblem,
      cardOwnedRole: localized.projects[0].cardOwnedRole,
      cardEvidence: localized.projects[0].cardEvidence,
      visualAlt: localized.projects[0].visualAlt,
      visualCaption: localized.projects[0].visualCaption
    },
    {
      visualKey: 'nav-digitaltwin-pipeline',
      cardProblem: 'Problem <signal>.',
      cardOwnedRole: 'Owned & scoped.',
      cardEvidence: 'Evidence <checked>.',
      visualAlt: 'Visual <alt>.',
      visualCaption: 'Caption & proof.'
    }
  );
  assert.equal(render.localizePortfolioData.length, 2);
  assert.equal(render.capabilityAtlasHtml.length, 4);
  assert.equal(render.projectChaptersHtml.length, 4);
  assert.equal(render.capabilityDetailsHtml.length, 4);
  assert.equal(render.mountAll.length, 2);
});

test('Stage 2 capability atlas uses compact card copy while details retain the detailed copy', () => {
  const fixture = stage2Fixture();
  fixture.capabilities[0].translations.en.summary = 'Detailed capability summary.';
  fixture.capabilities[0].translations.en.validation = 'Detailed capability validation.';
  fixture.capabilities[0].translations.en.cardSummary = 'Card <summary> & signal.';
  fixture.capabilities[0].translations.en.cardValidation = 'Card validation only.';

  const atlas = render.capabilityAtlasHtml(fixture, '', false, 'en');
  const details = render.capabilityDetailsHtml(fixture, '', false, 'en');
  assert.match(atlas, /Card &lt;summary&gt; &amp; signal\./);
  assert.match(atlas, /Card validation only\./);
  assert.doesNotMatch(atlas, /Detailed capability summary\.|Detailed capability validation\./);
  assert.match(details, /Detailed capability summary\./);
  assert.match(details, /Detailed capability validation\./);
  assert.doesNotMatch(details, /Card &lt;summary&gt; &amp; signal\.|Card validation only\./);
});

test('Stage 2 project cards render localized evidence frames before their title and concise card copy', () => {
  const fixture = stage2Fixture();
  const project = fixture.projects[0];
  project.period = '2099.01 – 2099.02';
  project.translations.en.title = 'Stage <Two> Project';
  project.translations.en.status = 'Lifecycle completed';
  project.translations.en.problemSummary = 'Detailed problem that must not appear in the card.';
  project.translations.en.ownedRole = 'Detailed owned role that must not appear in the card.';
  project.translations.en.verifiedEvidence = 'Detailed evidence that must not appear in the card.';
  project.translations.en.cardProblem = 'Problem <signal>.';
  project.translations.en.cardOwnedRole = 'Owned & scoped.';
  project.translations.en.cardEvidence = 'Evidence <checked>.';
  project.translations.en.visualAlt = 'Visual <alt>.';
  project.translations.en.visualCaption = 'Caption & proof.';

  const cards = render.projectChaptersHtml(fixture, '../../', false, 'en');
  const card = cards.match(/<article\b(?=[^>]*\bclass="[^"]*\bproject-card\b[^"]*")[^>]*>[\s\S]*?<\/article>/)?.[0];
  assert.ok(card, 'missing the first project card');
  const scopeLabelViolations = [
    ['en', card, '<strong>My scope</strong> Owned &amp; scoped.'],
    ['ko', render.projectChaptersHtml(fixture, '../../', false, 'ko'), '<strong>내 범위</strong> ko card owned role 1']
  ].filter(([, html, expected]) => !html.includes(expected))
    .map(([locale, , expected]) => locale + ' card is missing ' + expected);
  assert.deepEqual(scopeLabelViolations, [], 'project cards must render the localized My scope label');
  assert.match(
    card,
    /<figure\b(?=[^>]*\bclass="[^"]*\bss-project-card__figure\b[^"]*")[^>]*>\s*<img\b(?=[^>]*\bsrc="\.\.\/\.\.\/assets\/diagrams\/nav-digitaltwin-pipeline-en\.svg")(?=[^>]*\balt="Visual &lt;alt&gt;\.")(?=[^>]*\bwidth="1180")(?=[^>]*\bheight="664")(?=[^>]*\bloading="lazy")(?=[^>]*\bdecoding="async")[^>]*>\s*<figcaption\b[^>]*>Caption &amp; proof\.<\/figcaption>\s*<\/figure>/
  );
  const observableOrder = [
    'data-state="verified"',
    '2099.01 – 2099.02',
    'ss-project-card__figure',
    'Stage &lt;Two&gt; Project',
    'Problem &lt;signal&gt;.',
    'Owned &amp; scoped.',
    'Evidence &lt;checked&gt;.'
  ];
  let previous = -1;
  for (const expected of observableOrder) {
    const current = card.indexOf(expected);
    assert.ok(current > previous, `project card must render ${expected} after the preceding observable item`);
    previous = current;
  }
  assert.doesNotMatch(card, /Detailed problem|Detailed owned role|Detailed evidence/);
  assert.match(card, /href="\.\.\/\.\.\/en\/projects\/surgical-twin\/"/);
  assert.match(render.projectChaptersHtml(fixture, '../../', true, 'en'), /href="\.\.\/\.\.\/en\/projects\/surgical-twin\/index\.html"/);
});

test('Stage 2 renderers expose every documented discovery and capability-panel hook', () => {
  const fixture = stage2Fixture();
  const chapters = render.projectChaptersHtml(fixture, '../../', false, 'en');
  const projectHooks = [
    'ss-project-chapter',
    'ss-project-chapter__rail',
    'ss-project-chapter__header',
    'ss-project-chapter__index',
    'ss-project-chapter__eyebrow',
    'ss-project-chapter__count',
    'ss-project-chapter__summary',
    'ss-project-grid',
    'ss-project-card',
    'ss-project-card__meta',
    'ss-project-card__period',
    'ss-project-card__figure',
    'ss-project-card__image',
    'ss-project-card__caption',
    'ss-project-card__body',
    'ss-project-card__title',
    'ss-project-card__facts',
    'ss-project-card__fact'
  ];
  for (const hook of projectHooks) {
    assert.equal(hasStage2ClassHook(chapters, hook), true, 'project chapters must expose ' + hook);
  }

  const details = render.capabilityDetailsHtml(fixture, '../../', false, 'en');
  const panelHooks = [
    'ss-capability-panel',
    'ss-capability-panel__header',
    'ss-capability-panel__index',
    'ss-capability-panel__eyebrow',
    'ss-capability-panel__matrix',
    'ss-capability-panel__item',
    'ss-capability-panel__methods',
    'ss-capability-panel__evidence'
  ];
  for (const hook of panelHooks) {
    assert.equal(hasStage2ClassHook(details, hook), true, 'capability details must expose ' + hook);
  }
  assert.match(
    details,
    /<div\b(?=[^>]*\bclass="[^"]*\bss-capability-panel__matrix\b[^"]*")[^>]*>\s*<div\b(?=[^>]*\bclass="[^"]*\bss-capability-panel__item\b[^"]*")[^>]*>\s*<h3>What I solve<\/h3>[\s\S]*?<\/div>\s*<div\b(?=[^>]*\bclass="[^"]*\bss-capability-panel__item\b[^"]*")[^>]*>\s*<h3>How I validate<\/h3>/,
    'capability-panel matrix must contain named solve and validate cells in semantic order'
  );
});

test('Stage 2 evidence-state labels are localized from evidenceState rather than lifecycle status', () => {
  const fixture = stage2Fixture();
  const expectedStateByProject = ['verified', 'ongoing', 'expected', 'research', 'completed'];
  for (const [index, project] of fixture.projects.entries()) {
    project.evidenceState = expectedStateByProject[index % expectedStateByProject.length];
    project.translations.en.status = 'Lifecycle completed';
    project.translations.ko.status = '수명주기 완료';
  }
  const englishLabels = {
    verified: 'Verified', ongoing: 'Ongoing', expected: 'Expected', research: 'Research', completed: 'Completed'
  };
  const koreanLabels = {
    verified: '검증됨', ongoing: '진행 중', expected: '예상', research: '연구', completed: '완료'
  };
  assert.deepEqual(i18n.ui.en.portfolio.evidenceStates, englishLabels);
  assert.deepEqual(i18n.ui.ko.portfolio.evidenceStates, koreanLabels);
  const englishCards = render.projectChaptersHtml(fixture, '', false, 'en');
  const koreanCards = render.projectChaptersHtml(fixture, '', false, 'ko');
  for (const [state, label] of Object.entries(englishLabels)) {
    assert.equal(hasStage2EvidenceStatePill(englishCards, state, label), true, 'English ' + state + ' pill must contain status-pill, status-pill--' + state + ', and ss-status');
  }
  for (const [state, label] of Object.entries(koreanLabels)) {
    assert.equal(hasStage2EvidenceStatePill(koreanCards, state, label), true, 'Korean ' + state + ' pill must contain status-pill, status-pill--' + state + ', and ss-status');
  }
  assert.doesNotMatch(englishCards, />Lifecycle completed<\//);
  assert.doesNotMatch(koreanCards, />수명주기 완료<\//);
});

test('Stage 2 provides every shared visual key as a localized, privacy-safe SVG pair', () => {
  const violations = [];
  for (const visualKey of stage2VisualKeys) {
    for (const suffix of ['', '-en']) {
      const file = `assets/diagrams/${visualKey}${suffix}.svg`;
      if (!fs.existsSync(path.join(root, file))) {
        violations.push(`missing Stage 2 SVG ${file}`);
        continue;
      }
      const partnerName = read(file).match(render.policy.prohibitedPartnerPattern)?.[0];
      if (partnerName) violations.push(`${file}: Stage 2 evidence SVG must not disclose ${partnerName}`);
    }
  }
  assert.deepEqual(violations, [], 'Stage 2 SVG privacy violations');
});

test('Stage 2 validator inventories only the canonical localized evidence SVG pairs', () => {
  assert.equal(typeof validator.publicPortfolioVisualFiles, 'function', 'validator must expose publicPortfolioVisualFiles(root)');
  const visualFiles = validator.publicPortfolioVisualFiles(root);
  const expectedPaths = stage2VisualKeys.flatMap((key) => [
    `assets/diagrams/${key}.svg`,
    `assets/diagrams/${key}-en.svg`
  ]).sort();
  assert.equal(visualFiles.length, 14, 'validator must inventory exactly seven Korean/English visual pairs');
  assert.deepEqual(
    visualFiles.map((file) => file.relativePath.replace(/\\/g, '/')).sort(),
    expectedPaths,
    'validator must exclude detail/CV assets and inventory only canonical Stage 2 visuals'
  );
});

test('Stage 2 validator exposes a pure evidence-asset privacy guard', () => {
  assert.equal(typeof validator.visualAssetErrors, 'function', 'validator must expose visualAssetErrors for isolated SVG privacy checks');
  const syntheticAsset = {
    relativePath: 'assets/diagrams/hololens-ar-concept.svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg"><text>Digitrack</text></svg>'
  };
  const errors = validator.visualAssetErrors([syntheticAsset]);
  assert.equal(
    errors.some((error) => error.includes(syntheticAsset.relativePath) && /Digitrack/i.test(error)),
    true,
    'the isolated SVG guard must report prohibited partner text with its public relative path'
  );
});

test('Stage 2 validator applies the evidence-asset privacy guard during full portfolio validation', () => {
  assert.equal(typeof validator.publicPortfolioVisualFiles, 'function', 'validator must expose publicPortfolioVisualFiles(root)');
  const visualFiles = validator.publicPortfolioVisualFiles(root);
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-stage2-validator-'));
  try {
    for (const file of validator.publicPortfolioFiles(root).concat(visualFiles)) {
      const target = path.join(temporaryRoot, file.relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file.absolutePath, target);
    }
    const syntheticRelativePath = 'assets/diagrams/hololens-ar-concept.svg';
    fs.writeFileSync(
      path.join(temporaryRoot, syntheticRelativePath),
      '<svg xmlns="http://www.w3.org/2000/svg"><text>Digitrack</text></svg>'
    );
    const errors = validator.validatePortfolio(temporaryRoot);
    assert.equal(
      errors.some((error) => error.replace(/\\/g, '/').includes(syntheticRelativePath) && /Digitrack/i.test(error)),
      true,
      'validatePortfolio(root) must inspect canonical evidence SVG content, not only HTML pages'
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Stage 2 evidence SVGs have safe, localized, palette-bounded XML source with KO/EN geometry parity', () => {
  const violations = [];
  const forbiddenElement = /<\/?(?:script|foreignObject|image|animation|animate(?:Motion|Transform|Color)?|set|filter|(?:linear|radial)?gradient|style)\b/i;
  const forbiddenAttribute = /\s(?:on[a-z]+|style)\s*=/i;
  const externalReference = /(?:\b(?:href|xlink:href|src)\s*=\s*["']\s*(?:[a-z][a-z0-9+.-]*:|\/\/)|url\(\s*["']?\s*(?:[a-z][a-z0-9+.-]*:|\/\/))/i;
  for (const visualKey of stage2VisualKeys) {
    const localized = [];
    for (const [suffix, locale] of [['', 'ko'], ['-en', 'en']]) {
      const file = `assets/diagrams/${visualKey}${suffix}.svg`;
      if (!fs.existsSync(path.join(root, file))) {
        violations.push(`${file}: missing canonical localized SVG`);
        continue;
      }
      const svg = read(file);
      localized.push([file, svg]);
      if (!hasSimpleSvgXmlShape(svg)) violations.push(`${file}: SVG source must be simply XML-well-formed`);
      if (forbiddenElement.test(svg)) violations.push(`${file}: SVG source must not contain an executable, embedded-image, animation, filter, gradient, or style element`);
      if (forbiddenAttribute.test(svg)) violations.push(`${file}: SVG source must not contain style or event-handler attributes`);
      if (externalReference.test(svg)) violations.push(`${file}: SVG source must not load an external URL`);
      if (locale === 'en' && /[가-힣]/.test(svg)) violations.push(`${file}: English evidence SVG must not contain Hangul`);
      const unsupportedColors = (svg.match(/#[0-9a-fA-F]{3,8}\b/g) || [])
        .map(svgColorToSixDigits)
        .filter((color) => !stage2ApprovedSvgPalette.has(color));
      const unsupportedPaints = [...svg.matchAll(/\b(?:fill|stroke|color)\s*=\s*["']([^"']+)["']/gi)]
        .map((match) => match[1])
        .filter((paint) => paint.toLowerCase() !== 'none' && !stage2ApprovedSvgPalette.has(svgColorToSixDigits(paint)));
      const unsupportedPalette = [...new Set(unsupportedColors.concat(unsupportedPaints))];
      if (unsupportedPalette.length) violations.push(`${file}: unsupported Stage 2 palette paint(s) ${unsupportedPalette.join(', ')}`);
    }
    if (localized.length === 2 && stage2NonFontGeometrySignature(localized[0][1]) !== stage2NonFontGeometrySignature(localized[1][1])) {
      violations.push(`${visualKey}: Korean and English SVGs must retain identical element and non-font geometry`);
    }
  }
  assert.deepEqual(violations, [], 'Stage 2 evidence SVG source contracts');
});

test('Stage 2 bilingual discovery pages keep route metadata and scripts while exposing scoped surfaces', () => {
  const pages = [
    ['projects/index.html', 'ko', 'projects', 'ss-projects', 'ss-projects__chapters'],
    ['en/projects/index.html', 'en', 'projects', 'ss-projects', 'ss-projects__chapters'],
    ['research/index.html', 'ko', 'capabilities', 'ss-capabilities', 'ss-capabilities__details'],
    ['en/research/index.html', 'en', 'capabilities', 'ss-capabilities', 'ss-capabilities__details']
  ];
  for (const [file, locale, page, pageClass, mountClass] of pages) {
    const html = read(file);
    assert.match(html, new RegExp(`<body\\b[^>]*\\bclass="[^"]*\\b${pageClass}\\b`), `${file}: missing ${pageClass} page class`);
    assert.match(html, new RegExp(`data-page="${page}"`), `${file}: changed page data attribute`);
    assert.match(html, new RegExp(`data-lang="${locale}"`), `${file}: changed locale data attribute`);
    assert.match(html, /data-route="(?:projects\/|research\/)"/, `${file}: changed route data attribute`);
    assert.match(html, /<link rel="canonical" href="https:\/\/rafaam11\.github\.io\/(?:en\/)?(?:projects|research)\/" \/>/, `${file}: missing canonical`);
    assert.match(html, /hreflang="ko"/, `${file}: missing Korean alternate`);
    assert.match(html, /hreflang="en"/, `${file}: missing English alternate`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: must contain exactly one h1`);
    assert.equal(html.indexOf('site-i18n.js') < html.indexOf('portfolio-data.js'), true, `${file}: i18n must precede data`);
    assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true, `${file}: data must precede renderer`);
    assert.match(html, new RegExp(`data-portfolio="(?:project-chapters|capability-details)"[^>]*\\bclass="[^"]*\\b${mountClass}\\b|class="[^"]*\\b${mountClass}\\b[^"]*"[^>]*data-portfolio="(?:project-chapters|capability-details)"`), `${file}: missing ${mountClass} mount class`);
  }
});

test('Stage 2 mountAll keeps every existing mount point populated through the public renderer API', () => {
  const fixture = stage2Fixture();
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
    body: { getAttribute: (name) => name === 'data-lang' ? 'en' : '' },
    location: { protocol: 'https:' }
  };

  render.mountAll(fakeDocument, fixture);
  assert.match(atlasNode.innerHTML, /capability-card/);
  assert.match(chaptersNode.innerHTML, /<figure\b[^>]*\bclass="[^"]*\bss-project-card__figure\b[^"]*"/);
  assert.match(detailsNode.innerHTML, /capability-detail/);
});

test('Stage 2 regression: scoped navigation links meet the 44 by 44 pixel target gate', () => {
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const navLinkRules = cssRuleBodies(css, '.ss-site-nav .nav-link');
  const navLinkTargetRule = navLinkRules.find((body) => /\bmin-height\s*:\s*\d+(?:\.\d+)?px/.test(body));
  assert.ok(navLinkTargetRule, 'navigation links need a shared scoped target rule');
  for (const property of ['min-width', 'min-height']) {
    const values = [...navLinkTargetRule.matchAll(new RegExp('\\b' + property + '\\s*:\\s*(\\d+(?:\\.\\d+)?)px', 'g'))]
      .map((match) => Number(match[1]));
    assert.equal(values.some((value) => value >= 44), true, `.ss-site-nav .nav-link requires ${property}: at least 44px`);
  }
});

test('Stage 2 regression: bilingual Projects legends attach evidence state to each item parent', () => {
  const pages = [
    ['projects/index.html', 'ko'],
    ['en/projects/index.html', 'en']
  ];
  for (const [file, locale] of pages) {
    const html = read(file);
    for (const state of ['verified', 'ongoing', 'research', 'completed']) {
      assert.match(
        html,
        new RegExp('<[^>]+(?=[^>]*\\bclass="[^"]*\\bss-state-legend__item\\b[^"]*")(?=[^>]*\\bdata-state="' + state + '")[^>]*>'),
        file + ': ' + locale + ' ' + state + ' legend item must own data-state'
      );
    }
  }
});

test('Stage 2 regression: legend state markers use data-state rather than positional selectors', () => {
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const legendRules = css.split('}').filter((rule) => /ss-state-legend__item/.test(rule)).join('}');
  assert.doesNotMatch(legendRules, /nth-child/i, 'legend marker appearance must not depend on item order');
  for (const state of ['verified', 'ongoing', 'research', 'completed']) {
    assert.match(
      legendRules,
      new RegExp('\\.ss-state-legend__item\\[data-state="' + state + '"\\]::before'),
      state + ': legend marker must have a data-state selector'
    );
  }
});

test('Stage 2 regression: project evidence diagrams preserve their full SVG frame', () => {
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const imageRules = cssRuleBodies(css, 'body.ss-projects .ss-project-card__image');
  assert.equal(imageRules.length, 1, 'project evidence image needs one scoped Stage 2 rule');
  assert.match(imageRules[0], /object-fit\s*:\s*contain/, 'project evidence image must preserve the full SVG frame');
  assert.doesNotMatch(imageRules[0], /object-fit\s*:\s*cover/, 'project evidence image must not crop its SVG frame');
});

test('Stage 2 regression: capability evidence links keep separators inside named wrappers', () => {
  const details = render.capabilityDetailsHtml(data, '../../', false, 'en');
  const evidenceBlocks = [...details.matchAll(/<p\b(?=[^>]*\bclass="[^"]*\bss-capability-panel__evidence\b[^"]*")[^>]*>([\s\S]*?)<\/p>/g)];
  assert.equal(evidenceBlocks.length, 5, 'each capability needs one evidence-link block');
  for (const [index, block] of evidenceBlocks.entries()) {
    const content = block[1];
    const linkCount = (content.match(/<a\b/g) || []).length;
    const wrapperCount = (content.match(/<span\b(?=[^>]*\bclass="[^"]*\bss-capability-panel__evidence-link\b[^"]*")[^>]*>[\s\S]*?<\/span>/g) || []).length;
    assert.equal(wrapperCount, linkCount, 'capability ' + (index + 1) + ': every evidence link needs a named wrapper');
    assert.doesNotMatch(content, /\s·\s/, 'capability ' + (index + 1) + ': separators must be supplied by the wrapper/pseudo-element, not raw flex text');
  }
});

test('Stage 2 regression: coordinate evidence diagrams make no canonical-state assertion', () => {
  for (const file of ['coordinate-signal.svg', 'coordinate-signal-en.svg']) {
    const svg = read('assets/diagrams/' + file);
    assert.doesNotMatch(svg, /검증됨|VALIDATED/i, file + ': generic coordinate evidence must not claim a canonical verified state');
  }
});

test('Stage 2 regression: every Stage 2 evidence SVG card remains legible at its 1180 by 664 card size', () => {
  const visualKeys = stage2VisualKeys;
  const violations = [];
  for (const visualKey of visualKeys) {
    for (const suffix of ['', '-en']) {
      const file = 'assets/diagrams/' + visualKey + suffix + '.svg';
      const svg = read(file);
      if (!/<svg\b(?=[^>]*\bviewBox="0 0 1180 664")[^>]*>/.test(svg)) {
        violations.push(file + ': SVG card must use the approved 1180 by 664 viewBox');
      }
      const fontSizes = [...svg.matchAll(/\bfont-size\s*(?:=|:)\s*["']?(\d+(?:\.\d+)?)(?:px)?/gi)].map((match) => Number(match[1]));
      if (!fontSizes.length) violations.push(file + ': source must declare readable SVG text sizes');
      if (fontSizes.some((size) => size < 30)) {
        violations.push(file + ': all remaining SVG text must be at least 30px at card scale; found ' + fontSizes.join(', '));
      }
      if (fontSizes.some((size) => size >= 10 && size <= 12)) {
        violations.push(file + ': no 10–12px microcopy may remain');
      }
    }
  }
  assert.deepEqual(violations, [], 'Stage 2 evidence SVG card-legibility violations');
});

function homeEvidenceImages(file) {
  return [...read(file).matchAll(/<img\b([^>]*)\/?>/g)]
    .map((match) => {
      const attributes = match[1];
      return {
        src: attributes.match(/\bsrc="([^"]+)"/)?.[1],
        alt: attributes.match(/\balt="([^"]*)"/)?.[1],
        width: attributes.match(/\bwidth="(\d+)"/)?.[1],
        height: attributes.match(/\bheight="(\d+)"/)?.[1]
      };
    })
    .filter((image) => /(?:^|\/)assets\/diagrams\/(?:nav-digitaltwin-pipeline|hololens-ar-concept|forklift-sim-to-real)(?:-en)?\.svg$/.test(image.src || ''));
}

test('Home evidence images use the intrinsic dimensions of their six localized legacy SVG sources', () => {
  const pages = [
    ['index.html', 'ko'],
    ['en/index.html', 'en']
  ];
  const violations = [];
  for (const [file, locale] of pages) {
    const images = homeEvidenceImages(file);
    if (images.length !== 3) {
      violations.push(`${file}: expected exactly three public legacy evidence images, found ${images.length}`);
      continue;
    }
    for (const image of images) {
      const relativeSource = image.src.replace(/^\.\.\//, '');
      const svg = read(relativeSource);
      const viewBox = svg.match(/<svg\b[^>]*\bviewBox="0 0 (\d+) (\d+)"[^>]*>/)?.slice(1).map(Number);
      if (!viewBox) {
        violations.push(`${file}: ${relativeSource} must expose a numeric SVG viewBox`);
        continue;
      }
      if (viewBox[0] !== 1180 || viewBox[1] !== 664) {
        violations.push(`${relativeSource}: expected the Stage 2 1180 by 664 evidence frame, got ${viewBox.join(' by ')}`);
      }
      if (Number(image.width) !== viewBox[0] || Number(image.height) !== viewBox[1]) {
        violations.push(`${file}: ${image.src} intrinsic ${image.width} by ${image.height} must match source viewBox ${viewBox.join(' by ')}`);
      }
    }
  }
  assert.deepEqual(violations, [], 'Home evidence intrinsic-dimension contracts');
});

test('Home HoloLens evidence alt describes the actual surgeon-view public diagram in both locales', () => {
  const expectations = {
    ko: [
      /(?:술자|집도의)(?:의)?\s*시야/,
      /실제\s*환자/,
      /추적(?:된|되는)?\s*수술\s*도구/,
      /(?:가상\s*환자[\s\S]*(?:오버레이|정렬)|(?:오버레이|정렬)[\s\S]*가상\s*환자)/
    ],
    en: [
      /surgeon(?:'s)?\s+view/i,
      /real\s+patient/i,
      /tracked\s+surgical\s+tool/i,
      /(?:virtual[-\s]patient[\s\S]*(?:overlay|align)|(?:overlay|align)[\s\S]*virtual[-\s]patient)/i
    ]
  };
  for (const [file, locale] of [['index.html', 'ko'], ['en/index.html', 'en']]) {
    const image = homeEvidenceImages(file).find((item) => /hololens-ar-concept(?:-en)?\.svg$/.test(item.src));
    assert.ok(image, `${file}: missing HoloLens public evidence image`);
    for (const expected of expectations[locale]) {
      assert.match(image.alt, expected, `${file}: HoloLens alt must describe the actual surgeon-view evidence diagram`);
    }
  }
});

// Stage 3A contracts: only the five Registration case-study pairs move to the
// Spatial Signal case shell in this batch. The protected-copy hashes are taken
// from the deployed Stage 2 baseline after removing markup and normalizing
// whitespace, so layout refactors remain free while evidence and attribution do
// not silently change.
const stage3ARegistrationCases = [
  {
    slug: 'surgical-twin',
    state: 'verified',
    visual: 'nav-digitaltwin-pipeline',
    status: { ko: '검증 완료', en: 'Verified' },
    alt: { ko: [/좌표/, /수술/], en: [/coordinate/i, /surgical/i] }
  },
  {
    slug: 'rtms-navigation',
    state: 'ongoing',
    visual: 'coordinate-signal',
    status: { ko: '진행 중', en: 'Ongoing' },
    alt: { ko: [/좌표계/, /잔차/], en: [/frames?\s+[AB]/i, /residual/i] }
  },
  {
    slug: 'mandibular-fracture',
    state: 'verified',
    visual: 'coordinate-signal',
    status: { ko: '검증된 연구', en: 'Verified research' },
    alt: { ko: [/좌표계/, /잔차/], en: [/frames?\s+[AB]/i, /residual/i] }
  },
  {
    slug: 'c-arm-navigation',
    state: 'research',
    visual: 'research-protocol',
    status: { ko: '연구', en: 'Research' },
    alt: { ko: [/프로토콜/, /한계/], en: [/protocol/i, /limit/i] }
  },
  {
    slug: 'respiratory-surface-guidance',
    state: 'research',
    visual: 'coordinate-signal',
    status: { ko: '연구', en: 'Research' },
    alt: { ko: [/좌표계/, /잔차/], en: [/frames?\s+[AB]/i, /residual/i] }
  }
];

const stage3AProtectedCopyHashes = {
  'projects/surgical-twin/index.html': ['2b370ad74f99e476b3c831caee413849d03285d2a40cd9e7f50ac3acbc4fed5b', 'e5d483d4ad9fc64e4c1ce0204e16feff57351d8fee0fc2591deed374548d5925', '086854e59bb9667f07e8b356e67e9305bef806a0e8fbc3cf9b209ae3826f3c7f'],
  'en/projects/surgical-twin/index.html': ['26430acfb2b3e081a2d5fbe67f2611b0473a9457f2e5994bdfacf283d148073a', 'b3e0e3cf43cbb113434277accab944b55da384ec2249e7c47a399548d3a473cf', '97296623b297fad2d68fbcf7b97a4288a0c09a60ed6a344949e6d4da4a4b8faf'],
  'projects/rtms-navigation/index.html': ['3a9a69333059a99a217850c0f6ab836dc2eb41c9c413061dbfb05cf9711caa56', '1e1a6b7040ba113d6abed2ec8ff78a63564da03289df2ff9b275e8292a0a6e88', 'f8c8732f567039de9453808aca6b05d2ca12d6bed787eca1835ffe4eb3738754'],
  'en/projects/rtms-navigation/index.html': ['0e28c9d8f91ead6266d31445c1b927979308926fa10d81aebde49c879488071c', '8ab406afcb8d53d42649aed9e4c85e02b24b0dc398711ee4536b713cc52224d5', 'bf380f2826d81efff159201a70d0c28fc62b3157d1a2b02fa083b1cae5c653e1'],
  'projects/mandibular-fracture/index.html': ['bb5b8610fc9e46d688b3a94af801f3636fa2301ae669a016bc05a393bc8711fe', 'ccb3ad6ef60c91a5933804cee6c41fa7f9bed269ad039b053819c0fe40b084f9', '82f65b39cf0e90f379e8249a214f4d3cf3f909275c18f88fc50b5764a2bba3f0'],
  'en/projects/mandibular-fracture/index.html': ['21e6670e89b56c3475f252d37da668a777131f71b5f4d5dac1c2cfcfa4fda720', '2b9eddc258a690eebbf0ff5e2b337c8fca53d143fe5812f807b1cb986c2a663a', 'e038a3257e027ae266d4b09fc4844480539105337b69301f5a32020bb8de5386'],
  'projects/c-arm-navigation/index.html': ['73de8c057b52b64b6ac299c4453dffa0fcf3fd9bce82d9e2b107faa04884385b', '4ceb5c22b1cb744990db71de9b1eaacc5b76bcc55d5bbad714898b837bc441fc', '47e551837373c480415d401900c90bb01b82961d51685c136efdcc26949ec5c7'],
  'en/projects/c-arm-navigation/index.html': ['8b280cb21de026b38294d498b499935473d5b1da437ac831d280503e810951d4', '2f516e28bc185beb07797ca82629c5d8a18579909e597d13203be53f4cce47f8', '31372e28cac5715dd316f3f217ea4436e4790552f5e25f5ecbeb107208f7bb42'],
  'projects/respiratory-surface-guidance/index.html': ['73d4b80d2c19f2591ebf34a60c6ebdc43dde1f33e812559e930af48777d9a459', '0970c5d657f1b9be8160e40f6202389fc060158f97c36476c0ab1d17119ad399', '0791e531e7a91db07696762f54b57fb7a98e50f126e59c871baa544fec77df26'],
  'en/projects/respiratory-surface-guidance/index.html': ['35715dfb35dcf7c48132b08e8030f17c9f3fc4c6e3fee132aaec9e2cd82c58e9', 'd91d4a295d60ece9c2f18ce9039976cbfa47a56da6611f943e2ee8386896dde2', '84a2d536993570bd7b50dbdb4b72874dbfeb976996e12e9e5c2952307515b89b']
};

function stage3APages() {
  return stage3ARegistrationCases.flatMap((caseStudy) => ['ko', 'en'].map((locale) => {
    const english = locale === 'en';
    const file = `${english ? 'en/' : ''}projects/${caseStudy.slug}/index.html`;
    const base = english ? '../../../' : '../../';
    return {
      ...caseStudy,
      locale,
      file,
      base,
      navLabel: english ? 'Case study navigation' : '프로젝트 사례 탐색',
      statusLabel: caseStudy.status[locale],
      visualSource: `${base}assets/diagrams/${caseStudy.visual}${english ? '-en' : ''}.svg`
    };
  }));
}

function stage3ElementByClass(html, className) {
  const opening = [...html.matchAll(/<([a-z][\w:-]*)\b[^>]*\bclass="([^"]*)"[^>]*>/gi)]
    .find((match) => match[2].trim().split(/\s+/).includes(className));
  if (!opening) return null;
  const tagName = opening[1];
  const tagPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = opening.index;
  let depth = 0;
  for (let tag = tagPattern.exec(html); tag; tag = tagPattern.exec(html)) {
    const closing = /^<\//.test(tag[0]);
    const selfClosing = /\/\s*>$/.test(tag[0]);
    if (closing) depth--;
    else if (!selfClosing) depth++;
    if (depth === 0) {
      const innerStart = opening.index + opening[0].length;
      return {
        opening: opening[0],
        outer: html.slice(opening.index, tagPattern.lastIndex),
        inner: html.slice(innerStart, tag.index)
      };
    }
  }
  return null;
}

function stage3Attribute(openingTag, name) {
  return openingTag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1];
}

function stage3NormalizedText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

function stage3AtRuleBodies(css, atRule) {
  const flags = atRule.flags.includes('g') ? atRule.flags : atRule.flags + 'g';
  const pattern = new RegExp(atRule.source, flags);
  const bodies = [];
  for (let match = pattern.exec(css); match; match = pattern.exec(css)) {
    const openingBrace = css.indexOf('{', match.index);
    let depth = 0;
    for (let index = openingBrace; index < css.length; index++) {
      if (css[index] === '{') depth++;
      if (css[index] === '}' && --depth === 0) {
        bodies.push(css.slice(openingBrace + 1, index));
        break;
      }
    }
  }
  return bodies;
}

test('Stage 3A Registration pages put the sole hero heading inside a scoped main shell', () => {
  for (const page of stage3APages()) {
    const html = read(page.file);
    assert.match(html, /<body\b[^>]*\bclass="[^"]*\bss-case\b/, `${page.file}: body needs the scoped ss-case shell`);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${page.file}: must keep exactly one h1`);
    const main = html.match(/<main\b[^>]*\bid="main-content"[^>]*>[\s\S]*?<\/main>/i)?.[0];
    assert.ok(main, `${page.file}: missing main-content`);
    assert.match(main, /^<main\b[^>]*\btabindex="-1"/i, `${page.file}: main must remain a keyboard skip target`);
    assert.match(main, /^<main\b[^>]*\bclass="[^"]*\bss-case-main\b/i, `${page.file}: main needs ss-case-main`);
    const hero = stage3ElementByClass(main, 'ss-case-hero');
    assert.ok(hero, `${page.file}: hero must move inside main and expose ss-case-hero`);
    assert.match(hero.outer, /<h1\b[^>]*>[\s\S]*?<\/h1>/i, `${page.file}: case hero must own the page h1`);
    assert.equal(main.indexOf(hero.outer) < main.indexOf('decision-timeline'), true, `${page.file}: hero must precede the detailed timeline`);
    assert.equal(html.indexOf('<main') < html.indexOf('<h1'), true, `${page.file}: h1 remains outside main`);
  }
});

test('Stage 3A Registration heroes expose localized evidence state and a decorative Registration Trace', () => {
  for (const page of stage3APages()) {
    const html = read(page.file);
    const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
    const hero = stage3ElementByClass(main, 'ss-case-hero');
    assert.ok(hero, `${page.file}: missing ss-case-hero`);

    const status = stage3ElementByClass(hero.outer, 'ss-case-status');
    assert.ok(status, `${page.file}: visible state needs ss-case-status`);
    assert.equal(stage3Attribute(status.opening, 'data-ss-state'), page.state, `${page.file}: visible state must expose canonical ${page.state}`);
    assert.equal(stage3NormalizedText(status.inner), page.statusLabel, `${page.file}: state label is not localized`);

    const trace = stage3ElementByClass(hero.outer, 'ss-case-trace');
    assert.ok(trace, `${page.file}: hero needs an Evidence Registration Trace hook`);
    assert.equal(stage3Attribute(trace.opening, 'aria-hidden'), 'true', `${page.file}: decorative trace must be hidden from assistive technology`);
    assert.equal(stage3Attribute(trace.opening, 'data-ss-state'), page.state, `${page.file}: trace must expose canonical ${page.state}`);
    assert.equal(stage3NormalizedText(trace.inner), '', `${page.file}: decorative trace must contain no readable copy`);
    const traceSpans = [...trace.inner.matchAll(/<span\b[^>]*\bclass="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi)];
    assert.equal(traceSpans.length >= 3, true, `${page.file}: trace needs multiple structural checkpoints`);
    assert.equal(traceSpans.some((span) => span[1].split(/\s+/).includes('ss-case-trace__node')), true, `${page.file}: trace needs node hooks`);
    assert.equal(traceSpans.some((span) => span[1].split(/\s+/).includes('ss-case-trace__segment')), true, `${page.file}: trace needs segment hooks`);
    for (const span of traceSpans) assert.equal(stage3NormalizedText(span[2]), '', `${page.file}: trace checkpoint must remain empty and decorative`);
  }
});

test('Stage 3A Registration pages provide localized named case navigation with file-safe links', () => {
  for (const page of stage3APages()) {
    const html = read(page.file);
    const navigation = stage3ElementByClass(html, 'ss-case-nav');
    assert.ok(navigation, `${page.file}: missing ss-case-nav`);
    assert.equal(stage3Attribute(navigation.opening, 'aria-label'), page.navLabel, `${page.file}: case navigation needs a localized accessible name`);
    const links = [...navigation.inner.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi)];
    assert.equal(links.length >= 2, true, `${page.file}: named case navigation needs at least two destinations`);
    for (const link of links) {
      const href = link[1];
      if (/^(?:https?:|mailto:|#)/i.test(href)) continue;
      assert.match(href, /index\.html(?:[?#].*)?$/, `${page.file}: local case-navigation link must remain file:// safe: ${href}`);
    }
  }
});

test('Stage 3A adjacent case links use the canonical destination name for the active locale', () => {
  for (const page of stage3APages()) {
    const navigation = stage3ElementByClass(read(page.file), 'ss-case-nav');
    assert.ok(navigation, `${page.file}: missing ss-case-nav`);
    for (const link of navigation.inner.matchAll(/<a\b[^>]*\bhref="\.\.\/([^/]+)\/index\.html"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const destination = data.projects.find((project) => project.slug === link[1]);
      assert.ok(destination, `${page.file}: unknown adjacent project ${link[1]}`);
      const localizedTitle = destination.translations[page.locale].title;
      const conciseTitle = page.locale === 'ko' ? localizedTitle.replace(/\s*\([^)]*\)\s*$/, '') : localizedTitle;
      assert.equal(
        stage3NormalizedText(link[2]).includes(conciseTitle),
        true,
        `${page.file}: adjacent link ${link[1]} must include canonical ${page.locale} title “${conciseTitle}”`
      );
    }
  }
});

test('Stage 3A Registration evidence frames use localized public diagrams and intrinsic dimensions', () => {
  for (const page of stage3APages()) {
    const html = read(page.file);
    const figure = stage3ElementByClass(html, 'ss-case-evidence');
    assert.ok(figure, `${page.file}: missing public evidence figure`);
    assert.match(
      figure.inner,
      /^\s*<picture\b[^>]*\bclass="[^"]*\bss-case-evidence__picture\b[^"]*"[^>]*>[\s\S]*?<img\b[^>]*>[\s\S]*?<\/picture>\s*<figcaption\b[^>]*\bclass="[^"]*\bss-case-evidence__caption\b[^"]*"[^>]*>[\s\S]*?<\/figcaption>\s*$/i,
      `${page.file}: evidence must retain figure > picture > img + figcaption nesting`
    );
    const image = figure.inner.match(/<img\b[^>]*>/i)?.[0];
    assert.ok(image, `${page.file}: evidence picture is missing its image`);
    assert.match(image, /\bclass="[^"]*\bss-case-evidence__image\b/, `${page.file}: evidence image needs its scoped hook`);
    assert.equal(stage3Attribute(image, 'src'), page.visualSource, `${page.file}: wrong localized file-protocol evidence path`);
    assert.equal(stage3Attribute(image, 'width'), '1180', `${page.file}: evidence image needs intrinsic width`);
    assert.equal(stage3Attribute(image, 'height'), '664', `${page.file}: evidence image needs intrinsic height`);
    assert.equal(stage3Attribute(image, 'loading'), 'lazy', `${page.file}: below-hero evidence should load lazily`);
    assert.equal(stage3Attribute(image, 'decoding'), 'async', `${page.file}: evidence should decode asynchronously`);
    const alt = stage3Attribute(image, 'alt');
    assert.equal(Boolean(alt), true, `${page.file}: evidence image needs descriptive alt text`);
    for (const expected of page.alt[page.locale]) assert.match(alt, expected, `${page.file}: alt text does not describe the mapped public diagram`);
    const resolvedAsset = path.resolve(path.dirname(path.join(root, page.file)), page.visualSource);
    assert.equal(fs.existsSync(resolvedAsset), true, `${page.file}: evidence asset does not resolve under file://`);

    const caption = stage3ElementByClass(figure.outer, 'ss-case-evidence__caption');
    assert.ok(caption, `${page.file}: evidence needs a visible caption`);
    const captionText = stage3NormalizedText(caption.inner);
    if (page.locale === 'ko') {
      assert.match(alt, /[가-힣]/, `${page.file}: Korean alt must be localized`);
      assert.match(captionText, /공개 근거 다이어그램/, `${page.file}: Korean caption must identify public evidence`);
      assert.match(captionText, /제품 스크린샷이 아닌/, `${page.file}: Korean caption must not imply a product screenshot`);
    } else {
      assert.doesNotMatch(alt + captionText, /[가-힣]/, `${page.file}: English evidence accessibility copy contains Korean`);
      assert.match(captionText, /public evidence diagram/i, `${page.file}: English caption must identify public evidence`);
      assert.match(captionText, /not a product screenshot/i, `${page.file}: English caption must not imply a product screenshot`);
    }
  }
});

test('Stage 3A evidence frames share the at-a-glance lead column with their summary', () => {
  for (const page of stage3APages()) {
    const overview = stage3ElementByClass(read(page.file), 'case-overview');
    assert.ok(overview, `${page.file}: missing case-overview`);
    const figure = stage3ElementByClass(overview.inner, 'ss-case-evidence');
    assert.ok(figure, `${page.file}: evidence frame must stay inside the common at-a-glance grid`);
    assert.match(
      overview.inner,
      /^\s*<div\b[^>]*>[\s\S]*\bclass="[^"]*\bcs-tldr\b[^"]*"[\s\S]*\bclass="[^"]*\bss-case-evidence\b[^"]*"[\s\S]*<\/div>\s*<dl\b[^>]*\bclass="[^"]*\bcase-facts\b/i,
      `${page.file}: at-a-glance must keep summary + evidence beside the facts panel`
    );
  }
});

test('Stage 3A Registration redesign preserves detailed decision, attribution, and limitation copy', () => {
  const protectedClasses = ['decision-timeline', 'attribution-grid', 'limitation-note'];
  for (const page of stage3APages()) {
    const html = read(page.file);
    const hashes = protectedClasses.map((className) => {
      const block = stage3ElementByClass(html, className);
      assert.ok(block, `${page.file}: missing protected ${className} body`);
      return crypto.createHash('sha256').update(stage3NormalizedText(block.inner)).digest('hex');
    });
    assert.deepEqual(
      hashes,
      stage3AProtectedCopyHashes[page.file],
      `${page.file}: detailed Decision Timeline, My Decisions / Team Result, or limitation copy changed from the Stage 2 baseline`
    );
  }
});

test('Stage 3A Registration pages retain explicit ownership, limitation, and privacy boundaries', () => {
  const claimAnchors = {
    'projects/surgical-twin/index.html': [/임상 운영 배포로 표현하지 않습니다/],
    'en/projects/surgical-twin/index.html': [/not presented as production clinical deployment/i],
    'projects/rtms-navigation/index.html': [/임상 효능이나 상용 배포를 의미하지 않습니다/],
    'en/projects/rtms-navigation/index.html': [/not clinical efficacy or commercial deployment/i],
    'projects/mandibular-fracture/index.html': [/일상 임상 사용을 주장하지 않습니다/],
    'en/projects/mandibular-fracture/index.html': [/does not claim routine clinical use/i],
    'projects/c-arm-navigation/index.html': [/제한된 기여 범위만 다룹니다/, /전체 시스템 아키텍처, 임상 검증, 정확도 인증, 운영 배포는[^.]*범위 밖입니다/],
    'en/projects/c-arm-navigation/index.html': [/bounded contribution, not the full imaging or navigation system/i, /Full-system architecture, clinical validation, accuracy certification, and production deployment are outside the scope attributed to me/i],
    'projects/respiratory-surface-guidance/index.html': [/파트너 기관이 치료 하드웨어와 임상 프로토콜을 담당합니다/, /프로그램 전체 결과를 개인 성과로 귀속하지 않습니다/],
    'en/projects/respiratory-surface-guidance/index.html': [/Partner organizations own the delivery hardware and clinical protocol/i, /Program-level outcomes are not attributed as personal results/i]
  };
  for (const page of stage3APages()) {
    const html = read(page.file);
    for (const anchor of claimAnchors[page.file]) assert.match(html, anchor, `${page.file}: deep attribution or limitation claim was lost`);
    assert.doesNotMatch(html, contributionPercentagePattern, `${page.file}: contains a contribution percentage`);
    assert.doesNotMatch(html, render.policy.prohibitedPartnerPattern, `${page.file}: exposes a prohibited partner identity`);
  }
});

test('Stage 3A case CSS remains trailing, scoped, keyboard-visible, touch-safe, and narrow-safe', () => {
  for (const page of stage3APages()) {
    const stylesheets = [...read(page.file).matchAll(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*>/gi)].map((match) => match[1]);
    assert.equal(stylesheets.at(-1), `${page.base}css/spatial-signal.css`, `${page.file}: Spatial Signal must remain the final authored stylesheet`);
  }

  const css = read('css/spatial-signal.css');
  for (const hook of ['main', 'hero', 'trace', 'status', 'evidence', 'nav']) {
    assert.match(css, new RegExp(`body\\.ss-case[^,{]*\\.ss-case-${hook}\\b`), `Spatial Signal CSS needs a body.ss-case-scoped ss-case-${hook} rule`);
  }
  for (const state of ['verified', 'ongoing', 'research']) {
    assert.match(css, new RegExp(`body\\.ss-case[^,{]*\\.ss-case-status\\[data-ss-state="${state}"\\]`), `case status needs an explicit ${state} state selector`);
  }

  const navTargetRule = [...css.matchAll(/(?:^|})\s*([^@}{][^{]+)\{([^{}]*)\}/gm)]
    .find((match) => match[1].split(',').some((selector) => /body\.ss-case\b/.test(selector) && /\.ss-case-nav\b[^,{]*\ba\b/.test(selector)) && /\bmin-height\s*:/.test(match[2]));
  assert.ok(navTargetRule, 'case navigation links need a scoped touch-target rule');
  for (const property of ['min-width', 'min-height']) {
    const values = [...navTargetRule[2].matchAll(new RegExp(`\\b${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, 'g'))].map((match) => Number(match[1]));
    assert.equal(values.some((value) => value >= 44), true, `case navigation links require ${property}: at least 44px`);
  }
  assert.match(css, /body\.ss-case[^,{]*:focus-visible/, 'case-study controls need a body.ss-case-scoped visible focus rule');

  const imageRules = [...css.matchAll(/(?:^|})\s*([^@}{][^{]+)\{([^{}]*)\}/gm)]
    .filter((match) => match[1].split(',').some((selector) => /body\.ss-case\b/.test(selector) && /\.ss-case-evidence__image\b/.test(selector)))
    .map((match) => match[2]).join('\n');
  assert.match(imageRules, /\bmax-width\s*:\s*100%/, 'case evidence image must shrink within a 320px viewport');
  assert.match(imageRules, /\bheight\s*:\s*auto/, 'case evidence image must preserve its aspect ratio');

  const narrowBodies = stage3AtRuleBodies(css, /@media\s*\(max-width:\s*(?:340|480)px\)/i);
  assert.equal(narrowBodies.some((body) => /body\.ss-case\b/.test(body) && /(?:min-width\s*:\s*0|grid-template-columns\s*:\s*minmax\(0,\s*1fr\)|padding-inline)/.test(body)), true, 'case shell needs a 320px-safe responsive hook');
  const reducedMotionBodies = stage3AtRuleBodies(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
  assert.equal(reducedMotionBodies.some((body) => /body\.ss-case\b/.test(body) && /(?:transition-duration\s*:\s*\.01ms|animation\s*:\s*none)/.test(body)), true, 'case shell needs a reduced-motion override');
});

test('Spatial Signal exposes one seven-token typography scale and only approved weights', () => {
  const css = read('css/spatial-signal.css');
  const tokens = {
    '--ss-type-display': 'clamp(2.125rem, calc(1.6rem + 2.2vw), 3.25rem)',
    '--ss-type-section': 'clamp(1.5rem, calc(1.3rem + .8vw), 2rem)',
    '--ss-type-title': 'clamp(1.125rem, calc(1.05rem + .25vw), 1.25rem)',
    '--ss-type-lead': 'clamp(1.0625rem, calc(1rem + .15vw), 1.125rem)',
    '--ss-type-body': '1rem',
    '--ss-type-small': '.875rem',
    '--ss-type-label': '.8125rem'
  };

  for (const [token, value] of Object.entries(tokens)) {
    const declarations = [...css.matchAll(new RegExp(`${token}\\s*:\\s*([^;]+)`, 'g'))];
    assert.equal(declarations.length, 1, `${token} must be declared exactly once`);
    assert.equal(declarations[0][1].trim(), value, `${token} does not match the approved scale`);
  }

  const sizeDeclarations = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map((match) => match[1].trim());
  const allowedSizeReferences = new Set(Object.keys(tokens).map((token) => `var(${token})`));
  assert.deepEqual(
    sizeDeclarations.filter((value) => !allowedSizeReferences.has(value.replace(/\s*!important$/, ''))),
    [],
    'every Spatial Signal font-size must map to one approved type token'
  );

  const weights = [...css.matchAll(/font-weight\s*:\s*(\d+)\s*;/g)].map((match) => Number(match[1]));
  assert.deepEqual(
    [...new Set(weights)].filter((weight) => ![400, 500, 600, 700].includes(weight)),
    [],
    'Spatial Signal must use only the approved 400/500/600/700 weights'
  );
});

test('Spatial Signal body token wins the retained important Home validation rule', () => {
  const legacyCss = read('css/site.css');
  const css = read('css/spatial-signal.css');
  assert.match(
    legacyCss,
    /\.capability-validation\s*\{[^}]*font-size\s*:\s*\.75rem\s*!important/,
    'test fixture expects the retained legacy important declaration'
  );
  const validationRules = cssRuleBodies(css, '.ss-home .capability-validation');
  assert.match(
    validationRules.join('\n'),
    /font-size\s*:\s*var\(--ss-type-body\)\s*!important/,
    'the trailing Spatial Signal contract must beat legacy .75rem !important without editing legacy CSS'
  );
});

test('Spatial Signal maps semantic text roles to the shared typography scale', () => {
  const css = read('css/spatial-signal.css');
  const roleSelectors = {
    display: [
      '.ss-hero__title',
      'body.ss-projects .ss-discovery-hero__title',
      'body.ss-capabilities .ss-discovery-hero__title',
      'body.ss-case .ss-case-hero__title'
    ],
    section: [
      '.ss-section-title',
      'body.ss-projects .ss-project-chapter__header h2',
      'body.ss-capabilities .ss-capability-panel__header h2',
      'body.ss-case .cs-section > h2'
    ],
    title: [
      '.ss-home .capability-card h3',
      '.ss-evidence-slide__title',
      'body.ss-projects .ss-project-card__title',
      'body.ss-capabilities .ss-capability-panel__item h3',
      'body.ss-case .decision-step h3',
      'body.ss-case .limitation-note h2'
    ],
    lead: [
      '.ss-hero__support',
      'body.ss-projects .ss-discovery-hero__lead',
      'body.ss-capabilities .ss-discovery-hero__lead',
      'body.ss-case .ss-case-hero .cs-hero-summary'
    ],
    body: [
      '.ss-home',
      'body.ss-projects',
      'body.ss-capabilities',
      'body.ss-case',
      'body.ss-projects .ss-project-card__fact',
      'body.ss-case .case-facts dd'
    ],
    small: [
      '.ss-site-nav__link',
      '.ss-button',
      '.ss-evidence-slide__caption',
      'body.ss-projects .ss-project-card__caption',
      'body.ss-case .ss-case-evidence__caption',
      'body.ss-case .ss-case-nav a'
    ],
    label: [
      '.ss-eyebrow',
      '.ss-site-footer .ss-site-footer__meta',
      'body.ss-projects .ss-status',
      'body.ss-capabilities .ss-capability-panel__eyebrow',
      'body.ss-case .ss-case-status',
      'body.ss-case .ss-case-hero .cs-badges .badge'
    ]
  };

  for (const [role, selectors] of Object.entries(roleSelectors)) {
    for (const selector of selectors) {
      const rules = cssRuleBodies(css, selector);
      assert.equal(rules.length > 0, true, `${selector}: missing ${role} typography rule`);
      assert.match(rules.join('\n'), new RegExp(`font-size\\s*:\\s*var\\(--ss-type-${role}\\)`), `${selector}: must use ${role}`);
    }
  }

  for (const selector of roleSelectors.display) {
    const rules = cssRuleBodies(css, selector).join('\n');
    assert.match(rules, /line-height\s*:\s*1\.1/, `${selector}: display line-height must be 1.1`);
    assert.match(rules, /font-weight\s*:\s*700/, `${selector}: display weight must be 700`);
    assert.match(rules, /text-wrap\s*:\s*balance/, `${selector}: display text must balance`);
    assert.match(rules, /word-break\s*:\s*keep-all/, `${selector}: display text must preserve Korean words`);
  }

  for (const selector of roleSelectors.lead) {
    const rules = cssRuleBodies(css, selector).join('\n');
    assert.match(rules, /max-width\s*:\s*60ch/, `${selector}: lead measure must stay within 60ch`);
  }
});

test('Spatial Signal keeps every route H1 on one continuous display curve', () => {
  const css = read('css/spatial-signal.css');
  const mediaBodies = stage3AtRuleBodies(css, /@media\s*[^\{]+/i);
  const h1Selectors = [
    /\.ss-hero__title/,
    /body\.ss-projects\s+\.ss-discovery-hero__title/,
    /body\.ss-capabilities\s+\.ss-discovery-hero__title/,
    /body\.ss-case\s+\.ss-case-hero(?:\s+h1|__title)/
  ];
  const breakpointOverrides = mediaBodies.flatMap((body) => h1Selectors
    .filter((selector) => new RegExp(`${selector.source}[^\\{]*\\{[^}]*font-size`, 'i').test(body))
    .map((selector) => selector.source));
  assert.deepEqual(breakpointOverrides, [], 'H1 font-size must not be redefined inside breakpoints');

  const koreanRules = cssRuleBodies(css, '[data-lang="ko"] .ss-hero__title').join('\n')
    + cssRuleBodies(css, 'body.ss-case[data-lang="ko"] .ss-case-hero__title').join('\n');
  const englishRules = cssRuleBodies(css, '[data-lang="en"] .ss-hero__title').join('\n')
    + cssRuleBodies(css, 'body.ss-case[data-lang="en"] .ss-case-hero__title').join('\n');
  assert.match(koreanRules, /letter-spacing\s*:\s*-\.02em/, 'Korean H1 tracking must be -.02em');
  assert.match(englishRules, /letter-spacing\s*:\s*-\.03em/, 'English H1 tracking must be -.03em');
});

test('Spatial Signal final reduced-motion guard wins the complete shell cascade', () => {
  const css = read('css/spatial-signal.css');
  const reducedMotionBodies = stage3AtRuleBodies(css, /@media\s*\(prefers-reduced-motion\s*:\s*reduce\)/i);
  const shellGuards = reducedMotionBodies.filter((body) => /\.ss-shell\s+\*/.test(body));
  assert.equal(shellGuards.length > 0, true, 'the complete Spatial Signal shell needs a final reduced-motion guard');

  const guard = shellGuards.at(-1);
  assert.match(guard, /scroll-behavior\s*:\s*auto\s*!important/, 'smooth scrolling must be disabled');
  assert.match(guard, /animation\s*:\s*none\s*!important/, 'animations must be disabled');
  assert.match(guard, /transition-duration\s*:\s*\.01ms\s*!important/, 'transitions must collapse even against more specific rules');
  assert.match(guard, /transition-delay\s*:\s*0ms\s*!important/, 'transition delays must be removed');
});

test('Stage 3A desktop fact labels reserve an unbroken English responsibility column', () => {
  const css = read('css/spatial-signal.css');
  const factRowRules = cssRuleBodies(css, 'body.ss-case .case-facts div').join('\n');
  assert.match(
    factRowRules,
    /grid-template-columns\s*:\s*minmax\(7rem,\s*\.42fr\)\s+minmax\(0,\s*1fr\)/,
    'desktop fact rows must fit the longest English label before emergency wrapping'
  );
});

test('Stage 3A Korean case H1 separates its English translation without adding a second heading', () => {
  for (const page of stage3APages()) {
    const html = read(page.file);
    const heading = html.match(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/i);
    assert.ok(heading, `${page.file}: missing case H1`);
    assert.match(heading[1], /\bclass="[^"]*\bss-case-hero__title\b/, `${page.file}: H1 needs the shared title hook`);

    const translation = stage3ElementByClass(heading[2], 'ss-case-hero__title-translation');
    if (page.locale === 'ko') {
      assert.ok(translation, `${page.file}: Korean H1 must contain a translation span`);
      assert.equal(stage3Attribute(translation.opening, 'lang'), 'en', `${page.file}: translation must declare lang=en`);
      assert.notEqual(stage3NormalizedText(translation.inner), '', `${page.file}: translation cannot be empty`);
      assert.equal((heading[2].match(/ss-case-hero__title-translation/g) || []).length, 1, `${page.file}: translation span must be unique`);
    } else {
      assert.equal(translation, null, `${page.file}: English H1 must not add a translation line`);
    }
  }
});
