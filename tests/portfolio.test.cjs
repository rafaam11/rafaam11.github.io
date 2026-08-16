const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const dataPath = path.join(root, 'js', 'portfolio-data.js');
const rendererPath = path.join(root, 'js', 'portfolio-render.js');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');
const nav = require('../js/nav.js');
const validator = require('../scripts/validate-portfolio.cjs');

const slugs = [
  'surgical-navigation',
  'mandibular-fracture',
  'life-careverse',
  'rtms-navigation',
  'unmanned-forklift',
  'ai-build-lab'
];
const capabilityKeys = [
  'registration',
  'sensor-fusion',
  'medical-navigation',
  'xr-engineering',
  'ai-product-engineering'
];
const tierKeys = ['medical-core', 'industrial-spotlight', 'ai-build-lab'];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function count(haystack, needle) {
  return (haystack.match(new RegExp(needle, 'g')) || []).length;
}

function assertInOrder(haystack, values, label) {
  let previous = -1;
  for (const value of values) {
    const current = haystack.indexOf(value);
    assert.ok(current > previous, `${label}: ${value} is missing or out of order`);
    previous = current;
  }
}

function canonicalPages() {
  return validator.publicPortfolioFiles(root);
}

test('canonical data preserves the browser/CommonJS boundary and exact ordered portfolio', () => {
  const browser = {};
  vm.runInNewContext(fs.readFileSync(dataPath, 'utf8'), browser);
  assert.deepEqual(Array.from(browser.PortfolioData.projects, (project) => project.slug), slugs);
  assert.deepEqual(data.projects.map((project) => project.slug), slugs);
  assert.deepEqual(data.capabilities.map((capability) => capability.key), capabilityKeys);
  assert.deepEqual(data.tiers.map((tier) => tier.key), tierKeys);
  assert.deepEqual(data.impactMetrics, []);
});

test('canonical records retain localized evidence, attribution, media, blocks, and stable PDFs', () => {
  const required = [
    'title', 'shortTitle', 'eyebrow', 'thesis', 'summary', 'problem', 'role',
    'teamResult', 'evidence', 'limitation', 'collaboration', 'mediaAlt', 'mediaCaption'
  ];
  const blockTypes = new Set(['text', 'list', 'system', 'evidence', 'limitation']);
  for (const project of data.projects) {
    assert.equal(project.route, `projects/${project.slug}/`);
    assert.deepEqual(project.pdf, {
      ko: `assets/pdfs/${project.slug}-ko.pdf`,
      en: `assets/pdfs/${project.slug}-en.pdf`
    });
    assert.ok(project.capabilityKeys.every((key) => capabilityKeys.includes(key)));
    assert.ok(project.media && project.media.lead);
    assert.ok(project.blocks.length > 0);
    for (const locale of ['ko', 'en']) {
      for (const field of required) assert.ok(project.translations[locale][field], `${project.slug}: missing ${locale}.${field}`);
      assert.notEqual(project.translations[locale].role, project.translations[locale].teamResult);
    }
    for (const block of project.blocks) {
      assert.ok(blockTypes.has(block.type), `${project.slug}: unsupported ${block.type}`);
      for (const locale of ['ko', 'en']) {
        const copy = block.translations[locale];
        assert.ok(copy.heading);
        if (block.type === 'list') assert.ok(Array.isArray(copy.items) && copy.items.length > 0);
        else assert.ok(copy.body);
      }
    }
  }
  assert.deepEqual(data.projects.at(-1).subcases.map((item) => item.key), ['llm-wiki', 'multi-cli-work', 'daegu-bus']);
});

test('pending evidence remains pathless and approved evidence uses safe public paths', () => {
  for (const project of data.projects) {
    const lead = project.media.lead;
    if (lead.status === 'pending-approval') assert.equal(Object.hasOwn(lead, 'publicPath'), false);
    if (lead.status === 'approved') assert.equal(validator.portfolioDataErrors(data).length, 0);
  }
  const unsafePaths = [
    'C:/private/raw/demo.png', '../private/demo.png', 'assets/projects/../private/demo.png',
    'file:///C:/private/demo.png', 'javascript:alert(1)', 'data:text/plain,private'
  ];
  for (const publicPath of unsafePaths) {
    const candidate = clone(data);
    candidate.projects.at(-1).media.lead.publicPath = publicPath;
    assert.match(validator.portfolioDataErrors(candidate).join(' '), /unsafe public path/i);
  }
});

