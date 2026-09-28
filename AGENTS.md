# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project overview

Jinmin Kim의 GitHub Pages 개인 포트폴리오. 순수 정적 HTML/CSS/JavaScript 기반이며 빌드 과정이 없습니다.

- **URL:** https://rafaam11.github.io
- **Positioning:** 3D registration · medical imaging · robot systems — research to field
- **Audience:** 연구 협력자(의료영상·3D 정합)와 일반 방문자(리크루터·지인)
- **Structure:** Home / News / Projects / CV / Contact
- **Canonical cases:** 9 projects, paired in Korean and English
- **Capabilities:** 5 implementation-backed stacks on Home between the intro and selected research, without per-stack project lists; no standalone route
- **Deploy:** `main` push 후 GitHub Pages가 root를 직접 서빙
- **Preview:** `python -m http.server 8000` or direct `file://` open

## Content principles

- 팀 전체 결과를 개인 성과로 쓰지 않는다. `My Role`과 `Team Result`를 분리한다.
- 기여율 퍼센트 대신 소유한 문제, 결정, 구현, 검증 근거를 쓴다.
- 기관·제품 실명은 승인 목록(2026-08-21 사용자 승인)만 쓴다: 디지트랙/DIGITRACK, SKADI, SMCNavi, NeuroPilot, DOTORI, 삼성서울병원, 서울성모병원, AT&C, KERI, ETRI, KAIST, A4LAB, 정부과제명. 타인의 이름(교수·임원·동료), 연구비, 문서·특허 번호, 과제 목표치·타 기관 지표는 쓰지 않는다. 본인이 직접 측정한 수치만 인용한다.
- `Verified`, `Ongoing`, `Prototype`, `Expected`, `Research`, `Completed` 상태를 구분한다.
- AI는 정체성이 아니라 구현 증폭 수단으로 다룬다. 사람은 맥락, 요구사항, 아키텍처, 수용 기준, PR 리뷰를 소유한다.
- 검증되지 않은 생산성·유지보수·임상·운영 효과를 확정적으로 표현하지 않는다.
- 내부 원본은 Git 밖에 유지하고, 승인·비식별화·메타데이터 제거를 거친 파생본만 공개한다.
- 활동 사진(소식 탭)에는 다른 사람이 나올 수 있다(소유자 결정 2026-09-28). 다른 사람의 이름은 캡션·alt·본문에 쓰지 않는다. 환자·임상 데이터는 금지한다. 파생본은 EXIF/GPS/오디오를 제거한다. 게시 중단 요청이 오면 해당 파생본을 블러 처리하거나 삭제한다.

## Public routes

한국어는 루트, 영어는 `/en/`에 있으며 정확히 28개 HTML 페이지를 유지합니다.

- `index.html`, `news/index.html`, `projects/index.html`, `cv/index.html`, `contact/index.html`
- `en/index.html`, `en/news/index.html`, `en/projects/index.html`, `en/cv/index.html`, `en/contact/index.html`
- 두 언어의 아홉 사례: `surgical-navigation`, `mandibular-fracture`, `digital-occlusion-workflow`, `life-careverse`, `rtms-navigation`, `respiratory-surface-guidance`, `skadi-tracking-software`, `unmanned-forklift`, `ai-build-lab`

## File structure

```text
index.html                         # Home: intro (name, lede, affiliation, contacts, photo), capability list, selected research (3), publications + patents/awards line, News (4, curated), selected activities (local-feed overlay), contact line
projects/index.html                # Projects groups: Medical Core (6), Platform Software (1), Industrial Spotlight (1), AI Build Lab (1)
projects/<slug>/index.html         # 9 shared-renderer case summaries
en/                               # English counterparts for all 13 Korean routes
cv/index.html                      # Full public CV in semantic HTML plus PDF and raster fallbacks
contact/index.html                 # Joint-development enquiry guidance
js/portfolio-data.js               # Canonical 9 projects and 5 capability stacks
js/portfolio-render.js             # Home, Projects, and case renderer
js/site-i18n.js                    # Canonical route descriptors and localized UI copy
js/nav.js                          # Shared nav/footer; file:// and HTTP compatible
css/site.css                       # Shared portfolio components
css/scholar.css                    # Researcher-style visual system (2026-08-21; type scale and meta tone revised 2026-09-28, see docs/superpowers/specs/2026-09-28-scholar-readability-design.md)
css/cv-pdf.css                     # CV viewer and page-preview layout
assets/projects/EVIDENCE_REGISTER.md # Public evidence identifier and approval SSOT
assets/projects/<slug>/            # Approved derivatives or public-safe boundary README
assets/pdfs/                       # 18 public project PDFs
assets/cv/                         # 2 tracked CV PDFs (the author's Word document, ko and en)
scripts/export-portfolio-data.cjs  # Deterministic PDF input exporter
scripts/activity-media.cjs         # Activity media pipeline: catalog, sheet, derive, check (ffmpeg)
data/activity-media.json           # Activity media SSOT; js/local-media-data.js is generated from it
assets/local-review/               # Public activity derivatives (WEBP/MP4, ≤16 MiB total)
assets/usermedia/                  # Private originals, git-ignored; never commit
scripts/generate-portfolio-pdfs.py # ReportLab PDF generator and artifact publisher
scripts/validate-portfolio.cjs     # Privacy, route, link, dependency, evidence, and PDF validator
tests/portfolio.test.cjs           # Content, rendering, artifact, and inventory contracts
output/pdf/                        # Canonical generated PDF output and manifest
public/                            # Generated blog output; never edit for portfolio work
.nojekyll                          # Required for GitHub Pages; do not delete
```

