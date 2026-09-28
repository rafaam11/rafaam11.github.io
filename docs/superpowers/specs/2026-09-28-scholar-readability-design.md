# Scholar Readability Design (v2)

> 2026-09-28 · supersedes only the **Home** information architecture and the **type-scale** values of `2026-08-21-scholar-portfolio-design.md`. The palette, forbidden devices (no chips, eyebrows, icons, gradients, shadows, uppercase), media rules, and privacy rules of that spec remain in force.

## Problem

The site read as clean but text-heavy. Body type (Pretendard 17px / 1.7, 880px column) was adequate; the flatness came from elsewhere:

- headings barely larger than body (h2 1.35rem with a hairline under every section),
- two text tones only, so dates, venues, captions and prose shared one texture,
- blue underlined "details · PDF" rows competing with every title,
- ten Home sections of equal weight, with a tool table and five near-identical release notes above the research itself,
- internal review notes rendered on public case pages.

Reference patterns (Jon Barron, al-folio, The Academic Designer 2025 winners): short intro, selected research with large thumbnails immediately below, three or four curated news items, headings 1.6–2× body, whitespace instead of rules, quiet secondary links.

## Type scale and tone (`css/scholar.css`)

| Element | Value |
|---|---|
| Body | 1.0625rem / 1.7 (unchanged) |
| h1 | 2.25rem / 1.2 (≤700px: 1.7rem) |
| h2 | 1.6rem, `margin-top: 4rem`, **no under-rule** (≤700px: 1.4rem, 3rem). Tier titles and News year headings use 2.5rem; case sections 3rem |
| h3 | 1.2rem |
| Intro lede | 1.25rem / 1.6, `max-width: 34em` |
| Case thesis | 1.25rem / 1.6 |
| Meta (`--sc-faint` #6b7280, `--sc-meta` .9rem) | project meta, news dates, venues, list years, figure captions, case meta, `.hero-kicker`, local-feed dates and counts, CV dates/meta |
| Secondary link rows | `.sc-intro__links`, `.sc-project__links`, `.sc-news-links`, `.sc-case__links`, `.lf-links`: `--sc-meta` size, `--sc-muted` colour, underline kept, blue on hover. Inline prose links stay blue |
| Project rows | 240px thumbnail column, 1.5rem gap, 1.5rem vertical padding, title 1.2rem, summary `max-width: 60ch` |
| Intro | padding 3.5rem 0 3rem, photo 176px (≤760px 120px) |

Page-level rules stay: `.sc-intro`, `.sc-page-header` and `.sc-case__header` keep their bottom border as the single divider level. `scholar.css` stays under the 300-line contract.

## Home information architecture (`scripts/profile-home.cjs` → `renderHome`)

Seven sections, in this order:

1. **Intro** — name, lede, two affiliation lines, contact links, photo.
2. **Capabilities** — the five-stack `<dl class="sc-capabilities">` (`id="implementation-title"`), kept on Home at the owner's request (2026-09-28 review of the local preview).
3. **Selected research** — three rows (`data-portfolio="home-projects"`).
4. **Selected publications & presentations** — three items, "all N" link, then the patents/awards line (`data-portfolio="home-highlights"`) closing the same section. No separate heading.
5. **News** — four items from `homeNews()`: the newest software release (evidence path `data/news-software-sources.json`) at most once, then the newest remaining items. "All news (N)" link.
6. **Selected activities** — inserted by `js/local-feed.js` after the News section (fallback: before contact).
7. **Contact**.

Projects does not repeat the capability list. No standalone route.

## Public review artefacts

The following review artefacts are no longer rendered on public pages: the `pf-gap` "material needed" aside, the `pf-review-note` caption lines and the SMCNavi "early AR exploration · association pending" section in `js/local-projects.js`, and the media review notes in `js/local-feed.js`. Figure placement, video hygiene and figure renumbering stay. The media records remain in `js/local-media-data.js` for later reintroduction once their links are confirmed.

Still visible, and outside this change: some media captions and the mandibular stage prose in `js/local-media-data.js` / `js/local-projects.js` keep candidate wording ("…연결할 후보입니다", "remains unconfirmed"). Rewriting that copy is an owner decision for a later pass.

## Non-goals

- No rewriting of project summaries, case copy, CV text or data records.
- No theme change: white background, ink/muted/faint text, underlined links, Pretendard, 880px column.
- No new routes; 28 localized pages remain.

## Verification

`node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check`, `node scripts/check-local-preview.cjs` against a local HTTP server, and screenshots of Home (ko/en), Projects, News, CV and one case at wide and narrow widths. Contract tests live in `tests/scholar-readability.test.cjs`, `tests/profile-pages.test.cjs` (`homeNews`) and the Home/Projects shell tests in `tests/portfolio.test.cjs`.
