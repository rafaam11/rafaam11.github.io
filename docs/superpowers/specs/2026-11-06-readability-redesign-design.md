# 포트폴리오 가독성 개편 설계 (2026-11-06)

> 상태: 승인(2026-11-06). 사용자 인터뷰 6라운드, 로컬 레포 전수조사 4건, 빌더 검토, 구현 전략 검토를 반영했다.
> 구현 계획은 단계별로 `docs/superpowers/plans/2026-11-06-stage<N>-*.md`에 둔다(추적하지 않는 작업 문서).

## Context

사용자 판단(2026-11-06 인터뷰): "가독성이 가장 중요하다. 내가 뭘 했는지 한눈에 들어와야 한다. 시각 자료가 많으면 좋다."
- 주 독자: **연구자·교수**(면담 전후에 열어 봄). 참고 느낌: 연구실 홈페이지. 톤: Scholar 라이트 유지.
- 가장 큰 문제 지점: **홈 첫 화면**. 10초 안에 남아야 할 것: **어떤 도메인의 전문가인지**.
- 원하는 시각 자료: 구조 다이어그램, 3D 장면 확대(퀄리티 향상), 실제 화면·데모 영상.
- 범위: ① 홈 첫 화면 파이프라인 지도 ② 3D 장면 9개 퀄리티 ③ 케이스 상세 시각 보강 ④ 최신 코드 기준 콘텐츠 최신화 — **네 덩어리를 한 번에 설계**하고 단계별로 배포한다.

현재 상태(확인): 홈 = 인트로(소개 문단 2개 + 측면 3D `home-tracking`) → 현재 전문성 5줄 → 대표 연구 3개(텍스트 행) → 논문·특허·수상 → 소식 4 → 선택한 활동 3장(`local-feed.js` 삽입) → 연락. 홈·소식·프로젝트 목록 HTML은 `scripts/profile-home.cjs`가 생성한다(`node scripts/public-cv-summary.cjs --write`). 케이스 9개는 `web` 고밀도 레이아웃, 3D 8개(`js/scenes/*.js`, 프로시저럴 전용), 흐름도는 HTML/CSS 박스(`.sc-flow`), MP4는 5개 케이스에 있음.

## 목표 · 비목표 · 반목표

**목표**
- 홈 첫 화면에서 "영상·센서 → 모델·특징점 → 정합 → 추적 → 계획·내비·시각화"를 잇는 사람임이 지도로 보인다.
- 9개 3D 장면이 한 세트처럼 보이고, 단계 버튼으로 동작을 설명하며, 사실감(조명·그림자·재질·바닥·형상·glTF)이 올라간다.
- 케이스 상세는 첫 시각물이 영상 또는 3D이고, 흐름도는 손으로 그린 SVG, 스크린샷에는 번호 콜아웃이 있다.
- 케이스 본문·상태·기간이 최신 코드 상태(2026-11)와 맞는다.

**비목표**
- 프로젝트 PDF는 **④로 본문이 바뀐 케이스만** 기존 파이프라인으로 재생성한다(사용자 결정 2026-11-06, 빌더 검토 1번). ①②③가 추가하는 필드(`pipeline`·`web.diagram`·`callouts`·`steps`·glTF)는 모두 웹 전용으로 PDF digest에서 제외한다. CV PDF(작성자 Word 원본)는 이번에 바꾸지 않는다 — 웹 CV rows만 갱신하고 PDF와의 불일치는 다음 판까지 허용한다고 스펙·AGENTS.md에 명시(사용자 결정).
- 다크 모드, 슬라이드형 레이아웃, 기여율 %, 칩·아이콘 남발은 하지 않는다.
- Projects 목록 카드는 승인 이미지를 유지한다(이번 범위 밖).

**반목표**(동작해도 실패)
- 3D·지도가 사실보다 큰 역할을 암시(로봇 보조 수술, 설계 단계를 완성품처럼, 팀 성과의 개인화).
- 비공개 파트너명·고객 하드웨어 CAD·타인 이름 노출.
- 모바일에서 지도가 읽히지 않거나 스크롤이 3D에 붙잡힘. three.js·glTF 로드가 본문 렌더를 늦춤.
- AI스러운 슬로건·과장 카피(사용자 피드백 원칙).

## 사용자 결정 (인터뷰 그대로)

| 항목 | 결정 |
|---|---|
| 첫 화면 중심 | 도메인 지도 한 장, **A안 가로 파이프라인 띠** |
| 도메인 틀 | 기술 파이프라인 **5단계**: 영상·센서 → 모델·특징점 → 정합 → 추적 → 계획·내비·시각화 |
| 지도 제작 | **인터랙티브 SVG**(호버 시 프로젝트 칩 강조·설명) |
| 칩 배치 | 대표 단계에 한 번, 호버 시 걸친 단계 밝아짐 |
| 매핑 | ① 무인지게차(①③④)·**SGRT(①④)** / ② 하악골 골절(②③⑤)·디지털 교합(①②⑤) / ③ SMCNavi(③④⑤) / ④ SKADI(④⑤) / ⑤ NeuroPilot(③④⑤)·OMFS VR(⑤) / 바닥 띠 AI Build Lab — SGRT는 사용자 요청으로 ①로 이동 |
| 소개 문단 2개 | **한 줄로 압축해 지도 위에**; 소속·링크·연구 방향은 지도 아래 한 블록 |
| 홈 3D | **홈에서 제거**, 케이스에만 |
| "현재 전문성" | 제목만 **"기술 영역"**(en: Technical areas)으로, 내용 5줄·배치 유지 |
| 대표 연구 3개 | 실제 화면 **타일**로 |
| 소식·활동 | 홈 소식 3줄로 축소, 활동 사진 카드는 홈에서 제거(소식 페이지는 유지) |
| 3D 사실감 | 조명·그림자·재질 + 바닥면·깊이감 배경 + 장비 형상 세밀화 + **공개 라이선스 glTF 허용(CC0·CC-BY·CC-BY-NC, 캡션 출처 표기)** — 기존 "프로시저럴 전용" 규칙을 이 스펙으로 개정 |
| 3D 움직임 | **단계 버튼**. 기본 상태 = 마지막 단계(완성 상태) 정지 + 느린 회전 |
| 3D 통일 | 9개 장면의 톤·카메라·스케일·라벨을 한 세트로 |
| 케이스 시각 | 영상(있는 케이스)·3D를 상단으로 / HTML 흐름도 → 손그림 SVG / 스크린샷 번호 콜아웃 |
| 콘텐츠 최신화 | dotori 계열, OmfsNavi, OprNavi, 디지털 교합 앱 최신 코드, DtDepthScan, view-anything, harness-manager, multi-cli-work 등 최신 코드를 전수조사해 추가 항목·진척 상태를 반영. 애매하면 사용자 인터뷰 |

