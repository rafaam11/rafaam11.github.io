# Positioning Design — Robotics & Computer Vision R&D

> 2026-09-29. This spec supersedes the positioning wording, the project tiers and the capability titles in `2026-08-21-scholar-portfolio-design.md`. It also extends the Home intro defined in `2026-09-28-scholar-readability-design.md`. The visual system, privacy rules and media rules of both specs remain in force.

## Identity

The site tells one career story: an engineer who connects anatomy, surgical instruments, sensors, cameras, XR devices and robots in one 3D coordinate space. Each step is listed below with where it is claimed.

| Step | Claimed as |
|---|---|
| 3D geometry and registration | current expertise |
| Optical tracking | current expertise |
| Surgical navigation | current expertise |
| XR and spatial computing | current expertise |
| Robot vision and sensor integration | current expertise |
| Surgical robotics and Physical AI | research direction only |

- **Role (ko):** 수술 로보틱스·컴퓨터비전 R&D 엔지니어
- **Role (en):** Robotics & Computer Vision R&D Engineer
- The English role matches the English CV headline, which does not carry "Surgical".

## Current expertise vs research direction

**Current expertise** covers Surgical Navigation, 3D Registration, Optical Tracking, Computer Vision, XR and Spatial Computing, and Robotics, Vision and Sensor Integration.

- It appears in the capability list ("현재 전문성 / Current expertise").
- It appears in the Person JSON-LD `knowsAbout`.
- It appears in page descriptions.

**Research direction** covers Surgical Robotics, Physical AI, Surgical AI, 3D Vision, Robot Perception, Multimodal Perception and Spatial Intelligence.

- Its only source is `data/public-cv.json` `interests` (ko/en, seven terms each).
- It appears in only four places:
  - the Home `.sc-intro__direction` line;
  - the last sentence of the CV summary;
  - the JSON-LD `description`;
  - the "growing toward" clause of the English Home description.
- It never appears in capability titles, methods, tier labels or `knowsAbout`.

**Claims the owner has ruled out:**

- development of robot-assisted surgical systems;
- SLAM;
- sensor-fusion algorithm expertise;
- responsibility for clinical trials;
- expertise in Physical AI;
- research on AI model architecture.

Past projects are not relabelled as Physical AI. `tests/positioning.test.cjs` guards the overclaim terms.

**Facts confirmed by the owner:**

- use of Galaxy XR and OpenXR;
- integration, not development, of an AI anatomical-landmark detection model into the digital occlusion workflow.

## Project tiers

| key | ko | en | slugs (explicit order) |
|---|---|---|---|
| `surgical-robotics` | 수술 로보틱스·내비게이션 | Surgical Robotics & Navigation | surgical-navigation, digital-occlusion-workflow, rtms-navigation, mandibular-fracture |
| `spatial-computing` | 컴퓨터비전·3D 공간 컴퓨팅 | Computer Vision & 3D Spatial Computing | skadi-tracking-software, respiratory-surface-guidance |
| `xr` | XR·공간 시각화 | XR & Spatial Visualization | life-careverse |
| `robotics` | 로보틱스·자동화 | Robotics & Automation | unmanned-forklift |
| `ai-build-lab` | AI 빌드 랩 | AI Build Lab | ai-build-lab |

- The `slugs` field on a tier is optional. When it is present:
  - `projectListHtml` follows its order;
  - `validatePortfolioData` rejects it unless it lists exactly the cases in that tier.
- The brief suggested "XR & Digital Twin". It was replaced by "XR & Spatial Visualization" because no digital-twin project exists.
- Case eyebrows begin with their tier label; a test guards this, and the eyebrows are printed on the PDF covers.
- On the Projects page each case adds one technology line (`.sc-project__tech`, from `tech`). The problem, role and evidence table stays off the list pages (readability v2).

## Capabilities

The order follows the career path:

1. `medical-navigation`: 수술 내비게이션·광학 추적
2. `registration`: 3D 정합·컴퓨터비전
3. `xr-engineering`: XR·공간 컴퓨팅, whose methods add OpenXR, HoloLens 2 and Galaxy XR
4. `sensor-fusion`: 로봇 비전·센서 통합
5. `ai-product-engineering`: unchanged

Keys are kept so that the project `capabilityKeys` and the PDF pipeline stay stable.

## Home intro

The intro renders in this order:

1. `h1`
2. `.sc-intro__role`
3. `.sc-intro__keywords` (English keyword line, `lang="en"` on the Korean page)
4. `.sc-intro__lede` (two sentences)
5. `.sc-intro__statement` (one line on the career path)
6. `.sc-intro__affiliation`: "㈜디지트랙 연구원 · 소프트웨어 R&D" / "Research Engineer · Software R&D, DIGITRACK Inc." and the DGIST degree
7. `.sc-intro__links`
8. `.sc-intro__direction`, rendered only when `cv.interests` exists

Other Home changes:

- The capability heading becomes "현재 전문성 / Current expertise"; `id="implementation-title"` is kept.
- A selected publication that has a `projectSlug` gets a "관련 프로젝트 / Related project" link.
- `hero-kicker` is not used on Home.

## Head metadata

Page titles and descriptions:

- The Home title and all Home, Projects, CV and Contact descriptions follow the positioning.
- Contact still avoids the word "consultation".
- News is unchanged.

Person JSON-LD:

- `personJsonLd()` in `scripts/profile-home.cjs` generates one block into the Home `<head>` only, between the `PERSON JSON-LD` markers.
- The block carries: name and alternate name, URL, image, job title, description, `worksFor` DIGITRACK Inc., `alumniOf` DGIST and Kumoh, `knowsAbout` (current expertise), and `sameAs` (GitHub, LinkedIn).
- There is no email, partner hospital or patient information.

Footer:

- Tagline (`js/nav.js`): "수술 내비게이션 · 3D 정합 · 광학 추적 · XR — 지능형 수술을 향해."
- Meta line (`js/site-i18n.js`): the role and Daegu.

## Public CV extensions

`data/public-cv.json` keeps `version: '2026-08-22'`, the public-approval policy date. It gains three optional fields, which the validator checks:

- `interests: {ko: [7], en: [7]}`.
- `publications[].authors`: allowed only on the JIIM 2024 citation (`s10278-024-01014-z`). It lists all five authors in full, as bibliographic data for the author's own paper. Apart from this line and the thesis advisor approved on 2026-08-22, other people's names stay out of public copy.
- `publications[].projectSlug`: a canonical case slug. It renders a "관련 프로젝트 / Related project" link on the CV and on Home.

## Project PDFs

- Generator 3.3 checks five tiers, and the PDF keywords are "surgical navigation, 3D registration, computer vision, public portfolio".
- The 18 PDFs were regenerated once. Page counts are unchanged, 95 in total.
- The Korean forklift thesis was shortened to one line so that its page count stays at four.

## Verification

- `tests/positioning.test.cjs`
- `tests/cv-sync.test.cjs` (CV fields)
- Updated pins in `tests/portfolio.test.cjs`: tier and capability keys, tier mapping, Projects order, Home lede
- `node --test`
- `node scripts/validate-portfolio.cjs`
- `node scripts/check-local-preview.cjs`
- Screenshots of Home (ko) at 1280 and 500 px
