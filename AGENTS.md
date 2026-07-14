# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project overview

Jinmin Kim의 GitHub Pages 개인 포트폴리오. 순수 정적 HTML/CSS/JavaScript 기반이며 빌드 과정이 없습니다.

- **URL:** https://rafaam11.github.io
- **Positioning:** 3D Spatial Computing · Research Engineer · hands-on technical-lead IC
- **Audience:** senior R&D hiring managers and technical leaders
- **Structure:** Home / Projects / Capabilities / CV / Contact
- **Deploy:** `main` push 후 GitHub Pages가 root를 직접 서빙
- **Preview:** `python -m http.server 8000`

## Content principles

- 팀 전체 결과를 개인 성과로 쓰지 않는다. `My Decisions`와 `Team Result`를 분리한다.
- 기여율 퍼센트 대신 소유한 문제, 결정, 구현, 검증 근거를 쓴다.
- 공개되지 않은 고객사·병원·기관명은 프로젝트와 상위 페이지에서 익명화한다.
- `Verified`, `Ongoing`, `Expected`, `Research`, `Completed` 상태를 구분한다.
- AI는 정체성이 아니라 구현 증폭 수단으로 다룬다. 사람은 맥락, 요구사항, 아키텍처, 수용 기준, PR 리뷰를 소유한다.
- 검증되지 않은 생산성·유지보수·임상 효과를 확정적으로 표현하지 않는다.

## File structure

```text
index.html                         # Home: hero, Capability Atlas, impact, work principles
projects/index.html                # 5 capability chapters; cards rendered from shared data
projects/<slug>/index.html         # 12 Decision Timeline case studies
research/index.html                # Capabilities route
cv/index.html                      # CV and current-role impact framing
contact/index.html                 # Contact and hiring fit
js/portfolio-data.js               # Canonical 5 capabilities, 3 metrics, 12 project summaries
js/portfolio-render.js             # Home atlas and Projects chapter renderer
js/nav.js                          # Shared nav/footer; file:// and HTTP compatible
css/site.css                       # Top-level page and shared portfolio components
css/case-study.css                 # Project timeline and attribution components
scripts/validate-portfolio.cjs     # Privacy, percentage, and route validator
tests/portfolio.test.cjs           # Content and rendering contract tests
assets/diagrams/                   # Hand-authored diagrams
docs/superpowers/specs/            # Approved audit and design
docs/superpowers/plans/            # Implementation plan
public/                            # Generated blog output; do not edit for portfolio work
.nojekyll                          # Required for GitHub Pages; do not delete
```

## Architecture notes

- `js/nav.js` renders `<header id="site-nav">` and `<footer id="site-footer">` without `fetch`, so `file://` preview works.
- Each page declares `data-base` and `data-page`. Valid page keys are `home`, `projects`, `capabilities`, `cv`, and `contact`.
- Home and Projects load `portfolio-data.js` before `portfolio-render.js`.
- `portfolio-data.js` is the summary-content SSOT. Update it when a card title, period, evidence state, role, or capability mapping changes.
- Project details remain authored HTML because their evidence and limitations differ.
- Do not use `#sideNav` or `section.resume-section`; those activate the old sidebar layout.

## Required verification

Run both commands after portfolio changes:

```powershell
node --test
node scripts/validate-portfolio.cjs
```

For layout or link changes, also run a local HTTP preview and inspect Home, Projects, Capabilities, CV, Contact, one wide detail page, and one narrow viewport.

## Deployment

Commit and push to `main` only when deployment is intended. GitHub Pages must remain configured as **Deploy from a branch → main → / (root)**.
