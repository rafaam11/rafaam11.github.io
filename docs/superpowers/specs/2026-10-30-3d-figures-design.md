# 3D 그림 도입 설계 (2026-10-30)

> 상태: 승인(2026-10-30). 원 계획: 사용자 인터뷰 후 승인된 구현 계획을 스펙으로 옮김.

## Context

사용자는 지금 rafaam11.github.io를 이렇게 판단했다(2026-10-30 인터뷰):
- 글 위주라 밋밋하다.
- 사례 페이지가 빈약하다.
- 최근 발표 덱보다 못하다.
- 첫 화면 인상이 약하다.

최근 발표 HTML 5종(경력 소개 덱, A4LAB, SGRT, 가상병원 2-2, DOTORI)은 같은 three.js r128 `Deck3D` 엔진으로 시스템 구조를 3D로 보여 주었고, 효과가 있었다. 이 엔진과 장면을 포트폴리오로 옮겨, 각 사례가 무엇을 만들었는지 그림으로 보이게 한다. 함께 할 일은 둘이다.
- 직접 만들어 쓰는 도구(multi-cli-work, harness-manager, view-anything)를 사이트와 README 양쪽에 드러낸다.
- GitHub 프로필 README를 프로젝트 중심으로 다시 쓴다.

### 사용자 결정 (인터뷰)

**사이트**
- 분위기: **Scholar 유지 + 3D 추가**. 담백한 텍스트 톤과 880px 단일 칼럼을 유지한다. 칩·아이콘·그림자는 다시 넣지 않는다. 3D는 번호가 붙은 "그림"으로 들어간다.
- 홈 대표 장면: **광학 추적·정합**. 천장 SKADI가 두부 마커를 추적하고 CT 단면이 머리에 정합되는 장면이다. 로봇팔은 넣지 않는다.
- Projects 목록 카드: **실제 승인 이미지를 유지**한다. 3D는 홈과 사례 페이지에만 둔다.
- AI Build Lab 사례에 harness-manager와 view-anything을 **사이트에도 추가**한다. 소식은 첫 릴리스 기준이다(harness-manager v0.2.0 · 2026-06-19, view-anything v0.1.0 · 2026-10-26).

**README**
- 독자는 연구자·교수와 채용 담당자다. 영어로 쓴다.
- **프로젝트 중심**으로 짠다. 기술 나열은 버리고 각 프로젝트에 쓴 툴을 공식 아이콘으로 단다.
- 구성:
  - 상단: 3D 배너와 사실형 한 줄
  - 프로젝트: 썸네일 표 9행
  - 별도 섹션 "Tools I build and use"
  - "Daily tools" 아이콘 한 줄
- 움직임: 배너만 회전 GIF로 하고, 썸네일은 정지 PNG로 한다.

## 목표 · 비목표 · 반목표

- **목표**
  - 홈에 3D 그림 1개, 사례 8개에 3D 그림 1개씩을 넣는다. AI Build Lab에는 넣지 않는다.
  - AI Build Lab에 앱 2개를 추가한다.
  - README를 새로 쓴다.
- **비목표**
  - AI Build Lab을 뺀 프로젝트 PDF와 CV PDF의 내용은 바꾸지 않는다.
  - 다크 모드와 슬라이드형 레이아웃은 넣지 않는다.
  - Projects 카드는 바꾸지 않는다.
- **반목표** (기술적으로는 동작해도 실패로 본다)
  - 3D가 사실보다 큰 역할을 암시한다. 예: 로봇 보조 수술, 설계 단계 기능을 완성품처럼 그린 것.
  - 비공개 파트너 이름이나 고객 하드웨어 CAD가 보인다.
  - 모바일에서 스크롤이 3D에 붙잡힌다.
  - 600KB three.js가 사례 본문 렌더를 늦춘다.
  - 사례 본문 문장과 대응하지 않는 장식용 장면이 들어간다.
  - 사용자가 거부한 "센서 실측 벤치(σ 막대)" 장면이 들어간다.

## 설계

### 1. 엔진 — `js/vendor/three-r128.min.js`, `js/scene3d.js`

