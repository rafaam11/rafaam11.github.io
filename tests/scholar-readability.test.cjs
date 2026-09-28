// Scholar v2 readability contracts (2026-09-28): type scale, meta tone, quiet secondary links.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function ruleBodies(css, selector) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/(?:^|})\s*([^@}{][^{]+)\{([^{}]*)\}/gm)]
    .filter((match) => match[1].split(',').some((candidate) => candidate.trim() === selector))
    .map((match) => match[2]);
}

function atRuleBody(css, atRule) {
  const index = css.search(atRule);
  if (index === -1) return '';
  const open = css.indexOf('{', index);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') { depth -= 1; if (depth === 0) return css.slice(open + 1, i); }
  }
  return '';
}

test('Scholar v2 declares faint and meta tokens and a larger heading scale', () => {
  const css = read('css/scholar.css');
  assert.match(css, /--sc-faint:\s*#6b7280/);
  assert.match(css, /--sc-meta:\s*\.9rem/);
  assert.ok(ruleBodies(css, '.td-shell h1').some((body) => /font-size:\s*2\.25rem/.test(body) && /line-height:\s*1\.2/.test(body)), 'h1 2.25rem/1.2');
  const h2 = ruleBodies(css, '.td-shell h2');
  assert.match(css, /--sc-h2:\s*1\.6rem/);
  assert.match(css, /--sc-h2-gap:\s*4rem/);
  assert.ok(h2.some((body) => /font-size:\s*var\(--sc-h2\)/.test(body) && /margin-top:\s*var\(--sc-h2-gap\)/.test(body)), 'h2 reads its size and rhythm from tokens so component h2 rules win at every width');
  assert.ok(h2.every((body) => !/border-bottom/.test(body)), 'h2 carries no under-rule');
  assert.ok(ruleBodies(css, '.td-shell h3').some((body) => /font-size:\s*1\.2rem/.test(body)), 'h3 1.2rem');
  assert.ok(ruleBodies(css, '.td-shell .sc-group__title').length, 'tier heading correction outranks .td-shell h2');
  assert.ok(ruleBodies(css, '.sc-intro__lede').some((body) => /font-size:\s*1\.25rem/.test(body) && /max-width:\s*34em/.test(body)), 'lede 1.25rem/34em');
  assert.ok(ruleBodies(css, '.sc-project').some((body) => /grid-template-columns:\s*240px 1fr/.test(body)), 'project thumb column 240px');
  assert.ok(ruleBodies(css, '.sc-project__summary').some((body) => /max-width:\s*60ch/.test(body)), 'summary measure 60ch');
  const narrow = atRuleBody(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(narrow, /\.td-shell h1\s*\{[^}]*font-size:\s*1\.7rem/);
  assert.doesNotMatch(narrow, /\.td-shell h2\s*\{/, 'no global h2 override inside the 700px query (it would outrank component h2 rules)');
  assert.match(narrow, /:root\s*\{[^}]*--sc-h2:\s*1\.4rem/);
  assert.match(narrow, /:root\s*\{[^}]*--sc-h2-gap:\s*3rem/);
});

test('Scholar v2 gives meta text one faint tone and keeps secondary links quiet', () => {
  const css = read('css/scholar.css');
  for (const selector of ['.sc-project__meta', '.sc-case__meta', '.sc-figure figcaption', '.sc-list__venue', '.hero-kicker']) {
    assert.ok(ruleBodies(css, selector).some((body) => /var\(--sc-faint\)/.test(body)), `${selector} uses --sc-faint`);
  }
  assert.doesNotMatch(css, /#667085/, 'no hard-coded meta grey left in scholar.css');
  for (const selector of ['.sc-intro__links', '.sc-project__links', '.sc-news-links', '.sc-case__links', '.lf-links']) {
    assert.ok(ruleBodies(css, selector).some((body) => /font-size:\s*var\(--sc-meta\)/.test(body)), `${selector} is meta-sized`);
  }
  assert.match(css, /\.td-shell :is\([^)]*\.sc-project__links[^)]*\) a\s*\{[^}]*color:\s*var\(--sc-muted\)/, 'secondary link rows are muted');
  assert.match(css, /\.td-shell :is\([^)]*\.sc-project__links[^)]*\) a:hover\s*\{[^}]*color:\s*var\(--sc-link\)/, 'secondary links turn blue on hover');
  assert.ok(ruleBodies(css, '.td-shell a').some((body) => /text-decoration:\s*underline/.test(body)), 'global underline stays');
});