## 설계

### ① 홈 첫 화면 — 파이프라인 지도

**화면 순서(위→아래)**: h1 이름 · 역할 · 키워드 줄 · **사실형 한 문장** → **지도** → 소속·링크·연구 방향 압축 블록 → 기술 영역(5줄) → 대표 연구 타일 3 → 논문·특허·수상 → 소식 3 → 연락.

**지도 구조(내 결정, 구현 전략 검토 후 확정 — 글자는 전부 HTML, SVG는 띠만, JS 없음)**: 전체 폭(`--sc-max` 880px 안) 블록 `section.sc-map`.
- `svg.sc-map__band`(`aria-hidden`, `viewBox 0 0 1000 72`): 5칸 트랙·화살표·번호 원만 **직접 그린 인라인 SVG**. 글자 없음(줄바꿈·폰트 측정 문제 회피).
- `ol.sc-map__stages`(5열 grid): `li.sc-map__stage[data-n]`에 단계 제목·blurb·썸네일 `<img>`, 그리고 **그 단계가 primary인 칩들을 중첩 `ul.sc-map__stage-chips`로** 포함. 넓은 폭에서는 `display: contents` + grid 행 배치로 "단계 줄 / 칩 줄"처럼 보이고, ≤760px에서는 띠를 숨기고 1열 세로 목록(번호·이름·칩·작은 썸네일)이 된다 — **한 렌더로 두 폭을 처리**(DOM 중복·AT 중복 없음). 바닥 띠 `p.sc-map__tools`에 AI Build Lab 칩.
- 칩은 `a.sc-map__chip[data-primary][data-spans="1 3 4"]`(공백 구분, 케이스 링크). 연동은 **CSS `:has()`만**: `.sc-map:has(.sc-map__chip[data-spans~="3"]:is(:hover,:focus-visible)) .sc-map__stage[data-n="3"]` 강조, 나머지 칩·단계 `opacity:.45`; 단계 hover → 걸친 칩 강조. `:has()` 미지원 브라우저는 정적 지도. → `js/home-map.js` 불필요, validator 스크립트 화이트리스트·async/defer 규칙과 무관.
- 스타일 제약: `opacity`·`border`·`transition`만, 강조색 `--sc-link` 1색, 그림자·그라데이션·대문자 금지. 인라인 SVG는 "decorative SVG fallback 금지"(실체: `assets/diagrams/**/*.svg` 파일 금지, validator 약 2441행) 대상이 아니며 AGENTS.md에 한 줄로 구분을 명시한다.
- 썸네일: 단계당 1장, 기존 승인 이미지에서 선택(`assets/projects/<slug>/…` 중 `portfolio-data.js`가 참조하는 것만). 후보: ① 지게차 ToF·RGB 화면 ② 교합 특징점 화면 ③ SMCNavi 정합 화면 ④ SKADI 6DoF 앱 ⑤ HoloLens 포스터. 영상 케이스도 홈에서는 정지 이미지.
- 스타일: Scholar 규약 준수 — 1px `--sc-rule` 테두리, 그림자·그라데이션·대문자 금지(`portfolio.test.cjs:2629`), 색은 `--sc-ink/--sc-muted/--sc-link` + 강조 1색.

**데이터(SSOT)**: `js/portfolio-data.js` top-level `pipeline` — `translations{ko,en}{lede}`(사실형 한 문장), `stages[{n, id, translations{ko,en}{title, blurb}, thumb{slug, mediaId}}]`, `placements[{slug, primary, spans[], translations{ko,en}{chip}}]`, `tools:['ai-build-lab']`. 새 `pipelineErrors(data)`(`js/portfolio-render.js` `validatePortfolioData` 약 842행에 합류): 단계 정확히 5·n 순서·id 고유, 모든 slug가 placements∪tools에 정확히 한 번, `primary ∈ spans ⊆ 1..5`, `thumb.mediaId`가 그 케이스의 승인 **이미지**(영상 거부, poster 허용)로 해석, 글자 예산(ko title≤14/blurb≤38/lede≤60, en ≤30/≤70/≤120), 종결어미 금지. top-level이라 PDF digest(`scripts/portfolio-pdf-source.cjs` `canonicalPdfSource` 약 57행: capabilities·tiers·projects·evidence·cv만 해시)에서 **자동 제외** — 테스트로 고정.

**생성**: `scripts/profile-home.cjs` `renderHome()`(약 130행)이 인트로 축약(h1·role·keywords·lede 한 문장 — 기존 테스트 1749·5483이 고정한 "해부학 구조, 수술 도구, 센서, 카메라, XR 기기, 로봇" 구절을 한 문장에 유지)·지도(`render.pipelineMapHtml`)·소속·링크·연구 방향 블록·`capabilitiesHtml`(약 154행) 제목 "기술 영역/Technical areas"(id `implementation-title` 유지)·타일·`homeNews(limit 3)`를 생성. `homeScene3dFigureHtml`(render 약 1196행) 삭제, `index.html`/`en/index.html`에서 `scene3d.js`·`scenes/home-tracking.js` 스크립트 제거(validator `pageScene3dName` 약 2201행이 홈에 ''를 돌려주므로 **필수**), 홈에서 `local-media-data/local-feed/local-projects` 스크립트와 `local-feed.css`도 제거(홈에서 쓰는 곳이 선택 활동뿐), `data.homeScene3d`(약 2123행) 삭제, `assets/3d/home-tracking.webp`·`js/scenes/home-tracking.js` 삭제(같은 커밋; README 배너 GIF는 별도 레포라 무관). `js/local-feed.js` 홈 분기(약 258행)·`selectedActivitiesHtml` 삭제, `css/local-feed.css` `.lf-selected*`·`.lf-activity*` 삭제.

**대표 연구 타일**: `homeProjectGalleryHtml`에 `tile` 변형 — 3열, 16:10 이미지(`media.lead` 이미지 또는 영상 `poster`), 제목, 기간·상태 한 줄, 요약 1줄(`web` brief의 첫 항목 재사용, 새 문구 금지). ≤700px 1열.