**원본 위치.** 원본은 Drive의 최신 낱개 파일(10-14 v2 재작업본)을 쓴다. 공유본 HTML 번들이나 `C:\work\...` git 사본은 쓰지 않는다.
- 위치: 비공개 발표 덱 작업 폴더의 `html/3d/` (레포 밖)
- 쓰는 파일: `deck3d.js`, `deck3d-layout.js`, `meeting-models.js`(skull·skadiCam·patient·person 덮어쓰기), `three-r128.min.js`
- 빼는 파일: `GLTFLoader.js`, `meeting-assets.js`, `post-r128.js`(SSAO)

**`scene3d.js` 구성.** `deck3d.js`, `deck3d-layout.js`, `meeting-models.js`를 이 파일 하나로 합친다. `register(name,{fit,build})` 계약을 유지해서 장면 파일을 거의 그대로 옮길 수 있게 한다.

스크롤 페이지에 맞게 바꾸는 점:
- **three.js 지연 주입.** 정적 `<script>`로 넣지 않는다.
  - `scene3d.js`가 `.view3d`가 화면 근처에 오면 `js/vendor/three-r128.min.js`를 동적 `<script>`로 주입한다. 이 방식은 `file://`에서도 동작한다.
  - 이유: validator가 `async`/`defer`를 금지한다(`validate-portfolio.cjs:2209`). 블로킹으로 넣으면 클라이언트 사례 렌더가 늦어진다.
- **수명주기.** `MutationObserver(section.active)`를 `IntersectionObserver`(rootMargin 200px)로 바꾼다. 동시에 살아 있는 WebGL 컨텍스트는 최대 2개로 두고, 화면을 벗어나면 dispose와 `forceContextLoss`를 한다.
- **입력.**
  - 휠 줌은 끈다.
  - 드래그로 회전하고, 더블클릭이나 "원위치" 텍스트 버튼으로 되돌린다.
  - 터치에서는 한 손가락 입력을 페이지 스크롤로 통과시키고(`touch-action: pan-y`), 두 손가락으로 회전한다.
- **reduced-motion.** `prefers-reduced-motion`이면 autoYaw와 애니메이션을 멈추고 고정 프레임만 그린다.
- **품질 단계.** 모바일과 WebGL1은 그림자 1024, SSAO 없음.
- **장면 제약.** 장면은 프로시저럴만 허용한다. GLB와 텍스처 이미지 로드는 금지한다(`file://` 호환과 고객 하드웨어 배제를 위해).

**스크립트 순서.** 정적으로 추가하는 스크립트는 2개다: `scene3d.js` → `scenes/<name>.js`. 위치는 `portfolio-render.js` 다음, `nav.js` 앞이다.

**폴백과 인쇄.**
- `.view3d` 안에 WebP 포스터 `<img>`를 두고, 마운트에 성공하면 `.view3d.live`가 포스터를 숨긴다.
- 사례 셸의 정적 `td-case-fallback`(JS 없을 때 보이는 텍스트)에도 포스터 `<img>`를 추가한다.
- `css/scholar.css`에 `@media print { .view3d canvas{display:none} .view3d img{display:block} }`를 추가한다. 현재 print 규칙은 없다.
- AGENTS.md에 "실제 장면 캡처 래스터 포스터는 금지된 decorative SVG fallback이 아니다"를 명시한다.

**스타일.** `css/scholar.css`에 `.sc-figure3d` 블록을 추가한다.
- 16:10 상자, 배경 `--sc-bg`, `--sc-rule` 1px 테두리, 기존 figure 캡션 스타일을 쓴다.
- box-shadow, gradient, uppercase는 쓰지 않는다(`portfolio.test.cjs:2606` 계약).

### 2. 장면 — `js/scenes/<name>.js`

