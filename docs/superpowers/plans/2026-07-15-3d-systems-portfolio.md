# 3D Systems Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static portfolio around a capability-first 3D spatial-computing identity, equal project visibility, decision-led case studies, and explicit personal/team/AI attribution.

**Architecture:** Browser-compatible UMD modules hold canonical project metadata and pure HTML render functions. Home, Projects, and Capabilities mount those shared views without `fetch`, so direct `file://` preview remains supported. Project narratives stay in static HTML and adopt one decision-timeline vocabulary.

**Tech Stack:** Static HTML5, existing Bootstrap 5 bundle, existing CSS tokens, vanilla JavaScript UMD modules, Node.js 22 built-in test runner, PowerShell/Python preview commands.

## Global Constraints

- No framework, package manager, static-site generator, CMS, server-side rendering, or build step.
- Preserve `.nojekyll`, clean directory URLs over HTTP, and explicit `index.html` links under `file://`.
- Keep all twelve projects and give their cards equal geometry.
- Use the approved B1 Pure Atlas, P1 Capability Chapters, and D2 Decision Timeline directions.
- Do not restore the deleted Repositories page.
- Anonymize nonpublic customers, hospitals, industrial partners, and company-project relationships.
- Keep public paper, patent, award, education, and formal CV affiliations where attribution is inherent.
- Replace contribution percentages with owned decisions, artifacts, evidence, and team impact.
- Label claims as verified, ongoing, expected, research, or completed; never render expected benefit as verified outcome.
- Treat AI as implementation acceleration under human-owned judgment and verification.
- Do not edit the generated `public/` blog tree.

---

### Task 1: Canonical Portfolio Data and Validation

**Files:**
- Create: `js/portfolio-data.js`
- Create: `js/portfolio-render.js`
- Create: `tests/portfolio.test.cjs`
- Create: `scripts/validate-portfolio.cjs`

**Interfaces:**
- Produces: `PortfolioData = { capabilities, impactMetrics, projects }` in both `window.PortfolioData` and CommonJS.
- Produces: `PortfolioRender = { validatePortfolioData(data), capabilityAtlasHtml(data, base), projectChaptersHtml(data, base), mountAll(document, data) }` in both browser globals and CommonJS.
- Each project has `slug`, `title`, `period`, `status`, `evidenceState`, `primaryCapability`, `crossCapabilities`, `problemSummary`, `ownedRole`, `verifiedEvidence`, `tech`, and `links`.

- [ ] **Step 1: Write data-contract tests**

Create `tests/portfolio.test.cjs` with Node's `node:test` and `node:assert/strict`. Tests must assert exactly twelve unique slugs, five capability keys, one valid primary capability per project, valid evidence states, no percentage-based contribution wording, no prohibited partner names in shared data, and a real `projects/<slug>/index.html` route for every project.

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');