**카피**: 사실형 한 문장(ko ≤ 60자/en ≤ 120자 — 내 결정), 단계 이름·blurb(ko ≤ 14자/≤ 38자)는 케이스 본문 사실만 압축. 슬로건 금지.

### ② 3D 장면 9개(홈 제거 후 8개) — 단계 버튼·사실감·통일

**엔진(`js/scene3d.js`) 변경**
- 단계: `register(name, { steps: [{ id, t0, t1, label:{ko,en} }] })`(선택 — skadi처럼 연속 추적 장면은 없음). 엔진이 `.view3d__steps`(`role=group`, 실제 `<button aria-pressed>` ①…ⓝ + 현재 라벨)를 readout 옆에 그린다(`fitView` 하단 여백 약 216행 34→56, 라벨 장애물 약 399행에 추가, `.view3d:not(.live)`·print 숨김 목록에 포함).
- 시간 모델(`sceneTime` 약 416행): `DECK3D_CLOCK` > reduced-motion(`last.t1`) > 재생 중(`min(t1, t0+경과)`) > 보류(`현재 단계 t1`). 마운트 직후 현재=마지막, 정지. 클릭 → `t0`부터 재생, `t1` 도달 시 정지. 느린 autoYaw(약 425행)는 장면 시각 대신 벽시계 기준으로 바꿔 보류 중에도 흔들리게(캡처 시 `DECK3D_CLOCK`이면 0 고정). 각 장면의 `t1`은 루프 길이 `T`보다 작게(되감기 방지), `box.dataset.ph` 장면은 그대로. 장면별 단계 초안: ms-frac 4, neuro 2, foaa 3, fk-safety sim 단계, smcnavi 2, omfsvr 2, sgrt 3(게이트 "(계획)" 점선), skadi 없음. readout의 단계 문자열은 `steps[].label`로 옮기고 세부 판독만 남긴다.
- 사실감(공통): 바닥 접촉 그림자(`ShadowMaterial`, 이미 있음 약 300행) + 바닥 명도판(`CircleGeometry` 방사형 vertex color — 캔버스 안), 노출·키라이트 통일, 재질 라이브러리(`D.matLib`: steel·anodized·plastic·skin·bone·visor-glass·emissive-marker)로 8장면 통일, 빌드 후처리(linearize·그림자 플래그·envMapIntensity, 약 261~272행)를 함수화해 늦게 로드된 glTF 메시에도 적용. **SSAO는 범위 제외**(vendor 추가·테스트 316 `SSAO` 금지와 충돌).
- 포스터 8장은 마지막 단계 프레임으로 재캡처(`scripts/capture-3d.mjs` 기본 시각 약 188행 → `steps.at(-1).t1`, `--step N` 옵션 추가).
- 통일 규약: 카메라 pitch 0.35~0.45·fov 30, 라벨 스타일 동일, 단위 cm, 장비 비율 실측에 가깝게, 번호 배지와 단계 라벨 어휘 통일(장면 ↔ 홈 지도 단계 이름 재사용).
- 형상 세밀화: 추적 카메라·헤드셋·포인터·침대·지게차 등 프로시저럴 부품을 베벨·세부 부품 추가로 다듬는다(장면별 작업 목록은 구현 계획에서).

**glTF 도입(규칙 개정 — 사용자 결정)**
- 허용 라이선스: CC0, CC-BY 4.0, CC-BY-NC 4.0(사용자 선택; NC는 포트폴리오가 비상업임을 전제, 출처 표기 필수). 출처·작자·라이선스·수정 내용을 `assets/3d/models/LICENSES.md`에 기록하고, CC-BY/NC 모델이 보이는 그림 캡션에 "모델: 작자(CC-BY 4.0)" 한 줄.
- 파일: `assets/3d/models/<name>.glb`(텍스처 내장), 장면당 ≤ 1.5 MB, 전체 ≤ 10 MB(내 결정, 조정 가능). 로더 `js/vendor/GLTFLoader-r128.js`를 three와 함께 지연 주입. **`file://`에서는 glTF 장면은 라이브 3D 없이 포스터만 보인다**(내 결정, 빌더 검토 6번 — 소품마다 프로시저럴 대체본을 이중 제작하지 않는다). 포스터 캡처 무대는 `capture-3d.mjs`가 임시 HTTP 서버로 띄우도록 바꿔 glTF가 포함된 프레임을 찍는다.
- 단계 라벨(내 결정, 빌더 검토 7번): 장면 고유 라벨을 쓰고 번호 배지·글꼴·위치 스타일만 통일한다. 홈 지도 5단계 이름을 강제하지 않는다(ms-frac·fk-safety·omfsvr는 맞지 않음).
- 대상 후보(빌더가 고르고 소유자가 다운로드 전 승인): 헤드셋류(HoloLens·VR), 해부 모델(두개골·하악), 병원 침대, LiDAR 유닛, 지게차 본체. **SKADI 추적기·고객 장비는 glTF 금지**(제품 CAD 노출 방지) — 프로시저럴 유지.
- 로더 API: `js/vendor/GLTFLoader-r128.js`(three r128 examples UMD, 압축 확장 없음)를 `models`가 있는 장면에서만 three 다음에 주입(`loadThree` 약 568행 패턴 일반화). 장면은 `D.model('name', fallbackGroup)`으로 **모델 이름만** 알고, 로드 성공 시 fallback을 숨기고 glb 노드를 넣는다 — 실패·거부·`file://`(`SCENE3D_CAPTURE`가 아닐 때)이면 fallback 유지. 캡처 스크립트는 `SCENE3D_CAPTURE` 예외로 모델을 찍는다. `scene3d`에 웹 전용 `models: [...]` 필드(`scene3dKeys` 약 53행, `scene3dErrors` 약 760행).
- 검증 규칙 교체(`scripts/validate-portfolio.cjs` 약 2266행): 장면 파일에 `GLTFLoader|TextureLoader|FileLoader|ImageLoader|XMLHttpRequest|fetch(|.glb|https?://|data:` 금지(모델 이름만), 엔진은 `.glb` 경로 조립 한 곳만; `assets/3d/models/`: 파일명 `^[a-z0-9-]+\.glb$`, GLB 매직·version 2, 외부 `uri` 없음(자기완결), `extensionsRequired ⊆ {KHR_materials_*, KHR_texture_transform, KHR_mesh_quantization}`(draco/basisu 금지), 파일 ≤1.5 MiB·합계 ≤10 MiB, LICENSES.md 표(`file|title|author|source|license|modifications|used-by`)와 1:1, `used-by` 장면이 실제로 `D.model('<name>')` 호출, CC-BY/NC 모델을 쓰는 장면의 `scene3d` 캡션에 작자·라이선스 약칭 포함; `scene3dVendorFiles`(약 69행)에 로더 추가, 장면 JS 400 KB 예산 유지. `tests/scene3d.test.cjs` 261~262·281~283·291~311 갱신 + glb/LICENSES 신규 테스트; AGENTS.md 3D 절·2026-10-30 스펙에 개정 주석.

