# 3D Registration Partner Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing SVG-heavy 13-project hiring portfolio with a bilingual, evidence-led 6-case joint-development portfolio centered on 3D registration.

**Architecture:** Keep the site static and buildless. Extend the CommonJS/browser UMD portfolio data as the single structured content source, render shared discovery and case surfaces without `fetch`, and generate committed PDF artifacts offline from an exported version of the same data.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node test runner, Python ReportLab/PyPDF, Poppler-compatible PDF rendering.

**Spec:** `docs/superpowers/specs/2026-08-16-3d-registration-partner-portfolio.md`

## Global Constraints

- Work in the user-approved current `main` checkout; do not create a worktree or push without a later explicit publish request.
- Preserve Korean root, English `/en/`, explicit language links, `file://` compatibility, `.nojekyll`, and untouched `public/`.
- Public tree contains exactly 6 canonical projects, 5 capabilities, and 20 localized HTML routes.
- Do not publish unapproved internal media or source paths; approved derivatives only.
- Use test-first red-green cycles for behavior changes and run required verification after every task.

---

### Task 1: Lock the new content and route contract

**Files:**
- Modify: `tests/portfolio.test.cjs`
- Modify: `scripts/validate-portfolio.cjs`
- Modify: `js/site-i18n.js`
- Modify: `js/nav.js`

- [ ] Add failing tests for four navigation pages, six localized case pairs, five capability stacks, the supported evidence states, and removal of the research/legacy routes.
- [ ] Run the focused tests and confirm they fail because the old 13-project/36-page contract remains.
- [ ] Implement the route and validation contract with file-safe localized links.
- [ ] Run focused and full tests, then commit the task.

### Task 2: Replace the canonical project and capability data

**Files:**
- Modify: `js/portfolio-data.js`
- Modify: `tests/portfolio.test.cjs`
- Modify: `scripts/validate-portfolio.cjs`

- [ ] Add failing tests for the six exact case identities, tier order, role/team-result separation, media metadata, PDF pairs, and the five ordered technology stacks.
- [ ] Run the tests and confirm the current data fails the new contract.
- [ ] Replace old summaries with the approved Korean/English content and structured case-study blocks.
- [ ] Validate privacy, localization, route, and media invariants; run the full test suite and commit.

### Task 3: Rebuild Home, Projects, shared case pages, and Contact

**Files:**
- Modify: `index.html`, `projects/index.html`, `contact/index.html`
- Modify: `en/index.html`, `en/projects/index.html`, `en/contact/index.html`
- Modify: `js/portfolio-render.js`
- Modify: `css/site.css`, `css/case-study.css`, `css/spatial-signal.css`
- Create/modify: six Korean and six English case route files

- [ ] Add failing renderer and authored-page tests for the technical-document hero, image/title-only Home tiles, three-tier Projects layout, custom case blocks, click-to-play video contract, and partner enquiry guidance.
- [ ] Confirm the tests fail against the old Atlas/carousel/timeline UI.
- [ ] Implement the new shared renderer, HTML shells, responsive layout, typography, focus states, and reduced-motion behavior.
- [ ] Run focused and full tests, perform an initial HTTP/file smoke, and commit.

### Task 4: Establish the public evidence asset pipeline

**Files:**
- Create: `assets/projects/EVIDENCE_REGISTER.md`
- Create: `assets/projects/<slug>/` approved derivative directories
- Modify: `scripts/validate-portfolio.cjs`
- Modify: `tests/portfolio.test.cjs`

- [ ] Add failing tests for registered public asset IDs, safe extensions/names, intrinsic image dimensions, video poster/preload requirements, and missing/unapproved asset rejection.
- [ ] Confirm the tests fail before the register and approved derivative structure exist.
- [ ] Add public-safe assets already supported by public repositories; keep internal medical/field candidates outside Git until project-batch approval.
- [ ] Generate local review contact sheets for approval-gated candidates without recording original paths in Git.
- [ ] Run privacy/media validation and commit only public-safe derivatives and the register.

### Task 5: Generate project PDFs and public CV PDFs

**Files:**
- Create: `scripts/export-portfolio-data.cjs`
- Create: `scripts/generate-portfolio-pdfs.py`
- Create: `requirements-pdf.txt`
- Create: `output/pdf/`, then publish approved files under `assets/pdfs/` and `assets/cv/`
- Modify: `cv/index.html`, `en/cv/index.html`
- Modify: `tests/portfolio.test.cjs`, `scripts/validate-portfolio.cjs`

- [ ] Add failing tests for twelve 6-8 page case PDFs, two two-page CV PDFs, stable localized links, and CV viewer/image fallbacks.
- [ ] Confirm the tests fail because the artifacts and generation pipeline do not exist.
- [ ] Export canonical data, generate PDFs with ReportLab, and build public-safe KO/EN CV content from approved career sources.
- [ ] Render all PDFs, visually inspect every page, verify extraction/links/page counts, publish approved artifacts, run full tests, and commit.

### Task 6: Remove legacy public content and perform final verification

**Files:**
- Delete: unselected Korean/English project routes and `research/`, `en/research/`
- Modify: validation/tests and any stale shared assets or styles required by no remaining route

- [ ] Add failing inventory tests proving excluded routes or stale canonical references still exist.
- [ ] Confirm the inventory test fails before deletion.
- [ ] Remove excluded public HTML and unreachable decorative SVG/CSS/JS without touching `public/` or `.nojekyll`.
- [ ] Run `node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check`, HTTP/file route smoke, KO/EN desktop/mobile visual review, and PDF render review.
- [ ] Request final code review, address findings, and stop before push unless the user explicitly requests deployment.