test('canonical data contains twelve valid project records', () => {
  assert.equal(data.projects.length, 12);
  assert.equal(new Set(data.projects.map((project) => project.slug)).size, 12);
  assert.deepEqual(render.validatePortfolioData(data), []);
  for (const project of data.projects) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'projects', project.slug, 'index.html')), true);
  }
});
```

- [ ] **Step 2: Run the tests and verify the missing-module failure**

Run: `node --test tests/portfolio.test.cjs`  
Expected: FAIL because `js/portfolio-data.js` and `js/portfolio-render.js` do not exist.

- [ ] **Step 3: Implement the canonical data and pure renderers**

Use a UMD wrapper so `require()` works in tests and `window.PortfolioData` / `window.PortfolioRender` work in browsers. `capabilityAtlasHtml()` returns the five capability cards. `projectChaptersHtml()` returns one semantic `<section>` per capability with equal `.project-card` articles. `mountAll()` fills `[data-portfolio="capability-atlas"]` and `[data-portfolio="project-chapters"]` and leaves a visible fallback message if validation fails.

```js
(function (root, factory) {
  var value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.PortfolioData = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return { capabilities: [], impactMetrics: [], projects: [] };
});
```

The final implementation replaces the empty arrays with the complete five-capability, three-metric, twelve-project data defined by the approved design.

- [ ] **Step 4: Add the validation command**

`scripts/validate-portfolio.cjs` must run `validatePortfolioData`, verify every route, scan portfolio HTML for contribution percentages, and exit nonzero with one line per violation. It prints `Portfolio validation passed: 12 projects, 5 capabilities.` on success.

- [ ] **Step 5: Run validation tests**

Run: `node --test tests/portfolio.test.cjs`  
Expected: PASS with all data, rendering, privacy, and route tests successful.

Run: `node scripts/validate-portfolio.cjs`  
Expected: initially FAIL until percentage-based copy is removed in Task 4; record the failures and continue.

- [ ] **Step 6: Commit the foundation**

```powershell
git add js/portfolio-data.js js/portfolio-render.js tests/portfolio.test.cjs scripts/validate-portfolio.cjs
git commit -m "test: add canonical portfolio data validation"
```

---

### Task 2: Capability-First Navigation and Core Pages

**Files:**
- Modify: `js/nav.js`
- Modify: `index.html`
- Modify: `projects/index.html`
- Modify: `research/index.html`
- Modify: `css/site.css`

**Interfaces:**
- Consumes: `window.PortfolioData`, `window.PortfolioRender`, and existing body `data-base` / `data-page` attributes.
- Produces: navigation order `Projects / Capabilities / CV / Contact`, B1 Home, P1 Projects, and the renamed Capabilities page.

- [ ] **Step 1: Add failing static-page assertions**

Extend `tests/portfolio.test.cjs` to assert:

- `js/nav.js` includes `Projects`, `Capabilities`, `CV`, and `Contact` in that order;
- `index.html` contains mount points for `capability-atlas` and the three approved impact metrics;
- `projects/index.html` contains `project-chapters` and no `Featured` / `More Projects` rows;
- `research/index.html` has `data-page="capabilities"` and title `Capabilities`;
- all three pages load `portfolio-data.js` before `portfolio-render.js`.

- [ ] **Step 2: Run the targeted tests and verify failure**

Run: `node --test tests/portfolio.test.cjs`  
Expected: FAIL on old navigation, missing mount points, and old Research Fields copy.

- [ ] **Step 3: Update navigation and page metadata**

Change the nav order to:

```js
var links = [
  { key: 'projects', label: 'Projects', href: dir('projects/') },
  { key: 'capabilities', label: 'Capabilities', href: dir('research/') },
  { key: 'cv', label: 'CV', href: dir('cv/') },
  { key: 'contact', label: 'Contact', href: dir('contact/') }
];
```

Update the footer identity to `3D Spatial Computing · Research Engineer`.

- [ ] **Step 4: Rebuild Home using B1 Pure Atlas**

Use English primary copy, retain the profile image, remove birth year and employer/client names from the hero, add the approved positioning statement, mount the Capability Atlas before the evidence strip, then add Proven Impact, How I Work, and a shortened public-evidence timeline. Remove project contribution percentages and nonpublic partner names from Home.

- [ ] **Step 5: Rebuild Projects using P1 Capability Chapters**

Replace the table with:

```html
<div data-portfolio="project-chapters">
  <p class="portfolio-fallback">Project chapters require JavaScript; open the individual project links from the site map if scripting is disabled.</p>