test('privacy and attribution policies reject private names and contribution percentages', () => {
  assert.doesNotMatch(JSON.stringify(data), render.policy.prohibitedPartnerPattern);
  const percentage = clone(data);
  percentage.projects[0].translations.en.role += ' Contribution 47%.';
  assert.match(validator.portfolioDataErrors(percentage).join(' '), /contribution percentage/i);
  const measured = clone(data);
  measured.projects[0].translations.en.evidence += ' Measured pass rate 87%.';
  assert.doesNotMatch(validator.portfolioDataErrors(measured).join(' '), /contribution percentage/i);
  const named = clone(data);
  named.projects[0].translations.en.summary += ' Samsung Medical partner.';
  assert.match(validator.portfolioDataErrors(named).join(' '), /nonpublic partner/i);
});

test('canonical validator rejects malformed capabilities, tiers, states, blocks, and media', () => {
  const mutations = [
    [(candidate) => { candidate.capabilities[0].key = 'unknown'; }, /known ordered keys/i],
    [(candidate) => { candidate.projects[0].tier = 'featured'; }, /unknown tier/i],
    [(candidate) => { candidate.projects[0].evidenceState = 'completed'; }, /unknown evidence state/i],
    [(candidate) => { candidate.projects[0].blocks[0].type = 'timeline'; }, /unsupported block type/i],
    [(candidate) => { candidate.projects[0].media.lead.publicPath = 'assets/private/demo.mp4'; }, /pending-approval media must not declare a public path/i],
    [(candidate) => { delete candidate.projects.at(-1).media.lead.publicPath; }, /approved media requires a public path/i],
    [(candidate) => { candidate.projects[0].pdf.ko = 'download.pdf'; }, /invalid ko PDF path/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    assert.match(validator.portfolioDataErrors(candidate).join(' '), expected);
  }
});

test('route descriptors keep four public pages and six paired case routes', () => {
  assert.deepEqual(i18n.supportedNavigationPages, ['home', 'projects', 'cv', 'contact']);
  assert.deepEqual(i18n.canonicalCaseSlugs, slugs);
  assert.deepEqual(validator.portfolioRoutes().map((item) => item.route), [
    '', 'projects/', 'cv/', 'contact/', ...slugs.map((slug) => `projects/${slug}/`)
  ]);
  const files = canonicalPages();
  assert.equal(files.length, 20);
  assert.equal(new Set(files.map((item) => item.relativePath)).size, 20);
});

test('route helpers preserve locale and explicit file protocol targets', () => {
  assert.equal(i18n.routeHref('../', 'ko', 'projects/surgical-navigation/', false), '../projects/surgical-navigation/');
  assert.equal(i18n.routeHref('../', 'en', 'projects/surgical-navigation/', false), '../en/projects/surgical-navigation/');
  assert.equal(i18n.routeHref('../../../', 'en', 'projects/', true), '../../../en/projects/index.html');
  assert.equal(i18n.routeHref('', 'ko', '', true), 'index.html');
});

test('shared navigation contains only brand, Projects, CV, Contact, and explicit locale links', () => {
  const html = nav.navigationHtml({ base: '../../../', current: 'projects', locale: 'en', route: 'projects/rtms-navigation/', isFile: true });
  assertInOrder(html, ['Jinmin Kim', '>Projects<', '>CV<', '>Contact<', '>한국어<', '>EN<'], 'navigation');
  assert.doesNotMatch(html, /Capabilities|Research|GitHub|fontawesome|navbar-toggler|data-bs-/i);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/projects\/rtms-navigation\/index\.html"[^>]*>한국어<\/a>/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/projects\/rtms-navigation\/index\.html"[^>]*aria-current="page"[^>]*>EN<\/a>/);
});

test('prototype evidence state is localized in both languages', () => {
  assert.equal(i18n.ui.ko.portfolio.evidenceStates.prototype, '프로토타입');
  assert.equal(i18n.ui.en.portfolio.evidenceStates.prototype, 'Prototype');
});

