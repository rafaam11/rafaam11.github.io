const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dataModulePath = path.join(root, 'js', 'portfolio-data.js');
const renderModulePath = path.join(root, 'js', 'portfolio-render.js');
const validatorPath = path.join(root, 'scripts', 'validate-portfolio.cjs');
const contributionPercentagePattern = /(?:(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당)[\s\S]{0,80}\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*%[\s\S]{0,80}(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당))/i;

test('portfolio data and renderer modules exist', () => {
  assert.equal(fs.existsSync(dataModulePath), true, 'missing js/portfolio-data.js');
  assert.equal(fs.existsSync(renderModulePath), true, 'missing js/portfolio-render.js');
  assert.equal(fs.existsSync(validatorPath), true, 'missing scripts/validate-portfolio.cjs');
});

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');

test('canonical data contains five capabilities and twelve projects', () => {
  assert.equal(data.capabilities.length, 5);
  assert.equal(data.impactMetrics.length, 3);
  assert.equal(data.projects.length, 12);
  assert.equal(new Set(data.projects.map((project) => project.slug)).size, 12);
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
});

test('policy rejects arbitrary contribution percentages but permits evidence rates', () => {
  const attributed = JSON.parse(JSON.stringify(data));
  attributed.projects[0].ownedRole += ' Contribution 47%.';
  assert.match(render.validatePortfolioData(attributed).join(' '), /contribution percentage/i);

  const measured = JSON.parse(JSON.stringify(data));
  measured.projects[0].verifiedEvidence += ' Measured pass rate 87%.';
  assert.doesNotMatch(render.validatePortfolioData(measured).join(' '), /contribution percentage/i);
});

test('data validator accepts the canonical portfolio', () => {
  assert.deepEqual(render.validatePortfolioData(data), []);
});

