# Scholar Portfolio Copy, CV, and Hand-off Plan (Plan ③ of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the public CV to the 2026-08 source (copy-only, inside the fixed two-page layout), give every case the sentences it needs once media is approved, sync the GitHub profile README, and close the bookkeeping (contact kit, wiki log, atlas issue) — so the first release is complete end to end.

**Architecture:** `data/public-cv.json` is the CV SSOT; `scripts/public-cv-summary.cjs` regenerates the digest-checked HTML summary on both CV pages; `scripts/export-portfolio-data.cjs` + `scripts/generate-portfolio-pdfs.py` regenerate the 2 CV PDFs (and, because the digest changes, all 16 project PDFs). The CV schema is deliberately rigid (4 timeline · 4 capabilities · 2 research · 3 selected awards · 2 languages · totals 7/3/9) and the PDF layout caps lines (`max_lines`), so Task 1 changes **text only** and stays within those caps. Case copy lives in `js/portfolio-data.js` translations and is changed per slug when Plan ② places media.

**Tech Stack:** Node 22 `node:test`, Python venv `.superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/.venv-pdf`, Git.

**Spec:** `docs/superpowers/specs/2026-08-21-scholar-portfolio-design.md` (Positioning, PDF and CV) + approved plan `~/.claude/plans/docs-cv-luminous-dusk.md` (decisions 5, 7, 10, 12, 13, 20, 21).

**Depends on:** Plan ① Task 5 merged into `feat/scholar-portfolio` (8 cases, 16 PDFs) — Task 1 here runs on that branch **before** the final whole-branch review; Tasks 2–4 run after the owner's first push.

## Global Constraints

- Approved real names may appear (삼성서울병원/Samsung Medical Center, 서울성모병원, KERI/한국전기연구원, ETRI, KAIST, AT&C, SKADI, SMCNavi, NeuroPilot, DOTORI, K-LINAC). Never: other people's names, budgets, patent/document numbers, phone/address/age, contribution percentages, unverified clinical/operational claims, the words 박사/진학/이직/PhD/admission/채용 anywhere public.
- CV schema counts are fixed by `scripts/validate-portfolio.cjs` `publicCvDataErrors` and `scripts/generate-portfolio-pdfs.py` `validate_cv`: contacts 3 (fixed values), timeline 4, capabilities 4, research 2, selected awards 3, languages 2, `patentApplications 7 / patentGrants 3 / awardTotal 9`, must contain `JLPT N2`, `s10278-024-01014-z`, `Joint first author`, `ACCAS 2022`. Do not change counts.
- PDF line caps (A4, `generate_cv_pdf`): identity headline ≤ 2 lines @14pt, identity summary ≤ 5 lines @~9pt, timeline role ≤ 2 lines @8.5pt and summary ≤ 3 lines @7.2pt in a ~240pt column (≈ 33 Korean / 65 Latin characters per line), capability body ≤ 3 lines @6.9pt in a half-width box (≈ 30 Korean / 60 Latin characters per line). Keep Korean timeline summaries ≤ 95 characters and English ≤ 190; capability bodies ≤ 85 Korean / 170 English.
- `version` and `achievements.asOf` move to `2026-08-21`; the literal `'2026-08-16'` is asserted in `scripts/validate-portfolio.cjs` (`Public CV data requires the approved 2026-08-16 version`) and `tests/portfolio.test.cjs` (`exported.cv.version`) — both change together. Tests also pin `DIGITRACK`, `공동 제1저자`, `출원 7건.*등록 3건.*수상 9건`, `7 applications.*3 grants.*9 awards`, `3D 정합과 로봇 소프트웨어` / `3D registration and robot software` (CV page headers) — keep those strings.
- Line endings LF (`.gitattributes`); never `git stash` / `git checkout -- .` / `git reset --hard` in this repo.
- Every task ends with `node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check` clean; one commit per task; **no push** — the owner pushes after previewing.

---

### Task 1: Public CV copy refresh (2026-08 source) and PDF regeneration

**Files:**
- Modify: `data/public-cv.json`, `scripts/validate-portfolio.cjs` (version literal), `tests/portfolio.test.cjs` (version literal + new test), `cv/index.html`, `en/cv/index.html` (regenerated summary envelope only), `output/pdf/*`, `assets/pdfs/*`, `assets/cv/*` (regenerated)