| 위치 | 장면 | 원본(Drive 3d/) | 사실 경계 |
|---|---|---|---|
| 홈 | `home-tracking` | A4LAB `scene-cover`에서 로봇팔을 빼고 경력 소개 덱 `scene-skadi`와 합침 | 추적·정합·내비만 |
| mandibular-fracture | `ms-frac` | `scene-ms-frac.js` | 시뮬레이터·최적화(연구) |
| surgical-navigation | `smcnavi` | `scene-smcnavi.js` | 좌표 정합 체인. HoloLens는 본문 근거가 있을 때만 |
| digital-occlusion-workflow | `foaa` | `scene-foaa.js` | 수술계획 요소는 빼거나 "(설계)"로 표시 |
| life-careverse | `omfsvr` | `scene-omfsvr.js` | 3인 VR 상담·CT 턱 모델 |
| rtms-navigation | `neuro` | `scene-neuro.js` | 본문에 UR 연동이 없으면 로봇 요소 제거. 기관명 라벨 금지 |
| respiratory-surface-guidance | `sgrt-poc` | `scene-sgrt-poc.js` | 1차년도 센서 검증·호흡 추적 PoC만 |
| skadi-tracking-software | `skadi` | `scene-skadi.js` | 추적기·마커 |
| unmanned-forklift | `fk-safety` | `scene-fk-safety.js` | GLB 없음 확인됨. `scene-forklift`·`fk-servo`·`fk-site`는 GLB를 쓰므로 제외. Zenoh 자체 미들웨어 |

- 라벨은 장면 파일 안에 ko/en 쌍으로 두고 문서 `lang`으로 고른다.
- 각 장면에서 보이는 요소와 라벨은 `portfolio-data.js`의 해당 사례 role/summary/evidence 문장과 1:1로 대응시킨다.
  - 이 대조표는 스펙에 남긴다.
  - 근거 자료: AGENTS.md 금지 목록, 소유자가 확인한 사실 경계.
- 장면 원본 주석에는 내부 설계 문서·하드웨어 모델 같은 비공개 출처가 적혀 있다. 이식할 때 주석과 문자열을 정리하고 validator 스캔으로 확인한다.

### 3. 페이지 통합

**데이터**
- 사례 레코드에 `scene3d`를 추가한다.
  - 형식: `{ name, poster, translations: { ko:{caption,alt}, en:{caption,alt} } }` (레포 관례)
  - 형식 검사는 `validatePortfolioData`(`js/portfolio-render.js:748`)에 추가한다.
- PDF digest 처리: `canonicalPdfSource`(`scripts/portfolio-pdf-source.cjs:22`)가 `projects` 전체를 해시한다. 여기서 `scene3d`를 제외해 3D 추가가 PDF manifest를 깨지 않게 한다.

**렌더** (`caseStudyHtml`, `js/portfolio-render.js:1492`, 레이아웃 3종)
- 공통 원칙: 대표 이미지(lead)는 그림 1을 유지하고, 3D는 그 다음 그림이 된다.
- 레이아웃별 위치:

| 레이아웃 | 사례 | 3D 위치 |
|---|---|---|
| 기본 | mandibular, life-careverse, rtms, sgrt, forklift | approach 섹션 첫 그림 |
| story | surgical-navigation, digital-occlusion | overview 섹션 뒤 |
| product-console | skadi | 제품 이력 섹션 뒤 |

- product-console은 미디어 인덱스로 번호를 매긴다(1399, 1422). 증거 링크 "Figure N"이 어긋나지 않는지 확인한다.
- 번호 재부여: `js/local-projects.js`가 렌더 후 `.sc-figure__label`을 페이지 순서로 다시 매기고(47), 기사 바로 아래 첫 `figure`를 lead로 옮긴다(27). 따라서 3D figure는 기사 직속 첫 figure가 되지 않게 섹션 안에 둔다.

**사례 셸.** 16개 셸에 스크립트 2개를 추가한다(ai-build-lab ko/en 제외). 대상은 `projects/<slug>/index.html`과 `en/projects/<slug>/index.html`이다.

**홈**
- `scripts/profile-home.cjs`가 `<main>` 안의 인트로 아래(현재 전문성 위)에 `home-tracking` figure를 생성하도록 고친다.
  - 이 figure에 `data-project` 속성을 붙이지 않는다(`profile-pages.test.cjs:29`).
- `<main>` 밖의 스크립트 태그는 `index.html`과 `en/index.html`에서 손으로 추가한다.
- 그다음 `node scripts/public-cv-summary.cjs --write`를 실행한다.

**Validator**
- `pageDependencyErrors`(`validate-portfolio.cjs:2120`): 페이지의 `data-project`(사례)와 홈을 키로, 데이터에 `scene3d`가 있을 때만 두 스크립트를 순서에 넣어 허용한다.
- 포스터 검사:
  - 존재 여부
  - WebP 메타데이터: `scripts/activity-media.cjs` 198–222행의 WebP EXIF/XMP 검사를 재사용한다.
  - 용량 예산: 장면 JS 합계 ≤ 400KB, 포스터 합계 ≤ 3MiB