### ③ 케이스 상세 — 시각 보강

- **첫 시각물(내 결정: 위치 = 헤더·메타 바로 아래, brief 그리드 위)**: 승인 영상(`media.lead` video)이 있는 케이스(surgical-navigation, digital-occlusion-workflow, life-careverse, rtms-navigation, unmanned-forklift)는 영상이 그림 1, 3D는 그림 2. 영상 없는 케이스(mandibular, sgrt, skadi)는 3D가 그림 1, 기존 lead 이미지는 갤러리로. ai-build-lab은 제품 화면 유지. 현재는 영상이 brief 아래 그림 1이므로 "상단"은 brief 위로 올리는 것을 뜻한다 — dense 레이아웃 순서와 `js/local-projects.js`의 lead 이동·번호 재부여를 이에 맞춘다. surgical-navigation의 대표 매체는 **HoloLens 데모 영상 유지**(사용자 결정), 캡션에 "HoloLens 확장(2024–2025)" 명시.
- **첫 시각물 구현**: 영상 케이스 5개는 `js/local-projects.js` 약 30~31행(두 story 케이스 lead 영상을 story 섹션으로 끌어내리는 코드) 삭제만으로 영상이 그림 1이 된다(렌더러 dense 분기 약 1744~1757행은 이미 lead=그림 1). 같은 파일의 `placement`/`leadTargets`/`block`(약 4~29행)은 dense 레이아웃에서 죽은 코드라 정리하되 mandibular 오버레이(약 32~52행, M076/M077/M084/M012)와 번호 재부여(약 56행)는 유지 — 분리 커밋. 이미지 lead + 3D 케이스(mandibular, sgrt)는 `caseStudyHtml`에서 3D를 그림 1, lead 이미지를 `caseGalleryHtml` 첫 항목으로. product-console(skadi)은 이미 3D가 그림 1 — 변경 없음. 그림 1인 3D 포스터는 `loading="lazy"` 대신 eager(LCP).
- **흐름도 SVG**: `portfolio-render.js`에 `normalizeDiagram(diagram | legacy)` + **결정적 레이아웃 함수** `diagramSvg(input, locale, {orientation:'wide'|'tall'})` — 열=level(`systemFlowLevels` 약 1247행 재사용), 상자=node, 직교 경로 화살표=edge(라벨은 흰 배경 rect), 점선 rect=boundary, `planned:true` 노드는 점선+`--sc-faint`. 글자 측정 없이: 열 폭 균등, 예산 기반 줄바꿈(ko 글자 수·en 단어, label 2줄·detail 3줄), 같은 다이어그램의 박스 높이 통일, 입력 예산을 validator에 고정(label ko≤14/en≤28, detail ko≤40/en≤80, edge ko≤12/en≤24). wide·tall 두 SVG를 함께 출력하고 CSS 760px에서 교체(둘 다 `aria-hidden`, 접근성 텍스트는 기존 `ariaParts` 문자열을 시각 숨김 `<p>`로 — `clip`만 사용). figure 클래스 `sc-figure sc-flow sc-flow-figure`와 `data-from/to/direction`·`data-node-key`를 SVG `<g>`에 유지해 기존 테스트 정규식(약 2231·2246행)을 살린다. `systemFlowDiagramHtml`(약 1285행)을 SVG 출력으로 교체, `.sc-flow__*` HTML 규칙(CSS 약 135~151행) 삭제.
  **데이터 출처(내 결정, 빌더 검토 2번 + 구현 전략 §0-1)**: nodes·edges가 있는 `diagram`은 story 케이스 2개(system-flow 3장)뿐이고 나머지 7 kind는 `pdfSequence.diagram`(제목+노드 4개, PDF 전용, digest 포함)이다. 기본값은 **legacy 4노드에서 합성**(loop 계열=4노드 순환, chain=직선, sensor-convergence=3→1 수렴, sync-topology=허브+스포크 양방향, tracking-sdk-stack=수직 적층)해 7개 케이스의 접근 섹션에 흐름도 그림을 추가하고, 더 자세한 흐름이 필요한 케이스에는 **웹 전용 `web.flow`**(system-flow 스키마 + `planned`; `webCopyKeys` 약 56행에 추가, PDF digest 제외)를 써서 덮어쓴다 — 라벨은 케이스 본문 사실만, 소유자 검수. SGRT 게이팅 "(계획)"은 `web.flow`로 표현하고 `pdfSequence.diagram`은 ④의 PDF 재생성과 함께 고친다.
- **스크린샷 콜아웃**: 갤러리·story 미디어의 **이미지** 항목에 선택적 `callouts: [{ n, x, y, translations{ko,en}{label} }]`(0~1 정규화 좌표, n 1..9 연속, 라벨 ko≤24/en≤48). `storyMediaKeys`(약 37행)에 `callouts` 추가, `calloutErrors` 검사, `scripts/portfolio-pdf-source.cjs` `pdfProject`(약 18행)를 깊은 제거로 바꿔 `media.gallery[].callouts`·`storySections[].media[].callouts`·`web.flow`·`scene3d.models`를 digest에서 벗긴다. 렌더(`caseGalleryHtml` 약 1448행·`storyMediaFigureHtml` 약 1231행)는 이미지 위 `position:absolute; pointer-events:none` SVG 오버레이(번호 원 `aria-hidden` + 짧은 지시선) + 이미지 아래 `<ol>` 번호 목록(접근성 본문). 어떤 화면에 어떤 콜아웃을 둘지는 빌더가 초안 → 소유자 확인.

### ④ 콘텐츠 최신화 — 전수조사(2026-11-06, 로컬 레포 40여 개) + 사용자 인터뷰 결과

