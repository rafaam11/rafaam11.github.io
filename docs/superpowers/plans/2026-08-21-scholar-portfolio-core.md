# Scholar Portfolio Core Implementation Plan (Plan ① of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Spatial Signal visual system with the researcher-style "Scholar" design, widen the naming policy to approved real names, add the gallery/highlights data contracts, and register the two new cases (8 cases, 4 groups, 24 pages, 16 PDFs) — with `node --test`, `node scripts/validate-portfolio.cjs`, and `git diff --check` green after every task.

**Architecture:** The site stays a buildless static site. `js/portfolio-data.js` remains the content SSOT; `js/portfolio-render.js` renders Home/Projects/case pages into `data-portfolio` mounts; `scripts/validate-portfolio.cjs` + `tests/portfolio.test.cjs` enforce contracts; `scripts/generate-portfolio-pdfs.py` regenerates PDFs whenever data, the evidence register, or CV data change (manifest freshness test). Work order keeps PDFs fresh: policy → contracts (no data change) → renderer → CSS/shells (+highlights data, which is outside the PDF digest) → case registration + PDF regeneration.

**Tech Stack:** Vanilla JS (UMD, ES5 style in `js/`), Node 22 `node:test`, Python 3 venv `.superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/.venv-pdf` (reportlab, pypdf, PyMuPDF, Pillow), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-21-scholar-portfolio-design.md` (reads together with the approved plan `~/.claude/plans/docs-cv-luminous-dusk.md`).

**Companion plans (written separately, executed after this one):** Plan ② media pipeline (candidate extraction outside Git, review sheet, derivative placement, register approval); Plan ③ copy refresh, CV 2026-08 regeneration, PDF typography.

## Global Constraints

- Korean at root, English under `/en/`; exactly 4 routes + 8 cases per language = **24 HTML pages**; no Research/Capabilities route.
- Slug order is identical in 5 files: `js/portfolio-data.js` projects, `js/portfolio-render.js` `projectSlugs`, `js/site-i18n.js` `canonicalCaseSlugs`, `tests/portfolio.test.cjs` `slugs`, `scripts/generate-portfolio-pdfs.py` `EXPECTED_SLUGS`.
- Approved real names: DIGITRACK/디지트랙, SKADI, SMCNavi, NeuroPilot, DOTORI, 삼성서울병원/Samsung Medical Center, 서울성모병원/Seoul St. Mary's Hospital, AT&C, KERI, ETRI, KAIST, A4LAB, programme names. Still forbidden: names of other people, budgets, document/patent numbers (`10-YYYY-NNNNNNN`), patient data, private paths, phone/address/age, contribution percentages, unverified clinical/operational claims.
- Contact/home copy never uses 박사, 진학, 이직, PhD, admission, graduate program, job change, 채용.
- Visual system tokens: background `#fff`, text `#1a1a1a`, muted `#555`, rule `#e5e5e5`, link `#1a56db`; Pretendard Variable; body 17px/1.7; max column 880px; **no** `text-transform: uppercase`, `ui-monospace`, gradients, box-shadows, decorative SVG, chips, 1px-gap grids.
- Video markup contract: `<video controls preload="none" tabindex="0" poster="…">` + `<source src="…">`, never `autoplay`.
- Approved local evidence files: images `.png`, videos `.mp4`, lower-case kebab names, below `assets/projects/<slug>/`, metadata-stripped (PNG chunks `tEXt/zTXt/iTXt/eXIf/tIME`, MP4 boxes `udta/meta/ilst/uuid` forbidden), every file registered in `assets/projects/EVIDENCE_REGISTER.md`.
- Every task ends with: `node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check` — all clean — then a commit. Never push in this plan (push = live deploy; the owner pushes after reviewing the local preview).
- Work in `C:\Users\uiop3\Desktop\3_Hobby_ws\rafaam11.github.io` on `main` (clean, ahead by the spec commit). Run node commands from the repository root.

---

### Task 1: Naming policy — allow approved institutions and products

**Files:**
- Modify: `js/portfolio-render.js:40` (`policy.prohibitedPartnerPattern`)
- Modify: `scripts/validate-portfolio.cjs:968-976` (`prohibitedPatterns` in `publicCvDataErrors`)
- Modify: `tests/portfolio.test.cjs:967-978`, `:382-408` (register prose regex), `:1633-1648` (CV surface regex)
- Modify: `AGENTS.md:18-26`, `README.md` 콘텐츠 원칙

**Interfaces:**
- Produces: `render.policy.prohibitedPartnerPattern` no longer matches `Digitrack`, `삼성서울병원`, `Samsung Medical`, `KERI`, `ETRI`; still matches `KAERI|ANL|SNU|HD현대|Hyundai|계명대|동산병원|울산대|이화여대|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대`.

- [ ] **Step 1: Write the failing test** — append to `tests/portfolio.test.cjs` (after the test at line 967):

```js
test('Scholar policy allows approved institution and product names while still rejecting private partners', () => {
  const approved = clone(data);
  approved.projects[0].translations.ko.summary += ' 삼성서울병원 구강악안면외과와 협력해 SKADI·SMCNavi 기반으로 통합했고 KERI·ETRI 컨소시엄 과제에 참여합니다.';
  approved.projects[0].translations.en.summary += ' Built with Samsung Medical Center on SKADI and SMCNavi; Digitrack, KERI, and ETRI are named.';
  assert.deepEqual(render.dataErrors(approved).filter((error) => /nonpublic partner/i.test(error)), []);
  assert.deepEqual(validator.portfolioDataErrors(approved).filter((error) => /nonpublic partner/i.test(error)), []);

  const blocked = clone(data);
  blocked.projects[0].translations.en.summary += ' Genoray partner.';
  assert.match(render.dataErrors(blocked).join('\n'), /nonpublic partner/i);

  const cv = JSON.parse(read('data/public-cv.json'));
  cv.identity.translations.ko.summary += ' 삼성서울병원·서울성모병원과 협력했습니다.';
  cv.identity.translations.en.summary += ' Collaborated with Samsung Medical Center, KERI, and ETRI.';
  assert.deepEqual(validator.publicCvDataErrors(cv).filter((error) => /prohibited/i.test(error)), []);
  const stillBlocked = JSON.parse(read('data/public-cv.json'));
  stillBlocked.identity.translations.ko.summary += ' 연봉 협상 중';
  assert.match(validator.publicCvDataErrors(stillBlocked).join('\n'), /prohibited/i);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test --test-name-pattern="Scholar policy allows" tests/portfolio.test.cjs`
Expected: FAIL — `render.dataErrors(approved)` reports "Shared data contains a nonpublic partner name." (삼성서울병원) and `publicCvDataErrors` reports "prohibited private or unverified claim: 삼성서울병원".

- [ ] **Step 3: Relax the renderer policy** — in `js/portfolio-render.js` replace the `prohibitedPartnerPattern` line with:

```js
    prohibitedPartnerPattern: /\b(?:KAERI|ANL|SNU)\b|HD현대|Hyundai|계명대|동산병원|울산대|이화여대|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대/i,
```

- [ ] **Step 4: Relax the CV validator** — in `scripts/validate-portfolio.cjs` `prohibitedPatterns` replace the three lines:

```js
    /\b(?:age|salary|professor|advisor|patient|customer|street address|home address)\b/i,
    /나이|연봉|지도교수|환자|고객|자택|거주지|주소/,
    ...
    /동산병원|계명대|HD현대|Hyundai|KAERI|ANL/i,
```
(`hospital`, `병원`, `Samsung Medical|삼성서울병원`, `KERI`, `ETRI` removed. `병원` had no word boundary and would match inside every hospital name.)

- [ ] **Step 5: Fix the fixtures that assumed the old policy**
  - `tests/portfolio.test.cjs:976` — change `' Samsung Medical partner.'` to `' Genoray partner.'`.
  - `tests/portfolio.test.cjs:399` (register prose regex) — change `\b(?:CT|MRI|patient|hospital)\b` to `\b(?:CT|MRI|patient)\b`.
  - `tests/portfolio.test.cjs:1640` (CV surface regex) — remove `hospital` from the English group and `병원` from the Korean group so it reads `\b(?:age|salary|professor|advisor|patient|customer)\b|나이|연봉|지도교수|환자|고객|…`.
  - Run `grep -n "hospital\|병원" scripts/validate-portfolio.cjs scripts/public-cv-summary.cjs scripts/generate-portfolio-pdfs.py` and remove `hospital`/`병원` from any remaining *prohibited-word* list (keep them if they appear only in PII regexes that need a colon/ID suffix, e.g. `환자(?:명|번호|ID)`). Record each removal in the commit body.

- [ ] **Step 6: Run the whole suite and validator**

Run: `node --test && node scripts/validate-portfolio.cjs && git diff --check`
Expected: all pass (the new test now passes; no other test referenced the removed names except the fixtures fixed in Step 5).

- [ ] **Step 7: Update the written policy** — `AGENTS.md` content principles: replace the line `공개되지 않은 고객사·병원·기관명은 프로젝트와 상위 페이지에서 익명화한다.` with:

```
- 기관·제품 실명은 승인 목록(2026-08-21 사용자 승인)만 쓴다: 디지트랙/DIGITRACK, SKADI, SMCNavi, NeuroPilot, DOTORI, 삼성서울병원, 서울성모병원, AT&C, KERI, ETRI, KAIST, A4LAB, 정부과제명. 타인의 이름(교수·임원·동료), 연구비, 문서·특허 번호, 과제 목표치·타 기관 지표는 쓰지 않는다. 본인이 직접 측정한 수치만 인용한다.
```
  `README.md` 콘텐츠 원칙의 `공개 승인이 없는 고객사·병원·기관명과 원본 경로를 노출하지 않습니다.` → `승인된 기관·제품 실명만 쓰고, 타인의 이름·연구비·문서 번호·원본 경로는 노출하지 않습니다.`

- [ ] **Step 8: Commit**

```bash
git add js/portfolio-render.js scripts/validate-portfolio.cjs tests/portfolio.test.cjs AGENTS.md README.md
git commit -m "feat(policy): allow approved institution and product names in public copy"
```

---

### Task 2: Gallery and highlights data contracts (no data change yet)

**Files:**
- Modify: `js/portfolio-render.js` (`validatePortfolioData`, helpers, `portfolioPublicCopy`)
- Modify: `scripts/validate-portfolio.cjs:277-290` (`canonicalMediaEntries`), `:831-851` (`publicPortfolioVisualFiles`)
- Test: `tests/portfolio.test.cjs`

**Interfaces:**
- Produces (data shape, optional until Task 4/5):
  - `project.media.gallery?: Array<{ id: string, type: 'image', status: 'approved'|'pending-approval', publicPath?: string, translations?: { ko: { caption, alt }, en: { caption, alt } } }>` — max 6, unique ids; approved items require `translations.ko/en.caption` and `.alt`.
  - `data.highlights?: { publications: Array<{ year: 'YYYY', href?: httpsUrl, translations: { ko: { title, venue }, en: { title, venue } } }>, patents: { filed: int, registered: int, items: Array<{ year: 'YYYY', status: 'registered'|'filed', translations: { ko: { title }, en: { title } } }> }, awards: Array<{ year: 'YYYY', translations: { ko: { title }, en: { title } } }> }`.
  - `validator.publicPortfolioVisualFiles(rootDir, candidate = data)` — second optional parameter.

- [ ] **Step 1: Write the failing tests** — append to `tests/portfolio.test.cjs`:

```js
test('Scholar gallery contract accepts up to six images and rejects other shapes', () => {
  const ok = clone(data);
  ok.projects[0].media.gallery = [
    { id: 'surgical-navigation-gallery-1', type: 'image', status: 'pending-approval' },
    { id: 'surgical-navigation-gallery-2', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/gallery-2.png',
      translations: { ko: { caption: '정합 화면', alt: '정합 화면 캡처' }, en: { caption: 'Registration view', alt: 'Registration view capture' } } }
  ];
  assert.deepEqual(render.dataErrors(ok).filter((error) => /gallery/i.test(error)), []);
  const mutations = [
    [(candidate) => { candidate.projects[0].media.gallery = 'nope'; }, /gallery must be an array/i],
    [(candidate) => { candidate.projects[0].media.gallery = Array.from({ length: 7 }, (_, index) => ({ id: `g-${index}`, type: 'image', status: 'pending-approval' })); }, /at most six/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'g-video', type: 'video', status: 'pending-approval' }]; }, /unsupported video media type/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'g-1', type: 'image', status: 'approved' }]; }, /approved media requires a public path/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'g-1', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/g-1.png' }]; }, /missing ko translation for caption/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'dup', type: 'image', status: 'pending-approval' }, { id: 'dup', type: 'image', status: 'pending-approval' }]; }, /duplicate gallery id/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    assert.match(render.dataErrors(candidate).join('\n'), expected);
    assert.match(validator.portfolioDataErrors(candidate).join('\n'), expected);
  }
});

test('Scholar gallery items participate in evidence registry and public visual file checks', () => {
  const candidate = clone(data);
  candidate.projects[0].media.gallery = [{ id: 'surgical-navigation-gallery-unregistered', type: 'image', status: 'pending-approval' }];
  assert.match(validator.evidenceRegistryErrors(candidate, root).join('\n'), /gallery 0 surgical-navigation-gallery-unregistered: canonical media id is not registered/i);

  const approved = clone(data);
  approved.projects[0].media.gallery = [{ id: 'surgical-navigation-gallery-1', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/gallery-1.png',
    translations: { ko: { caption: 'c', alt: 'a' }, en: { caption: 'c', alt: 'a' } } }];
  const files = validator.publicPortfolioVisualFiles(root, approved).map((file) => file.relativePath.replace(/\\/g, '/'));
  assert.ok(files.includes('assets/projects/surgical-navigation/gallery-1.png'));
});

test('Scholar highlights contract validates publications, patents, and awards without patent numbers', () => {
  const base = {
    publications: [{ year: '2024', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: { ko: { title: '제목', venue: '학술지' }, en: { title: 'Title', venue: 'Journal' } } }],
    patents: { filed: 7, registered: 3, items: [{ year: '2024', status: 'registered', translations: { ko: { title: '특허' }, en: { title: 'Patent' } } }] },
    awards: [{ year: '2024', translations: { ko: { title: '수상' }, en: { title: 'Award' } } }]
  };
  const ok = clone(data);
  ok.highlights = clone(base);
  assert.deepEqual(render.dataErrors(ok).filter((error) => /highlight/i.test(error)), []);
  const mutations = [
    [(candidate) => { candidate.highlights = []; }, /highlights must be an object/i],
    [(candidate) => { candidate.highlights.publications = []; }, /require publications/i],
    [(candidate) => { candidate.highlights.publications[0].href = 'http://example.com/x'; }, /unsafe link/i],
    [(candidate) => { candidate.highlights.patents.registered = 9; }, /registered <= filed/i],
    [(candidate) => { candidate.highlights.patents.items[0].translations.ko.title = '특허 10-2024-0186869'; }, /patent number/i],
    [(candidate) => { candidate.highlights.awards[0].year = '24'; }, /four-digit year/i],
    [(candidate) => { delete candidate.highlights.awards[0].translations.en; }, /missing en translation for title/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    candidate.highlights = clone(base);
    mutate(candidate);
    assert.match(render.dataErrors(candidate).join('\n'), expected);
  }
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test --test-name-pattern="Scholar (gallery|highlights)" tests/portfolio.test.cjs`
Expected: FAIL (no gallery/highlights validation exists; `publicPortfolioVisualFiles` ignores the second argument).