- `scene3d.js`와 `js/scenes/*.js`를 `privatePartnerPattern`(=`render.policy.prohibitedPartnerPattern`)과 `contributionPattern` 스캔 대상에 넣는다.

**테스트 갱신 목록** (검토로 확인)
- `portfolio.test.cjs`
  - 282–320 `copyTask6Surface`: 새 JS와 `assets/3d` 복사
  - 2004–2005: surgical-navigation 그림 수 10과 연속 번호
  - 2423: mandibular 그림 순서
  - 506: subcase 키
  - 805–813: AI Build Lab evidence 행
  - 2606: CSS 금지 속성
- `activity-media.test.cjs` 174–176: 릴리스 ID 하드코딩
- `profile-pages.test.cjs` 134: 소식 수 55 → 57
- 스크립트 순서 계약 테스트

**캡처 무대.** capture-3d.mjs가 임시 폴더에 만드는 무대 페이지에 둔다. `docs/`는 validator HTML 인벤토리에서 이미 제외되어 있다. `tools/`에 두면 "unexpected public HTML"로 걸린다.

**문서**
- 스펙: `docs/superpowers/specs/2026-10-30-3d-figures-design.md`
- AGENTS.md: File structure, Architecture notes, 3D 그림 규칙
- 2026-09-28 가독성 스펙: "3D 그림 예외" 링크 한 줄

### 4. 캡처 — `scripts/capture-3d.mjs`

- 무대 페이지: `(임시 무대)?scene=<name>&lang=ko&w=1600&h=1000`
- 방식: `DECK3D_CLOCK`으로 시각을 고정하고 `.live`를 기다린 뒤 Chrome 헤드리스(GPU, `--use-angle`)로 캡처한다.
- puppeteer-core는 레포에 넣지 않는다. 기존 설치본이 든 node_modules를 `SCENE3D_PUPPETEER_DIR` 환경변수로 지정한다.
- 출력:
  - 사이트 포스터: `assets/3d/<name>.webp` (1600×1000, 메타데이터 없음, 9장)
  - README 썸네일: 480×300 PNG 8장
  - README 배너: `banner-3d.gif`
    - 1280×400 프레이밍, 3~4초 yaw 루프
    - 고정 시계로 프레임을 뽑은 뒤 ffmpeg palettegen으로 만든다.
    - 2MB 이하

### 5. AI Build Lab 확장 — `js/portfolio-data.js` `ai-build-lab` (1431행~)

- `subcases`: `harness-manager`와 `view-anything`을 ko/en 한 줄씩 추가한다.
  - 문구는 각 레포 README의 사실 범위만 쓴다.
  - harness-manager: Claude Code·Codex 전역 환경 구성·검증
  - view-anything: Markdown·3D CAD·포인트클라우드 뷰어, 강체 ICP 정합
  - 정확도·사용자 수는 주장하지 않는다.
- `media.references`, `links`: 두 레포를 추가한다.
- `tech`: 레포를 확인한 뒤 React, Tauri, Rust를 추가한다.
- 개수 표현을 고친다: summary·evidence의 "두 앱", "세 가지" 등.
- 갤러리: 앱마다 실제 화면 1장을 추가한다.
  - 로컬 경로를 블러 처리하고 메타데이터를 제거한다.
  - `assets/projects/EVIDENCE_REGISTER.md`에 등록한다.
  - **사용자 승인 후** `approved`로 바꾼다.
- 소식: 첫 릴리스 2건을 `data/news-software-sources.json`과 소식 레코드에 추가한다. 시각은 Asia/Seoul 기준이다.
  - harness-manager v0.2.0: 2026-06-19 22:51 KST
  - view-anything v0.1.0: 2026-10-26 21:50 KST
  - 홈 소식의 "최신 소프트웨어 릴리스" 슬롯은 view-anything으로 바뀐다(`homeNews`, 수용).
- 사례 정적 셸 문구를 동기화하고 `node scripts/public-cv-summary.cjs --write`를 실행한다.
- PDF: ai-build-lab ko/en을 다시 생성한다. 파이프라인은 결정적이므로 나머지 PDF는 바이트가 동일해야 한다. 생성 후 쪽수를 비교한다.