**Interfaces:**
- Produces: `public-cv.json` version `2026-08-21` with updated identity/timeline/capability copy; regenerated CV summaries and all 18 PDFs + manifest.

- [ ] **Step 1: Write the failing test** — append to `tests/portfolio.test.cjs`:

```js
test('Scholar CV refresh names the approved partners and products within the PDF line caps', () => {
  const cv = JSON.parse(read('data/public-cv.json'));
  assert.equal(cv.version, '2026-08-21');
  assert.equal(cv.achievements.asOf, '2026-08-21');
  const digitrack = cv.timeline[0];
  assert.match(digitrack.translations.ko.summary, /삼성서울병원/);
  assert.match(digitrack.translations.ko.summary, /SKADI/);
  assert.match(digitrack.translations.ko.summary, /DOTORI/);
  assert.match(digitrack.translations.en.summary, /Samsung Medical Center/);
  for (const entry of cv.timeline) {
    assert.ok(entry.translations.ko.summary.length <= 95, `${entry.organization}: ko summary ${entry.translations.ko.summary.length} chars`);
    assert.ok(entry.translations.en.summary.length <= 190, `${entry.organization}: en summary ${entry.translations.en.summary.length} chars`);
  }
  for (const capability of cv.capabilities) {
    assert.ok(capability.translations.ko.body.length <= 85, `${capability.translations.ko.title}: ko body`);
    assert.ok(capability.translations.en.body.length <= 170, `${capability.translations.en.title}: en body`);
  }
  assert.doesNotMatch(JSON.stringify(cv), /박사|진학|이직|PhD|admission|홍재성|안재명|강영남|최현석|\b10-\d{4}-\d+\b/);
  assert.deepEqual(validator.publicCvDataErrors(cv), []);
});
```

- [ ] **Step 2: Run it** — `node --test --test-name-pattern="Scholar CV refresh" tests/portfolio.test.cjs` → FAIL (version is `2026-08-16`).

- [ ] **Step 3: Update `data/public-cv.json`** (text only; counts unchanged):