test('renderers produce the five-card atlas and twelve-card capability chapters', () => {
  const atlas = render.capabilityAtlasHtml(data, '');
  const chapters = render.projectChaptersHtml(data, '../');

  assert.equal((atlas.match(/class="capability-card/g) || []).length, 5);
  assert.equal((chapters.match(/class="project-chapter/g) || []).length, 5);
  assert.equal((chapters.match(/class="project-card/g) || []).length, 12);
  assert.equal((render.capabilityDetailsHtml(data, '../').match(/class="capability-detail"/g) || []).length, 5);
  assert.match(atlas, /3D Registration &amp; Navigation/);
  assert.doesNotMatch(chapters, /Featured|More Projects/);
  assert.match(chapters, /href="unmanned-forklift\//);
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
    body: { getAttribute: () => '' }
  };

  render.mountAll(fakeDocument, data);

  assert.match(atlasNode.innerHTML, /capability-card/);
  assert.match(chaptersNode.innerHTML, /project-card/);
  assert.match(detailsNode.innerHTML, /What I solve/);
});

test('mountAll skips a malformed project while preserving valid content', () => {
  const malformed = JSON.parse(JSON.stringify(data));
  delete malformed.projects[0].ownedRole;
  const chaptersNode = { innerHTML: '' };
  const fakeDocument = {
    querySelectorAll(selector) { return selector === '[data-portfolio="project-chapters"]' ? [chaptersNode] : []; },
    body: { getAttribute: () => '' },
    location: { protocol: 'https:' }
  };
  const originalWarn = console.warn;
  console.warn = () => {};
  try { render.mountAll(fakeDocument, malformed); } finally { console.warn = originalWarn; }
  assert.equal((chaptersNode.innerHTML.match(/class="project-card/g) || []).length, 11);
  assert.doesNotMatch(chaptersNode.innerHTML, /portfolio-error/);
});

test('renderers create explicit index pages for file protocol', () => {
  assert.match(render.capabilityAtlasHtml(data, '', true), /projects\/surgical-twin\/index\.html/);
  assert.match(render.projectChaptersHtml(data, '', true), /href="surgical-twin\/index\.html"/);
  assert.match(render.capabilityDetailsHtml(data, '../', true), /\.\.\/projects\/surgical-twin\/index\.html/);
});

test('authored local directory links have explicit file protocol fallbacks', () => {
  const files = ['index.html', 'projects/index.html', 'research/index.html', 'contact/index.html']
    .concat(data.projects.map((project) => `projects/${project.slug}/index.html`));
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

test('navigation leads with Projects and Capabilities', () => {
  const nav = read('js/nav.js');
  const projectsIndex = nav.indexOf("label: 'Projects'");
  const capabilitiesIndex = nav.indexOf("label: 'Capabilities'");
  const cvIndex = nav.indexOf("label: 'CV'");
  const contactIndex = nav.indexOf("label: 'Contact'");

  assert.equal(projectsIndex >= 0, true);
  assert.equal(projectsIndex < capabilitiesIndex, true);
  assert.equal(capabilitiesIndex < cvIndex, true);
  assert.equal(cvIndex < contactIndex, true);
  assert.match(nav, /3D Spatial Computing · Research Engineer/);
  assert.match(nav, /window\.location\.protocol === 'file:'/);
  assert.match(nav, /isFile \? 'index\.html' : ''/);
  assert.match(nav, /replace\(\/index\\\.html\$\//);
  assert.match(nav, /aria-current="page"/);
});

test('Home implements the Pure Capability Atlas hierarchy', () => {
  const html = read('index.html');
  assert.match(html, /data-portfolio="capability-atlas"/);
  assert.match(html, /I turn uncertain 3D spatial problems into systems teams can test, trust, and extend\./);
  assert.match(html, /3–4 months → 1–2 weeks/);
  assert.match(html, /weekly → monthly/i);
  assert.match(html, /4–5 micro-PoCs/);
  assert.match(html, /profile_square\.webp/);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'img', 'profile_square.webp')), true);
  assert.equal(html.indexOf('data-portfolio="capability-atlas"') < html.indexOf('Proven Impact'), true);
  assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true);
});

test('Projects uses capability chapters without Featured hierarchy', () => {
  const html = read('projects/index.html');
  assert.match(html, /data-portfolio="project-chapters"/);
  assert.doesNotMatch(html, />Featured</);
  assert.doesNotMatch(html, />More Projects</);
  assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true);
});

test('Research route is presented as Capabilities', () => {
  const html = read('research/index.html');
  assert.match(html, /data-page="capabilities"/);
  assert.match(html, /<title>Capabilities · Jinmin Kim<\/title>/);
  assert.match(html, /data-portfolio="capability-details"/);
  assert.match(html, /What I solve/);
  assert.match(html, /How I validate/);
  assert.equal(html.indexOf('portfolio-data.js') < html.indexOf('portfolio-render.js'), true);
});

test('site stylesheet defines the approved atlas and chapter components', () => {
  const css = read('css/site.css');
  for (const className of ['.hero-kicker', '.hero-statement', '.capability-atlas', '.capability-card', '.impact-strip', '.work-principles', '.project-chapter', '.project-grid', '.project-card']) {
    assert.match(css, new RegExp(className.replace('.', '\\.')));
  }
  assert.match(css, /:focus-visible/);
});

test('CV frames current experience as owned decisions and evidenced change', () => {
  const html = read('cv/index.html');
  assert.match(html, /Hands-on technical-lead IC/);
  assert.match(html, />Owned</);
  assert.match(html, />Changed</);
  assert.match(html, />Evidence</);
  assert.match(html, /3–4 months → 1–2 weeks/);
  assert.match(html, /weekly → monthly/i);
  assert.doesNotMatch(html, /\b\d{1,3}(?:\.\d+)?\s*%/);
});

test('Contact speaks to senior R&D hiring without overpromising', () => {
  const html = read('contact/index.html');
  assert.match(html, /senior R&amp;D teams/i);
  assert.match(html, /hands-on technical-lead IC/i);
  assert.doesNotMatch(html, /end-to-end/i);
  assert.doesNotMatch(html, /1–2일/);
  assert.doesNotMatch(html, /within (?:one|two|1|2) business days/i);
});

test('all project details use the Decision Timeline attribution contract', () => {
  const requiredLabels = ['Uncertainty', 'Probe', 'Evidence', 'Decision', 'Integration', 'Verified Outcome', 'My Decisions', 'Team Result', 'Current Status'];
  for (const project of data.projects) {
    const html = read(`projects/${project.slug}/index.html`);
    for (const label of requiredLabels) assert.match(html, new RegExp(label), `${project.slug}: missing ${label}`);
    assert.match(html, /class="decision-timeline"/, `${project.slug}: missing decision timeline`);
    assert.match(html, new RegExp(project.period.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${project.slug}: period differs from canonical data`);
    assert.doesNotMatch(html, contributionPercentagePattern, `${project.slug}: contains contribution percentage`);
  }
});

test('thin case studies stay within their canonical ownership boundaries', () => {
  const distance = read('projects/ar-distance-meter/index.html');
  assert.match(distance, /Vuforia/);
  assert.match(distance, /marker/i);
  assert.doesNotMatch(distance, /AR Foundation|Plane Tracking|plane tracking/);

  const cArm = read('projects/c-arm-navigation/index.html');
  assert.match(cArm, /bounded|partial/i);
  assert.match(cArm, /assigned (?:portion|subset|contribution|functionality)/i);

  const twin = read('projects/radioactive-digital-twin/index.html');
  assert.match(twin, /initial Isaac Sim environment/i);
  assert.match(twin, /hand(?:ed )?off|handoff/i);
  assert.match(twin, /Robot integration, route rehearsal, field validation, and safety claims are explicitly outside this case/i);

  const orthognathic = read('projects/orthognathic-ar/index.html');
  assert.match(orthognathic, /HoloLens/);
  assert.match(orthognathic, /partial research contribution/i);

  const oralFacial = read('projects/oral-facial-ar/index.html');
  assert.match(oralFacial, /supporting AR navigation/i);
  assert.match(oralFacial, /partial early-career contribution/i);
});

test('AI-assisted case studies state the human and agent boundary', () => {
  const html = read('projects/llm-wiki/index.html');
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
