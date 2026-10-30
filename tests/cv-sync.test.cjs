const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { publicCvDataErrors, cvPdfErrors } = require('../scripts/validate-portfolio.cjs');
const root = path.resolve(__dirname, '..');
const cv = () => JSON.parse(fs.readFileSync(path.join(root, 'data/public-cv.json'), 'utf8'));
test('CV rejects CBCT terminology and changed patent state', () => {
  const changed = cv();
  changed.experience[0].areas[0].translations.en.items.push('4D CBCT registration');
  assert.match(publicCvDataErrors(changed).join('\n'), /4D CT/);
  const patent = cv();
  patent.patents.find(p => p.number === '10-2015-0122661').status = 'granted';
  assert.match(publicCvDataErrors(patent).join('\n'), /patent.*PDF/i);
});
test('CV source PDF hashes identify the reviewed editions', () => {
  const value = cv();
  assert.match(value.sourcePdfs?.ko?.sha256 || '', /^[a-f0-9]{64}$/);
  assert.deepEqual(cvPdfErrors(root), []);
  const os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-sync-'));
  try {
    fs.mkdirSync(path.join(temp, 'data'));
    fs.cpSync(path.join(root, 'assets/cv'), path.join(temp, 'assets/cv'), {recursive: true});
    fs.writeFileSync(path.join(temp, 'data/public-cv.json'), JSON.stringify(value));
    fs.appendFileSync(path.join(temp, 'assets/cv/jinmin-kim-cv-en.pdf'), '\n% changed edition');
    assert.match(cvPdfErrors(temp).join('\n'), /synchronization review/i);
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});
test('CV rejects duplicate patents and encoding damage, and localizes Korean headings', () => {
  const duplicate = cv();
  duplicate.patents[6] = structuredClone(duplicate.patents[5]);
  assert.match(publicCvDataErrors(duplicate).join('\n'), /patent inventory/);
  const damaged = cv();
  damaged.identity.translations.ko.summary = '????';
  assert.match(publicCvDataErrors(damaged).join('\n'), /encoding/);
  const html = require('../scripts/public-cv-summary.cjs').renderPublicCvSummary(cv(), 'ko').html;
  assert.match(html, /금오공과대학교/);
  assert.match(html, /2023\.02 - 현재/);
  assert.doesNotMatch(html, /\?{2,}|\ufffd/);
});
test('PDF comparison binds a publication year to its own bibliography entry', () => {
  const temp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cv-year-'));
  try {
    fs.mkdirSync(path.join(temp, 'data'));
    fs.cpSync(path.join(root, 'assets/cv'), path.join(temp, 'assets/cv'), {recursive: true});
    const changed = cv();
    changed.publications[1].year = '2022';
    fs.writeFileSync(path.join(temp, 'data/public-cv.json'), JSON.stringify(changed));
    const result = require('node:child_process').spawnSync('python', [path.join(root, 'scripts/check-cv-pdf-sync.py'), '--root', temp], {encoding: 'utf8'});
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /publication 2 title\/year differs/);
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});
test('CV positioning fields: interests, JIIM authors, and case links', () => {
  const value = cv();
  assert.deepEqual(publicCvDataErrors(value), []);
  assert.deepEqual(value.interests.en, ['Surgical Robotics', 'Physical AI', 'Surgical AI', '3D Vision', 'Robot Perception', 'Multimodal Perception', 'Spatial Intelligence']);
  assert.equal(value.interests.ko.length, 7);
  const jiim = value.publications.find((entry) => /s10278-024-01014-z/.test(entry.href || ''));
  assert.deepEqual(jiim.authors, ['Jinmin Kim', 'Deokgi Jeung', 'Ranyeong Cho', 'Byoungeun Yang', 'Jaesung Hong']);
  assert.equal(value.publications.filter((entry) => entry.authors).length, 1);
  const slugs = Object.fromEntries(value.publications.map((entry) => [entry.translations.en.title.slice(0, 24), entry.projectSlug]));
  assert.equal(Object.values(slugs).filter(Boolean).length, 6);
  for (const locale of ['ko', 'en']) {
    const html = require('../scripts/public-cv-summary.cjs').renderPublicCvSummary(value, locale).html;
    assert.equal((html.match(/class="sc-cv__authors"/g) || []).length, 1);
    assert.match(html, /<strong>Jinmin Kim<\/strong>, Deokgi Jeung/);
    assert.equal((html.match(/class="sc-cv__case" href="\.\.\/projects\/(?:mandibular-fracture|life-careverse|digital-occlusion-workflow)\/index\.html"/g) || []).length, 6);
  }
  const stray = cv();
  stray.publications[0].authors = ['Someone Else'];
  assert.match(publicCvDataErrors(stray).join('\n'), /authors/);
  const badSlug = cv();
  badSlug.publications[0].projectSlug = 'not-a-case';
  assert.match(publicCvDataErrors(badSlug).join('\n'), /projectSlug/);
  const badInterests = cv();
  badInterests.interests.ko = [];
  assert.match(publicCvDataErrors(badInterests).join('\n'), /interests/);
});
// Dense CV (2026-10-31): web-only project rows, keywords and identity brief; items stay for the PDF review.
const summary = () => require('../scripts/public-cv-summary.cjs');
const area = (html, index) => html.split('<div class="sc-cv__area">')[index + 1].split('</div>')[0];
test('CV experience areas with rows render a project table with case links instead of items', () => {
  const value = cv();
  for (const locale of ['ko', 'en']) {
    const html = summary().renderPublicCvSummary(value, locale).html;
    const header = locale === 'ko' ? ['프로젝트', '기간', '한 일', '결과'] : ['Project', 'Period', 'What I did', 'Result'];
    value.experience[0].areas.forEach((record, index) => {
      const copy = record.translations[locale];
      const block = area(html, index);
      assert.ok(copy.rows.length && copy.items.length, `${locale} area ${index + 1}: rows for the web, items for the PDF`);
      assert.match(block, new RegExp(`<table class="sc-cv__projects">\\s*<thead>\\s*<tr>${header.map((cell) => `<th scope="col">${cell}</th>`).join('')}</tr>`));
      assert.equal((block.match(/<tr><th scope="row">/g) || []).length, copy.rows.length);
      for (const item of copy.items) assert.ok(!block.includes(summary().htmlEscape(item)), `${locale} area ${index + 1}: item not rendered`);
      for (const row of copy.rows) {
        const project = summary().htmlEscape(row.project);
        if (row.slug) assert.ok(block.includes(`<th scope="row"><a href="../projects/${row.slug}/index.html">${project}</a></th>`), `${locale}: ${row.project} links to its case`);
        else assert.ok(block.includes(`<th scope="row">${project}</th>`), `${locale}: ${row.project} has no link`);
        assert.ok(block.includes(`data-label="${header[2]}">${row.did.map(summary().htmlEscape).join(' · ')}</td>`), `${locale}: ${row.project} did line`);
        assert.ok(block.includes(`<td class="sc-cv__period" data-label="${header[1]}">${row.period || '—'}</td>`), `${locale}: ${row.project} period`);
      }
      const tags = (block.match(/<li class="sc-tag">/g) || []).length;
      assert.equal(tags, (copy.keywords || []).length, `${locale} area ${index + 1}: one tag per keyword`);
      if (copy.keywords) assert.ok(block.indexOf('class="sc-tags"') < block.indexOf('<table'), 'keywords precede the table');
    });
  }
  const legacy = cv();
  delete legacy.experience[0].areas[0].translations.ko.rows;
  const html = summary().renderPublicCvSummary(legacy, 'ko').html;
  assert.match(area(html, 0), /<ul>\s*<li>/, 'an area without rows keeps its item list');
  assert.doesNotMatch(area(html, 0), /sc-cv__projects/);
});
test('CV identity brief replaces the summary on the web and research direction stays a separate line', () => {
  const value = cv();
  for (const locale of ['ko', 'en']) {
    const copy = value.identity.translations[locale];
    assert.ok(copy.brief.length >= 1 && copy.brief.length <= 2);
    const html = summary().renderPublicCvSummary(value, locale).html;
    assert.ok(html.includes(`<p class="sc-cv__summary sc-cv__brief">${copy.brief.map(summary().htmlEscape).join('<br>')}</p>`));
    assert.ok(!html.includes(summary().htmlEscape(copy.summary)), `${locale}: summary prose is not rendered`);
    assert.ok(html.includes(`<p class="sc-cv__direction"><strong>${locale === 'ko' ? '연구 방향' : 'Research direction'}</strong> ${value.interests[locale].map(summary().htmlEscape).join(' · ')}</p>`));
    for (const term of value.interests[locale]) assert.ok(!copy.brief.join(' ').includes(term), `${locale}: research direction stays out of the brief`);
    const intro = html.slice(0, html.indexOf('</header>'));
    assert.doesNotMatch(intro, /sc-tag/, 'research direction is not rendered as tags');
  }
  const legacy = cv();
  delete legacy.identity.translations.en.brief;
  const html = summary().renderPublicCvSummary(legacy, 'en').html;
  assert.ok(html.includes(`<p class="sc-cv__summary">${summary().htmlEscape(legacy.identity.translations.en.summary)}</p>`));
  assert.doesNotMatch(html, /sc-cv__direction/);
});
test('CV skills and languages render as tags inside the definition list', () => {
  const value = cv();
  const html = summary().renderPublicCvSummary(value, 'en').html;
  assert.match(html, /<dl class="sc-cv__skills">/);
  assert.ok(html.includes('<dd><ul class="sc-tags"><li class="sc-tag">Zenoh</li><li class="sc-tag">behaviour trees (BehaviorTree.CPP)</li><li class="sc-tag">Isaac Sim</li>'));
  assert.ok(html.includes('<li class="sc-tag">Japanese - JLPT N2 (2021)</li>'));
  const ko = summary().renderPublicCvSummary(value, 'ko').html;
  assert.ok(ko.includes('<li class="sc-tag">세그멘테이션(SAM 계열)</li>'));
});
test('Web-only CV fields stay out of the PDF source and are validated', () => {
  const { pdfCv } = require('../scripts/portfolio-pdf-source.cjs');
  const { publicCvDataErrors } = require('../scripts/validate-portfolio.cjs');
  const value = cv();
  const stripped = pdfCv(value);
  assert.equal(JSON.stringify(stripped).includes('"rows"') || JSON.stringify(stripped).includes('"keywords"') || JSON.stringify(stripped).includes('"brief"'), false);
  const legacy = cv();
  for (const record of legacy.experience[0].areas) for (const locale of ['ko', 'en']) { delete record.translations[locale].rows; delete record.translations[locale].keywords; }
  for (const locale of ['ko', 'en']) delete legacy.identity.translations[locale].brief;
  assert.equal(JSON.stringify(stripped), JSON.stringify(legacy), 'PDF source equals the CV without web-only fields');
  const cases = [
    [(c) => { c.experience[0].areas[1].translations.ko.rows[0].slug = 'not-a-case'; }, /slug must name a public case/],
    [(c) => { c.experience[0].areas[1].translations.en.rows[0].did.push('x'.repeat(71)); }, /web budget/],
    [(c) => { c.experience[0].areas[1].translations.ko.rows[0].result = '병원에서 사용 중입니다'; }, /noun phrase/],
    [(c) => { c.experience[0].areas[1].translations.ko.rows[0].period = '2023년'; }, /period/],
    [(c) => { delete c.experience[0].areas[2].translations.en.rows; }, /keywords require project rows/],
    [(c) => { c.experience[0].areas[0].translations.ko.rows[0].owner = 'x'; }, /unexpected field owner/],
    [(c) => { c.identity.translations.ko.brief.push('세 번째 줄'); }, /one or two lines/],
    [(c) => { c.identity.translations.ko.brief[0] = '가'.repeat(71); }, /brief line exceeds/]
  ];
  for (const [mutate, pattern] of cases) {
    const candidate = cv();
    mutate(candidate);
    assert.match(publicCvDataErrors(candidate).join('\n'), pattern);
  }
});
test('CV PDF synchronization check still passes with the web-only fields', () => {
  const result = require('node:child_process').spawnSync('python', [path.join(root, 'scripts/check-cv-pdf-sync.py')], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /CV PDF selected facts match/);
});