```json
"version": "2026-08-21",
"identity": { "name": "Jinmin Kim", "translations": {
  "ko": { "displayName": "김진민", "headline": "3D 정합·의료영상·로봇 시스템을 잇는 로봇SW 엔지니어",
          "summary": "수술내비게이션에서 시작해 XR, 3D 정합, 다중 센서 통합, 무인지게차 현장 배치까지 확장해 온 연구개발 엔지니어입니다. 좌표계와 알고리즘을 실제 장치, 사용자 인터페이스, 검증 흐름으로 연결합니다." },
  "en": { "displayName": "Jinmin Kim", "headline": "Robot Software Engineer — 3D Registration, Medical Imaging, Robot Systems",
          "summary": "An R&D engineer whose work spans surgical navigation, XR, 3D registration, multi-sensor integration, and autonomous-forklift field deployment. I connect coordinate models and algorithms to physical devices, user interfaces, and explicit validation flows." } } },
"timeline": [
  { "period": "2023-02 - Present", "organization": "DIGITRACK Inc.", "translations": {
    "ko": { "role": "연구원 · 로봇SW 개발", "summary": "삼성서울병원과 협업한 수술내비게이션 통합 SW, NeuroPilot rTMS 내비게이션, SKADI API·Viewer, 무인지게차 DOTORI 비전·안전정책, 표면유도 호흡추적(2026–) 담당." },
    "en": { "role": "Researcher · Robot Software", "summary": "Surgical-navigation software with Samsung Medical Center; NeuroPilot rTMS navigation; SKADI API and Viewer; DOTORI forklift vision and safety policy; surface-guided respiratory tracking (2026–)." } } },
  { "period": "2021-03 - 2023-02", "organization": "DGIST", "translations": {
    "ko": { "role": "로봇공학 석사", "summary": "치아 교합 기반 하악골 골절 정복 계획 최적화(JIIM 2024, 공동 제1저자)와 AR 수술내비게이션·XR 연구." },
    "en": { "role": "M.S. in Robotics", "summary": "Occlusion-based mandibular fracture reduction planning (JIIM 2024, joint first author) and AR surgical-navigation and XR research." } } },
  { "period": "2020-07", "organization": "UNIST U-SURF", "translations": {
    "ko": { "role": "하계대학원 연구인턴", "summary": "소프트로봇 논문 리딩과 자기력 실험을 수행했습니다." },
    "en": { "role": "Summer Research Intern", "summary": "Reviewed soft-robotics literature and conducted magnetic-force experiments." } } },
  { "period": "2015-03 - 2021-02", "organization": "Kumoh National Institute of Technology", "translations": {
    "ko": { "role": "기계시스템공학 학사", "summary": "시스템비전연구실 학부연구, 4족 보행 로봇 설계·제작, 발명·특허 활동을 수행했습니다." },
    "en": { "role": "B.S., Mechanical System Engineering", "summary": "System-vision undergraduate research, a quadruped robot design-and-build, and invention and patent activity." } } }
],
"capabilities": [
  { "translations": { "ko": { "title": "3D 정합 및 최적화", "body": "PCA, ICP, CLPSO와 Open3D, OpenCV, SciPy로 특징점·표면·좌표계 정합과 센서 정밀도 검증을 다뤘습니다." },
                      "en": { "title": "3D Registration and Optimization", "body": "Feature, surface, and coordinate-frame registration plus sensor-precision validation with PCA, ICP, CLPSO, Open3D, OpenCV, and SciPy." } } },
  { "translations": { "ko": { "title": "의료 내비게이션 및 XR", "body": "3D Slicer, VTK, Qt, OpenIGTLink, Unity, MRTK, Meta SDK, Photon으로 동작하는 내비게이션·XR 앱을 구현했습니다." },
                      "en": { "title": "Medical Navigation and XR", "body": "Working navigation and XR applications with 3D Slicer, VTK, Qt, OpenIGTLink, Unity, MRTK, Meta SDK, and Photon." } } },
  { "translations": { "ko": { "title": "로봇 및 센서 통합", "body": "ROS 2, Zenoh, Isaac Sim, NDI 추적기, HoloLens 2, Meta Quest, RGB·ToF·LiDAR를 연결하고 현장에 배치했습니다." },
                      "en": { "title": "Robot and Sensor Integration", "body": "Integrated ROS 2, Zenoh, Isaac Sim, NDI tracking, HoloLens 2, Meta Quest, RGB, ToF, and LiDAR, and deployed them in the field." } } },
  { "translations": { "ko": { "title": "응용 계층 개발", "body": "Python, C#, C++로 알고리즘, API·Viewer, XR 앱, ROS 2 패키지, SAM 계열 세그멘테이션 PoC를 구현했습니다." },
                      "en": { "title": "Application-layer Engineering", "body": "Algorithms, API and Viewer software, XR apps, ROS 2 packages, and SAM-family segmentation PoCs in Python, C#, and C++." } } }
],
"achievements": { "...": "unchanged except", "asOf": "2026-08-21" }
```
  (`contacts`, `research`, `achievements.selectedAwards`, `languages` stay exactly as they are.)

- [ ] **Step 4: Version literals** — `scripts/validate-portfolio.cjs`: `if (candidate.version !== '2026-08-21') errors.push('Public CV data requires the approved 2026-08-21 version.');` and `tests/portfolio.test.cjs` `assert.equal(exported.cv.version, '2026-08-21')`. `grep -rn "2026-08-16" scripts tests data` afterwards — the only remaining hits should be the venv/sdd path and the older spec references.

- [ ] **Step 5: Regenerate the CV summaries** — `node scripts/public-cv-summary.cjs` (its `main` calls `refreshCvSummaries(root)`; it rewrites the `PUBLIC CV SUMMARY` envelopes on `cv/index.html` and `en/cv/index.html` atomically). Confirm `git diff --stat cv/index.html en/cv/index.html` shows only lines inside the envelope.

- [ ] **Step 6: Regenerate PDFs** (same command as Plan ① Task 5 Step 10). Open `pdf-review/jinmin-kim-cv-ko-page-1.png` and `-en-page-1.png`: no truncated ellipses in the timeline summaries or capability boxes; if any text is clipped, shorten that string (keeping the required names) and rerun.

- [ ] **Step 7: Verify and commit**

```bash
node --test && node scripts/validate-portfolio.cjs && git diff --check
git add data/public-cv.json scripts/validate-portfolio.cjs tests/portfolio.test.cjs cv/index.html en/cv/index.html output/pdf assets/pdfs assets/cv
git commit -m "feat(cv): refresh the public CV copy to the 2026-08 source and regenerate PDFs"
```

---