### 6. GitHub 프로필 README — `C:\dev\rafaam11\README.md`

```
[banner-3d.gif — 홈 장면 회전]
Jinmin Kim — Robotics & Computer Vision R&D Engineer
DIGITRACK Inc. · M.S. Robotics & Mechatronics Engineering, DGIST
Optical tracking · 3D registration · Surgical navigation · XR · Robot/vision integration
[Portfolio] [CV] [LinkedIn] · 한국어 포트폴리오

## Projects            ← 9행, 사이트 Projects 순서
| thumb 200px(사례 링크) | **Title** · period · state<br>역할 한 줄(≤25단어, 사이트 en role 범위) | 툴 아이콘 22px |
  AI Build Lab 행 → 아래 섹션 링크

## Tools I build and use   ← HTML <table> 3열
| 앱 스크린샷 | multi-cli-work | harness-manager | view-anything |
| 한 줄 설명 | 최신 릴리스 배지(shields github/v/release, 자동 갱신) | 기술 아이콘 |

## Daily tools         ← 아이콘 10~14개 한 줄(Python, C++, C#, TypeScript, Unity, ROS 2, Open3D, OpenCV, Claude Code, Codex …)

## Selected research   ← JIIM 2024 유지(논문·발표 합산 금지) · [Full CV] · [CV PDF]
```

- **삭제:** 기하 배너, readme-typing-svg, About 표, 분야별 배지 표, 섹션 이모지. 섹션 이모지 삭제는 내 판단이고, 근거는 담백한 사실형 원칙이다.
- **툴 목록 출처:** 프로젝트별 툴은 `portfolio-data.js`의 `tech`에서 가져온다.
- **아이콘 출처 우선순위**
  1. devicon(jsDelivr, 버전 고정)
  2. Simple Icons(`cdn.simpleicons.org`)
  3. 둘 다 없으면 텍스트(Zenoh, 3D Slicer, MRTK, Photon, SKADI 등)
  - 모든 아이콘에 `alt`와 `title`을 단다.
- **이미지:** 프로필 레포 `assets/`에 커밋한다. 클릭하면 사이트 사례 페이지로 간다.
- **문구 검사:** README 문구도 사이트와 같은 사실 범위로 쓰고, 기여율 %나 비공개 파트너명을 넣지 않는다. 문구는 같은 정규식으로 검사한다.

## 작업 순서 (커밋 단위)

1. 스펙, AGENTS.md, PDF digest에서 `scene3d` 제외.
2. 엔진, CSS, validator·테스트 골격, capture-3d.mjs가 임시 폴더에 만드는 무대 페이지, 캡처 스크립트.
   - 파일럿은 **mandibular-fracture**(기본 레이아웃) ko/en으로 끝까지 연결한다.
3. 나머지 장면 7개. 장면마다 사실 감사와 캡처를 사용자에게 보여 확인받는다.
   - skadi(product-console)는 마지막에 한다.
4. 홈 `home-tracking`과 생성기 수정.
5. AI Build Lab 확장: 하위 사례, 갤러리(사용자 승인), 소식, PDF.
6. README와 이미지(배너 GIF, 썸네일 8장, 앱 스크린샷 3장).
7. 배포: 사이트와 README를 각각 `main`에 push한다. 검증을 마친 뒤 사용자 확인을 받고 push한다.

구현은 sonnet 서브에이전트에 맡긴다. 장면 사실 감사, 파트너명 정리, 최종 리뷰는 직접 한다.

## 검증

- `node --test`: 약 12분 걸리므로 별도 작업트리에서 돌린다.
- `node scripts/validate-portfolio.cjs`, `git diff --check`
- `python -m http.server 8000`, `node scripts/check-local-preview.cjs`, `file://` 직접 열기
- 시각 QA(Chrome 캡처): 홈, 사례 ko 2개(기본·story), en 1개, skadi를 1440px와 390px에서 본다. 확인 항목:
  - 회전과 원위치
  - 모바일 한 손가락 스크롤 통과
  - `--disable-webgl`일 때 포스터 폴백
  - JS 끔
  - 인쇄 미리보기
  - reduced-motion
  - 컨텍스트 2개 이하
  - three.js가 스크롤 근접 시에만 로드되는지(Network)