- [ ] **Step 3: Add renderer validation** — in `js/portfolio-render.js`, after `function blockErrors(...)` add:

```js
  var galleryMaxItems = 6;
  var patentNumberPattern = /\b10-\d{4}-\d{6,}\b/;

  function galleryErrors(project, slug) {
    var gallery = project.media && project.media.gallery;
    if (gallery === undefined) return [];
    if (!Array.isArray(gallery)) return [slug + ': media gallery must be an array.'];
    var errors = [];
    if (gallery.length > galleryMaxItems) errors.push(slug + ': media gallery allows at most six items.');
    var seen = [];
    gallery.forEach(function (item, index) {
      var label = slug + ' gallery ' + index;
      errors = errors.concat(mediaItemErrors(item, label, ['image']));
      if (item && typeof item.id === 'string') {
        if (seen.includes(item.id)) errors.push(label + ': duplicate gallery id.');
        seen.push(item.id);
      }
      if (item && item.status === 'approved') errors = errors.concat(translationErrors(item, ['caption', 'alt'], label));
    });
    return errors;
  }

  function yearErrors(item, label) {
    return item && typeof item.year === 'string' && /^\d{4}$/.test(item.year) ? [] : [label + ': requires a four-digit year.'];
  }

  function highlightsErrors(highlights) {
    if (highlights === undefined) return [];
    if (!highlights || typeof highlights !== 'object' || Array.isArray(highlights)) return ['Portfolio highlights must be an object.'];
    var errors = [];
    if (!Array.isArray(highlights.publications) || !highlights.publications.length) errors.push('Portfolio highlights require publications.');
    (Array.isArray(highlights.publications) ? highlights.publications : []).forEach(function (item, index) {
      var label = 'highlights publication ' + index;
      errors = errors.concat(yearErrors(item, label), translationErrors(item, ['title', 'venue'], label));
      if (item && item.href !== undefined && !isSafeProjectLink(item.href)) errors.push(label + ': unsafe link.');
    });
    var patents = highlights.patents;
    if (!patents || typeof patents !== 'object' || Array.isArray(patents)) {
      errors.push('Portfolio highlights require a patents summary.');
    } else {
      if (!Number.isInteger(patents.filed) || !Number.isInteger(patents.registered) || patents.registered > patents.filed) {
        errors.push('highlights patents: filed and registered must be integers with registered <= filed.');
      }
      if (!Array.isArray(patents.items)) errors.push('highlights patents: items must be an array.');
      (Array.isArray(patents.items) ? patents.items : []).forEach(function (item, index) {
        var label = 'highlights patent ' + index;
        errors = errors.concat(yearErrors(item, label), translationErrors(item, ['title'], label));
        if (!item || !['registered', 'filed'].includes(item.status)) errors.push(label + ': status must be registered or filed.');
      });
    }
    if (!Array.isArray(highlights.awards) || !highlights.awards.length) errors.push('Portfolio highlights require awards.');
    (Array.isArray(highlights.awards) ? highlights.awards : []).forEach(function (item, index) {
      var label = 'highlights award ' + index;
      errors = errors.concat(yearErrors(item, label), translationErrors(item, ['title'], label));
    });
    if (patentNumberPattern.test(JSON.stringify(highlights))) errors.push('Portfolio highlights must not include a patent number.');
    return errors;
  }
```

  Inside `validatePortfolioData`, directly after the `(project.media.references || []).forEach(...)` block (still inside the `else` of the lead check) add:

```js
          errors = errors.concat(galleryErrors(project, slug));
```

  Before `errors = errors.concat(publicCopySafetyErrors(data));` add:

```js
    errors = errors.concat(highlightsErrors(data.highlights));
```

  In `portfolioPublicCopy(data)` add `surfaces.push(data && data.highlights);` before the `return` so PII scanning covers highlight copy.

- [ ] **Step 4: Extend the validator** — `scripts/validate-portfolio.cjs`:

  In `canonicalMediaEntries`, after the references loop add:

```js
    for (const [index, item] of (Array.isArray(media.gallery) ? media.gallery : []).entries()) {
      entries.push({ project, item, slot: `gallery ${index}` });
    }
```

  Replace the head of `publicPortfolioVisualFiles` with:

```js
function publicPortfolioVisualFiles(rootDir, candidate = data) {
  const mediaItems = (Array.isArray(candidate && candidate.projects) ? candidate.projects : []).flatMap((project) => {
    const media = project.media || {};
    const references = Array.isArray(media.references) ? media.references : [];
    const gallery = Array.isArray(media.gallery) ? media.gallery : [];
    return [media.lead, media.video, media.poster].concat(references, gallery).filter(Boolean);
  });
```
  (rest unchanged.) Confirm `publicPortfolioVisualFiles` is in `module.exports`; add it if missing.

- [ ] **Step 5: Run tests, validator, diff check**

Run: `node --test && node scripts/validate-portfolio.cjs && git diff --check`
Expected: all pass. (No data changed, so the PDF manifest stays fresh.)

- [ ] **Step 6: Commit**

```bash
git add js/portfolio-render.js scripts/validate-portfolio.cjs tests/portfolio.test.cjs
git commit -m "feat(data): add gallery and highlights contracts to renderer and validator"
```

---

### Task 3: Scholar renderer templates

**Files:**
- Modify: `js/portfolio-render.js` (`pageCopy`, everything from `function mediaLedgerHtml` to the end), keep the validation section from Task 2 intact
- Modify: `js/nav.js:64-73` (`footerHtml`), `js/site-i18n.js` footer strings
- Test: `tests/portfolio.test.cjs` — rewrite the renderer tests listed below

**Interfaces:**
- Produces (exports, all used by `mountAll` and tests): `homeProjectGalleryHtml(data, base, isFile, locale)` → grouped `<section class="sc-group">` + `<ol class="sc-project-list">` list with `h3` group / `h4` item titles; `projectGroupsHtml(data, base, isFile, locale)` → same with `h2`/`h3` and a `<dl class="sc-project__facts">`; `capabilityIndexHtml(data, locale)` → one `<p class="sc-capabilities">`; `highlightsHtml(data, locale)` → `<div class="sc-highlights">` or `''`; `evidenceMediaHtml(project, locale, base, isFile)` → `<figure class="sc-figure">` or `''`; `caseGalleryHtml(project, locale, base, firstFigureNumber)`; `caseStudyHtml(data, slug, base, isFile, locale)` → `<article class="sc-case">`; `mountAll(doc, data)` fills `home-projects`, `capability-index`, `home-highlights`, `project-groups`, `case-study`. `homeEvidenceMosaicHtml` is removed.
- Consumes: Task 2 validation (`galleryErrors`, `highlightsErrors`), existing helpers `isApprovedImage/isApprovedVideo/assetHref/translation/translatedField/projectStateLabel/validProjects/localizePortfolioData/escapeHtml`.

- [ ] **Step 1: Write the failing renderer tests** — in `tests/portfolio.test.cjs`:

  **Delete** these tests entirely (they assert removed Spatial Signal surfaces): `Task 3 review hero mosaic renders approved images with truthful alt and title only` (1096), `Task 3 review hero mosaic renders an approved video poster without inline playback` (1112), `Task 3 review hero mosaic keeps a nonvisual lead as a title-only placeholder` (1135), `Integrated review keeps the entire Home evidence mosaic image-and-title only` (3689).

  **Replace** the body of `Task 3 Home renderer creates six ordered title-led links without card marketing copy` (1028) with (rename the test `Scholar Home list renders every project as thumbnail-plus-text rows grouped by tier`):

```js
  const html = render.homeProjectGalleryHtml(data, '', false, 'en');
  assert.equal(count(html, 'class="sc-project'), data.projects.length);
  assertInOrder(html, data.tiers.filter((tier) => data.projects.some((project) => project.tier === tier.key)).map((tier) => `data-tier="${tier.key}"`), 'Home groups');
  assertInOrder(html, data.projects.map((project) => project.translations.en.title.replace(/&/g, '&amp;')), 'Home projects');
  for (const project of data.projects) {
    assert.match(html, new RegExp(`<h4 class="sc-project__title"><a href="en/projects/${project.slug}/">`));
    assert.match(html, new RegExp(project.translations.en.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, new RegExp(project.translations.en.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /td-|sc-project__facts|Pending approval|Public evidence|role="img"|aria-label=|data-media-status/);
```

  **Replace** the body of `Task 3 review Home tiles render approved images with alt and no evidence metadata` (1043) — rename `Scholar list rows show an approved lead image as a decorative thumbnail`:

```js
  const candidate = clone(data);
  candidate.projects[0].media.lead = { id: 'surgical-navigation-public-image', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/lead.png' };
  candidate.projects[0].pdfSequence.evidenceId = candidate.projects[0].media.lead.id;
  const html = render.homeProjectGalleryHtml(candidate, '../', true, 'en');
  const firstRow = html.match(/<li class="sc-project"[\s\S]*?<\/li>/)?.[0] || '';
  assert.match(firstRow, /<a class="sc-project__thumb" href="\.\.\/en\/projects\/surgical-navigation\/index\.html" tabindex="-1" aria-hidden="true"><img src="\.\.\/assets\/projects\/surgical-navigation\/lead\.png" alt="" loading="lazy" decoding="async"><\/a>/);
  const pendingRow = html.match(/<li class="sc-project sc-project--text"[\s\S]*?<\/li>/)?.[0] || '';
  assert.ok(pendingRow, 'pending projects render as text-only rows');
  assert.doesNotMatch(pendingRow, /<img|sc-project__thumb|Pending approval|placeholder/i);
```

  **Replace** the body of `Task 3 review Home video tiles use an approved poster without autoplay or inline video` (1058):

```js
  const candidate = clone(data);
  candidate.projects[0].media.lead = { id: 'surgical-navigation-public-video', type: 'video', status: 'approved', publicPath: 'assets/projects/surgical-navigation/demo.mp4' };
  candidate.projects[0].media.poster = { id: 'surgical-navigation-public-poster', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/poster.png' };
  candidate.projects[0].pdfSequence.evidenceId = candidate.projects[0].media.lead.id;
  const html = render.homeProjectGalleryHtml(candidate, '', false, 'ko');
  const firstRow = html.match(/<li class="sc-project"[\s\S]*?<\/li>/)?.[0] || '';
  assert.match(firstRow, /<img src="assets\/projects\/surgical-navigation\/poster\.png" alt=""/);
  assert.doesNotMatch(firstRow, /<video\b|autoplay|demo\.mp4/);
```

  **Replace** the body of `Task 3 Home evidence mosaic and capability index follow the required data order` (1079) — rename `Scholar capability paragraph follows data order and the mosaic is gone`:

```js
  assert.equal(render.homeEvidenceMosaicHtml, undefined);
  const index = render.capabilityIndexHtml(data, 'en');
  assert.match(index, /^<p class="sc-capabilities">/);
  assertInOrder(index, data.capabilities.map((item) => item.translations.en.title.replace(/&/g, '&amp;')), 'capability paragraph');
  for (const capability of data.capabilities) {
    assert.match(index, new RegExp(capability.methods[0].replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(index, /rating|progress|capability-card|td-/i);
```

  **Replace** the body of `Task 3 Projects renderer groups four Medical Core cases then two full-width spotlights` (1172) — rename `Scholar Projects page groups detailed rows by tier in data order`:

```js
  const html = render.projectGroupsHtml(data, '../', false, 'en');
  const tiers = data.tiers.filter((tier) => data.projects.some((project) => project.tier === tier.key));
  assertInOrder(html, tiers.map((tier) => `data-tier="${tier.key}"`), 'project tiers');
  assert.equal(count(html, '<section class="sc-group"'), tiers.length);
  assert.equal(count(html, 'class="sc-project'), data.projects.length);
  for (const tier of tiers) {
    const group = html.match(new RegExp(`<section class="sc-group" data-tier="${tier.key}">[\\s\\S]*?</section>`))?.[0] || '';
    assert.match(group, new RegExp(`<h2 class="sc-group__title">${tier.translations.en.label.replace(/&/g, '&amp;')}</h2>`));
    assert.equal(count(group, 'class="sc-project'), data.projects.filter((project) => project.tier === tier.key).length);
  }
  assert.match(html, /<dt>Problem<\/dt>[\s\S]*<dt>Personal role<\/dt>[\s\S]*<dt>Evidence<\/dt>/);
  assert.match(html, /<h3 class="sc-project__title"><a href="\.\.\/en\/projects\/surgical-navigation\/">Surgical Navigation Systems<\/a><\/h3>/);
  assert.doesNotMatch(html, /td-|Featured|More Projects/i);
```

  **Replace** `Task 3 media renderer shows pending provenance without broken media` (1184) and `Task 3 review keeps pending disclosure on detail surfaces only` (1194) with one test:

```js
test('Scholar figure renderer skips pending media instead of drawing a placeholder', () => {
  const project = data.projects[0];
  assert.equal(render.evidenceMediaHtml(project, 'en', '../../', false), '');
  const html = render.caseStudyHtml(data, project.slug, '../../', false, 'en');
  assert.doesNotMatch(html, /<figure|<img|<video|role="img"|Pending approval|placeholder/i);
  assert.match(html, new RegExp(project.translations.en.limitation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const repositoryLead = data.projects.find((item) => item.media.lead.type === 'repository');
  assert.equal(render.evidenceMediaHtml(repositoryLead, 'en', '', false), '');
});
```

  **Keep** `Task 3 approved video contract is poster-led, click-to-play, and keyboard reachable` (1213) but change `poster.webp` → `poster.png` in both the fixture and the regex, and add `assert.match(html, /<figcaption><span class="sc-figure__label">Figure 1\.<\/span> /);`.

  **Replace** the last two lines of `Task 3 approved video without an approved poster stays an honest fallback` (1223) with `assert.equal(html, '');`.

  **Replace** the body of `Task 3 case renderer uses project-specific blocks and separates role from team result` (1330) — rename `Scholar case article orders header, figure, five sections, gallery, and links`:

```js
  const project = clone(data.projects[1]);
  project.blocks = [
    { key: 'text', type: 'text', translations: { ko: { heading: '텍스트', body: '본문' }, en: { heading: 'Text block', body: 'Text body' } } },
    { key: 'list', type: 'list', translations: { ko: { heading: '목록', items: ['하나', '둘'] }, en: { heading: 'List block', items: ['One', 'Two'] } } },
    { key: 'system', type: 'system', translations: { ko: { heading: '시스템', body: '흐름' }, en: { heading: 'System block', body: 'System flow' } } },
    { key: 'evidence', type: 'evidence', translations: { ko: { heading: '근거', body: '증거' }, en: { heading: 'Evidence block', body: 'Evidence body' } } },
    { key: 'limit', type: 'limitation', translations: { ko: { heading: '한계', body: '경계' }, en: { heading: 'Limit block', body: 'Limit body' } } }
  ];
  project.pdfSequence.middle = ['text', 'list', 'system', 'evidence'];
  project.media.lead = { id: 'mandibular-lead', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/lead.png' };
  project.pdfSequence.evidenceId = 'mandibular-lead';
  project.media.gallery = [
    { id: 'mandibular-gallery-1', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/g1.png', translations: { ko: { caption: '첫 그림', alt: '첫 그림 설명' }, en: { caption: 'First gallery figure', alt: 'First gallery alt' } } },
    { id: 'mandibular-gallery-2', type: 'image', status: 'pending-approval' },
    { id: 'mandibular-gallery-3', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/g3.png', translations: { ko: { caption: '셋째', alt: '셋째 설명' }, en: { caption: 'Third gallery figure', alt: 'Third alt' } } }
  ];
  const candidate = clone(data);
  candidate.projects[1] = project;
  const html = render.caseStudyHtml(candidate, project.slug, '../../../', true, 'en');
  assertInOrder(html, ['sc-case__header', 'sc-case__meta', 'sc-case__thesis', 'Figure 1.', '<h2>Problem</h2>', '<h2>Approach</h2>', 'data-block-type="system"', 'data-block-type="text"', 'data-block-type="list"', '<h2>My role</h2>', '<h2>Results and evidence</h2>', 'data-block-type="evidence"', '<h2>Limits and team result</h2>', 'data-block-type="limitation"', 'sc-gallery', 'Figure 2.', 'First gallery figure', 'Figure 3.', 'Third gallery figure', 'sc-case__links'], 'case sequence');
  assert.match(html, /<ul>[\s\S]*<li>One<\/li>[\s\S]*<li>Two<\/li>/);
  assert.doesNotMatch(html, /mandibular-gallery-2|Figure 4\./);
  assert.match(html, /src="\.\.\/\.\.\/\.\.\/assets\/projects\/mandibular-fracture\/g1\.png" alt="First gallery alt"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/pdfs\/mandibular-fracture-en\.pdf"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/contact\/index\.html"/);
  assert.match(html, new RegExp(project.translations.en.teamResult.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /td-|Decision Timeline|decision-step|Verified · Completed<\/span><span class="td/);
  const pendingGallery = render.caseStudyHtml(data, 'surgical-navigation', '', false, 'ko');
  assert.doesNotMatch(pendingGallery, /sc-gallery/);
```

  **Add** a highlights rendering test:

```js
test('Scholar highlights render three numbered groups and a linked publication', () => {
  const candidate = clone(data);
  candidate.highlights = {
    publications: [{ year: '2024', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: { ko: { title: '논문 제목', venue: 'JIIM' }, en: { title: 'Paper title', venue: 'JIIM' } } }],
    patents: { filed: 7, registered: 3, items: [{ year: '2024', status: 'registered', translations: { ko: { title: '특허 제목' }, en: { title: 'Patent title' } } }] },
    awards: [{ year: '2023', translations: { ko: { title: '수상 제목' }, en: { title: 'Award title' } } }]
  };
  const html = render.highlightsHtml(candidate, 'ko');
  assertInOrder(html, ['<h3>논문</h3>', 'https://link.springer.com/article/10.1007/s10278-024-01014-z', '논문 제목', '<h3>특허</h3>', '출원 7건 · 등록 3건', '특허 제목', '<h3>수상</h3>', '수상 제목'], 'highlights');
  assert.equal(count(html, '<ol class="sc-list">'), 3);
  assert.equal(render.highlightsHtml(data, 'en'), '', 'no highlights data renders nothing');
});
```

  **Update** `Task 3 mountAll is safe, idempotent, and ignores invalid case mounts` (1372): add `const highlights = { innerHTML: '', getAttribute: () => '' };`, map `'[data-portfolio="home-highlights"]': [highlights]` in `querySelectorAll`, and include `highlights.innerHTML` in both snapshot arrays.

  **Update** `Integrated review separates evidence maturity from project lifecycle` (3660): keep the tuple list for now (Task 5 extends it); the two `assert.match(projectsHtml, …)` lines still hold because the meta line renders `Verified · Completed`; change `assert.match(caseHtml, />검증됨 · 완료</)` to `assert.match(caseHtml, /<span>검증됨 · 완료<\/span>/)`.

- [ ] **Step 2: Run to verify the renderer tests fail**

Run: `node --test --test-name-pattern="Scholar|Task 3" tests/portfolio.test.cjs`
Expected: the rewritten tests FAIL (old markup), the kept ones still pass.

- [ ] **Step 3: Replace `pageCopy`** in `js/portfolio-render.js` with:

```js
  var pageCopy = {
    ko: {
      personalRole: '내 역할', teamResult: '팀 성과', period: '기간', technology: '기술',
      evidence: '근거', problem: '문제', approach: '접근', results: '결과와 근거', limits: '한계와 팀 성과',
      components: '구성', details: '자세히', pdf: 'PDF', openPdf: '사례 PDF 열기', figure: '그림', figures: '그림 모음',
      contact: '연락처', publications: '논문', patents: '특허', awards: '수상',
      patentSummary: function (filed, registered) { return '출원 ' + filed + '건 · 등록 ' + registered + '건'; }
    },
    en: {
      personalRole: 'Personal role', teamResult: 'Team result', period: 'Period', technology: 'Technology',
      evidence: 'Evidence', problem: 'Problem', approach: 'Approach', results: 'Results and evidence', limits: 'Limits and team result',
      components: 'Components', details: 'Details', pdf: 'PDF', openPdf: 'Open case PDF', figure: 'Figure', figures: 'Figures',
      contact: 'Contact', publications: 'Publications', patents: 'Patents', awards: 'Awards',
      patentSummary: function (filed, registered) { return filed + ' filed · ' + registered + ' registered'; }
    }
  };
```
  Then search the file for any remaining use of removed keys (`mediaApproved`, `mediaPending`, `fallback`, `pendingAccessible`, `representativeAccessible`, `evidenceLimits`, `deeperDocument`, `pdfDescription`, `collaboration`, `medicalSummary`, `industrialSummary`, `aiSummary`, `mediaType`) — all of them live only in the template block replaced in Step 4.

- [ ] **Step 4: Replace the template block** — delete everything from `  function mediaLedgerHtml(project, locale, displayStatus) {` down to (but not including) the final `});` of the file, and insert:

```js
  function isApprovedImage(item) {
    return Boolean(item && item.type === 'image' && item.status === 'approved' &&
      isSafePublicPath(item.publicPath) && isImagePath(item.publicPath));
  }

  function isApprovedVideo(item) {
    return Boolean(item && item.type === 'video' && item.status === 'approved' &&
      isSafePublicPath(item.publicPath) && isVideoPath(item.publicPath));
  }

  function thumbnailItem(project) {
    var media = project.media && project.media.lead ? project.media.lead : {};
    var posterItem = project.media && project.media.poster;
    if (isApprovedImage(media)) return media;
    if (isApprovedVideo(media) && isApprovedImage(posterItem)) return posterItem;
    return null;
  }

  function figureHtml(visual, label, caption, extraClass) {
    return '<figure class="sc-figure' + (extraClass ? ' ' + extraClass : '') + '" data-media-status="approved">' + visual +
      '<figcaption><span class="sc-figure__label">' + escapeHtml(label) + '</span> ' + escapeHtml(caption) + '</figcaption></figure>';
  }

  function evidenceMediaHtml(projectRecord, locale, base, isFile) {
    void isFile;
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var sourceCopy = translation(projectRecord, normalized);
    var media = projectRecord && projectRecord.media && projectRecord.media.lead ? projectRecord.media.lead : {};
    var posterItem = projectRecord && projectRecord.media && projectRecord.media.poster;
    var alt = sourceCopy.mediaAlt || projectRecord.mediaAlt || '';
    var caption = sourceCopy.mediaCaption || projectRecord.mediaCaption || '';
    var visual = '';
    if (isApprovedVideo(media) && isApprovedImage(posterItem)) {
      visual = '<video controls preload="none" tabindex="0" poster="' + escapeHtml(assetHref(base, posterItem.publicPath)) + '"' +
        ' aria-label="' + escapeHtml(alt) + '"><source src="' + escapeHtml(assetHref(base, media.publicPath)) + '"></video>';
    } else if (isApprovedImage(media)) {
      visual = '<img src="' + escapeHtml(assetHref(base, media.publicPath)) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">';
    } else {
      return '';
    }
    return figureHtml(visual, copy.figure + ' 1.', caption, '');
  }

  function caseGalleryHtml(project, locale, base, firstFigureNumber) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var items = (project.media && Array.isArray(project.media.gallery) ? project.media.gallery : []).filter(isApprovedImage);
    if (!items.length) return '';
    var figures = items.map(function (item, offset) {
      var itemCopy = translation(item, normalized);
      var visual = '<img src="' + escapeHtml(assetHref(base, item.publicPath)) + '" alt="' + escapeHtml(itemCopy.alt || project.mediaAlt || '') + '" loading="lazy" decoding="async">';
      return figureHtml(visual, copy.figure + ' ' + (firstFigureNumber + offset) + '.', itemCopy.caption || '', 'sc-figure--gallery');
    }).join('');
    return '<section class="sc-gallery" aria-label="' + escapeHtml(copy.figures) + '"><div class="sc-gallery__grid">' + figures + '</div></section>';
  }

  function capabilityIndexHtml(data, locale) {
    var localized = localizePortfolioData(data, locale);
    return '<p class="sc-capabilities">' + localized.capabilities.map(function (capability) {
      return '<strong>' + escapeHtml(capability.title) + '</strong> (' + capability.methods.map(escapeHtml).join(', ') + ')';
    }).join(' · ') + '</p>';
  }

  function projectLinksInline(project, locale) {
    return (project.links || []).filter(function (link) { return link && isSafeProjectLink(link.href); }).map(function (link) {
      return ' · <a href="' + escapeHtml(link.href) + '" target="_blank" rel="noopener">' + escapeHtml(translatedField(link, 'label', locale)) + '</a>';
    }).join('');
  }

  function projectItemHtml(project, base, isFile, locale, settings) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var href = i18n.routeHref(base, normalized, project.route, Boolean(isFile));
    var thumb = thumbnailItem(project);
    var visual = thumb
      ? '<a class="sc-project__thumb" href="' + escapeHtml(href) + '" tabindex="-1" aria-hidden="true"><img src="' + escapeHtml(assetHref(base, thumb.publicPath)) + '" alt="" loading="lazy" decoding="async"></a>'
      : '';
    var facts = settings.detailed
      ? '<dl class="sc-project__facts">' +
          '<div><dt>' + escapeHtml(copy.problem) + '</dt><dd>' + escapeHtml(project.problem) + '</dd></div>' +
          '<div><dt>' + escapeHtml(copy.personalRole) + '</dt><dd>' + escapeHtml(project.role) + '</dd></div>' +
          '<div><dt>' + escapeHtml(copy.evidence) + '</dt><dd>' + escapeHtml(project.evidence) + '</dd></div>' +
        '</dl>'
      : '';
    var tag = settings.headingTag;
    return '<li class="sc-project' + (thumb ? '' : ' sc-project--text') + '" data-project="' + escapeHtml(project.slug) + '">' + visual +
      '<div class="sc-project__body">' +
        '<' + tag + ' class="sc-project__title"><a href="' + escapeHtml(href) + '">' + escapeHtml(project.title) + '</a></' + tag + '>' +
        '<p class="sc-project__meta">' + escapeHtml(project.period) + ' · ' + escapeHtml(projectStateLabel(project, normalized)) + '</p>' +
        '<p class="sc-project__summary">' + escapeHtml(project.summary) + '</p>' + facts +
        '<p class="sc-project__links"><a href="' + escapeHtml(href) + '">' + escapeHtml(copy.details) + '</a> · <a href="' + escapeHtml(assetHref(base, project.pdf[normalized])) + '">' + escapeHtml(copy.pdf) + '</a>' + projectLinksInline(project, normalized) + '</p>' +
      '</div></li>';
  }

  function projectListHtml(data, base, isFile, locale, settings) {
    var normalized = localeOf(locale);
    var localized = localizePortfolioData(data, normalized);
    var projects = validProjects(data, normalized);
    return localized.tiers.map(function (tier) {
      var tierProjects = projects.filter(function (project) { return project.tier === tier.key; });
      if (!tierProjects.length) return '';
      return '<section class="sc-group" data-tier="' + escapeHtml(tier.key) + '">' +
        '<' + settings.groupHeadingTag + ' class="sc-group__title">' + escapeHtml(tier.label) + '</' + settings.groupHeadingTag + '>' +
        '<ol class="sc-project-list">' + tierProjects.map(function (project) { return projectItemHtml(project, base, isFile, normalized, settings); }).join('') + '</ol>' +
      '</section>';
    }).join('');
  }

  function homeProjectGalleryHtml(data, base, isFile, locale) {
    return projectListHtml(data, base, isFile, locale, { detailed: false, groupHeadingTag: 'h3', headingTag: 'h4' });
  }

  function projectGroupsHtml(data, base, isFile, locale) {
    return projectListHtml(data, base, isFile, locale, { detailed: true, groupHeadingTag: 'h2', headingTag: 'h3' });
  }

  function highlightsHtml(data, locale) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var highlights = data && data.highlights;
    if (!highlights || highlightsErrors(highlights).length) return '';
    function item(entry, withVenue) {
      var entryCopy = translation(entry, normalized);
      var title = escapeHtml(entryCopy.title || '');
      if (entry.href && isSafeProjectLink(entry.href)) title = '<a href="' + escapeHtml(entry.href) + '" target="_blank" rel="noopener">' + title + '</a>';
      var venue = withVenue && entryCopy.venue ? ' <span class="sc-list__venue">' + escapeHtml(entryCopy.venue) + '</span>' : '';
      return '<li><span class="sc-list__year">' + escapeHtml(entry.year) + '</span> ' + title + venue + '</li>';
    }
    function group(title, note, entries, withVenue) {
      return '<section class="sc-highlights__group"><h3>' + escapeHtml(title) + '</h3>' + (note ? '<p class="sc-highlights__note">' + escapeHtml(note) + '</p>' : '') +
        '<ol class="sc-list">' + entries.map(function (entry) { return item(entry, withVenue); }).join('') + '</ol></section>';
    }
    return '<div class="sc-highlights">' +
      group(copy.publications, '', highlights.publications, true) +
      group(copy.patents, copy.patentSummary(highlights.patents.filed, highlights.patents.registered), highlights.patents.items, false) +
      group(copy.awards, '', highlights.awards, false) +
    '</div>';
  }

  function blockHtml(block, locale) {
    var copy = translation(block, locale);
    var heading = escapeHtml(copy.heading || '');
    if (block.type === 'list') {
      return '<div class="sc-block" data-block-type="list"><h3>' + heading + '</h3><ul>' +
        (copy.items || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div>';
    }
    return '<div class="sc-block" data-block-type="' + escapeHtml(block.type) + '"><h3>' + heading + '</h3><p>' + escapeHtml(copy.body || '') + '</p></div>';
  }

  function subcasesHtml(project, locale) {
    if (!project.subcases || !project.subcases.length) return '';
    var copy = pageCopy[localeOf(locale)];
    return '<section class="sc-case__section" aria-label="' + escapeHtml(copy.components) + '"><h2>' + escapeHtml(copy.components) + '</h2><ul class="sc-subcases">' + project.subcases.map(function (subcase) {
      var subcaseCopy = translation(subcase, locale);
      return '<li><strong>' + escapeHtml(subcaseCopy.title || '') + '</strong> — ' + escapeHtml(subcaseCopy.summary || '') + '</li>';
    }).join('') + '</ul></section>';
  }

  function caseStudyHtml(data, slug, base, isFile, locale) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var project = validProjects(data, normalized).find(function (item) { return item.slug === slug; });
    if (!project) return '';
    var sourceProject = (data.projects || []).find(function (item) { return item.slug === slug; });
    var englishTitle = sourceProject ? translatedField(sourceProject, 'title', 'en') : '';
    var title = '<span>' + escapeHtml(project.title) + '</span>';
    if (normalized === 'ko' && englishTitle) title += '<small lang="en">' + escapeHtml(englishTitle) + '</small>';
    var pdfHref = assetHref(base, project.pdf[normalized]);
    var contactHref = i18n.routeHref(base, normalized, 'contact/', Boolean(isFile));
    var lead = evidenceMediaHtml(sourceProject, normalized, base, isFile);
    function blocksOfType(types) {
      return project.blocks.filter(function (block) { return types.includes(block.type); }).map(function (block) { return blockHtml(block, normalized); }).join('');
    }
    return '<article class="sc-case" data-case="' + escapeHtml(project.slug) + '">' +
      '<header class="sc-case__header"><h1>' + title + '</h1>' +
        '<p class="sc-case__meta"><span>' + escapeHtml(project.period) + '</span> · <span>' + escapeHtml(projectStateLabel(project, normalized)) + '</span> · <span>' + project.tech.map(escapeHtml).join(', ') + '</span></p>' +
        '<p class="sc-case__thesis">' + escapeHtml(project.thesis) + '</p></header>' +
      lead +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.problem) + '</h2><p>' + escapeHtml(project.problem) + '</p></section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.approach) + '</h2><p>' + escapeHtml(project.summary) + '</p>' + blocksOfType(['system', 'text', 'list']) + '</section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.personalRole) + '</h2><p>' + escapeHtml(project.role) + '</p></section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.results) + '</h2><p>' + escapeHtml(project.evidence) + '</p>' + blocksOfType(['evidence']) + '</section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.limits) + '</h2><p>' + escapeHtml(project.limitation) + '</p><p>' + escapeHtml(project.teamResult) + '</p>' + blocksOfType(['limitation']) + '</section>' +
      caseGalleryHtml(project, normalized, base, lead ? 2 : 1) +
      subcasesHtml(project, normalized) +
      '<p class="sc-case__links"><a href="' + escapeHtml(pdfHref) + '">' + escapeHtml(copy.openPdf) + '</a>' + projectLinksInline(project, normalized) +
        ' · <a href="' + escapeHtml(contactHref) + '">' + escapeHtml(copy.contact) + '</a></p>' +
    '</article>';
  }

  function mountAll(doc, data) {
    if (!doc || typeof doc.querySelectorAll !== 'function') return;
    var body = doc.body;
    var base = body && body.getAttribute ? (body.getAttribute('data-base') || '') : '';
    var locale = localeOf(body && body.getAttribute ? body.getAttribute('data-lang') : 'ko');
    var isFile = Boolean(doc.location && doc.location.protocol === 'file:');
    var mountedSlugs = validProjects(data, locale).map(function (project) { return project.slug; });

    function fill(selector, renderer) {
      Array.prototype.forEach.call(doc.querySelectorAll(selector), function (node) {
        var html = renderer(node);
        if (typeof html === 'string' && html) node.innerHTML = html;
      });
    }

    fill('[data-portfolio="home-projects"]', function () { return homeProjectGalleryHtml(data, base, isFile, locale); });
    fill('[data-portfolio="capability-index"]', function () { return capabilityIndexHtml(data, locale); });
    fill('[data-portfolio="home-highlights"]', function () { return highlightsHtml(data, locale); });
    fill('[data-portfolio="project-groups"]', function () { return projectGroupsHtml(data, base, isFile, locale); });
    fill('[data-portfolio="case-study"]', function (node) {
      var slug = node && node.getAttribute ? node.getAttribute('data-project') : '';
      return mountedSlugs.indexOf(slug) === -1 ? '' : caseStudyHtml(data, slug, base, isFile, locale);
    });
  }

  return {
    policy: policy,
    dataErrors: validatePortfolioData,
    isSafePublicPath: isSafePublicPath,
    localizePortfolioData: localizePortfolioData,
    validatePortfolioData: validatePortfolioData,
    homeProjectGalleryHtml: homeProjectGalleryHtml,
    capabilityIndexHtml: capabilityIndexHtml,
    highlightsHtml: highlightsHtml,
    projectGroupsHtml: projectGroupsHtml,
    evidenceMediaHtml: evidenceMediaHtml,
    caseGalleryHtml: caseGalleryHtml,
    caseStudyHtml: caseStudyHtml,
    mountAll: mountAll
  };
```
  Keep `projectStateLabel`/`stateLabel`/`validProjects` (defined just above the deleted region) untouched. Remove the old `isApprovedRepository` if it is now unused (run `grep -n isApprovedRepository js/portfolio-render.js` — expect no hits).