test('Task 3 Home renderer creates six ordered title-led links without card marketing copy', () => {
  const html = render.homeProjectGalleryHtml(data, '', false, 'en');
  assert.equal(count(html, 'class="td-home-project"'), 6);
  assertInOrder(html, data.projects.map((project) => project.translations.en.title.replace(/&/g, '&amp;')), 'Home projects');
  for (const project of data.projects) {
    assert.match(html, new RegExp(`href="en/projects/${project.slug}/"`));
    assert.doesNotMatch(html, new RegExp(project.translations.en.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, new RegExp(project.translations.en.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /td-status|td-tech-list|project-summary|project-role/);
});

test('Task 3 Home evidence mosaic and capability index follow the required data order', () => {
  const mosaic = render.homeEvidenceMosaicHtml(data, 'en');
  assert.equal(count(mosaic, 'class="td-mosaic-cell"'), 3);
  assertInOrder(mosaic, ['Registration', 'Surgical navigation', 'Sensor fusion'], 'Home evidence mosaic');
  assert.doesNotMatch(mosaic, /<img|<video|<svg/i, 'pending evidence must remain an honest technical panel');
  assert.doesNotMatch(mosaic, /<figcaption/i, 'mosaic ledger must not use figcaption outside a figure');

  const index = render.capabilityIndexHtml(data, 'en');
  assert.equal(count(index, 'class="td-capability-row"'), 5);
  assertInOrder(index, data.capabilities.map((item) => item.translations.en.title.replace(/&/g, '&amp;')), 'capability index');
  for (const capability of data.capabilities) {
    const method = capability.methods[0].replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(index, new RegExp(method));
  }
  assert.doesNotMatch(index, /rating|progress|capability-card/i);
});

test('Task 3 Home shells preserve exact thesis, section order, and six-link no-JS fallback', () => {
  const pages = [
    ['index.html', '3D 정합과 공간 시스템을 설계하고 구현합니다.', data.projects.map((item) => item.translations.ko.title)],
    ['en/index.html', 'I design and build 3D registration and spatial systems.', data.projects.map((item) => item.translations.en.title)]
  ];
  for (const [file, thesis, titles] of pages) {
    const html = read(file);
    assert.match(html, new RegExp(thesis.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assertInOrder(html, ['td-home-hero', 'data-portfolio="home-projects"', 'data-portfolio="capability-index"', 'td-home-contact'], file);
    const fallback = html.match(/<div class="td-home-projects__fallback">([\s\S]*?)<\/div>\s*<\/section>/)?.[1] || '';
    assert.equal(count(fallback, '<a '), 6, `${file}: fallback link count`);
    assertInOrder(fallback, titles, `${file}: fallback project titles`);
  }
});

test('Task 3 Projects renderer groups four Medical Core cases then two full-width spotlights', () => {
  const html = render.projectGroupsHtml(data, '../', false, 'en');
  assertInOrder(html, ['data-tier="medical-core"', 'data-tier="industrial-spotlight"', 'data-tier="ai-build-lab"'], 'project tiers');
  const medical = html.match(/<section[^>]*data-tier="medical-core"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal(count(medical, 'class="td-project-card"'), 4);
  assert.match(medical, /Surgical Navigation Systems/);
  assert.ok(medical.indexOf('Surgical Navigation Systems') < medical.indexOf('Mandibular Fracture Reduction Optimization'));
  assert.equal(count(html, 'class="td-project-row td-project-row--feature"'), 2);
  assert.match(html, /Personal role[\s\S]*Team result/);
  assert.doesNotMatch(html, /capability-chapter|Featured|More Projects|13 projects/i);
});

test('Task 3 media renderer shows pending provenance without broken media', () => {
  const project = data.projects[0];
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /data-media-status="pending-approval"/);
  assert.match(html, /Pending approval/);
  assert.match(html, /video/i);
  assert.match(html, new RegExp(project.translations.en.mediaCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /<(?:img|video)\b/i);
});

test('Task 3 approved video contract is poster-led, click-to-play, and keyboard reachable', () => {
  const project = clone(data.projects[0]);
  project.media.lead = { id: 'approved-demo', type: 'video', status: 'approved', publicPath: 'assets/projects/demo.mp4' };
  project.media.poster = { id: 'approved-poster', type: 'image', status: 'approved', publicPath: 'assets/projects/poster.webp' };
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")(?=[^>]*\bposter="\.\.\/\.\.\/assets\/projects\/poster\.webp")(?=[^>]*\btabindex="0")[^>]*>/);
  assert.match(html, /<source src="\.\.\/\.\.\/assets\/projects\/demo\.mp4"/);
  assert.doesNotMatch(html, /\bautoplay\b|\bmuted\b/);
});

test('Task 3 approved video without an approved poster stays an honest fallback', () => {
  const project = clone(data.projects[0]);
  project.media.lead = { id: 'approved-demo', type: 'video', status: 'approved', publicPath: 'assets/projects/demo.mp4' };
  project.media.poster = { id: 'pending-poster', type: 'image', status: 'pending-approval' };
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /td-evidence-placeholder/);
  assert.doesNotMatch(html, /<video\b|assets\/projects\/demo\.mp4/);
});

test('Task 3 case renderer uses project-specific blocks and separates role from team result', () => {
  const project = clone(data.projects[1]);
  project.blocks = [
    { key: 'text', type: 'text', translations: { ko: { heading: '텍스트', body: '본문' }, en: { heading: 'Text block', body: 'Text body' } } },
    { key: 'list', type: 'list', translations: { ko: { heading: '목록', items: ['하나', '둘'] }, en: { heading: 'List block', items: ['One', 'Two'] } } },
    { key: 'system', type: 'system', translations: { ko: { heading: '시스템', body: '흐름' }, en: { heading: 'System block', body: 'System flow' } } },
    { key: 'evidence', type: 'evidence', translations: { ko: { heading: '근거', body: '증거' }, en: { heading: 'Evidence block', body: 'Evidence body' } } },
    { key: 'limit', type: 'limitation', translations: { ko: { heading: '한계', body: '경계' }, en: { heading: 'Limit block', body: 'Limit body' } } }
  ];
  const candidate = clone(data);
  candidate.projects[1] = project;
  const html = render.caseStudyHtml(candidate, project.slug, '../../../', true, 'en');
  assertInOrder(html, ['td-case__header', 'td-case__thesis', 'td-fact-ledger', 'td-evidence-frame', 'td-case__blocks', 'td-team-result', 'td-evidence-limits', 'td-pdf-cta', 'td-case-contact'], 'case sequence');
  for (const type of ['text', 'list', 'system', 'evidence', 'limitation']) assert.match(html, new RegExp(`data-block-type="${type}"`));
  assert.match(html, /<ul>[\s\S]*<li>One<\/li>[\s\S]*<li>Two<\/li>/);
  assert.match(html, /Personal role[\s\S]*Team result/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/pdfs\/mandibular-fracture-en\.pdf"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/contact\/index\.html"/);
  assert.doesNotMatch(html, /Decision Timeline|decision-step/);
});

test('Task 3 all twelve case shells share one fetch-free, localized renderer contract', () => {
  for (const locale of ['ko', 'en']) {
    for (const project of data.projects) {
      const file = `${locale === 'en' ? 'en/' : ''}projects/${project.slug}/index.html`;
      assert.equal(fs.existsSync(path.join(root, file)), true, `${file}: missing shell`);
      const html = read(file);
      const copy = project.translations[locale];
      assert.match(html, new RegExp(`<html lang="${locale}">`));
      assert.match(html, new RegExp(`data-project="${project.slug}"`));
      assert.match(html, new RegExp(`data-lang="${locale}"`));
      assert.match(html, /data-portfolio="case-study"/);
      assert.match(html, new RegExp(copy.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(html, new RegExp(copy.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(html, new RegExp(`${project.slug}-${locale}\\.pdf`));
      assertInOrder(html, ['site-i18n.js', 'portfolio-data.js', 'portfolio-render.js', 'nav.js'], `${file}: script order`);
      assert.doesNotMatch(html, /fetch\s*\(|fontawesome|bootstrap(?:\.bundle)?\.min\.js|spatial-signal\.js|carousel/i);
    }
  }
});

test('Task 3 mountAll is safe, idempotent, and ignores invalid case mounts', () => {
  const home = { innerHTML: '', getAttribute: () => '' };
  const capabilities = { innerHTML: '', getAttribute: () => '' };
  const projects = { innerHTML: '', getAttribute: () => '' };
  const validCase = { innerHTML: '', getAttribute: (name) => name === 'data-project' ? 'rtms-navigation' : '' };
  const invalidCase = { innerHTML: 'fallback remains', getAttribute: () => 'missing-project' };
  const fakeDocument = {
    body: { getAttribute: (name) => ({ 'data-base': '../../', 'data-lang': 'en' }[name] || '') },
    location: { protocol: 'file:' },
    querySelectorAll(selector) {
      return ({
        '[data-portfolio="home-projects"]': [home],
        '[data-portfolio="capability-index"]': [capabilities],
        '[data-portfolio="project-groups"]': [projects],
        '[data-portfolio="case-study"]': [validCase, invalidCase]
      })[selector] || [];
    }
  };
  assert.doesNotThrow(() => render.mountAll(fakeDocument, data));
  const once = [home.innerHTML, capabilities.innerHTML, projects.innerHTML, validCase.innerHTML];
  assert.doesNotThrow(() => render.mountAll(fakeDocument, data));
  assert.deepEqual([home.innerHTML, capabilities.innerHTML, projects.innerHTML, validCase.innerHTML], once);
  assert.equal(invalidCase.innerHTML, 'fallback remains');
  assert.doesNotThrow(() => render.mountAll({ body: null, querySelectorAll: () => [] }, null));
});

test('Task 3 rebuilt pages exclude obsolete scripts and retain HTTP/file-safe metadata', () => {
  const files = ['index.html', 'projects/index.html', 'contact/index.html', 'en/index.html', 'en/projects/index.html', 'en/contact/index.html']
    .concat(slugs.flatMap((slug) => [`projects/${slug}/index.html`, `en/projects/${slug}/index.html`]));
  for (const file of files) {
    const html = read(file);
    assert.match(html, /<main id="main-content"/);
    assert.match(html, /<header id="site-nav"><\/header>/);
    assert.match(html, /<footer id="site-footer"><\/footer>/);
    assert.doesNotMatch(html, /fontawesome|use\.fontawesome|bootstrap(?:\.bundle)?\.min\.js|spatial-signal\.js|data-ss-evidence-strip|carousel/i, file);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      assert.equal(href.endsWith('/'), false, `${file}: directory fallback must end in index.html: ${href}`);
    }
  }
});

test('Task 3 Contact asks joint-development partners for problem, data or sensors, validation, and schedule', () => {
  const pages = [
    ['contact/index.html', [/공동개발/, /문제/, /데이터|센서/, /검증/, /일정/]],
    ['en/contact/index.html', [/joint development/i, /problem/i, /data|sensors/i, /validation/i, /schedule/i]]
  ];
  for (const [file, patterns] of pages) {
    const html = read(file);
    for (const pattern of patterns) assert.match(html, pattern, `${file}: ${pattern}`);
    assert.match(html, /mailto:uiop3847@naver\.com/);
    assert.match(html, /https:\/\/github\.com\/rafaam11/);
    assert.doesNotMatch(html, /<form\b|LinkedIn|response time|consultation|시니어 R&amp;D|채용/i);
  }
});

test('Task 3 technical-document CSS exposes the instrument palette, grid, provenance, focus, and reduced motion', () => {
  const css = [read('css/site.css'), read('css/case-study.css'), read('css/spatial-signal.css')].join('\n');
  for (const value of ['#eef1ef', '#fbfcfb', '#101715', '#586560', '#b9c4c0', '#0c6b5e', '#a94b32']) assert.match(css, new RegExp(value, 'i'));
  assert.match(css, /--td-max:\s*1240px/);
  assert.match(css, /repeat\(12,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.td-media-ledger/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const technical = css.match(/\/\* Task 3 technical-document system \*\/[\s\S]*?\/\* Task 3 technical-document system end \*\//)?.[0] || '';
  assert.doesNotMatch(technical, /gradient|box-shadow/i);
});

test('full validator scans live SVGs and passes the twenty-page public contract', () => {
  assert.deepEqual(validator.validatePortfolio(root), []);
  const live = validator.publicPortfolioVisualFiles(root);
  assert.ok(live.some((item) => item.relativePath.replace(/\\/g, '/') === 'assets/diagrams/decision-signal.svg'));

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-svg-'));
  try {
    for (const file of canonicalPages()) {
      const target = path.join(temporaryRoot, file.relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file.absolutePath, target);
    }
    for (const file of live) {
      const target = path.join(temporaryRoot, file.relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file.absolutePath, target);
    }
    const targetSvg = path.join(temporaryRoot, 'assets', 'diagrams', 'decision-signal.svg');
    fs.appendFileSync(targetSvg, '<text>Samsung Medical</text>');
    assert.ok(validator.validatePortfolio(temporaryRoot).some((error) => /decision-signal\.svg.*nonpublic partner.*Samsung Medical/i.test(error.replace(/\\/g, '/'))));
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('published localized pages never rewrite parent traversal into external URLs', () => {
  for (const file of canonicalPages().filter((item) => fs.existsSync(item.absolutePath))) {
    assert.doesNotMatch(fs.readFileSync(file.absolutePath, 'utf8'), /https?:\/\/[^"\s]*\/\.\.\//, file.relativePath);
  }
});