**공통 원칙**: `js/portfolio-data.js`가 SSOT(웹 `web` 필드 + 본문 필드 모두 갱신). **본문 필드(period·state·title·role·storySections·tech·pdfSequence)가 바뀐 케이스는 PDF를 재생성한다**(사용자 결정): `scripts/generate-portfolio-pdfs.py`(PDF 생성용 파이썬 가상환경, PyMuPDF·ReportLab) → 쪽수 변화 비교(thesis 한 줄이 늘면 쪽수가 밀림) → 대상 외 PDF는 HEAD로 복원(ReportLab 이미지명 해시 때문에 바이트가 달라짐) → `output/pdf/manifest.json` 갱신. 수치는 모두 본인 측정으로 확인됨(대차 분류기 top-1 99.5%/2,010 질의, 측정 4.66 s·트랙 편차, SGRT 55회 등 — 사용자 확인 2026-11-06). 웹 CV `data/public-cv.json` rows는 함께 갱신하되 CV PDF는 다음 판으로 미룬다. 상태 어휘(Verified/Ongoing/Prototype/Research/Completed) 준수. **승인 기관명 외 금지**(고객사명·현장 코드·차종 모델명·교수명·과제번호 금지 — 조사 보고서에 나온 고객사명·현장 식별자·차종 모델명·지원사업명은 그대로 옮기지 않는다). 팀/타인 성과는 `팀` 태그로 분리. 수치는 본인이 측정·실행한 것만. **신규 케이스는 만들지 않는다**(라우트 28개·PDF 쌍·EVIDENCE_REGISTER 비용) — 모두 기존 케이스의 섹션·하위 사례로 흡수. 사례 셸 `summary` 동기화, ko/en 쌍, `node scripts/public-cv-summary.cjs --write`, CV(`data/public-cv.json` rows)와 기간·상태 일치 확인.

**surgical-navigation** (사용자 결정: 통합, 제목 일반명)
- 제목 → ko "구강악안면 수술 내비게이션 (SMCNavi → OprNavi → OmfsNavi)" / en 대응(정확한 문구는 빌더 초안 → 소유자 확인). 홈 지도 칩 라벨도 이 이름(짧게 "수술 내비게이션").
- 추가: 2026-09 SMCNavi 안정화·SDK 7.1.2·핸즈프리 조작 PoC(풋스위치+음성, 위험 명령 제외) 한 줄·L1~L7 지연 측정 하네스(수치 미주장, 현행 유지) → 2026-10 OprNavi v0.1.0(범용 케이스 기반 내비, signed-distance 안전 마진, 끝점-표면 가이던스, 점별 잔차 RMSE, 정합 프리셋, 추적 녹화·재생, 트래커 SDK 선택·진단, 체크섬 manifest 설치본, 서비스 테스트 58개; **카트 배포 사실은 쓰지 않고 prototype 유지**) → 2026-10~ OmfsNavi(Slicer 5.12.4·Qt 6·C++ loadable 모듈 재구성, 모듈 독립 추적·기능별 준비 상태, 독립 정합 확인점, plan.json v1 importer(디지털 교합 앱 연계, 호환 미검증), CTest, 모의 백엔드). 회사 업무로 표기(저장소 링크 없음).
- XR 확장: HoloLens(OprNavi-H, Unity·MRTK·AppRemoting·OpenIGTLink)은 **2024–2025 단계로 종료(중단)** 명시 → Galaxy XR WebRTC 미러링 실험(2025.11–2026.01: 화면 캡처→H.264 하드웨어 인코딩→WebRTC→Unity, 지연 수치 미주장)을 XR 확장 항목으로 추가. 3D 장면 `smcnavi`의 HoloLens 라벨은 "(2024–2025)" 표기.
- 정정: role의 "2026년 … 미러 평면 정합" → 2025-08~09. limitation "패키징 미완" → "설치본·manifest 있음, 실물 정확도·장시간 안정성 미검증". tech 태그 후보: C++, Qt 6, CTest, NSIS, Cython.
- 상태: period '2023.07 – present' 유지, prototype·ongoing 유지.

**rtms-navigation (NeuroPilot)** (사용자 결정: 2026-08 고객사 이관, 본인 자문)
- period → '2024.07 – 2026.08', lifecycleState → completed(이관), evidenceState verified 유지. 본문에 "2026-08 고객사 개발팀으로 이관, 이후 자문" 한 줄.
- 추가(본인, 2026-06~08): SDK v6→7.1.2 마이그레이션(DLL 5개→DtSkadi.dll), 제품 인증 라이선스 체계(**구조만**: 제품·옵션 게이팅, PC 바인딩, 발급 도구 — RSA 세부 미기재), AI 모듈 어댑터 경계(고객 제공 LRT 랜드마크·치료위치·코일 각도 최적화 모듈을 폴더 교체로 갱신; 과업 범위 언급 없음), Reset Project·다중 실행 방지.
- 정정: "표적별 거리·RMSE·CSV 비교" → "정량평가는 납품본에서 분리한 평가 전용 브랜치 도구"로. ICP 3모드 유지, "ICP 점군 자동 저장·복원 제거" 반영 안 함(사소). 태블릿 TCP 프로토콜은 "동료가 만든 C++ NaviClient를 이식" 경계 명시. 고객사 개발자 기여(numba 가속·Undo·SMA 분리 등)는 쓰지 않는다. 소식 'neuropilot-evaluation-review-2026'은 사실이므로 유지.

**digital-occlusion-workflow (디지털 교합 앱)**
- 정정: "8개 3D 모델 준비" → "원본 STL 4개(두개·상악, 하악, 상·하악 스캔 치아) → 작업 모델 합성" (서사·흐름도 노드·web·verification-boundary 모두). AI 특징점 출처 → **"삼성서울병원 연구팀이 제공한 모델을 별도 프로세스로 통합(CPU/CUDA, 취소 롤백, 정답 비교; 학습은 하지 않음)"**(사용자 결정: 병원 연구팀 제공).
- 추가: 조기접촉 가상 절삭(그라인딩) 루프, Midline·Overjet·Overbite 목표값 지표, FH·정중시상·관상 평면 축 기준 악궁 중점 6-DOF 미세조정, 적합/검토 판정 요약·PNG/CSV/HTML 리포트, 디지털 교합 앱 v1 golden 케이스 동등성 검증, Slicer 5.12.4·Qt 6 이관(단위 시험 622개, NSIS 설치본·포터블, Cython 보호). 장기 방향(절골·분절·가이드 계획, OmfsNavi 계획 전달)은 "(설계)" 표기로 한 줄. tech 태그 후보: Qt 6, ONNX Runtime, CTest, NSIS.
- period '2026.03 – present', ongoing 유지. 회사 업무 표기.