- [ ] **Step 5: Neutral footer** — `js/nav.js` `footerHtml`: replace the `collaboration` ternary with

```js
    var tagline = normalized === 'en'
      ? 'Registration, medical imaging, and robot systems — from research to the field.'
      : '3D 정합 · 의료영상 · 로봇 시스템 — 연구에서 현장까지.';
```
  and use `escapeHtml(tagline)` in the `<p>`. In `js/site-i18n.js` set `footer` to `'로봇SW 엔지니어 · 대한민국 대구'` (ko) and `'Robot Software Engineer · Daegu, Korea'` (en).

- [ ] **Step 6: Run the full suite**

Run: `node --test && node scripts/validate-portfolio.cjs && git diff --check`
Expected: all pass. Note: the old shells still contain `data-portfolio="home-evidence"` mosaics; `mountAll` no longer fills them, so the authored placeholder markup remains until Task 4 — that is expected and the shell tests (1152, 3689-deleted) still pass because 1152 is untouched until Task 4.

- [ ] **Step 7: Commit**

```bash
git add js/portfolio-render.js js/nav.js js/site-i18n.js tests/portfolio.test.cjs
git commit -m "feat(render): Scholar templates — grouped project rows, figure-led case article, highlights"
```

---

### Task 4: Scholar stylesheet, page shells, and highlights data

**Files:**
- Create: `css/scholar.css`
- Modify: `css/site.css` (full rewrite, ≤160 lines)
- Delete: `css/spatial-signal.css`
- Modify: `index.html`, `en/index.html`, `projects/index.html`, `en/projects/index.html`, `contact/index.html`, `en/contact/index.html`, `cv/index.html`, `en/cv/index.html`, the 12 case shells (`projects/<slug>/index.html`, `en/projects/<slug>/index.html`)
- Modify: `js/portfolio-data.js` (add `highlights`, export it)
- Modify: `scripts/validate-portfolio.cjs:1860` (`requiredStyles`)
- Modify: `AGENTS.md`, `README.md`
- Test: `tests/portfolio.test.cjs`

**Interfaces:**
- Produces: `PortfolioData.highlights` (shape from Task 2); stylesheet contract `css/site.css` + `css/scholar.css` (+ `css/cv-pdf.css` on CV pages); Home mounts `capability-index`, `home-projects`, `home-highlights`.
- Consumes: renderer from Task 3.

- [ ] **Step 1: Write the failing shell/CSS tests** — in `tests/portfolio.test.cjs`:

  **Replace** `Task 3 Home shells preserve exact thesis, section order, and six-link no-JS fallback` (1152) with:

```js
test('Scholar Home shells carry the intro, four mounts, and a full no-JS project list', () => {
  const pages = [
    ['index.html', '로봇SW 엔지니어', data.projects.map((item) => item.translations.ko.title), 'assets/'],
    ['en/index.html', 'robot software engineer', data.projects.map((item) => item.translations.en.title), '../assets/']
  ];
  for (const [file, identity, titles, assetBase] of pages) {
    const html = read(file);
    assert.match(html, new RegExp(identity, 'i'));
    assertInOrder(html, ['class="sc-intro"', 'data-portfolio="capability-index"', 'data-portfolio="home-projects"', 'data-portfolio="home-highlights"', 'class="sc-contact"'], file);
    assert.match(html, new RegExp(`<img class="sc-intro__photo" src="${assetBase}img/profile_square.webp"`));
    assert.match(html, /mailto:uiop3847@naver\.com/);
    assert.match(html, /https:\/\/www\.linkedin\.com\/in\/rlawlsals/);
    assert.match(html, new RegExp(`${assetBase}cv/jinmin-kim-cv-(?:ko|en)\\.pdf`));
    const fallback = html.match(/<ol class="sc-project-list sc-project-list--fallback">([\s\S]*?)<\/ol>/)?.[1] || '';
    assert.equal(count(fallback, '<a '), data.projects.length, `${file}: fallback link count`);
    assertInOrder(fallback, titles, `${file}: fallback project titles`);
    assert.doesNotMatch(html, /td-eyebrow|td-home-hero|td-mosaic|hero-kicker|SELECTED WORK|JOINT DEVELOPMENT|공동개발 파트너|박사|진학|이직|PhD|admission/i, `${file}: no Spatial Signal residue or career wording`);
  }
});
```

  **Replace** `Task 3 Contact asks joint-development partners for problem, data or sensors, validation, and schedule` (1445) with:

```js
test('Scholar Contact invites research collaboration in neutral wording', () => {
  const pages = [
    ['contact/index.html', [/공동연구/, /연구 협력/, /문제/, /데이터|센서/, /검증/, /일정/]],
    ['en/contact/index.html', [/joint research/i, /research collaboration/i, /problem/i, /data|sensors/i, /validation/i, /schedule/i]]
  ];
  for (const [file, patterns] of pages) {
    const html = read(file);
    for (const pattern of patterns) assert.match(html, pattern, `${file}: ${pattern}`);
    assert.match(html, /mailto:uiop3847@naver\.com/);
    assert.match(html, /https:\/\/github\.com\/rafaam11/);
    assert.ok(count(html.match(/<main[\s\S]*<\/main>/)?.[0] || '', '<p') <= 4, `${file}: at most three paragraphs plus the link line`);
    assert.doesNotMatch(html, /<form\b|response time|consultation|채용|박사|진학|이직|PhD|admission|graduate program|job change|td-eyebrow|hero-kicker/i);
  }
});
```

  **Replace** the three CSS tests `Task 3 technical-document CSS exposes …` (1459), `Task 3 review technical-document CSS stays narrow …` (1471), `Task 3 review case block title scale …` (1484) and `Task 6 follow-up keeps a compact runtime-only technical-document CSS contract` (3825) with:

```js
test('Scholar CSS keeps the quiet researcher palette and no decorative devices', () => {
  const siteCss = read('css/site.css');
  const scholarCss = read('css/scholar.css');
  const css = `${siteCss}\n${scholarCss}`;
  assert.equal(fs.existsSync(path.join(root, 'css', 'spatial-signal.css')), false, 'spatial-signal.css must be deleted');
  for (const value of ['#1a1a1a', '#555', '#e5e5e5', '#1a56db', '--sc-max: 880px']) assert.match(css, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.doesNotMatch(css, /text-transform\s*:\s*uppercase|ui-monospace|SFMono|gradient|box-shadow|--td-|\.td-(?!shell|site-nav|site-footer|cv-|section-heading)/i);
  for (const selector of ['.td-shell', '.td-site-nav', '.td-site-footer', '.td-shell .ss-skip-link', '.sc-intro', '.sc-project-list', '.sc-project', '.sc-project__thumb', '.sc-figure', '.sc-gallery__grid', '.sc-highlights', '.sc-case', '.sc-contact', '.hero-kicker']) {
    assert.ok(cssRuleBodies(css, selector).length, `missing selector ${selector}`);
  }
  assert.ok(cssRuleBodies(siteCss, '.td-site-nav .nav-link').some((body) => /min-height\s*:\s*44px/.test(body)));
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.ok(cssAtRuleBodies(scholarCss, /@media\s*\(max-width:\s*700px\)/i).some((body) => /\.sc-project[\s\S]*grid-template-columns:\s*1fr/.test(body)));
  assert.ok(cssAtRuleBodies(scholarCss, /@media\s*\(max-width:\s*760px\)/i).some((body) => /\.sc-gallery__grid[\s\S]*grid-template-columns:\s*1fr/.test(body)));
  assert.ok(siteCss.split(/\r?\n/).length <= 160, 'site.css stays a small shared shell');
  assert.ok(scholarCss.split(/\r?\n/).length <= 300, 'scholar.css stays compact');
  const ssClasses = [...new Set([...css.matchAll(/\.((?:ss)-[a-z0-9_-]+)/gi)].map((match) => match[1]))].sort();
  assert.deepEqual(ssClasses, ['ss-skip-link']);
});
```

  **Add** a highlights-data consistency test:

```js
test('Scholar highlights data mirrors the approved public CV signals', () => {
  assert.ok(data.highlights, 'portfolio data exports highlights');
  assert.deepEqual(render.dataErrors(data).filter((error) => /highlight/i.test(error)), []);
  assert.equal(data.highlights.publications.length, 3);
  assert.equal(data.highlights.publications[0].href, 'https://link.springer.com/article/10.1007/s10278-024-01014-z');
  assert.deepEqual([data.highlights.patents.filed, data.highlights.patents.registered], [7, 3]);
  assert.equal(data.highlights.patents.items.length, 3);
  assert.ok(data.highlights.patents.items.every((item) => item.status === 'registered'));
  assert.equal(data.highlights.awards.length, 9);
  assert.doesNotMatch(JSON.stringify(data.highlights), /\b10-\d{4}-\d+\b|홍재성|안재명|강영남|최현석/);
});
```

  **Update** `Task 5 CV pages provide localized PDF object, raster previews, open, and download fallbacks` (1609): no change needed if Step 5 keeps the phrases `3D 정합과 로봇 소프트웨어` / `3D registration and robot software`, `PDF 열기`/`PDF 다운로드`, `Open PDF`/`Download PDF`.

- [ ] **Step 2: Run to verify they fail**

Run: `node --test --test-name-pattern="Scholar (Home|Contact|CSS|highlights data)" tests/portfolio.test.cjs`
Expected: FAIL (files/markup/data missing).

- [ ] **Step 3: Write `css/scholar.css`** (tokens + components; keep under 300 lines):