</div>
```

Load shared data and renderer scripts before `nav.js`.

- [ ] **Step 6: Convert Research Fields into Capabilities**

Keep the route `research/` for link stability, change its active key to `capabilities`, and give each capability four fields: problem class, principles, validation method, and evidence links. Keep technologies as compact supporting tags.

- [ ] **Step 7: Add the approved visual system**

In `css/site.css`, add focused classes for `.hero-kicker`, `.hero-statement`, `.capability-atlas`, `.capability-card`, `.impact-strip`, `.impact-card`, `.work-principles`, `.project-chapter`, `.project-grid`, `.project-card`, `.project-evidence`, `.status-pill`, and mobile stacking. Reuse existing navy, slate, line, and soft-background tokens; add one restrained gold evidence token.

- [ ] **Step 8: Run tests and inspect generated HTML**

Run: `node --test tests/portfolio.test.cjs`  
Expected: PASS.

Run: `node scripts/validate-portfolio.cjs`  
Expected: only remaining failures come from old percentage wording in project detail pages.

- [ ] **Step 9: Commit core surfaces**

```powershell
git add js/nav.js index.html projects/index.html research/index.html css/site.css tests/portfolio.test.cjs
git commit -m "feat: build capability-first portfolio surfaces"
```

---

### Task 3: Evidence-Led CV and Contact

**Files:**
- Modify: `cv/index.html`
- Modify: `contact/index.html`
- Modify: `css/cv-theme.css`
- Modify: `tests/portfolio.test.cjs`

**Interfaces:**
- Produces: current-role bullets using `Owned`, `Changed`, and `Evidence`; privacy-safe contact positioning.

- [ ] **Step 1: Add failing CV/contact assertions**

Assert that CV contains all three evidence labels and the LiteSim travel-frequency metric; Contact describes a senior R&D / hands-on technical-lead IC focus and does not promise one-person end-to-end delivery or expose response-time guarantees.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test tests/portfolio.test.cjs`  
Expected: FAIL on missing evidence labels and legacy contact claims.

- [ ] **Step 3: Rewrite the current role**

Add concise English bullets for ownership of SafetyGate, vision, and LiDAR/ToF modules; LiteSim team adoption and travel reduction; surgical-navigation and XR integration; and ongoing AI-assisted review/SSOT practices. Keep long-term maintainability benefits explicitly ongoing.

- [ ] **Step 4: Align Contact**

Lead with senior R&D, 3D spatial computing, technical validation, and collaboration. Retain email, GitHub, LinkedIn, and NDA language. Remove unsupported universal end-to-end and guaranteed response-time wording.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/portfolio.test.cjs`  
Expected: PASS.

```powershell
git add cv/index.html contact/index.html css/cv-theme.css tests/portfolio.test.cjs
git commit -m "feat: make CV and contact evidence-led"
```

---

### Task 4: Convert All Twelve Case Studies to Decision Timelines

**Files:**
- Modify: `css/case-study.css`
- Modify: every `projects/<slug>/index.html` for the twelve canonical slugs
- Modify: `tests/portfolio.test.cjs`

**Interfaces:**
- Produces: semantic timeline nodes with classes `.decision-timeline`, `.decision-step`, `.decision-label`, and final `.attribution-grid` / `.limitation-note` blocks.

- [ ] **Step 1: Add failing case-study contract tests**

For every canonical project page, assert the presence of `Uncertainty`, `Evidence`, `Decision`, `My Decisions`, `Team Result`, and `Current Status`. Assert the absence of percentage contribution copy. For AI-assisted pages, assert `Human-owned` and `AI-assisted` boundaries.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/portfolio.test.cjs`  
Expected: FAIL for all legacy case-study structures.

- [ ] **Step 3: Add shared D2 timeline styles**

Implement the approved vertical decision rail, restrained labeled nodes, final two-column attribution grid, evidence-state pills, and responsive one-column fallbacks. Existing diagrams and tech badges remain reusable.

- [ ] **Step 4: Rewrite the three evidence-rich team cases**

