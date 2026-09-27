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
  assert.ok(h2.some((body) => /font-size:\s*1\.6rem/.test(body) && /margin-top:\s*4rem/.test(body)), 'h2 1.6rem with 4rem margin');
  assert.ok(h2.every((body) => !/border-bottom/.test(body)), 'h2 carries no under-rule');
  assert.ok(ruleBodies(css, '.td-shell h3').some((body) => /font-size:\s*1\.2rem/.test(body)), 'h3 1.2rem');
  assert.ok(ruleBodies(css, '.td-shell .sc-group__title').length, 'tier heading correction outranks .td-shell h2');
  assert.ok(ruleBodies(css, '.sc-intro__topics').length, 'topics line style exists');
  assert.ok(ruleBodies(css, '.sc-intro__lede').some((body) => /font-size:\s*1\.25rem/.test(body) && /max-width:\s*34em/.test(body)), 'lede 1.25rem/34em');
  assert.ok(ruleBodies(css, '.sc-project').some((body) => /grid-template-columns:\s*240px 1fr/.test(body)), 'project thumb column 240px');
  assert.ok(ruleBodies(css, '.sc-project__summary').some((body) => /max-width:\s*60ch/.test(body)), 'summary measure 60ch');
  const narrow = atRuleBody(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(narrow, /\.td-shell h1\s*\{[^}]*font-size:\s*1\.7rem/);
  assert.match(narrow, /\.td-shell h2\s*\{[^}]*font-size:\s*1\.4rem/);
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