```css
/* Scholar — researcher-style visual system (2026-08-21) */
:root {
  --sc-bg: #fff;
  --sc-ink: #1a1a1a;
  --sc-muted: #555;
  --sc-rule: #e5e5e5;
  --sc-link: #1a56db;
  --sc-max: 880px;
  --sc-body: 1.0625rem;
}

.td-shell { color: var(--sc-ink); background: var(--sc-bg); font-size: var(--sc-body); line-height: 1.7; word-break: keep-all; overflow-wrap: break-word; }
.td-shell #main-content { display: block; width: min(calc(100% - 2.5rem), var(--sc-max)); margin: 0 auto; padding-bottom: 3rem; }
.td-shell a { color: var(--sc-link); text-decoration: underline; text-underline-offset: .2em; text-decoration-thickness: 1px; }
.td-shell a:hover { text-decoration-thickness: 2px; }
.td-shell a:focus-visible, .td-shell video:focus-visible, .td-shell [tabindex]:focus-visible { outline: 2px solid var(--sc-link); outline-offset: 3px; }
.td-shell h1, .td-shell h2, .td-shell h3, .td-shell h4 { margin: 0; color: var(--sc-ink); font-weight: 700; line-height: 1.3; letter-spacing: -.01em; }
.td-shell h1 { font-size: 1.9rem; }
.td-shell h2 { font-size: 1.35rem; margin-top: 3rem; padding-bottom: .4rem; border-bottom: 1px solid var(--sc-rule); }
.td-shell h3 { font-size: 1.1rem; margin-top: 1.75rem; }
.td-shell h4 { font-size: var(--sc-body); }
.td-shell p { margin: .6rem 0 0; }
.td-shell img, .td-shell video { max-width: 100%; height: auto; }
.hero-kicker { margin: 0 0 .35rem; color: var(--sc-muted); font-size: .9rem; }
.td-section-heading p { margin-top: .35rem; }

/* Home intro */
.sc-intro { display: grid; grid-template-columns: 1fr auto; gap: 1.5rem 2.5rem; align-items: start; padding: 3rem 0 2rem; border-bottom: 1px solid var(--sc-rule); }
.sc-intro h1 span[lang="en"] { display: block; color: var(--sc-muted); font-weight: 500; font-size: 1.1rem; letter-spacing: 0; }
.sc-intro__lede { font-size: 1.15rem; }
.sc-intro__affiliation { color: var(--sc-muted); }
.sc-intro__links { margin-top: .9rem; }
.sc-intro__photo { width: 160px; height: 160px; object-fit: cover; border-radius: 4px; }
.sc-capabilities { color: var(--sc-ink); }
.sc-capabilities strong { font-weight: 600; }

/* Project rows */
.sc-group__title { margin-top: 1.75rem; }
.sc-project-list { list-style: none; margin: .75rem 0 0; padding: 0; }
.sc-project { display: grid; grid-template-columns: 200px 1fr; gap: 1.25rem; padding: 1.1rem 0; border-top: 1px solid var(--sc-rule); }
.sc-project:first-child { border-top: 0; }
.sc-project--text { grid-template-columns: 1fr; }
.sc-project__thumb { display: block; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 3px; background: var(--sc-rule); }
.sc-project__thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sc-project__title { margin: 0; font-size: 1.1rem; }
.sc-project__title a { color: var(--sc-ink); text-decoration: none; }
.sc-project__title a:hover { text-decoration: underline; }
.sc-project__meta { margin-top: .15rem; color: var(--sc-muted); font-size: .95rem; }
.sc-project__summary { margin-top: .4rem; }
.sc-project__facts { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; margin: .75rem 0 0; }
.sc-project__facts div { display: contents; }
.sc-project__facts dt { color: var(--sc-muted); font-weight: 500; }
.sc-project__facts dd { margin: 0; }
.sc-project__links { margin-top: .5rem; font-size: .95rem; }
.sc-project-list--fallback .sc-project { display: block; padding: .35rem 0; border: 0; }

/* Highlights */
.sc-highlights__group h3 { margin-top: 1.5rem; }
.sc-highlights__note { color: var(--sc-muted); }
.sc-list { margin: .5rem 0 0; padding-left: 1.4rem; }
.sc-list li { margin: .3rem 0; }
.sc-list__year { color: var(--sc-muted); margin-right: .35rem; }
.sc-list__venue { color: var(--sc-muted); }
.sc-contact { padding-bottom: 1rem; }

/* Page headers (Projects, CV, Contact) */
.sc-page-header { padding: 3rem 0 1.5rem; border-bottom: 1px solid var(--sc-rule); }
.sc-page-header h1 { margin: 0; }
.sc-page-header p { max-width: 64ch; color: var(--sc-muted); }
.td-cv-actions a { margin-right: 1rem; }

/* Case article */
.sc-case__header { padding: 3rem 0 1.5rem; border-bottom: 1px solid var(--sc-rule); }
.sc-case__header h1 small { display: block; margin-top: .35rem; color: var(--sc-muted); font-size: 1rem; font-weight: 500; }
.sc-case__meta { color: var(--sc-muted); font-size: .95rem; }
.sc-case__thesis { font-size: 1.15rem; }
.sc-case__section h2 { margin-top: 2.5rem; }
.sc-case__section > p { max-width: 70ch; }
.sc-block { margin-top: 1.25rem; }
.sc-block h3 { margin-top: 0; font-size: 1rem; }
.sc-block ul { margin: .4rem 0 0; padding-left: 1.3rem; }
.sc-subcases { margin: .5rem 0 0; padding-left: 1.3rem; }
.sc-case__links { margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid var(--sc-rule); }

/* Figures and gallery */
.sc-figure { margin: 2rem 0 0; }
.sc-figure img, .sc-figure video { display: block; width: 100%; border-radius: 3px; background: var(--sc-rule); }
.sc-figure figcaption { margin-top: .5rem; color: var(--sc-muted); font-size: .95rem; line-height: 1.5; }
.sc-figure__label { color: var(--sc-ink); font-weight: 600; }
.sc-gallery { margin-top: 2.5rem; }
.sc-gallery__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 1.25rem; }
.sc-figure--gallery { margin: 0; }
.sc-figure--gallery img { aspect-ratio: 4 / 3; object-fit: cover; }

@media (max-width: 900px) {
  .td-shell #main-content { width: min(calc(100% - 1.5rem), var(--sc-max)); }
}

@media (max-width: 760px) {
  .sc-intro { grid-template-columns: 1fr; }
  .sc-intro__photo { order: -1; width: 120px; height: 120px; }
  .sc-gallery__grid { grid-template-columns: 1fr; }
  .sc-project__facts { grid-template-columns: 1fr; }
}

@media (max-width: 700px) {
  .td-shell h1 { font-size: 1.6rem; }
  .sc-project { grid-template-columns: 1fr; }
  .sc-project__thumb { max-width: 320px; }
}

@media (prefers-reduced-motion: reduce) {
  .td-shell *, .td-shell *::before, .td-shell *::after { scroll-behavior: auto !important; animation: none !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 4: Rewrite `css/site.css`** (nav/footer on the same tokens; ≤160 lines):

```css
/* Shared shell: navigation, footer, accessible base (Scholar tokens). */
.td-shell { margin: 0; color: var(--sc-ink, #1a1a1a); background: var(--sc-bg, #fff); font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.td-shell *, .td-shell *::before, .td-shell *::after { box-sizing: border-box; }

.td-shell .ss-skip-link { position: fixed; inset: .5rem auto auto .5rem; z-index: 100; padding: .7rem 1rem; color: #fff; background: #1a1a1a; transform: translateY(-160%); }
.td-shell .ss-skip-link:focus { transform: translateY(0); }

.td-site-nav { border-bottom: 1px solid var(--sc-rule, #e5e5e5); background: var(--sc-bg, #fff); }
.td-site-nav__inner { display: grid; grid-template-columns: minmax(10rem, 1fr) auto auto; align-items: center; gap: 1.25rem; width: min(calc(100% - 2.5rem), var(--sc-max, 880px)); min-height: 60px; margin: 0 auto; }
.td-site-nav__brand { color: var(--sc-ink, #1a1a1a); font-weight: 700; text-decoration: none; }
.td-site-nav__links { display: flex; gap: .25rem; margin: 0; padding: 0; list-style: none; }
.td-site-nav .nav-link, .td-site-nav .language-option { display: inline-flex; align-items: center; min-height: 44px; padding: .5rem .6rem; color: var(--sc-muted, #555); text-decoration: none; }
.td-site-nav .nav-link:hover, .td-site-nav .language-option:hover { color: var(--sc-ink, #1a1a1a); text-decoration: underline; text-underline-offset: .25rem; }
.td-site-nav .nav-link[aria-current="page"], .td-site-nav .nav-link[aria-current="location"], .td-site-nav .language-option[aria-current="page"] { color: var(--sc-ink, #1a1a1a); font-weight: 600; }
.td-site-nav .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.td-site-nav .language-switch { display: flex; align-items: center; gap: .15rem; color: var(--sc-muted, #555); white-space: nowrap; }
.td-site-nav a:focus-visible { outline: 2px solid var(--sc-link, #1a56db); outline-offset: 2px; }

.td-site-footer { margin-top: 3rem; border-top: 1px solid var(--sc-rule, #e5e5e5); }
.td-site-footer__inner { display: grid; grid-template-columns: 1fr auto; gap: .75rem 2rem; width: min(calc(100% - 2.5rem), var(--sc-max, 880px)); margin: 0 auto; padding: 1.5rem 0 2rem; color: var(--sc-muted, #555); font-size: .95rem; }
.td-site-footer__inner p { margin: .2rem 0 0; }
.td-site-footer__links { display: flex; gap: 1rem; align-items: flex-start; }
.td-site-footer__links a { color: var(--sc-link, #1a56db); }
.td-site-footer__meta { grid-column: 1 / -1; }

@media (max-width: 700px) {
  .td-site-nav__inner { grid-template-columns: 1fr auto; gap: 0 .5rem; padding: .3rem 0; }
  .td-site-nav__links { grid-column: 1 / -1; grid-row: 2; justify-content: space-between; border-top: 1px solid var(--sc-rule, #e5e5e5); }
  .td-site-nav .nav-link { padding: .5rem .35rem; }
  .td-site-footer__inner { grid-template-columns: 1fr; }
}
```
  Then `git rm css/spatial-signal.css`.

- [ ] **Step 5: Rewrite the Home shells.** `index.html`:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="3D 정합·의료영상·로봇 시스템을 연구에서 현장까지 잇는 로봇SW 엔지니어 김진민의 포트폴리오입니다.">
  <meta name="author" content="Jinmin Kim">
  <link rel="canonical" href="https://rafaam11.github.io/">
  <link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/">
  <link rel="alternate" hreflang="en" href="https://rafaam11.github.io/en/">
  <link rel="alternate" hreflang="x-default" href="https://rafaam11.github.io/">
  <title>김진민 · 로봇SW 엔지니어</title>
  <link rel="icon" href="assets/img/favicon.ico">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">
  <link rel="stylesheet" href="css/site.css">
  <link rel="stylesheet" href="css/scholar.css">
</head>
<body class="td-shell sc-home" data-base="" data-page="home" data-lang="ko" data-route="">
  <header id="site-nav"></header>
  <main id="main-content" tabindex="-1">
    <section class="sc-intro" aria-labelledby="home-title">
      <div>
        <h1 id="home-title">김진민 <span lang="en">Jinmin Kim</span></h1>
        <p class="sc-intro__lede">3D 정합·의료영상·로봇 시스템을 연구에서 현장까지 잇는 로봇SW 엔지니어입니다.</p>
        <p class="sc-intro__affiliation">㈜디지트랙 연구개발부 연구원 · 로봇SW 개발<br>DGIST 로봇공학 석사 (수술로봇및증강현실연구실)</p>
        <p class="sc-intro__links"><a href="mailto:uiop3847@naver.com">Email</a> · <a href="https://github.com/rafaam11" target="_blank" rel="noopener">GitHub</a> · <a href="https://www.linkedin.com/in/rlawlsals" target="_blank" rel="noopener">LinkedIn</a> · <a href="assets/cv/jinmin-kim-cv-ko.pdf" target="_blank" rel="noopener">CV (PDF)</a></p>
      </div>
      <img class="sc-intro__photo" src="assets/img/profile_square.webp" alt="김진민 프로필 사진" width="160" height="160">
    </section>

    <section aria-labelledby="interests-title">
      <h2 id="interests-title">관심 분야와 역량</h2>
      <div data-portfolio="capability-index"><p>3D 기하 및 정합 · 센서 융합 및 위치추정 · 의료 내비게이션 및 시각화 · XR 애플리케이션 엔지니어링 · AI 활용 제품 엔지니어링</p></div>
    </section>

    <section aria-labelledby="projects-title">
      <h2 id="projects-title">프로젝트</h2>
      <div data-portfolio="home-projects">
        <ol class="sc-project-list sc-project-list--fallback">
          <li class="sc-project"><a href="projects/surgical-navigation/index.html">수술내비게이션 시스템</a></li>
          <li class="sc-project"><a href="projects/mandibular-fracture/index.html">하악골 골절 정복 최적화</a></li>
          <li class="sc-project"><a href="projects/life-careverse/index.html">Life Careverse - 멀티유저 XR</a></li>
          <li class="sc-project"><a href="projects/rtms-navigation/index.html">rTMS 내비게이션 프로토타입</a></li>
          <li class="sc-project"><a href="projects/unmanned-forklift/index.html">무인지게차 다중 센서 정합</a></li>
          <li class="sc-project"><a href="projects/ai-build-lab/index.html">AI Build Lab - 필요한 도구를 직접 만든다</a></li>
        </ol>
      </div>
    </section>

    <section aria-labelledby="highlights-title">
      <h2 id="highlights-title">논문 · 특허 · 수상</h2>
      <div data-portfolio="home-highlights"><p>논문 3편 · 특허 출원 7건(등록 3건) · 수상 9건 — 상세는 <a href="cv/index.html" data-root-dir="cv/">CV</a>에 있습니다.</p></div>
    </section>

    <section class="sc-contact" aria-labelledby="contact-title">
      <h2 id="contact-title">연락</h2>
      <p>공동연구·연구 협력 문의를 환영합니다. <a href="mailto:uiop3847@naver.com">uiop3847@naver.com</a> · <a href="contact/index.html" data-root-dir="contact/">연락처 안내</a></p>
    </section>
  </main>
  <footer id="site-footer"></footer>
  <script src="js/site-i18n.js"></script>
  <script src="js/portfolio-data.js"></script>
  <script src="js/portfolio-render.js"></script>
  <script src="js/nav.js"></script>
</body>
</html>
```
  The fallback titles must equal `translations.ko.title` of each project in data order (the test compares). `en/index.html`: same structure with `lang="en"`, `data-base="../"`, `data-lang="en"`, canonical `https://rafaam11.github.io/en/`, asset paths prefixed `../`, script/css paths prefixed `../`, fallback hrefs `projects/<slug>/index.html` (relative to `/en/`), and copy:
  - title `Jinmin Kim · Robot Software Engineer`; description `Portfolio of Jinmin Kim, a robot software engineer who carries 3D registration, medical imaging, and robot systems from research to the field.`
  - h1 `Jinmin Kim <span lang="ko">김진민</span>`; lede `A robot software engineer who carries 3D registration, medical imaging, and robot systems from research to field deployment.`; affiliation `Researcher, R&D Division, DIGITRACK Inc. · Robot software<br>M.S. in Robotics, DGIST (Surgical Robotics and Augmented Reality Lab)`; links `Email · GitHub · LinkedIn · CV (PDF)` → `../assets/cv/jinmin-kim-cv-en.pdf`; photo alt `Portrait of Jinmin Kim`.
  - h2s: `Interests and capabilities`, `Projects`, `Publications · Patents · Awards`, `Contact`; capability fallback `3D geometry and registration · sensor fusion and localization · medical navigation and visualization · XR application engineering · product engineering with AI`; highlights fallback `3 publications · 7 patent applications (3 registered) · 9 awards — details in the <a href="cv/index.html" data-root-dir="cv/">CV</a>.`; contact `Joint research and research collaboration enquiries are welcome. <a href="mailto:uiop3847@naver.com">uiop3847@naver.com</a> · <a href="contact/index.html" data-root-dir="contact/">Contact details</a>`; fallback titles = `translations.en.title` in data order.

- [ ] **Step 6: Rewrite the Projects shells.** `projects/index.html` head as before but `css/scholar.css` instead of `spatial-signal.css`, description `의료 코어, 플랫폼 소프트웨어, 산업, AI 빌드 랩으로 묶은 프로젝트 목록입니다.`; body:

```html
<body class="td-shell sc-projects" data-base="../" data-page="projects" data-lang="ko" data-route="projects/">
  <header id="site-nav"></header>
  <main id="main-content" tabindex="-1">
    <header class="sc-page-header">
      <h1>프로젝트</h1>
      <p>그룹별로 문제, 내 역할, 공개 근거를 구분해 정리합니다. 팀 결과와 개인 역할을 섞지 않고, 미디어는 공개 승인된 파생본만 싣습니다.</p>
    </header>
    <div data-portfolio="project-groups">
      <section class="sc-group" data-tier="medical-core"><h2 class="sc-group__title">의료 코어</h2><ol class="sc-project-list sc-project-list--fallback"><li class="sc-project"><a href="surgical-navigation/index.html">수술내비게이션 시스템</a></li><li class="sc-project"><a href="mandibular-fracture/index.html">하악골 골절 정복 최적화</a></li><li class="sc-project"><a href="life-careverse/index.html">Life Careverse - 멀티유저 XR</a></li><li class="sc-project"><a href="rtms-navigation/index.html">rTMS 내비게이션 프로토타입</a></li></ol></section>
      <section class="sc-group" data-tier="industrial-spotlight"><h2 class="sc-group__title">산업 스포트라이트</h2><ol class="sc-project-list sc-project-list--fallback"><li class="sc-project"><a href="unmanned-forklift/index.html">무인지게차 다중 센서 정합</a></li></ol></section>
      <section class="sc-group" data-tier="ai-build-lab"><h2 class="sc-group__title">AI 빌드 랩</h2><ol class="sc-project-list sc-project-list--fallback"><li class="sc-project"><a href="ai-build-lab/index.html">AI Build Lab - 필요한 도구를 직접 만든다</a></li></ol></section>
    </div>
  </main>
  <footer id="site-footer"></footer>
  <script src="../js/site-i18n.js"></script>
  <script src="../js/portfolio-data.js"></script>
  <script src="../js/portfolio-render.js"></script>
  <script src="../js/nav.js"></script>
</body>
```
  `en/projects/index.html`: `Projects` / `Projects are grouped by area. Each entry separates the problem, my role, and public evidence; media appears only as approved derivatives.`; group labels `Medical Core`, `Industrial Spotlight`, `AI Build Lab`; English titles; `data-base="../../"`.

- [ ] **Step 7: Rewrite the Contact shells.** `contact/index.html` body (head: title `연락처 · Jinmin Kim`, description `김진민에게 공동연구·연구 협력 문의를 보내는 방법입니다.`, scholar.css):

```html
<body class="td-shell sc-contact-page" data-base="../" data-page="contact" data-lang="ko" data-route="contact/">
  <header id="site-nav"></header>
  <main id="main-content" tabindex="-1">
    <header class="sc-page-header"><h1>연락처</h1></header>
    <p>공동연구·연구 협력 문의를 환영합니다. 3D 정합, 의료영상, 수술내비게이션, XR, 로봇 인지와 센서 통합에 관한 질문이면 메일로 보내 주세요.</p>
    <p>첫 메일에 풀려는 문제, 사용 가능한 데이터와 센서, 원하는 검증 수준(프로토타입·반복 실험·현장 통합), 일정을 적어 주시면 빠르게 답할 수 있습니다.</p>
    <p><a href="mailto:uiop3847@naver.com">uiop3847@naver.com</a> · <a href="https://github.com/rafaam11" target="_blank" rel="noopener">github.com/rafaam11</a> · <a href="https://www.linkedin.com/in/rlawlsals" target="_blank" rel="noopener">linkedin.com/in/rlawlsals</a></p>
  </main>
  <footer id="site-footer"></footer>
  <script src="../js/site-i18n.js"></script>
  <script src="../js/nav.js"></script>
</body>
```
  `en/contact/index.html`: `Contact` / `Joint research and research collaboration enquiries are welcome. Email me about 3D registration, medical imaging, surgical navigation, XR, or robot perception and sensor integration.` / `A first email that names the problem, the available data and sensors, the validation level you need (prototype, repeated experiments, or field integration), and the schedule gets the fastest reply.` / same link line.

- [ ] **Step 8: Restyle the CV shells (header only).** In `cv/index.html` and `en/cv/index.html`: swap `css/spatial-signal.css` → `css/scholar.css`; replace the `<header class="td-page-header td-cv-hero">…</header>` block with

```html
    <header class="sc-page-header td-cv-hero">
      <h1>3D 정합과 로봇 소프트웨어를 실제 시스템으로 연결합니다.</h1>
      <p>의료 내비게이션에서 시작해 XR, 3D 정합, 다중 센서 통합으로 확장해 온 연구개발 엔지니어입니다. 아래 2페이지 문서는 승인된 공개 사실과 사용·구현 경험만 담습니다.</p>
      <nav class="td-cv-actions" aria-label="이력서 문서 작업">
        <a href="../assets/cv/jinmin-kim-cv-ko.pdf" target="_blank" rel="noopener">PDF 열기</a>
        <a href="../assets/cv/jinmin-kim-cv-ko.pdf" download>PDF 다운로드</a>
      </nav>
    </header>
```
  (English page: keep its existing heading/paragraph text — they contain `3D registration and robot software` — and drop only the `hero-kicker` line.) Also replace `<p class="hero-kicker">CURRICULUM VITAE</p>` in the document section with nothing. **Do not touch** anything between `<!-- PUBLIC CV SUMMARY:START -->` and `<!-- PUBLIC CV SUMMARY:END -->` (generated, digest-checked).

- [ ] **Step 9: Case shells (12 files)** — run from the repo root:

```bash
for f in projects/*/index.html en/projects/*/index.html; do
  sed -i 's#css/spatial-signal.css#css/scholar.css#; s#td-shell td-case-page#td-shell sc-case-page#' "$f"
done
```
  Verify: `grep -rl "spatial-signal" --include=*.html . | grep -v "^./public/"` prints nothing.

- [ ] **Step 10: Validator stylesheet contract** — `scripts/validate-portfolio.cjs:1860`: `const requiredStyles = [\`${base}css/site.css\`, \`${base}css/scholar.css\`];`. Also add `'css/spatial-signal.css'` to `standaloneLegacyFiles` in both `scripts/validate-portfolio.cjs` and `tests/portfolio.test.cjs` so the old file can never come back.

- [ ] **Step 11: Add highlights data** — in `js/portfolio-data.js` before `var projects = [` add:

```js
  var highlights = {
    publications: [
      { year: '2024', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: {
        ko: { title: 'A Proof of Concept: Optimized Jawbone-Reduction Model for Mandibular Fracture Surgery', venue: 'Journal of Imaging Informatics in Medicine (SCIE Q1) · 공동 제1저자' },
        en: { title: 'A Proof of Concept: Optimized Jawbone-Reduction Model for Mandibular Fracture Surgery', venue: 'Journal of Imaging Informatics in Medicine (SCIE Q1) · joint first author' } } },
      { year: '2022', translations: {
        ko: { title: 'Dental Occlusion Model Using Arch Line for Mandibular Fracture Surgery', venue: 'ACCAS 2022, Bangkok · 구두 발표' },
        en: { title: 'Dental Occlusion Model Using Arch Line for Mandibular Fracture Surgery', venue: 'ACCAS 2022, Bangkok · oral presentation' } } },
      { year: '2019', translations: {
        ko: { title: 'Design of Ping-Pong Ball Launcher', venue: 'ISM 2019 — International Symposium on Mechatronics' },
        en: { title: 'Design of Ping-Pong Ball Launcher', venue: 'ISM 2019 — International Symposium on Mechatronics' } } }
    ],
    patents: {
      filed: 7,
      registered: 3,
      items: [
        { year: '2024', status: 'registered', translations: { ko: { title: '수술도구의 실시간 3차원 위치추적을 위한 좌표계 정합 방법' }, en: { title: 'Coordinate-system registration method for real-time 3D tracking of surgical instruments' } } },
        { year: '2024', status: 'registered', translations: { ko: { title: '위치 추적 장치 및 방법' }, en: { title: 'Position tracking apparatus and method' } } },
        { year: '2015', status: 'registered', translations: { ko: { title: '일회용 종이컵 수거함' }, en: { title: 'Disposable paper-cup collection box' } } }
      ]
    },
    awards: [
      { year: '2024', translations: { ko: { title: '의료메타버스학회 우수포스터상' }, en: { title: 'Best Poster Award, Korean Society of Medical Metaverse' } } },
      { year: '2023', translations: { ko: { title: '대한의료로봇학회 우수논문상' }, en: { title: 'Best Paper Award, Korean Society of Medical Robotics' } } },
      { year: '2020', translations: { ko: { title: 'KIT 엔지니어링 페어 장려상 (4족 보행 로봇)' }, en: { title: 'Encouragement Award, KIT Engineering Fair (quadruped robot)' } } },
      { year: '2020', translations: { ko: { title: 'ROS 기반 자율주행 교육 동상' }, en: { title: 'Bronze Prize, ROS-based Autonomous Driving Course' } } },
      { year: '2019', translations: { ko: { title: '국제 TRIZ 경진대회 대상' }, en: { title: 'Grand Prize, International TRIZ Competition' } } },
      { year: '2019', translations: { ko: { title: '창업아이디어 경진대회 최우수상' }, en: { title: 'First Prize, Startup Idea Competition' } } },
      { year: '2019', translations: { ko: { title: '효성 GREEN 지구 공모전 우수상' }, en: { title: 'Excellence Award, Hyosung GREEN Earth Contest' } } },
      { year: '2019', translations: { ko: { title: '대학창의발명대회 후원기관상' }, en: { title: 'Sponsor Award, University Creative Invention Contest' } } },
      { year: '2015', translations: { ko: { title: '대학창의발명대회 우수상' }, en: { title: 'Excellence Award, University Creative Invention Contest' } } }
    ]
  };
```
  and add `highlights: highlights,` to the returned object. (Nine awards match the public CV count; no patent numbers; no person names.)

- [ ] **Step 12: Docs** — `AGENTS.md`: replace `css/spatial-signal.css  # Active technical-document visual layer` with `css/scholar.css                   # Researcher-style visual system (2026-08-21)`; in Architecture notes add `- Home mounts: capability-index, home-projects, home-highlights; Projects mounts project-groups; case shells mount case-study. The hero mosaic and media ledger are removed; do not restore them.`; update the Positioning line to `3D registration · medical imaging · robot systems — research to field` and Audience to `연구 협력자(의료영상·3D 정합)와 일반 방문자(리크루터·지인)`. `README.md`: first paragraph → `Jinmin Kim의 연구자풍 포트폴리오입니다…`, remove the phrase about six cases (Task 5 sets the final eight).

- [ ] **Step 13: Run everything**

Run: `node --test && node scripts/validate-portfolio.cjs && git diff --check`
Expected: all pass. If `validate-portfolio.cjs` reports `index.html: contains a nonpublic partner…`, the word came from a name still in `prohibitedPartnerPattern` — the intro uses only 디지트랙/DIGITRACK (allowed after Task 1).

- [ ] **Step 14: Preview** — `python -m http.server 8000` then open `http://localhost:8000/`, `/en/`, `/projects/`, `/projects/mandibular-fracture/`, `/en/projects/unmanned-forklift/`, `/cv/`, `/contact/` at ≥1200px and ≤420px widths; also open `index.html` via `file://`. Check: no uppercase labels, no boxes/chips, links blue, photo 160px, project rows text-only (no media yet), highlights lists present, footer tagline neutral. Stop the server.

- [ ] **Step 15: Commit**

```bash
git add -A css index.html en/index.html projects en/projects contact en/contact cv en/cv js/portfolio-data.js scripts/validate-portfolio.cjs tests/portfolio.test.cjs AGENTS.md README.md
git commit -m "feat(design): Scholar stylesheet and page shells; publications, patents, awards on Home"
```

---

### Task 5: Register the two new cases and regenerate PDFs

**Files:**
- Modify: `js/site-i18n.js:6-13`, `js/portfolio-render.js` (`tierKeys`, `projectSlugs`, `pdfDiagramKindsBySlug`, messages "exactly three tiers"/"exactly six projects"), `js/portfolio-data.js` (tiers, two records, `gallery: []` on all records)
- Create: `projects/respiratory-surface-guidance/index.html`, `en/projects/respiratory-surface-guidance/index.html`, `projects/skadi-tracking-software/index.html`, `en/projects/skadi-tracking-software/index.html`, `assets/projects/respiratory-surface-guidance/README.md`, `assets/projects/skadi-tracking-software/README.md`
- Modify: `assets/projects/EVIDENCE_REGISTER.md`, `index.html`, `en/index.html`, `projects/index.html`, `en/projects/index.html` (fallback lists)
- Modify: `scripts/validate-portfolio.cjs:30-40` (`excludedProjectSlugs`), `scripts/generate-portfolio-pdfs.py` (`EXPECTED_SLUGS`, `EXPECTED_DIAGRAM_KIND`, tiers `3`→`4` at `require_array(payload.get("tiers"), "PDF input tiers", 3)`, two diagram branches, manifest `32`→`40`)
- Modify: `tests/portfolio.test.cjs` (`slugs`, `tierKeys`, `excludedProjectSlugs`, literal counts), `README.md`, `AGENTS.md`
- Regenerate: `output/pdf/*`, `assets/pdfs/*`, `assets/cv/*` via the exporter/generator

**Interfaces:**
- Produces: 8 ordered slugs `['surgical-navigation','mandibular-fracture','life-careverse','rtms-navigation','respiratory-surface-guidance','skadi-tracking-software','unmanned-forklift','ai-build-lab']`; tiers `['medical-core','platform','industrial-spotlight','ai-build-lab']`; diagram kinds `surface-gating-chain`, `tracking-sdk-stack`; register 14 rows (11 pending, 3 approved).

- [ ] **Step 1: Update the test constants first (they drive the failing state)** — `tests/portfolio.test.cjs`:
  - `slugs` (line 20) → the 8-slug order above.
  - `tierKeys` (line 35) → `['medical-core', 'platform', 'industrial-spotlight', 'ai-build-lab']`.
  - `excludedProjectSlugs` (line 83-93): remove `'respiratory-surface-guidance'`.
  - `Task 4 public evidence register…` (382): `register.entries.length` → `14`; distribution `{ 'pending-review': 11, 'approved-public': 3, excluded: 0 }`.
  - `Task 3 review preserves literal tier and evidence-state mappings` (943): tiers list → add `['platform', '플랫폼 소프트웨어', 'Platform Software']` after medical-core; project tuples → insert `['respiratory-surface-guidance', 'medical-core', 'ongoing']`, `['skadi-tracking-software', 'platform', 'ongoing']` after rtms-navigation.
  - `route descriptors keep four public pages and six paired case routes` (997): `20` → `24` (both asserts); rename to `…eight paired case routes`.
  - `Task 5 lifecycle follow-up…` (1554): add `'respiratory-surface-guidance': { ko: '진행 중 · 연구', en: 'Ongoing · Research' }` and `'skadi-tracking-software': { ko: '진행 중', en: 'Ongoing' }` after rtms-navigation.
  - `Task 5 integrated review requires four project-specific middle blocks and six diagram contracts` (1798): add `['respiratory-surface-guidance', 'surface-gating-chain']`, `['skadi-tracking-software', 'tracking-sdk-stack']`; `seenKinds.size` → `8`.
  - `Task 5 generator publishes CV previews and digest manifest…` (1741-1778): `manifest.artifacts.length` `32` → `40`.
  - `Integrated review separates evidence maturity from project lifecycle` (3660): insert `['respiratory-surface-guidance', 'ongoing', 'research']`, `['skadi-tracking-software', 'ongoing', 'ongoing']` after rtms-navigation; add `assert.match(projectsHtml, /Ongoing · Research/);`.
  - Test titles containing "twelve"/"six"/"twenty" (1352, 1522, 1554, 1798, 2691): change to "sixteen"/"eight"/"twenty-four".

- [ ] **Step 2: Run to verify the suite fails on the new contract**

Run: `node --test 2>&1 | tail -30`
Expected: FAIL — ordering/count mismatches against the 6-project data.

- [ ] **Step 3: Slug and tier registration (5 files, same order)**
  - `js/site-i18n.js` `canonicalCaseSlugs` → 8 slugs.
  - `js/portfolio-render.js`: `tierKeys = ['medical-core', 'platform', 'industrial-spotlight', 'ai-build-lab']`; `projectSlugs` → 8; `pdfDiagramKindsBySlug` add `'respiratory-surface-guidance': 'surface-gating-chain'`, `'skadi-tracking-software': 'tracking-sdk-stack'`; messages → `'Portfolio data must contain exactly four tiers.'`, `'Portfolio data must contain exactly eight projects.'`.
  - `scripts/validate-portfolio.cjs` `excludedProjectSlugs`: remove `'respiratory-surface-guidance'`.
  - `scripts/generate-portfolio-pdfs.py`: `EXPECTED_SLUGS` (8), `EXPECTED_DIAGRAM_KIND` (+2), `require_array(payload.get("tiers"), "PDF input tiers", 4)`, `require(len(manifest["artifacts"]) == 40, "Staged PDF manifest must track exactly 40 artifacts.")`.

- [ ] **Step 4: Data — tiers and gallery arrays** — `js/portfolio-data.js` `tiers`:

```js
  var tiers = [
    { key: 'medical-core', translations: { ko: { label: '의료 코어' }, en: { label: 'Medical Core' } } },
    { key: 'platform', translations: { ko: { label: '플랫폼 소프트웨어' }, en: { label: 'Platform Software' } } },
    { key: 'industrial-spotlight', translations: { ko: { label: '산업 스포트라이트' }, en: { label: 'Industrial Spotlight' } } },
    { key: 'ai-build-lab', translations: { ko: { label: 'AI 빌드 랩' }, en: { label: 'AI Build Lab' } } }
  ];
```
  Add `gallery: []` as the last property of every existing `media: { … }` object (6 records).

- [ ] **Step 5: Data — the two new records**, inserted after the `rtms-navigation` record and before `unmanned-forklift`:

```js
    project({
      slug: 'respiratory-surface-guidance', tier: 'medical-core', period: '2026.06 – present', evidenceState: 'ongoing', lifecycleState: 'research',
      capabilityKeys: ['registration', 'sensor-fusion', 'medical-navigation'], route: 'projects/respiratory-surface-guidance/',
      tech: ['ToF camera', 'Structured light', 'Qt', 'VTK', 'OpenCV', 'Python', '4DCT'],
      media: {
        lead: { id: 'respiratory-surface-guidance-sensor-precision', type: 'image', status: 'pending-approval' },
        gallery: []
      },
      pdf: { ko: 'assets/pdfs/respiratory-surface-guidance-ko.pdf', en: 'assets/pdfs/respiratory-surface-guidance-en.pdf' },
      pdfSequence: {
        middle: ['surface-to-signal', 'sensor-validation', 'measured-precision', 'research-boundary'],
        evidenceId: 'respiratory-surface-guidance-sensor-precision',
        diagram: {
          kind: 'surface-gating-chain',
          translations: {
            ko: { title: '광학 표면에서 게이팅 신호까지', nodes: ['3D 센서', '표면·ROI 깊이', '호흡 파형', '게이팅·정합 출력'] },
            en: { title: 'Optical surface to gating signal', nodes: ['3D sensor', 'Surface and ROI depth', 'Respiratory waveform', 'Gating and registration output'] }
          }
        }
      },
      translations: {
        ko: {
          title: '표면유도 호흡추적 (SGRT)', shortTitle: '표면유도 호흡추적', eyebrow: '의료 코어 · 방사선치료 연구',
          thesis: '환자 체표면을 광학 3D로 읽어 셋업 정합과 호흡 게이팅 신호를 만드는 표면유도 방사선치료(SGRT)의 광학 파트를 국산 센서 스택으로 구성합니다.',
          summary: 'K-LINAC 대과제(주관 한국전기연구원, 세부주관 ETRI)의 디지트랙 위탁 연구로, 원거리 표면 재구성과 근거리 실시간 호흡 추적을 상용 3D 센서로 구현하는 초기 단계 연구입니다.',
          problem: '치료 중 환자의 위치와 호흡을 추가 촬영·피부 마킹 없이 알아야 하는데, 기존 상용 시스템은 고가의 외산이며 센서·알고리즘 선택 근거가 공개되어 있지 않습니다.',
          role: '센서 검증 실험을 총괄하며 자체 검증 도구 DtDepthScan(Qt·VTK·OpenCV)을 개발했고, ROI 깊이에서 호흡 파형과 게이팅 신호를 뽑는 추적 알고리즘 설계·구현, 센서 인터페이스와 전송 프로토콜 정의, 과제 실무를 담당합니다.',
          teamResult: '컨소시엄이 4DCT 재구성, 영상유도 체계, 임상 자문을 나누어 맡고 있으며 임상 기관은 서울성모병원 방사선종양학과입니다. 과제 전체 성과를 개인 성과로 쓰지 않습니다.',
          evidence: '상용 3D 센서 5종을 0.5~3 m 거리에서 실리콘 인체 팬텀으로 측정한 정밀도(σ)·실측 fps·Fill rate 표와 DtDepthScan 화면이 본인 측정 근거입니다.',
          limitation: '2026년 6월 시작한 1차년도 연구로 임상 성능, 과제 목표 달성, 제품화를 주장하지 않으며 과제 목표치·연구비·타 기관 지표는 싣지 않습니다.',
          collaboration: '방사선종양학, 4DCT 재구성, 영상유도 체계, 통합 제어 담당 기관과 인터페이스를 맞춥니다.',
          mediaAlt: '상용 3D 센서 5종의 거리별 정밀도 실측표와 DtDepthScan 검증 도구 화면.', mediaCaption: '센서 실측 결과와 검증 도구 화면은 공개 승인 후 게시합니다.',
          status: '진행 중 · 연구', cardProblem: '추가 촬영 없이 환자 표면과 호흡을 읽는 광학 파트를 국산 센서로 구성합니다.', cardOwnedRole: '센서 검증 실험·검증 도구·호흡 추적 알고리즘·인터페이스를 담당합니다.', cardEvidence: '센서 5종 거리별 정밀도 실측; 임상 성능은 주장하지 않습니다.', problemSummary: '광학 표면 기반 셋업 정합과 호흡 게이팅 신호를 국산 센서로 만듭니다.', ownedRole: '센서 검증·검증 도구·호흡 추적 알고리즘·프로토콜을 담당합니다.', verifiedEvidence: '본인이 측정한 센서 정밀도·fps·Fill rate 표가 근거입니다.', visualAlt: '표면유도 호흡추적 센서 검증.', visualCaption: '실측 미디어는 승인 대기 중입니다.'
        },
        en: {
          title: 'Surface-guided Respiratory Tracking (SGRT)', shortTitle: 'Surface-guided Respiratory Tracking', eyebrow: 'Medical Core · Radiotherapy Research',
          thesis: 'Build the optical part of surface-guided radiotherapy — patient-surface setup registration and respiratory gating — on a domestic 3D sensor stack.',
          summary: 'An early-stage research assignment contracted to DIGITRACK within the K-LINAC programme (led by KERI, imaging sub-project led by ETRI): far-field surface reconstruction and near-field real-time breathing tracking with commercial 3D sensors.',
          problem: 'Patient position and breathing must be known during treatment without extra imaging or skin marks; the existing commercial system is imported and its sensor and algorithm choices are not documented publicly.',
          role: 'Lead the sensor validation campaign and wrote the in-house validation tool DtDepthScan (Qt, VTK, OpenCV); design and implement the breathing-tracking algorithm from ROI depth to respiratory waveform and gating signal; define the sensor interface and transport protocol; run day-to-day project work.',
          teamResult: 'Consortium partners own 4DCT reconstruction, the image-guidance framework, and clinical advice; the clinical partner is the radiation oncology department of Seoul St. Mary\'s Hospital. Programme-level results are not attributed to me.',
          evidence: 'My own measurements: precision (σ), measured fps, and fill rate for five commercial 3D sensors at 0.5–3 m against a silicone body phantom, plus DtDepthScan captures.',
          limitation: 'A first-year study that started in June 2026; no clinical performance, programme-target achievement, or productisation is claimed, and programme targets, budgets, and other institutions\' metrics are not published here.',
          collaboration: 'Interfaces are agreed with radiation oncology, 4DCT reconstruction, image guidance, and integrated-control partners.',
          mediaAlt: 'Measured precision table for five commercial 3D sensors by distance and the DtDepthScan validation tool.', mediaCaption: 'Sensor measurements and tool captures will be published after approval.',
          status: 'Ongoing · Research', cardProblem: 'Read patient surface and breathing without extra imaging, on domestic sensors.', cardOwnedRole: 'Own sensor validation, the validation tool, the breathing-tracking algorithm, and interfaces.', cardEvidence: 'Five-sensor precision measurements; no clinical claim.', problemSummary: 'Surface-based setup registration and gating signals on domestic sensors.', ownedRole: 'Own sensor validation, tooling, tracking algorithm, and protocol.', verifiedEvidence: 'Self-measured precision, fps, and fill-rate tables.', visualAlt: 'Sensor validation for surface-guided respiratory tracking.', visualCaption: 'Measurement media is pending approval.'
        }
      },
      blocks: [
        { key: 'surface-to-signal', type: 'system', translations: { ko: { heading: '표면에서 신호까지', body: '원거리 센서는 표면 재구성과 계획 CT 정합을, 근거리 센서는 흉·복부 ROI 깊이에서 호흡 파형과 게이팅 신호를 맡도록 역할을 나눴습니다.' }, en: { heading: 'Surface to signal', body: 'Far-field sensors reconstruct the surface for planning-CT registration; near-field sensors turn chest and abdomen ROI depth into a respiratory waveform and gating signal.' } } },
        { key: 'sensor-validation', type: 'text', translations: { ko: { heading: '센서 검증 설계', body: '카메라 추상화 구조의 DtDepthScan으로 센서 5종을 같은 절차(거리 5구간, 회당 500프레임)로 녹화해 정밀도·fps·Fill rate를 비교했습니다.' }, en: { heading: 'Sensor validation design', body: 'DtDepthScan abstracts the camera layer so five sensors run the same protocol — five distances, 500 frames per run — for precision, fps, and fill-rate comparison.' } } },
        { key: 'measured-precision', type: 'evidence', translations: { ko: { heading: '측정 근거', body: '거리별 ROI 평균 깊이의 시간 σ, 노출·워밍업에 따른 변화, 반복 측정 재현성을 표로 남겼습니다.' }, en: { heading: 'Measured evidence', body: 'Temporal σ of ROI mean depth by distance, exposure and warm-up effects, and repeat-measurement reproducibility are tabulated.' } } },
        { key: 'research-boundary', type: 'limitation', translations: { ko: { heading: '연구 경계', body: '1차년도 센서·알고리즘 기초 설계 단계이며 임상 성능이나 과제 목표 달성을 주장하지 않습니다.' }, en: { heading: 'Research boundary', body: 'First-year sensor and algorithm groundwork; no clinical performance or programme-target achievement is claimed.' } } }
      ]
    }),
    project({
      slug: 'skadi-tracking-software', tier: 'platform', period: '2023.02 – present', evidenceState: 'ongoing', lifecycleState: 'ongoing',
      capabilityKeys: ['medical-navigation', 'registration'], route: 'projects/skadi-tracking-software/',
      tech: ['SKADI', 'C++', 'Python API', 'Viewer', '3D Slicer', 'Optical tracking'],
      media: {
        lead: { id: 'skadi-viewer-demo', type: 'video', status: 'pending-approval' },
        video: { id: 'skadi-viewer-demo', type: 'video', status: 'pending-approval' },
        poster: { id: 'skadi-viewer-demo-poster', type: 'image', status: 'pending-approval' },
        gallery: []
      },
      pdf: { ko: 'assets/pdfs/skadi-tracking-software-ko.pdf', en: 'assets/pdfs/skadi-tracking-software-en.pdf' },
      pdfSequence: {
        middle: ['sdk-layers', 'viewer-and-template', 'delivery-evidence', 'hardware-boundary'],
        evidenceId: 'skadi-viewer-demo',
        diagram: {
          kind: 'tracking-sdk-stack',
          translations: {
            ko: { title: '추적 장치에서 응용까지의 소프트웨어 계층', nodes: ['SKADI 트래커', 'API·SDK', 'Viewer·Slicer 템플릿', '수술내비게이션 응용'] },
            en: { title: 'Software layers from tracker to application', nodes: ['SKADI tracker', 'API and SDK', 'Viewer and Slicer template', 'Surgical-navigation application'] }
          }
        }
      },
      translations: {
        ko: {
          title: 'SKADI 위치추적 소프트웨어 (API·Viewer)', shortTitle: 'SKADI 소프트웨어', eyebrow: '플랫폼 소프트웨어 · 광학 위치추적',
          thesis: '자체 광학식 3차원 위치추적장치 SKADI를 수술내비게이션 기업과 연구기관이 바로 쓸 수 있게 하는 소프트웨어 계층을 만듭니다.',
          summary: 'SKADI의 API·SDK, 장치 상태와 추적 결과를 보여주는 Viewer, 연구자가 바로 시작할 수 있는 3D Slicer 커스텀 앱 템플릿을 개발·유지보수합니다.',
          problem: '광학 트래커는 하드웨어만으로는 쓰이지 않습니다. 좌표계, 마커 정의, 실시간 스트리밍, 오류 상태를 응용 개발자가 다루기 쉬운 인터페이스로 제공해야 합니다.',
          role: 'API·SDK와 Viewer의 설계·구현·유지보수, 3D Slicer 커스텀 앱 템플릿 작성, 고객사 통합 지원과 문의 대응을 담당합니다.',
          teamResult: '장치 하드웨어, 광학·기구 설계, 영업과 납품은 회사의 다른 구성원이 맡습니다. 납품 실적과 매출은 회사 성과이며 여기서 주장하지 않습니다.',
          evidence: 'Viewer 화면, API 구조 다이어그램, Slicer 템플릿 동작 화면이 근거이며 고객 현장 영상은 싣지 않습니다.',
          limitation: '장치 사양·정확도 수치·고객사 명단·판매 수치는 회사 소유 정보로 공개하지 않습니다.',
          collaboration: '광학·하드웨어 설계자, 고객사 내비게이션 개발자, 연구기관 사용자와 인터페이스를 맞춥니다.',
          mediaAlt: 'SKADI Viewer가 추적 장치 상태와 마커 좌표를 실시간으로 표시하는 화면.', mediaCaption: 'Viewer·API 시연 클립은 공개 승인 후 게시합니다.',
          status: '진행 중', cardProblem: '광학 트래커를 응용 개발자가 바로 쓰는 API·Viewer 계층으로 만듭니다.', cardOwnedRole: 'API·SDK·Viewer·Slicer 템플릿 개발·유지보수를 담당합니다.', cardEvidence: 'Viewer·API·템플릿 화면; 장치 사양과 판매 수치는 비공개입니다.', problemSummary: '추적 장치를 쓰기 쉬운 소프트웨어 계층으로 감쌉니다.', ownedRole: 'API·SDK·Viewer·Slicer 템플릿을 담당합니다.', verifiedEvidence: 'Viewer·API·템플릿 동작 화면이 근거입니다.', visualAlt: 'SKADI 소프트웨어 계층.', visualCaption: '시연 미디어는 승인 대기 중입니다.'
        },
        en: {
          title: 'SKADI Tracking Software (API and Viewer)', shortTitle: 'SKADI Software', eyebrow: 'Platform Software · Optical Tracking',
          thesis: 'Make the in-house SKADI optical 3D tracker directly usable by surgical-navigation companies and research groups through its software layer.',
          summary: 'Develop and maintain the SKADI API and SDK, the Viewer that shows device state and tracking results, and a 3D Slicer custom-application template that lets researchers start immediately.',
          problem: 'An optical tracker is not used as bare hardware: coordinate frames, marker definitions, real-time streaming, and error states must be exposed through an interface application developers can work with.',
          role: 'Own the design, implementation, and maintenance of the API, SDK, and Viewer; wrote the 3D Slicer custom-application template; support customer integrations and enquiries.',
          teamResult: 'Device hardware, optical and mechanical design, sales, and delivery belong to other colleagues. Delivery records and revenue are company results and are not claimed here.',
          evidence: 'Viewer screens, an API structure diagram, and the Slicer template in action are the evidence; customer-site footage is excluded.',
          limitation: 'Device specifications, accuracy figures, customer lists, and sales numbers are company-owned and not published.',
          collaboration: 'Interfaces are agreed with optical and hardware designers, customer navigation developers, and research users.',
          mediaAlt: 'SKADI Viewer showing live tracker status and marker coordinates.', mediaCaption: 'The Viewer and API demonstration clip will be published after approval.',
          status: 'Ongoing', cardProblem: 'Turn the optical tracker into an API and Viewer layer developers use directly.', cardOwnedRole: 'Own the API, SDK, Viewer, and Slicer template.', cardEvidence: 'Viewer, API, and template screens; specs and sales figures stay private.', problemSummary: 'Wrap the tracker in a usable software layer.', ownedRole: 'Own the API, SDK, Viewer, and Slicer template.', verifiedEvidence: 'Viewer, API, and template screens.', visualAlt: 'SKADI software layers.', visualCaption: 'Demonstration media is pending approval.'
        }
      },
      blocks: [
        { key: 'sdk-layers', type: 'system', translations: { ko: { heading: 'SDK 계층', body: '장치 연결, 마커·좌표계 정의, 실시간 스트리밍, 오류 상태를 API로 드러내고 언어 바인딩을 제공합니다.' }, en: { heading: 'SDK layers', body: 'Device connection, marker and frame definitions, real-time streaming, and error states are exposed through the API with language bindings.' } } },
        { key: 'viewer-and-template', type: 'text', translations: { ko: { heading: 'Viewer와 템플릿', body: 'Viewer는 장치 상태와 추적 결과를 검증하는 도구이고, Slicer 템플릿은 연구자가 내비게이션 프로토타입을 바로 시작하게 합니다.' }, en: { heading: 'Viewer and template', body: 'The Viewer verifies device state and tracking output; the Slicer template lets researchers start a navigation prototype at once.' } } },
        { key: 'delivery-evidence', type: 'evidence', translations: { ko: { heading: '동작 근거', body: 'Viewer·API·템플릿의 실제 동작 화면을 근거로 삼고 고객 현장 영상은 제외합니다.' }, en: { heading: 'Working evidence', body: 'Working Viewer, API, and template screens are the evidence; customer-site footage is excluded.' } } },
        { key: 'hardware-boundary', type: 'limitation', translations: { ko: { heading: '하드웨어 경계', body: '장치 사양·정확도·판매 수치는 회사 소유 정보이며 이 사례는 소프트웨어 계층만 다룹니다.' }, en: { heading: 'Hardware boundary', body: 'Specifications, accuracy, and sales are company-owned; this case covers the software layer only.' } } }
      ]
    }),
```

- [ ] **Step 6: Evidence register and READMEs** — append to `assets/projects/EVIDENCE_REGISTER.md` (keep the table intact; no prose outside the table):

```
| respiratory-surface-guidance-sensor-precision | respiratory-surface-guidance | image | pending-review | - | Author-measured sensor precision table or validation-tool capture; no public derivative approved. |
| skadi-viewer-demo | skadi-tracking-software | video | pending-review | - | Viewer and API demonstration clip; no public derivative approved. |
| skadi-viewer-demo-poster | skadi-tracking-software | image | pending-review | - | Poster paired with the Viewer clip; no public derivative approved. |
```
  Create `assets/projects/respiratory-surface-guidance/README.md`:

```
# Surface-guided Respiratory Tracking Evidence

The public lead image slot remains pending review. This directory accepts only approved, redacted, metadata-stripped derivatives named in the public evidence register.
```
  and `assets/projects/skadi-tracking-software/README.md`:

```
# SKADI Tracking Software Evidence

The public video and poster slots remain pending review. This directory accepts only approved, redacted, metadata-stripped derivatives named in the public evidence register.
```

- [ ] **Step 7: Case shells (4 files)** — copy `projects/mandibular-fracture/index.html` → `projects/respiratory-surface-guidance/index.html` and substitute: every `mandibular-fracture` → `respiratory-surface-guidance`; description → `표면유도 호흡추적 연구의 역할, 근거, 한계를 설명합니다.`; `<title>` → `표면유도 호흡추적 (SGRT) · Jinmin Kim`; fallback `<h1>` → the ko title, `<p>` → the ko `summary` verbatim from Step 5, the PDF link text stays `사례 PDF 열기`. Same for `en/projects/respiratory-surface-guidance/index.html` from the English mandibular shell (description `Role, evidence, and limits for surface-guided respiratory tracking research.`, title `Surface-guided Respiratory Tracking (SGRT) · Jinmin Kim`, fallback = en title/summary). Repeat for `skadi-tracking-software` (ko description `SKADI 위치추적 소프트웨어의 역할, 근거, 한계를 설명합니다.`, en `Role, evidence, and limits for the SKADI tracking software layer.`). The summaries in the shells must match `translations.<locale>.summary` exactly (test 1352 compares).

- [ ] **Step 8: Fallback lists** — `index.html`/`en/index.html`: insert the two new `<li class="sc-project">` links after rtms-navigation (titles = data titles). `projects/index.html`/`en/projects/index.html`: add the respiratory entry to the medical-core list and a new group `<section class="sc-group" data-tier="platform"><h2 class="sc-group__title">플랫폼 소프트웨어</h2>…skadi…</section>` (en: `Platform Software`) between medical-core and industrial-spotlight.

- [ ] **Step 9: PDF diagram branches** — in `scripts/generate-portfolio-pdfs.py` before `else:\n            raise ValueError(...)` add:

```python
        elif kind == "surface-gating-chain":
            width = 104
            centers = [(self.left + 58 + index * 122, center_y) for index in range(4)]
            for index in range(3):
                connector((centers[index][0] + width / 2, center_y), (centers[index + 1][0] - width / 2, center_y),
                          "warm" if index == 2 else "signal")
            for index, center in enumerate(centers):
                box(*center, width, 58, nodes[index], index)
        elif kind == "tracking-sdk-stack":
            centers = [(center_x, center_y + 54 - index * 36) for index in range(4)]
            for index in range(3):
                connector((center_x, centers[index][1] - 15), (center_x, centers[index + 1][1] + 15))
            for index, center in enumerate(centers):
                box(*center, 196, 30, nodes[index], index)
```

- [ ] **Step 10: Regenerate PDFs and manifest** (PowerShell, repo root):

```powershell
node scripts/export-portfolio-data.cjs --output .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/pdf-input.json
.superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/.venv-pdf/Scripts/python.exe scripts/generate-portfolio-pdfs.py `
  --input .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/pdf-input.json `
  --output-dir output/pdf --publish-root . `
  --review-dir .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/pdf-review
```
  Expected: 16 project PDFs + 2 CV PDFs written to `output/pdf/`, copied to `assets/pdfs/` and `assets/cv/`, `output/pdf/manifest.json` lists 40 artifacts. Open `pdf-review/respiratory-surface-guidance-ko-page-3.png` (or whichever page carries the diagram) to confirm the two new diagrams are legible.

- [ ] **Step 11: Docs** — `README.md` list → eight cases in order with the four groups; `AGENTS.md`: `Canonical cases: 8 projects…`, `exactly 24 HTML pages`, the slug list, `assets/pdfs/ # 16 public project PDFs`, `Projects groups: Medical Core (5), Platform Software (1), Industrial Spotlight (1), AI Build Lab (1)`.

- [ ] **Step 12: Run everything**

Run: `node --test && node scripts/validate-portfolio.cjs && git diff --check`
Expected: all pass — including `Task 5 manifest freshness…` (regenerated), `Task 4 public evidence register…` (14 rows), `Task 6 tracked site HTML inventory…` (24 pages).

- [ ] **Step 13: Preview** — `python -m http.server 8000`; check `/`, `/projects/` (four groups, eight rows), `/projects/respiratory-surface-guidance/`, `/en/projects/skadi-tracking-software/`, and that `assets/pdfs/respiratory-surface-guidance-ko.pdf` opens from the case page.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat(cases): register SGRT respiratory tracking and SKADI software cases (8 cases, 4 groups, 16 PDFs)"
```

---

### Task 6: Final verification and owner review hand-off

**Files:** none modified (verification only); optional `docs/superpowers/plans/2026-08-21-scholar-portfolio-core.md` checkbox updates.

- [ ] **Step 1: Clean-tree verification**

```bash
git status --short --branch          # expect: clean, ahead of origin/main
node --test 2>&1 | tail -5           # expect: fail 0
node scripts/validate-portfolio.cjs  # expect: no output / exit 0
git diff --check
```

- [ ] **Step 2: Residue scan**

```bash
grep -rn "spatial-signal\|td-eyebrow\|hero-kicker\|td-mosaic\|td-media-ledger\|SELECTED WORK\|JOINT DEVELOPMENT" --include=*.html --include=*.css --include=*.js . | grep -v "^./public/\|^./.superpowers/\|^./docs/\|^./tests/"
```
  Expected: only the generated CV summary's `hero-kicker` lines (inside the START/END markers) — nothing else.

- [ ] **Step 3: Forbidden-word scan of public surfaces**

```bash
grep -rn "박사\|진학\|이직\|PhD\|admission\|채용\|홍재성\|안재명\|강영남\|최현석\|10-20[0-9][0-9]-" --include=*.html --include=*.js --include=*.md --include=*.json . | grep -v "^./public/\|^./.superpowers/\|^./docs/\|^./tests/\|^./node_modules/"
```
  Expected: no output.

- [ ] **Step 4: Preview checklist for the owner** — start `python -m http.server 8000` and hand over these URLs for review at desktop and phone widths: `/`, `/en/`, `/projects/`, `/projects/surgical-navigation/`, `/projects/respiratory-surface-guidance/`, `/en/projects/skadi-tracking-software/`, `/cv/`, `/contact/`. Report: what changed, that no media is published yet (Plan ②), and that pushing `main` deploys live. **Do not push.**

- [ ] **Step 5: Record** — `/atlas-issue-flow note` on issue #673 with the commit list from `git log --oneline origin/main..HEAD`.

---

## Self-review (done while writing)

- Spec coverage: routes/pages (T4, T5), canonical 8 cases and order (T5), naming policy (T1), visual system and removals (T4), figure/gallery contract (T2, T3), highlights on Home (T3, T4), neutral Contact (T4), PDF contract unchanged at six pages with 16 artifacts (T5), validation commands (every task). CV regeneration from the 2026-08 source and media publication are explicitly Plan ③/② and listed under companion plans.
- Placeholder scan: none — every code step carries the code; shell copies name the exact substitutions.
- Type consistency: `media.gallery` item shape, `highlights` shape, `publicPortfolioVisualFiles(rootDir, candidate)` signature, renderer export names (`homeProjectGalleryHtml`, `projectGroupsHtml`, `capabilityIndexHtml`, `highlightsHtml`, `evidenceMediaHtml`, `caseGalleryHtml`, `caseStudyHtml`, `mountAll`), mount names (`capability-index`, `home-projects`, `home-highlights`, `project-groups`, `case-study`), tier keys, diagram kinds and slug order are identical across Tasks 2–5.