**respiratory-surface-guidance (SGRT)** (사용자 결정: 1차년도 센서 검증 완료, 2차년도 대기; 코드 기준 정정)
- 정정: "게이팅 신호 추출"·"게이팅 윈도우 판정"·"계획 CT 정합"을 삭제하고 "다음 단계(계획)"로 내림. 흐름도 `surface-gating-chain`과 3D 장면 `sgrt-poc` 라벨도 같은 사실로 수정(게이팅 단계는 점선 "(계획)").
- 한 일로 교체: 센서 컨트롤러 5종 추상화(RealSense·Helios2·NSL·Orbbec·Basler), 정밀도 탭·KLT ROI 추적·ROI 시계열, 표면 재구성 탭(보정용 STL 기준 좌표, 대응점+point-to-surface ICP, RMS·inlier 기준 승인, PLY 병합), 호흡 추적(median Z→변위→이동 중앙값→1 Hz 저역통과), B0 자동 몸통 ROI(포즈 모델→사용자 확인), B1 정량 지표(진폭 오차·잔차 σ·상관), `--self-test`. 본문에 "1차년도 센서·알고리즘 검증 단계 완료, 2차년도 대기" 명시. 기존 실측 수치(55회 등)는 본인 측정이면 유지, tech의 `Python`·`4DCT`는 제거(근거 없음; 4DCT는 컨소시엄 담당).
- period '2026.06 – present' 유지, research 유지.

**life-careverse (OMFS VR)** (사용자 결정: 유지보수만)
- 본문에 "2026.07 전처리 도구(3열 웹 탐색기·업로드·슬라이드 에디터·5장 가이드)까지 개발, 이후 유지보수" 명시. period present 유지. VSP_* 레포는 이 케이스의 구성 요소(Unity 클라이언트·FastAPI 파일 서버·전처리)로만 서술.

**mandibular-fracture**: 변경 없음(코드 없음).

**skadi-tracking-software**
- desktop-app ownedRole에 2026-07 안정화 한 줄(카메라 오픈 오류 분기 세분화·연결 진단 로그·FPS 측정 도구 수정). api 모듈 Python 바인딩에 "2026-08 SKADI API 7 대응" 보강. period 유지.

**unmanned-forklift (DOTORI)** (사용자 결정: 2025.11 유지, 고객 현장 시험 운용 중, Isaac Sim 공개(실험), 본인 담당 = dotori_vision·비전 서보잉/approach_plane 액션·safety 초기 설계·sensor_integrator·대차 분류기)
- 상태 문구: "고객 현장 시험 운용 중(고객사명 비공개)". 2026.02 Windows 프로토타입(DtScanProgram) → 2026.04 팀 레포 → 2026.07 Set3 기준선 → Jetson 운영 저장소(dotori_vision) 이관 단계 보강.
- 추가(본인): **AI 비전 대차 인식·분류·액션 워크플로우** — 인식(SAM3 "cart/wheel/floor" 프롬프트 분할 → 바퀴쌍 중점 pose, ToF+RGB 3단계 보정 사슬: RGB 왜곡→ToF↔RGB→카메라↔포크, ChArUco), **대차 분류기**(DINOv2-S 특징 + 갤러리 최근접 top-3, 24종→프로파일 8묶음, 오프라인 top-1 99.5%/2,010 질의 — 본인 평가면 수치 유지, 로봇 카메라 질의는 미검증 명시, Basler 풍 증강, DINOv3 비교는 연구용), 작업자 확인(PDA 후보 3장) → 프로파일 값으로 측정·정렬·삽입 액션. 바닥 평면 SAM3 마스크 vs ToF RANSAC A/B, 바닥 반사 signed-height gate, 안쪽 caster 오선택 방어(fail-close), `RequestImage`/`RequestPointCloud` TCP API, 측정 거리 1.5~5 m 한계. 비전 서보잉 액션(approach_cart_rgbd, check_fork_alignable). approach_plane_lidar/tof는 "개발·실험 단계(실차 벽 1회)"로 한 줄. Isaac Sim 디지털트윈(RTX LiDAR·CAN 모의·운영자 콘솔·RCS 전체 스택 E2E, 2026-07~08, 실험·프로토타입). 측정 시간·정확도 수치는 브리핑의 본인 실측(4.66 s, 트랙 0.71 vs 0.75 m 편차)만, 출처는 "현장 측정".
- 정정: 안전 구역 "3단 가상 범퍼" → "경고·정지 구역(센서별 warn/stop) + E-STOP 래칭, 초기 설계 이후 팀이 프로파일 방식으로 확장". 센서: 안전용 2D LiDAR 3대·마스트 LiDAR·반사판 측위 스캐너·ToF(Basler blaze-102)·RGB — 모델명은 센서 종류 수준으로. 지도·미션 도구(Traffic Studio)는 "팀이 만든 현장 도구와 연동"으로만. 3D 장면 `fk-safety` 라벨 동기화.
- 비공개 참고 자료(레포 밖)는 사실 추출에만 쓰고 고객명·현장 코드는 옮기지 않는다.

**ai-build-lab** (사용자 결정: 기간 2025.05~, 커뮤니티 활동 명시, deck·bolt·jk-video-editor 추가)
- period → '2025.05 – present'("Claude Code 출시 시점부터"). 본문에 "2026.04부터 Claude Code in Daegu 커뮤니티(약 160명) 초기 멤버로 활동" 한 줄 — **공개 근거 링크는 소유자가 제공**(없으면 소식 항목은 만들지 않고 본문 한 줄만).
- 기존 4앱 갱신: multi-cli-work(모바일 원격 동반 앱, 팀 보드·`jk` MCP 도구, 진행률·구독 사용량 표시, 워크트리 setup/teardown; 버전 번호는 본문에서 빼고 대표 캡션 "v1.24" → 촬영 시점 표기 또는 새 화면), harness-manager(v3 재설계: doctor·설치 엔진·설정 병합·마켓플레이스·승인 기반 AI 복구; 진화 과정 한 줄), view-anything(이미지·CSV·텍스트 편집, LAS/LAZ, ICP 정합 품질 보고, Windows·Linux), 대구 버스(정류장 중심 재설계·초정밀 위치 지도·즐겨찾기 위젯, 상태 "안정화").
- 하위 사례 추가: deck(메모·할 일 PWA: React 19·BlockNote·오프라인·REST API·Android 설치), bolt(개인 운영 대시보드: Electron+React 공용 renderer·FastAPI 사이드카·Notion 연동 — 화면은 데모 데이터만), jk-video-editor(Electron·Remotion 영상 편집기, 2026-08까지). 저장소 링크·소식은 **공개 저장소 + 릴리스가 확인될 때만**(`data/news-software-sources.json` 규칙: 첫 공개 버전만). 회사 도구(DtHwpEditor·DtResearchTool 등)는 이력서에만(현행).

