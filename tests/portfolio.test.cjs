const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dataModulePath = path.join(root, 'js', 'portfolio-data.js');
const renderModulePath = path.join(root, 'js', 'portfolio-render.js');
const validatorPath = path.join(root, 'scripts', 'validate-portfolio.cjs');

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
  assert.doesNotMatch(serialized, /\b(?:30|90|95|100)\s*%/);
  assert.doesNotMatch(serialized, /Digitrack|DIGITRACK|삼성서울병원|Samsung Medical|KERI|KAERI|HD현대|Hyundai|계명대|동산병원/i);
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
  assert.match(atlas, /3D Registration &amp; Navigation/);
  assert.doesNotMatch(chapters, /Featured|More Projects/);
  assert.match(chapters, /href="unmanned-forklift\//);
});

test('mountAll fills supported portfolio mount points', () => {
  const atlasNode = { innerHTML: '' };
  const chaptersNode = { innerHTML: '' };
  const fakeDocument = {
    querySelectorAll(selector) {
      if (selector === '[data-portfolio="capability-atlas"]') return [atlasNode];
      if (selector === '[data-portfolio="project-chapters"]') return [chaptersNode];
      return [];
    },
    body: { getAttribute: () => '' }
  };

  render.mountAll(fakeDocument, data);

  assert.match(atlasNode.innerHTML, /capability-card/);
  assert.match(chaptersNode.innerHTML, /project-card/);
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
});

test('Home implements the Pure Capability Atlas hierarchy', () => {
  const html = read('index.html');
  assert.match(html, /data-portfolio="capability-atlas"/);
  assert.match(html, /I turn uncertain 3D spatial problems into systems teams can test, trust, and extend\./);
  assert.match(html, /3–4 months → 1–2 weeks/);
  assert.match(html, /Weekly → monthly/);
  assert.match(html, /4–5 micro-PoCs/);
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
  assert.match(html, /What I solve/);
  assert.match(html, /How I validate/);
});

test('site stylesheet defines the approved atlas and chapter components', () => {
  const css = read('css/site.css');
  for (const className of ['.hero-kicker', '.hero-statement', '.capability-atlas', '.capability-card', '.impact-strip', '.work-principles', '.project-chapter', '.project-grid', '.project-card']) {
    assert.match(css, new RegExp(className.replace('.', '\\.')));
  }
});

test('CV frames current experience as owned decisions and evidenced change', () => {
  const html = read('cv/index.html');
  assert.match(html, /Hands-on technical-lead IC/);
  assert.match(html, />Owned</);
  assert.match(html, />Changed</);
  assert.match(html, />Evidence</);
  assert.match(html, /3–4 months → 1–2 weeks/);
  assert.match(html, /Weekly → monthly/);
  assert.doesNotMatch(html, /기여도\s*\d+\s*%/);
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
    assert.doesNotMatch(html, /기여도\s*\d+\s*%/, `${project.slug}: contains contribution percentage`);
  }
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
