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

test('Spatial Signal hero title preserves Korean words while allowing normal wrapping', () => {
  assert.equal(fs.existsSync(spatialSignalCssPath), true, 'missing css/spatial-signal.css');
  const css = fs.readFileSync(spatialSignalCssPath, 'utf8');
  const heroTitleRule = css.match(/(?:^|})\s*\.ss-hero__title\s*\{([^}]*)\}/m);
  assert.ok(heroTitleRule, 'missing base .ss-hero__title rule');
  assert.match(heroTitleRule[1], /word-break:\s*keep-all/, 'hero title must keep Korean words intact');
  assert.match(heroTitleRule[1], /overflow-wrap:\s*normal/, 'hero title must use normal overflow wrapping');
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

test('Spatial Signal technical labels remain at least .70rem for readability', () => {
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
    const fontSizes = cssRuleBodies(css, selector)
      .flatMap((body) => [...body.matchAll(/font-size\s*:\s*([\d.]+)rem/g)].map((match) => Number(match[1])));
    if (!fontSizes.length) return `${label}: missing rem font-size declaration for ${selector}`;
    return fontSizes.filter((size) => size < .70).map((size) => `${label}: ${size}rem < .70rem`);
  });
  assert.deepEqual(violations, [], 'technical labels must remain readable at .70rem or larger');
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