## Architecture notes

- `js/nav.js` renders `<header id="site-nav">` and `<footer id="site-footer">` without `fetch`, so `file://` preview works.
- Each page declares `data-base`, `data-page`, `data-lang`, and `data-route`. Valid page keys are `home`, `news`, `projects`, `cv`, and `contact`.
- Home, Projects, and case pages load `site-i18n.js`, `portfolio-data.js`, `portfolio-render.js`, then `nav.js` with file-depth-correct relative paths.
- `portfolio-data.js` is the summary-content SSOT. Update it when a title, period, evidence state, role, team result, media declaration, PDF pair, or capability mapping changes.
- Evidence IDs and publication state must match `assets/projects/EVIDENCE_REGISTER.md`. Pending internal media has no public path.
- Project and CV PDFs are generated artifacts. Use the exporter/generator pipeline; do not hand-edit PDFs.
- The CV page body is generated from `data/public-cv.json` (version 2026-08-22): `node scripts/public-cv-summary.cjs --write` rewrites the marked block on both CV pages.
- The two PDFs in `assets/cv/` are **not** generated here. They are the author's own Word CV, localized and sanitized by `tools/cv-media/` in the LLMwiki workspace and committed as source; the generator never writes to `assets/cv/`. Keep `data/public-cv.json` in step with whatever those PDFs say. Approved as public on 2026-08-22: KIPO patent application numbers and the thesis advisor's name. Other people's names, phone numbers, addresses, and patient data stay out.
- Do not restore the removed Research/Capabilities route, excluded project routes, decorative SVG fallbacks, Bootstrap/StartBootstrap, or the old sidebar layout.
- Home uses generated introduction, capability list, selected research, achievements and curated News; home-projects can also render at runtime. The home-highlights block closes the publications section, is generated from CV data and is not replaced by JavaScript. `js/local-feed.js` inserts the selected-activities block after the Home News section. Projects mounts project-groups; case shells mount case-study. The hero mosaic and media ledger are removed; do not restore them.

## Required verification

Run all three commands after portfolio changes:

```powershell
node --test
node scripts/validate-portfolio.cjs
git diff --check
```

For layout or link changes, also run the local HTTP preview and inspect Home, News, Projects, CV, Contact, one Korean case, and one English case at wide and narrow widths. Run `node scripts/check-local-preview.cjs` against the local server to check HTTP resources and direct `file://` resolution for all localized pages and artifact links. This smoke check does not inspect layout. If the in-app browser is unavailable, record that limitation and do not silently substitute a different browser-control backend.

## Deployment

Commit and push to `main` only when deployment is intended. GitHub Pages must remain configured as **Deploy from a branch → main → / (root)**.

## Research profile maintenance

- Home selects digital-occlusion-workflow, mandibular-fracture, and surgical-navigation; Projects retains all nine cases.
- News is maintained bilingually in `js/portfolio-data.js`; preserve event-date precision and public evidence. Home shows four items chosen by `homeNews()` in `scripts/profile-home.cjs`: the newest software release (evidence path `data/news-software-sources.json`) at most once, then the newest remaining items. News groups the full list by year.
- News covers research, conferences, awards, career, activities (clubs, camps, exhibitions, overseas programmes), patent applications, and the first public release of each personal app (not every version) or public repositories. Combine an award with its corresponding presentation. Filing dates are not grant dates. Selected release and repository timestamps are recorded in `data/news-software-sources.json` and `data/news-repository-sources.json`, displayed in Asia/Seoul time.
- `node scripts/public-cv-summary.cjs --write` refreshes CV and generated Home/News content. Home publications/patents/awards derive from `data/public-cv.json`.
- Adding an activity event: `node scripts/activity-media.cjs catalog` → `sheet <folder>` for owner review → `derive M###` → fill ko/en caption/alt, `eventIds`, `order` and `approval: approved-public` in `data/activity-media.json` → add the news record (photo-only facts cite `{ path: 'data/activity-media.json', locator: 'M###' }`) and its `labels` entry in `js/local-feed.js` → `node scripts/public-cv-summary.cjs --write` → `node --test tests/activity-media.test.cjs tests/activity-feed.test.cjs` and `node scripts/activity-media.cjs check`. M-ids are frozen by `sourceSha256`; never renumber. The News page is one chronological list.
- `sourcePdfs` pins each reviewed CV PDF SHA-256. A changed edition requires explicit content synchronization review; do not blindly update the hashes.
- `python scripts/check-cv-pdf-sync.py` compares selected PDF terms, periods, publication titles, and patent states/dates; arbitrary prose equivalence is a manual review. The validator CLI runs it (PyMuPDF required, as for PDF generation).