- PDF: ai-build-lab 외 PDF의 해시가 바뀌지 않았는지, ai-build-lab 쪽수 변화.
- README: push 전에 `gh api markdown`으로 렌더해 아이콘·이미지 링크를 확인한다.

## 부록 A. 장면 사실 감사 (2026-10-30, 사례 본문 `js/portfolio-data.js` 대조)

| 장면 | 원본 라벨 | 판정 | 사이트 라벨(ko) |
|---|---|---|---|
| smcnavi | 트래커 · 환자 레퍼런스 · 하악 마커 · 도구 끝 · 하악 개구 각 | 유지 — 사례에 하악운동 워크플로·마커·기구 변환 있음 | 원본 유지 |
| foaa | ① 랜드마크(두개골·치아 15+15) ② 기준 평면 FH·Mid-sag·Coronal ③ 수술계획(설계) ④ 교합 시뮬레이션 SVD/seating ⑤ 최종 교합·간극 맵 | ③ 삭제(사례는 랜드마크·교합·평가까지, 수술계획은 다음 연구 방향). FH·SVD·조기접촉·간극은 본문에 없음 → 일반어로 | 치아 랜드마크 → 교합 정렬 → 교합 평가 |
| omfsvr | 의사 · 환자 · 참여 3명 · 동기화 · 2D 계획 · 3D 수술계획 | "수술계획" 과장 → 본문 용어로 | 참여 3명 · 동기화 · CT 기반 턱 모델 · 측정 패널 |
| neuro | 머리 마커 · TMS 코일 · UR 로봇 · 얼굴 점군 RGB-D · ① 정합 ② 코일 정렬 | 로봇은 본문 "로봇 연동" 범위로, 제조사명 삭제. 정합은 랜드마크+ICP | 머리 마커 · TMS 코일 · 로봇 연동 · 랜드마크+ICP 정합 · 코일 정렬 |
| sgrt-poc | 흉부 ROI(KLT 추적) · 들숨/날숨 · 1 Hz LPF · p-p 약 18–21 mm · 게이트 예시 | 수치 판독·KLT는 본문에 없음 → 삭제. 파형·게이트 신호는 본문 범위 | 흉부 ROI 깊이 → 호흡 파형 · 게이트 신호 예시 |
| skadi | SKADI(IR LED·카메라 2) · 반사 마커 · 위치/회전 readout | 유지 | 원본 유지 |
| fk-safety | 가상 범퍼 3단 · 경고 구역·감속 · 정지 구역 · E-STOP 래칭 · 리셋 입력 | 유지 — 본문 "3단 가상 범퍼·E-STOP 래칭 정책" | 원본 유지(내부 문서 출처 주석 삭제) |

## 부록 B. 추가 결정 (2026-10-30 2차 인터뷰)

- **홈 배치:** 인트로의 프로필 사진 자리를 3D(`home-tracking`)로 교체한다. 프로필 사진은 홈 하단 연락 줄 옆에 작게 둔다. JSON-LD의 사진 연결은 유지한다.
  - 사진 자리 비율에 맞춰 상자는 세로형에 가깝게(약 4:5) 잡는다. 모바일에서는 인트로 아래로 쌓인다. → 내 판단.
- **홈 장면 구성:**
  - SKADI(천장 마운트)와 두부 마커, 광선
  - 내비게이션 포인터(기구 끝이 표적을 가리킴)
  - HoloLens 오버레이(헤드셋과 시야, 환자 머리에 겹친 홀로그램 모델)
  - CT 단면 판은 넣지 않는다.
  - 흰 배경에 맞춰 밝은 PBR 재질로 다시 구성한다. A4LAB 표지의 어두운 배경용 X-ray 셰이더는 쓰지 않는다.
- **배포:** 단계별로 한다. 파일럿 → 나머지 장면 → 홈 → AI Build Lab → README 순서이고, 각 단계는 검증하고 사용자 확인을 받은 뒤 push한다.
- **README Daily tools:**
  - AI 에이전트: Claude Code, Codex
  - 3D·비전·의료영상: 3D Slicer, VTK, Open3D, OpenCV, PyTorch
  - 로봇·XR·앱: ROS 2, Zenoh, Unity, Qt, Electron, Tauri
  - 언어 아이콘은 넣지 않는다.