**홈 지도 매핑 최종**: ① 영상·센서: 무인지게차(①②③④)·SGRT(①③④) / ② 모델·특징점: 하악골(②③⑤)·디지털 교합(①②⑤) / ③ 정합: 수술 내비게이션(③④⑤) / ④ 추적: SKADI(④⑤) / ⑤ 계획·내비·시각화: NeuroPilot(③④⑤)·OMFS VR(⑤) / 바닥 띠 AI Build Lab. (지게차에 ② 추가 = SAM3 분할·DINOv2 분류, SGRT에 ③ 추가 = STL 기준 ICP — 조사로 드러난 사실 반영; 소유자 확인 항목)

## 제약·규칙(확인한 것)

- 홈·소식·프로젝트 목록은 생성물: 손으로 고치지 말고 `profile-home.cjs` 수정 후 `node scripts/public-cv-summary.cjs --write`. 사례 셸 18개(`projects/<slug>/index.html`, `en/…`)는 생성기가 없어 `<title>`·`<h1>`·meta description·fallback `<p>`(=summary)를 손으로 동기화(테스트 약 2512~2523행).
- CSS: scholar/local-feed에 `box-shadow|gradient|uppercase|monospace` 금지(`portfolio.test.cjs:2629`, `scholar-readability.test.cjs:72`); product-console만 예외. **`css/scholar.css` ≤ 420줄 한도**(테스트 약 2641행, 현재 323줄) — 새 스타일시트 파일은 `pageDependencyErrors`(약 2346행)에 걸리므로 지도·타일·단계 버튼·SVG 흐름도·콜아웃 CSS는 scholar.css에 넣고 한도를 한 번 올린다(`.sc-flow` HTML 규칙 17줄·`.sc-intro__figure` 2줄 삭제로 일부 상쇄).
- 스크립트: `pageDependencyErrors`(약 2274~2369행)가 페이지별 정확한 스크립트 순서를 요구, `async/defer` 금지(약 2209행). 공개 HTML 28개 고정.
- PDF digest 경계: `canonicalPdfSource`가 `capabilities·tiers·projects(pdfProject)·evidence·cv`를 해시 → 프로젝트 안 새 필드는 `pdfProject`에서 제거해야 하고, 본문 필드 변경은 `output/pdf/manifest.json` `sourceDigest` 불일치로 validator 실패 → **④에서 본문 변경을 모아 PDF를 1회 재생성한 뒤 ①②③은 digest 불변을 완료 기준으로** 한다. PDF 쪽수 테스트: surgical-navigation 6쪽 고정(약 3418행), 전체 2~12쪽(약 2745행).
- `web.sections[key]`는 기존 storySections/console 키만 허용(약 782행)·8줄·ko 38/en 70자 → ④의 신규 사실은 `storySections`/`blocks`/`subcases`에 넣고 `web`에 압축본. `aiBuildLabSubcaseKeys`(render 약 51행, 테스트 약 510행)는 5개 고정 → 8개로 확장.
- 장면 JS 합계 ≤ 400KB, 포스터 합계 ≤ 3MiB(기존, 현재 약 0.5MB); glTF 예산은 별도 신설. 테스트 316 `SSAO` 금지 유지.
- 사실 경계: 로봇 보조 수술 없음, NeuroPilot ICP 표면점은 포인터로 찍은 점, 지게차 안전 구역은 LiDAR 거리 기반, SMCNavi HoloLens는 본문 근거 있음. `policy.prohibitedPartnerPattern`(약 67행)은 조사에서 나온 고객사명·현장 코드를 잡지 못하므로 사람이 확인한다(패턴 추가 여부는 소유자 결정).
- 전체 `node --test` 약 12분 → 별도 worktree에서.

## 구현 계획(단계별 · 배포 순서)

**0단계 — 스펙 커밋.** 이 문서를 `docs/superpowers/specs/2026-11-06-readability-redesign-design.md`로 저장(사람 이름·Drive 경로·고객사명 제거 후), `scripts/public-scope.cjs`(약 7행 `publicDocs`)에 등록. 이후 superpowers:writing-plans로 단계별 세부 계획 작성.

**1단계 — ④ 콘텐츠 최신화(PDF 재생성 포함).**
- 수정: `js/portfolio-data.js` 9개 케이스(본문+`web`), `js/portfolio-render.js` `aiBuildLabSubcaseKeys`, 셸 18개 손 편집, `data/public-cv.json` rows 기간(ai-build-lab의 사내 도구 행은 케이스 링크만 제거(2026-11-06 판정), rtms `2024.07–2026.08`; `items`/`summary`는 CV PDF 동기화용이라 유지), `data/news-software-sources.json`·`news`·`js/local-feed.js` labels(deck/bolt/jk-video-editor는 공개 릴리스 확인 시만), `README.md` 약 13행 제목, `AGENTS.md` 상태 문구, `tests/positioning.test.cjs` eyebrow 접두(약 50행).
- 파이프라인: 데이터 → 셸 → `node scripts/public-cv-summary.cjs --write` → `node scripts/export-portfolio-data.cjs --output <tmp>/input.json` → `python scripts/generate-portfolio-pdfs.py --input … --output-dir output/pdf --publish-root .`(PyMuPDF·ReportLab, `.venv-pdf`) → `assets/pdfs/` 교체·manifest → 쪽수 전후 표 검토 → `python scripts/check-cv-pdf-sync.py`.
- 테스트 갱신(추정 행): `portfolio.test.cjs` 1932·1782·2353~2374·3406~3407(제목), 3418(6쪽), 510(subcase 키), 805~816(ai-build-lab evidence); `profile-pages.test.cjs` 143(`news.length`)·142(forklift 기간); 신규: rtms completed 라벨, CV rows 기간=케이스 period.
- 완료: 세 명령 통과, manifest digest 일치, 쪽수 diff 검토, 셸 18개 h1/summary 동기화, 9개 케이스 육안.