### Task 2: Case copy once media is approved (applied per slug during Plan ② Task 6)

**Files:**
- Modify: `js/portfolio-data.js` translations of the slug being published; `tests/portfolio.test.cjs` only if a test pins the old sentence (grep first)

**Interfaces:**
- Consumes: the approved media set for the slug (lead image or clip+poster, gallery items) from Plan ② `apply-decisions.cjs` output.
- Produces: `limitation`, `mediaCaption`, `cardEvidence`, `verifiedEvidence`, `visualCaption` (ko/en) that describe what is actually shown; gallery `translations.ko/en.{caption,alt}` filled.

Rules: one short declarative sentence per field; say what the visual is and what it does not prove; keep the team/individual separation; figure captions start with what is shown ("HoloLens 정합 피드백 화면", not "우리의 혁신적인…").

- [ ] **Step 1:** For the slug being published, replace the "pending approval" sentences with the matching row below (ko / en). If only some media is approved (e.g. lead but no clip), use the lead row and keep the clip sentence out.

| slug | field | ko | en |
|---|---|---|---|
| surgical-navigation | mediaCaption | 삼성서울병원 협업 수술내비게이션의 HoloLens 정합 피드백 시연 장면입니다. | HoloLens registration-feedback demonstration from the surgical-navigation work with Samsung Medical Center. |
| surgical-navigation | limitation | 시연 영상은 통합 동작을 보여주며 임상 효과나 운영 배포를 주장하지 않습니다. | The demonstration shows integrated operation; it does not claim clinical efficacy or production deployment. |
| surgical-navigation | cardEvidence / verifiedEvidence | 장치 연결·좌표 변환·공간 시연 클립과 화면 캡처가 근거입니다. | Device-connection, transform, and spatial demonstration clips and captures are the evidence. |
| mandibular-fracture | mediaCaption | 하악골 골절편 정복 최적화 결과와 학회 발표 장면입니다. | Mandibular fragment reduction results and the conference presentation. |
| mandibular-fracture | limitation | 공개 근거는 논문과 발표 자료이며 임상 적용을 주장하지 않습니다. | Public evidence is the paper and presentation material; no clinical use is claimed. |
| respiratory-surface-guidance | mediaCaption | 상용 3D 센서 5종의 거리별 정밀도 실측표와 DtDepthScan 검증 도구 화면입니다. | Measured precision of five commercial 3D sensors by distance and the DtDepthScan validation tool. |
| respiratory-surface-guidance | limitation | 1차년도 센서 검증 결과이며 임상 성능이나 과제 목표 달성을 주장하지 않습니다. | First-year sensor validation only; no clinical performance or programme-target achievement is claimed. |
| unmanned-forklift | mediaCaption | 무인지게차 DOTORI의 트럭 적재 비전과 주행 테스트 클립입니다. | Truck-loading vision and driving-test clip from the DOTORI autonomous forklift. |
| unmanned-forklift | limitation | 공개 클립은 테스트 주행이며 생산 운영 성과나 고객 성과를 주장하지 않습니다. | The public clip is a test run; it does not claim production or customer outcomes. |
| life-careverse | mediaCaption | Meta Quest 기반 다중 사용자 상담 XR 시연 장면입니다. | Multi-user consultation XR demonstration on Meta Quest. |
| life-careverse | limitation | 시연은 동기화 동작을 보여주며 임상 효과를 주장하지 않습니다. | The demonstration shows synchronisation; no clinical effect is claimed. |
| rtms-navigation | mediaCaption | NeuroPilot rTMS 코일 내비게이션 프로토타입 화면입니다. | NeuroPilot rTMS coil-navigation prototype screens. |
| rtms-navigation | limitation | 프로토타입 화면이며 임상 사용이나 승인을 주장하지 않습니다. | Prototype screens; no clinical use or approval is claimed. |
| skadi-tracking-software | mediaCaption | SKADI Viewer가 추적 장치 상태와 마커 좌표를 표시하는 장면입니다. | SKADI Viewer showing tracker status and marker coordinates. |
| skadi-tracking-software | limitation | 장치 사양·정확도·판매 수치는 회사 소유 정보로 공개하지 않습니다. | Device specifications, accuracy, and sales figures are company-owned and not published. |
| ai-build-lab | mediaCaption | 개인 지식 시스템 대시보드 화면(개인 데이터 비식별)입니다. | Personal knowledge-system dashboard screens with private data hidden. |
| ai-build-lab | limitation | 화면은 공개 안전 데이터로 캡처했으며 사용자·생산성 지표를 주장하지 않습니다. | Screens use public-safe data; no user or productivity metrics are claimed. |

  `cardEvidence`, `verifiedEvidence`, `visualCaption` follow the same wording as `mediaCaption`/`limitation` shortened to one clause. Gallery captions: "그림 n." is added by the renderer — write only the noun phrase (e.g. `ko: { caption: 'ToF-RGB 정합 결과', alt: 'ToF와 RGB 영상이 정합된 포인트클라우드 화면' }`).