test('Scholar v2 aligns the local feed and CV sheets with the shared tokens', () => {
  const feed = read('css/local-feed.css');
  assert.doesNotMatch(feed, /#536679|#52606d/, 'local-feed uses --sc-faint instead of private greys');
  assert.equal(ruleBodies(feed, '.td-shell .lf-links').length, 0, 'lf-links sizing comes from scholar.css');
  assert.ok(ruleBodies(feed, '.td-shell .lf-event-content h2').some((body) => /font-size:\s*1\.2rem/.test(body)));
  assert.ok(ruleBodies(feed, '.td-shell .lf-activity .lf-media img').some((body) => /height:\s*220px/.test(body)));
  const cv = read('css/cv-pdf.css');
  assert.ok(ruleBodies(cv, '.sc-cv__meta').some((body) => /var\(--sc-faint\)/.test(body)), 'CV meta uses --sc-faint');
  assert.ok(ruleBodies(cv, '.sc-cv__intro h2').some((body) => /margin(?:-top)?:\s*0\b/.test(body)), 'CV intro heading ignores the global 4rem');
});

test('Local feed renders no review notes and mounts activities after Home News', () => {
  const feed = require('../js/local-feed.js');
  const event = { id: 'x', eventDate: '2022-01-01', links: [], media: [{ id: 'M1', type: 'image', path: 'assets/x.png', translations: { ko: { alt: 'a', caption: 'c', note: 'review note' }, en: { alt: 'a', caption: 'c', note: 'review note' } } }] };
  for (const compact of [true, false]) {
    const html = feed.mediaHtml(event, { lang: 'ko', base: '', compact });
    assert.ok(html.includes('<figcaption>c</figcaption>'), 'caption only');
    assert.ok(!html.includes('lf-review-note') && !html.includes('review note'), 'no review note');
  }
  const source = read('js/local-feed.js');
  assert.ok(source.includes('[aria-labelledby="news-title"]'), 'home anchor is the News section');
  assert.ok(!source.includes('highlights-title'), 'no stale anchor');
  assert.ok(!read('css/local-feed.css').includes('lf-review-note'), 'no orphan review-note style');
});

test('Home keeps the capability list between the intro and selected research; Projects does not repeat it', () => {
  for (const file of ['index.html', 'en/index.html']) {
    const html = read(file);
    const marks = ['class="sc-intro"', 'id="implementation-title"', '<dl class="sc-capabilities">', 'data-portfolio="home-projects"'];
    const positions = marks.map((mark) => html.indexOf(mark));
    assert.ok(positions.every((pos, i) => pos !== -1 && (i === 0 || pos > positions[i - 1])), `${file}: ${JSON.stringify(positions)}`);
    assert.equal(html.split('<div><dt>').length - 1, require('../js/portfolio-data.js').capabilities.length, `${file}: one row per capability`);
  }
  for (const file of ['projects/index.html', 'en/projects/index.html']) {
    assert.ok(!read(file).includes('id="implementation-title"'), `${file}: no duplicate capability list`);
  }
});

test('Case pages render no internal review artefacts', () => {
  const projects = require('../js/local-projects.js');
  const media = { M1: { type: 'image', path: 'assets/x.png', translations: { ko: { alt: 'a', caption: 'c', note: 'review note' }, en: { alt: 'a', caption: 'c', note: 'review note' } } } };
  const html = projects.figure('M1', 'ko', '', media);
  assert.ok(html.includes('<figcaption><p>c</p></figcaption>'), 'caption only');
  assert.ok(!html.includes('pf-review-note') && !html.includes('review note'), 'no review note');
  const source = read('js/local-projects.js');
  for (const marker of ['pf-gap', 'early-ar', 'const gaps', 'M162', 'M159']) assert.ok(!source.includes(marker), `no ${marker} in local-projects.js`);
  const css = read('css/local-projects.css');
  assert.ok(!css.includes('pf-gap') && !css.includes('pf-review-note'), 'no orphan review styles');
});