**2단계 — ① 홈 지도 + 홈 정리.**
- 수정: `js/portfolio-data.js` `pipeline` 추가·`homeScene3d` 삭제; `js/portfolio-render.js` `pipelineErrors`·`pipelineMapHtml`·`homeProjectGalleryHtml` tile 변형(`thumbnailItem` 약 1169행 재사용)·`homeScene3dFigureHtml` 삭제; `scripts/profile-home.cjs` `renderHome`/`capabilitiesHtml`/`homeNews(3)`; `index.html`·`en/index.html` 스크립트·CSS 링크 정리; `js/local-feed.js`·`css/local-feed.css` 선택 활동 제거; `css/scholar.css` `.sc-map*`·`.sc-project--tile`·760px 분기; `js/scenes/home-tracking.js`·`assets/3d/home-tracking.webp` 삭제; `scripts/validate-portfolio.cjs` home 분기 정리; `AGENTS.md`.
- 썸네일 후보(승인 이미지): ① `unmanned-forklift-gallery-0x` ② `digital-occlusion-workflow-landmark-01` ③ `surgical-navigation-smcnavi-ui-01` ④ `skadi-desktop-tracker-6dof-01` ⑤ `surgical-navigation-hololens-poster-01`.
- 테스트 갱신: `scene3d.test.cjs` 69·230~257(홈 3D); `portfolio.test.cjs` 1758·1749~1750·5483(인트로)·1763(타일 `sc-project` 접두 유지)·4697~4705·4816(홈 fixture 스크립트 블록)·2632·2641; `profile-pages.test.cjs` 26~37·150(소식 3); `positioning.test.cjs` 65·72; `scholar-readability.test.cjs` 71·78~88; `activity-feed.test.cjs` 117~125 삭제. 신규: pipeline 계약, `pipelineMapHtml` ko/en 스냅샷(칩 href=`routeHref`), 홈에 `view3d|scene3d` 없음, digest 불변.
- 완료: 1280px 스크롤 없이 지도까지, 390px 세로 목록, hover/focus 연동, 탭 순서, Network에 three.js 없음, 영문 홈 동일, 세 명령 + `check-local-preview.cjs`.

**3단계 — ③ 케이스 시각 보강.**
- 수정: `js/portfolio-render.js`(`caseStudyHtml` 첫 시각물, `normalizeDiagram`·`diagramSvg`, `systemFlowDiagramHtml` 교체, 기본 레이아웃 접근 섹션에 흐름도 삽입 약 1755행, 콜아웃 렌더·검증, `webCopyKeys`에 `flow`, `storyMediaKeys`에 `callouts`); `scripts/portfolio-pdf-source.cjs` 깊은 제거; `js/local-projects.js` 정리; `css/scholar.css` `.sc-flow-svg--wide/--tall`·`.sc-callout*`; `js/portfolio-data.js` 콜아웃·`web.flow`.
- 테스트 갱신: `scene3d.test.cjs` 113~141(mandibular 그림 순서), `portfolio.test.cjs` 2216~2218·2231·2246·2336(흐름도 마크업)·2646~2690(CSS 셀렉터)·5699~5711; 신규: `diagramSvg` 결정성 스냅샷(ko/en·wide/tall·7 legacy kind), 콜아웃 검증, digest 불변, 번호 재부여 후 영상이 1번.
- 완료: 9개 케이스 그림 1이 영상/3D(ai-build-lab 제외), 번호 연속, 흐름도 880/390px 가독, 콜아웃 번호=목록, digest 불변, 세 명령.

**4단계 — ② 3D 엔진·장면 통일·glTF.**
- 순서: (a) 엔진 단계 버튼·시간 모델·바닥·재질 라이브러리 → (b) 8장면 `steps`·라벨 수정(smcnavi HoloLens "(2024–2025)", sgrt "(계획)", fk-safety 안전 구역 문구)·형상 세밀화 → (c) glTF 로더·validator·LICENSES·대상 장면 교체(소유자 모델 승인 후) → (d) 포스터 8장 재캡처.
- 수정: `js/scene3d.js`, `js/scenes/*.js` 8개, `js/vendor/GLTFLoader-r128.js`, `assets/3d/models/*.glb`·`LICENSES.md`, `scripts/validate-portfolio.cjs`(약 69·2266행), `scripts/capture-3d.mjs`(약 188행, `--step`, `SCENE3D_CAPTURE` 예외), `css/scholar.css` `.view3d__steps`(약 167·179행 목록 포함), `assets/3d/*.webp`, `AGENTS.md`·2026-10-30 스펙 개정 주석, `portfolio.test.cjs` 282~320 복사 목록.
- 테스트: `scene3d.test.cjs` 261~262·281~283·291~311 문구, 신규: 단계 바 DOM(`aria-pressed` 하나·기본 마지막), reduced-motion 시각, `DECK3D_CLOCK` 우선, glb 매직/외부 uri/확장/용량, LICENSES↔파일 1:1, 장면 파일에 `.glb`·URL 없음, CC-BY 캡션 출처.
- 완료: 8장면 기본 상태(마지막 단계 정지+느린 흔들림), 버튼 재생·정지, reduced-motion 정지, `file://` 포스터→프로시저럴, glb는 장면 근접 시에만 로드·컨텍스트 ≤2, 포스터 재캡처, 세 명령.

각 단계 공통: 별도 worktree에서 `node --test` → `node scripts/validate-portfolio.cjs` → `git diff --check` → `python -m http.server 8000` + `node scripts/check-local-preview.cjs` → 1280/390px 육안 → `file://` 직접 열기 → main 배포(사용자 선호: 리뷰 끝나면 바로 배포).

## 검증

- 자동: 위 세 명령 + 새 테스트(pipeline 데이터 계약, 홈 지도 생성물, 단계 버튼 DOM, glTF 라이선스 매니페스트·용량, diagramSvg 스냅샷, 콜아웃 좌표 범위).
- 수동: 1280px·390px에서 홈 첫 화면이 스크롤 없이 지도까지 보이는지, 칩 hover/focus 연동, 키보드 탭 순서, reduced-motion에서 3D 정지, `file://`에서 포스터 폴백, 영문 홈 동일 동작, Lighthouse 성능(three.js·glTF가 LCP에 영향 없음).

## 미결(구현 중 소유자 확인 항목)

- glTF 모델 후보 목록(다운로드 전 소유자 승인), LICENSES.md 초안.
- 콜아웃 대상 화면·문구 초안, 홈 한 문장·단계 blurb·새 케이스 제목(ko/en) 초안.
- Claude Code in Daegu 커뮤니티 활동의 공개 근거 링크, deck·bolt·jk-video-editor 저장소 공개 여부.
- 홈 지도 매핑 최종안(지게차 ②, SGRT ③ 추가)에 대한 확인.