- [ ] **Step 2:** `node --test && node scripts/validate-portfolio.cjs && git diff --check`; regenerate PDFs (data changed); commit together with the placement commit for that slug: `feat(evidence): publish approved <slug> media`.

---

### Task 3: GitHub profile README sync (after the owner's first push)

**Files:**
- Modify: `C:\Users\uiop3\Desktop\3_Hobby_ws\rafaam11\README.md`

- [ ] **Step 1:** Read the current README; keep the typing banner, tech-stack table, and contact block. Replace the intro tagline with `Robot software engineer — 3D registration, medical imaging, and robot systems, from research to the field. @ DIGITRACK`.
- [ ] **Step 2:** Replace the 4-item project showcase with an 8-row table linking to the live site (`https://rafaam11.github.io/projects/<slug>/`), in site order, each with a one-line English description taken from `translations.en.summary` (shortened to ≤ 110 characters). Remove "NDA/Private" labels from rows whose cases are now public; keep "(private data)" only on the knowledge-system line.
- [ ] **Step 3:** Update the publications/patents/awards line to `1 SCIE Q1 paper (joint first author) · 7 patent applications (3 registered) · 9 awards`. Remove any mention of 박사/진학/job search.
- [ ] **Step 4:** `git -C C:\Users\uiop3\Desktop\3_Hobby_ws\rafaam11 diff` for the owner; commit `docs: sync profile README with the Scholar portfolio (8 cases)`; **push only after the owner says so** (the profile is public).

---

### Task 4: Bookkeeping after the first push

**Files:**
- Modify: `C:\Users\uiop3\Desktop\0_LLMwiki_ws\wiki\synthesis\2026-08-15-yangsu-contact-kit.md` (section A checklist), `wiki\log.md`; atlas issue #673 via `/atlas-issue-flow done`; memory `project_portfolio_scholar_redesign_2026.md`

- [ ] **Step 1:** Contact kit section A: under the existing `rafaam11.github.io 갱신분 push 완료 (2026-08-16 …)` line add `- [x] **Scholar 재디자인·8케이스 push 완료** (<date>, 커밋 <sha> — 실명 반영·1차 미디어 <slugs>; 라이브 확인됨)`.
- [ ] **Step 2:** `wiki/log.md` entry: `## [<date>] output | 포트폴리오 Scholar 재디자인 1차 공개` with the commit list and the media counts per slug; reference `[[synthesis/2026-08-15-yangsu-contact-kit]]`.
- [ ] **Step 3:** `cd apps/atlas && npm run issue-flow -- done --page 1458ef67-9a0c-48e7-a9d3-42598a5da483 --content-file <results.md>` with: what shipped, commits, what remains (second wave, corrupt originals), where the ledgers are.
- [ ] **Step 4:** Update the memory file's 실행 상태 line (Plan ① merged/pushed date; Plan ② wave status); commit the wiki changes in LLMwiki (`docs(wiki): 포트폴리오 1차 공개 기록`).

---

## Self-review

- Spec coverage: CV regenerated from the 2026-08 source within the fixed schema (Task 1); positioning/neutral wording enforced by the new test's forbidden-word check; per-case copy separates individual/team and avoids clinical/operational claims (Task 2); profile README sync (decision 20, Task 3); contact-kit/log/atlas closure (Task 4).
- Placeholders: none — the CV JSON text, the per-slug sentence table, the README edits, and the bookkeeping lines are all written out.
- Type consistency: field names (`limitation`, `mediaCaption`, `cardEvidence`, `verifiedEvidence`, `visualCaption`, gallery `translations.ko/en.{caption,alt}`) match Plan ① Task 2/3 contracts; CV keys match `publicCvDataErrors`; version literal locations match Plan ① Task 5's notes.