- Surgical Twin: HoloLens uncertainty, four to five micro-PoCs, eye-tracking noise discovery, ten-frame outlier-filtered mean, one-to-two-week integration, accepted quantitative target, no outsourcing, strategy-shift limitation.
- Life Careverse: ambiguous clinical language, translation of occlusion and surgical workflow concepts, rapid XR consultation prototypes, approval/adoption/copyright/patient-consented research evidence, ongoing validation.
- Unmanned Forklift: costly physical validation, LiteSim decision, blind-spot/gate/coordinate evidence, team-wide adoption, weekly-to-monthly travel change, future maintainability still expected.

- [ ] **Step 5: Rewrite the three research/tool cases**

- rTMS Navigation: patient-specific target and registration decisions; clinical outcome remains ongoing.
- Mandibular Fracture: occlusion constraint, optimization, publication and award evidence; no invented accuracy metric.
- LLM Wiki: data-flood problem, user-owned architecture with AI implementation, solo-plus-AI authorship, current operation; no detailed private ingestion internals.

- [ ] **Step 6: Rewrite the six thinner cases honestly**

- Radioactive Digital Twin: initial Isaac Sim environment and handoff only.
- C-arm Navigation: partial navigation contribution only.
- Orthognathic AR: HoloLens/Unity navigation role, no team AI-planning claim.
- Oral-facial AR: early/supporting AR navigation contribution.
- AR Distance Meter: completed solo geometry prototype, no adoption claim.
- Quadruped Robot: owned mechanism design, modeling, build, patent, and award.

Each page receives a useful decision trail without inventing decisions or outcomes that are not documented.

- [ ] **Step 7: Run the full content validation**

Run: `node --test tests/portfolio.test.cjs`  
Expected: PASS.

Run: `node scripts/validate-portfolio.cjs`  
Expected: `Portfolio validation passed: 12 projects, 5 capabilities.`

- [ ] **Step 8: Commit case studies**

```powershell
git add css/case-study.css projects tests/portfolio.test.cjs
git commit -m "feat: rewrite projects as decision-led case studies"
```

---

### Task 5: Documentation and End-to-End Verification

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-07-15-3d-systems-portfolio.md`

**Interfaces:**
- Documents: actual navigation, shared metadata, validation command, project decision timeline, and no-build deployment.

- [ ] **Step 1: Update repository guidance**

Remove all Repositories-page references. Document `research/` as the stable route for Capabilities, `js/portfolio-data.js` as shared metadata SSOT, `js/portfolio-render.js` as the browser renderer, and `node scripts/validate-portfolio.cjs` as the content check.

- [ ] **Step 2: Run automated verification**

Run:

```powershell
node --test tests/portfolio.test.cjs
node scripts/validate-portfolio.cjs
git diff --check
```

Expected: all tests pass, portfolio validation reports twelve projects and five capabilities, and Git reports no whitespace errors.

- [ ] **Step 3: Run HTTP link and asset verification**

Start `python -m http.server 8000` in a hidden background process, request Home, Projects, Capabilities, CV, Contact, and all twelve project routes, and require HTTP 200 for each. Parse local `href`, `src`, and script references and require each local path to exist.

- [ ] **Step 4: Run browser visual checks**

At desktop and mobile widths, verify navigation, Home order, all five capability chapters, twelve equal project cards, timeline rails, focus order, visible keyboard focus, readable text, and no horizontal overflow. Verify direct `file://` links for Home, Projects, Capabilities, and one detail page.

- [ ] **Step 5: Record completion and commit**

Mark completed plan checkboxes only after their commands pass.

```powershell
git add README.md AGENTS.md CLAUDE.md docs/superpowers/plans/2026-07-15-3d-systems-portfolio.md
git commit -m "docs: align portfolio maintenance guidance"
```

- [ ] **Step 6: Final clean-state verification**

Run:

```powershell
git status --short
git log -5 --oneline
```

Expected: no uncommitted implementation files and the design, foundation, core surfaces, case studies, and documentation commits are present.

## Execution Choice

The user explicitly requested autonomous implementation without further questions. Execute this plan inline with `superpowers:executing-plans`, using the task boundaries above as checkpoints.
