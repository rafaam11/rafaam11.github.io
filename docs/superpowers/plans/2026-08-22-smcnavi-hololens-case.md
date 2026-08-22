# SMCNavi · HoloLens Surgical Navigation Case Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `surgical-navigation` 사례를 SMCNavi 6개 워크플로, 추적·정합·캘리브레이션, HoloLens 연구 프로토타입, 개인 역할과 팀 결과를 명확히 분리한 한·영 장문 기술 사례로 재구성한다.

**Architecture:** 기존 24개 정적 경로와 공유 사례 셸은 유지한다. `js/portfolio-data.js`에 선택적 `storySections` 계약을 추가하고, `js/portfolio-render.js`가 이 계약이 있는 수술내비게이션 사례만 장문 스토리·분산 미디어·시맨틱 시스템 흐름으로 렌더링한다. 증거 원장과 검증기는 중첩 포스터 및 사례별 장문 영상 정책을 재귀적으로 검사하며, PDF 생성기는 동일한 스토리 다이어그램을 참조해 기존 6쪽 수술내비게이션 PDF를 다시 만든다.

**Tech Stack:** 정적 HTML, CSS, JavaScript(CommonJS/브라우저 UMD), Node.js 내장 테스트 러너, PowerShell, FFmpeg/FFprobe, PowerPoint COM 읽기 전용 슬라이드 내보내기, Python 3, ReportLab, Pillow, PyMuPDF, pypdf.

**Spec:** `docs/superpowers/specs/2026-08-22-smcnavi-hololens-case-design.md`

## Global Constraints

- 변경 대상은 `surgical-navigation` 사례와 이를 지원하는 하위 호환 데이터·렌더링·검증·PDF 계약뿐이다. 경로를 추가하거나 제거하지 않으며 공개 HTML은 정확히 24개를 유지한다.
- 한국어는 루트, 영어는 `/en/`이며 `data-base`, `data-page`, `data-lang`, `data-route`와 HTTP/`file://` 경로 해석을 유지한다.
- 공개 제목은 `SMCNavi · HoloLens 수술내비게이션` / `SMCNavi · HoloLens Surgical Navigation`, 기간은 `2023.07 – present`, 상태는 `Prototype · Ongoing`이다.
- 개인 역할과 팀 결과를 분리한다. 기여율, 임상 효능·정확도·안전성·운영 효과, 실제 수술 사용, 생산 배포, 규제 승인, 특허 진행, 타 기관 수치 주장을 추가하지 않는다.
- 공개 기관 맥락은 DIGITRACK 개발과 삼성서울병원 연구 협력까지만 쓴다. 승인되지 않은 개인 이름, 내부 제품명, 공개 SMCNavi 저장소 링크를 추가하지 않는다.
- Azure Spatial Anchors와 Photon Unity Networking은 구현 기술로 쓰지 않는다. ASA는 초기에 검토됐지만 사용되지 않았으므로 공개 본문·그림·PDF에서 모두 제거한다.
- 두 영상은 원본 전체 길이를 유지한다. HoloLens 영상은 약 `159.833333s`, `1280×720`, SMCNavi 기능 영상은 약 `90.266667s`, `960×720`이다. 둘 다 H.264, `yuv420p`, fast-start, 무음, 식별 메타데이터 없음, 파일당 `100,000,000`바이트 미만이어야 한다.
- 영상은 `controls`, `preload="metadata"`, 포스터를 사용하고 `autoplay`와 `loop`를 사용하지 않는다. 기존 사례 영상의 기본 `preload="none"` 동작은 바꾸지 않는다.
- 승인된 두 영상, 발표자료 7쪽의 승인된 하단 파생본 두 장, 기존 공개 안전 이미지와 승인된 영상 프레임만 Git에 둔다. 원본·중간 산출물·절대 로컬 경로는 저장소에 기록하지 않는다.
- 수술내비게이션 웹 사례는 이미지·영상·시스템 다이어그램을 설명 옆에 배치한다. 다른 7개 사례의 HTML 구조와 내용은 기존 분기를 그대로 사용한다.
- 수술내비게이션 한·영 PDF는 각각 기존 6쪽을 유지한다. 다른 14개 프로젝트 PDF의 공개 내용은 바꾸지 않는다.
- 공유 작업 트리의 실시간 `git status`와 관련 diff를 각 단계 시작 전에 다시 확인한다. 다른 변경을 되돌리거나 덮어쓰거나 광범위하게 재포맷하지 않는다.
- 이 계획 실행에서는 파일을 stage하지 않고 commit, push, 배포하지 않는다. 이는 일반적인 계획 템플릿의 빈번한 커밋 권고보다 우선한다.
- 계획 작성 중 외부 자동 커밋 프로세스가 `main`과 `origin/main`을 이동시키는 것이 관찰됐다. 구현 시작 시 이 프로세스가 계속 동작하면 첫 소스 변경 전에 중단하고, 소유자가 자동 배포를 의도했는지 또는 프로세스를 끌 것인지 확인한다.
- 최종 자동 검증은 `node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check` 세 명령을 모두 포함한다.
- 레이아웃 검증은 인앱 브라우저만 사용한다. 사용할 수 없으면 그 한계를 기록하고 다른 브라우저 제어 백엔드로 조용히 대체하지 않는다.

---

## File and interface map

| File | Responsibility in this change |
| --- | --- |
| `js/portfolio-data.js` | 수술내비게이션의 정본 한·영 카피, `storySections`, 전체 길이 미디어, PDF 선택 계약 |
| `js/portfolio-render.js` | 선택적 스토리 스키마 검증, 현지화, 장문 렌더링, 연속 figure 번호, 시스템 흐름 HTML |
| `css/scholar.css` | 장문 섹션, wide/grid 미디어, 반응형 시스템 흐름 스타일 |
| `scripts/validate-portfolio.cjs` | 중첩 스토리 미디어 평탄화, 증거 원장 일치, 사례별 MP4 정책, 공개 파일 목록·카피 검사 |
| `scripts/generate-portfolio-pdfs.py` | 스토리 섹션·다이어그램 참조 해석, 대표 이미지 선택, 6쪽 한·영 PDF 생성 |
| `scripts/export-portfolio-data.cjs` | 수정 없이 회귀 검증한다. 정본 프로젝트 객체 전체를 이미 내보내므로 새 필드를 보존해야 한다. |
| `scripts/portfolio-pdf-source.cjs` | 수정 없이 회귀 검증한다. 최상위 PDF 소스 스키마 버전은 `1`을 유지한다. |
| `tests/portfolio.test.cjs` | 데이터·렌더러·검증기·미디어·PDF의 실패 우선 계약과 기존 7개 사례 회귀 검사 |
| `assets/projects/EVIDENCE_REGISTER.md` | 새 공개 파생본 ID 등록, 폐기 자산 `excluded` 전환 |
| `assets/projects/surgical-navigation/README.md` | 실제 공개 파생본과 비공개 원본 경계 설명 |
| `assets/projects/surgical-navigation/` | 두 MP4, 두 포스터, 두 슬라이드 파생본, 안전한 벤치 프레임 추가 및 네 개 구 자산 제거 |
| `assets/pdfs/surgical-navigation-{ko,en}.pdf` | 공개 수술내비게이션 PDF |
| `output/pdf/surgical-navigation-{ko,en}.pdf` | 정본 생성 PDF |
| `output/pdf/manifest.json` | 현재 데이터·생성기·32개 PDF 산출물 해시 |

### Canonical interfaces

아래 이름과 필드명을 모든 JavaScript, validator, Python generator, 테스트에서 동일하게 사용한다.

```ts
type VideoPolicy = {
  maxBytes: number;
  targetDurationSeconds: number;
  toleranceSeconds: number;
  width: number;
  height: number;
  codec: 'h264';
  requireNoAudio: true;
  requireFastStart: true;
};

type BilingualMediaCopy = {
  ko: { caption: string; alt: string };
  en: { caption: string; alt: string };
};

type StoryMedia = {
  id: string;
  type: 'image' | 'video';
  status: 'approved' | 'pending-approval';
  publicPath?: string;
  preload?: 'none' | 'metadata';
  videoPolicy?: VideoPolicy;
  poster?: {
    id: string;
    type: 'image';
    status: 'approved' | 'pending-approval';
    publicPath?: string;
  };
  translations?: BilingualMediaCopy;
};

type SystemFlowDiagram = {
  kind: 'system-flow';
  boundary: 'prototype';
  translations: {
    ko: { title: string; caption: string; boundaryLabel: string };
    en: { title: string; caption: string; boundaryLabel: string };
  };
  nodes: Array<{
    key: string;
    translations: {
      ko: { label: string; detail: string };
      en: { label: string; detail: string };
    };
  }>;
  edges: Array<{
    from: string;
    to: string;
    direction: 'forward' | 'bidirectional';
    translations: {
      ko: { label: string };
      en: { label: string };
    };
  }>;
};

type StorySection = {
  key: string;
  layout: 'wide' | 'grid';
  translations: {
    ko: { heading: string; body?: string; items?: string[] };
    en: { heading: string; body?: string; items?: string[] };
  };
  media?: StoryMedia[];
  diagram?: SystemFlowDiagram;
};

type StoryPdfSequence = {
  middle: [string, string, string, string];
  evidenceId: string;
  diagram: { storySectionKey: string };
  figureIds: [string, string, string, string, string, string];
};
```

The JavaScript renderer exports these exact helpers for tests and the filesystem validator:

```js
storySectionsErrors(project, slug) -> string[]
storySectionsHtml(projectRecord, locale, base, firstFigureNumber) -> string
systemFlowDiagramHtml(diagram, locale, figureNumber) -> string
mediaPreload(item) -> 'none' | 'metadata'
```

The filesystem validator exports these exact helpers:

```js
canonicalMediaEntries(candidate) -> Array<{ project, item, slot }>
approvedMp4Errors(filePath, videoPolicy) -> string[]
```

The PDF generator defines these exact helpers:

```py
resolve_sequence_sections(project: dict[str, Any], locale: str) -> list[tuple[dict[str, Any], dict[str, Any]]]
resolve_sequence_diagram(project: dict[str, Any]) -> dict[str, Any]
canonical_project_media(project: dict[str, Any]) -> dict[str, dict[str, Any]]
selected_media_image(project: dict[str, Any], item: dict[str, Any], local_evidence: dict[str, Path]) -> Path | None
```

---

### Task 1: Freeze the live baseline and private-source boundary

**Files:**
- Read: `AGENTS.md`
- Read: `docs/superpowers/specs/2026-08-22-smcnavi-hololens-case-design.md`
- Read: all files in the file map above
- Test: existing repository test and validator surfaces

**Interfaces:**
- Consumes: the approved specification and three private input locations supplied in the conversation.
- Produces: a verified clean baseline, a temporary hash guard for the 14 unrelated PDFs, and process-only source variables that never enter tracked files.

- [ ] **Step 1: Re-read repository instructions and inspect the live tree**

Run:

```powershell
Get-Content -Raw -LiteralPath AGENTS.md
git status --short --branch
git diff -- js/portfolio-data.js js/portfolio-render.js css/scholar.css scripts/validate-portfolio.cjs scripts/generate-portfolio-pdfs.py tests/portfolio.test.cjs assets/projects/EVIDENCE_REGISTER.md assets/projects/surgical-navigation/README.md output/pdf/manifest.json
```

Expected: the executor can identify every pre-existing hunk. If any mapped file changed after this plan was written, preserve it and patch only the surgical-navigation or shared-contract lines described here. Run `git log -10 --format="%h %ad %s" --date=iso` plus `git rev-parse HEAD` and `git rev-parse origin/main`; if recent `Auto-commit:` entries show that the background process is still publishing workspace edits, stop before implementation and resolve the automatic commit/deployment authority with the owner.

- [ ] **Step 2: Bind private inputs only to the current process**

The implementation session sets these process variables from the already approved conversation inputs; their values must not be copied into a tracked file:

```powershell
$requiredSourceVariables = @(
  'SMCNAVI_MAIN_VIDEO_SOURCE',
  'SMCNAVI_FEATURE_VIDEO_SOURCE',
  'SMCNAVI_SLIDE_DECK_SOURCE'
)
$missingSourceVariables = $requiredSourceVariables | Where-Object {
  -not [Environment]::GetEnvironmentVariable($_, 'Process')
}
if ($missingSourceVariables.Count) {
  throw "Missing process-only source variables: $($missingSourceVariables -join ', ')"
}
foreach ($name in $requiredSourceVariables) {
  $value = [Environment]::GetEnvironmentVariable($name, 'Process')
  if (-not (Test-Path -LiteralPath $value -PathType Leaf)) {
    throw "Private source is missing for $name"
  }
}
```

Expected: all three source files exist; no source value appears in `git diff`.

- [ ] **Step 3: Run the unmodified baseline**

Run:

```powershell
node --test
node scripts/validate-portfolio.cjs
git diff --check
```

Expected: all three pass before feature edits. If a baseline failure exists, stop this plan and diagnose it separately before changing feature code.

- [ ] **Step 4: Save an unrelated-PDF checksum guard outside the repository**

Run:

```powershell
$pdfGuardPath = Join-Path $env:TEMP 'smcnavi-unrelated-project-pdfs-20260822.json'
$guardRows = Get-ChildItem -LiteralPath assets\pdfs -Filter '*.pdf' |
  Where-Object { $_.Name -notin @('surgical-navigation-ko.pdf', 'surgical-navigation-en.pdf') } |
  Sort-Object Name |
  ForEach-Object {
    [pscustomobject]@{
      Name = $_.Name
      Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
    }
  }
$guardRows | ConvertTo-Json | Set-Content -LiteralPath $pdfGuardPath -Encoding utf8
$manifest = Get-Content -Raw -LiteralPath output\pdf\manifest.json | ConvertFrom-Json
$surgicalDocuments = $manifest.documents | Where-Object { $_.slug -eq 'surgical-navigation' }
if (($surgicalDocuments | Where-Object { $_.pages -ne 6 }).Count) {
  throw 'The approved baseline requires both surgical-navigation PDFs to have six pages.'
}
```

Expected: the temporary JSON contains 14 names and hashes; both current surgical-navigation documents report 6 pages.

- [ ] **Step 5: Record a no-write review checkpoint**

Run:

```powershell
git status --short --branch
```

Expected: no feature implementation files have changed in this task.

---

### Task 2: Add the optional story contract and long-form renderer with failing tests first

**Files:**
- Modify: `tests/portfolio.test.cjs` near the Scholar case renderer tests and schema tests
- Modify: `js/portfolio-render.js:17-40,117-125,246-295,311-375,414-592,638-670,755-806,833-847`

**Interfaces:**
- Consumes: `StorySection`, `StoryMedia`, `SystemFlowDiagram`, and `StoryPdfSequence` from the canonical interface section.
- Produces: `storySectionsErrors`, `storySectionsHtml`, `systemFlowDiagramHtml`, `mediaPreload`; legacy case rendering remains on its existing branch.

- [ ] **Step 1: Add reusable story fixtures to the test file**

Insert after `clone()`:

```js
function storyDiagramFixture() {
  return {
    kind: 'system-flow',
    boundary: 'prototype',
    translations: {
      ko: { title: '시스템 흐름', caption: '설명용 흐름', boundaryLabel: '연구 프로토타입' },
      en: { title: 'System flow', caption: 'Explanatory flow', boundaryLabel: 'Research prototype' }
    },
    nodes: [
      { key: 'tracker', translations: { ko: { label: '추적 장치', detail: '관측' }, en: { label: 'Tracker', detail: 'Observations' } } },
      { key: 'core', translations: { ko: { label: '코어', detail: '정합' }, en: { label: 'Core', detail: 'Registration' } } }
    ],
    edges: [
      { from: 'tracker', to: 'core', direction: 'forward', translations: { ko: { label: '좌표' }, en: { label: 'Transforms' } } }
    ]
  };
}

function storySectionFixture() {
  return {
    key: 'story-overview',
    layout: 'wide',
    translations: {
      ko: { heading: '개요', body: '본문' },
      en: { heading: 'Overview', body: 'Body' }
    },
    media: [{
      id: 'story-image-01',
      type: 'image',
      status: 'approved',
      publicPath: 'assets/projects/surgical-navigation/story-image-01.png',
      translations: {
        ko: { caption: '이미지 설명', alt: '이미지 대체 텍스트' },
        en: { caption: 'Image caption', alt: 'Image alternative text' }
      }
    }]
  };
}
```

- [ ] **Step 2: Write renderer and validation tests that fail on the current implementation**

Add these named tests:

```js
test('SMCNavi story contract rejects malformed sections, media, posters, and flow endpoints', () => {
  const mutations = [
    [(section) => { section.key = ''; }, /stable key/i],
    [(section) => { section.layout = 'carousel'; }, /layout/i],
    [(section) => { delete section.translations.en.body; }, /en.*body or list/i],
    [(section) => { section.media[0].translations.en.alt = ''; }, /en translation for alt/i],
    [(section) => {
      section.media = [{
        id: 'story-video-01', type: 'video', status: 'approved',
        publicPath: 'assets/projects/surgical-navigation/story-video-01.mp4',
        preload: 'metadata',
        translations: {
          ko: { caption: '영상', alt: '영상 설명' },
          en: { caption: 'Video', alt: 'Video description' }
        }
      }];
    }, /approved story video requires an approved image poster/i],
    [(section) => { section.diagram = storyDiagramFixture(); section.diagram.edges[0].to = 'missing'; }, /edge endpoint/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    const project = candidate.projects[0];
    project.storySections = [storySectionFixture()];
    mutate(project.storySections[0]);
    assert.match(render.dataErrors(candidate).join('\n'), expected);
  }
});

test('SMCNavi story renderer distributes approved media, numbers figures, and keeps video user-controlled', () => {
  const candidate = clone(data);
  const project = candidate.projects[0];
  project.translations.ko.roleLabel = '3D 의료영상·수술내비게이션 개발자';
  project.translations.en.roleLabel = '3D Medical Imaging · Surgical Navigation Developer';
  project.storySections = [storySectionFixture(), {
    key: 'system-architecture',
    layout: 'wide',
    translations: {
      ko: { heading: '구조', body: '연결 구조' },
      en: { heading: 'Architecture', body: 'Connection architecture' }
    },
    media: [{
      id: 'story-video-01', type: 'video', status: 'approved',
      publicPath: 'assets/projects/surgical-navigation/story-video-01.mp4',
      preload: 'metadata',
      poster: {
        id: 'story-video-poster-01', type: 'image', status: 'approved',
        publicPath: 'assets/projects/surgical-navigation/story-video-poster-01.png'
      },
      translations: {
        ko: { caption: '전체 영상', alt: '전체 영상 설명' },
        en: { caption: 'Full video', alt: 'Full video description' }
      }
    }],
    diagram: storyDiagramFixture()
  }];
  project.blocks = [];
  project.media.gallery = [];
  project.pdfSequence = {
    middle: ['story-overview', 'system-architecture', 'story-overview-copy', 'system-architecture-copy'],
    evidenceId: project.media.lead.id,
    diagram: { storySectionKey: 'system-architecture' },
    figureIds: ['story-image-01', 'story-video-01', 'story-image-01-copy', 'story-video-01-copy', 'story-image-01-copy-2', 'story-video-01-copy-2']
  };

  const sourceSections = clone(project.storySections);
  sourceSections.push(
    { ...clone(sourceSections[0]), key: 'story-overview-copy', media: [{ ...clone(sourceSections[0].media[0]), id: 'story-image-01-copy' }] },
    { ...clone(sourceSections[1]), key: 'system-architecture-copy', media: [{ ...clone(sourceSections[1].media[0]), id: 'story-video-01-copy', poster: { ...clone(sourceSections[1].media[0].poster), id: 'story-video-poster-01-copy' } }] }
  );
  sourceSections[0].media.push({ ...clone(sourceSections[0].media[0]), id: 'story-image-01-copy-2' });
  sourceSections[1].media.push({ ...clone(sourceSections[1].media[0]), id: 'story-video-01-copy-2', poster: { ...clone(sourceSections[1].media[0].poster), id: 'story-video-poster-01-copy-2' } });
  project.storySections = sourceSections;

  assert.deepEqual(render.dataErrors(candidate), []);
  const html = render.caseStudyHtml(candidate, 'surgical-navigation', '../../../', false, 'en');
  assert.match(html, /class="sc-story"/);
  assert.match(html, /data-story-section="system-architecture"/);
  assert.match(html, /<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="metadata")(?=[^>]*\bposter="\.\.\/\.\.\/\.\.\/assets\/projects\/surgical-navigation\/story-video-poster-01\.png")/);
  assert.doesNotMatch(html, /\bautoplay\b|\bloop\b/);
  assertInOrder(html, ['Figure 1.', 'Figure 2.', 'Figure 3.', 'System flow', 'Research prototype', '3D Medical Imaging · Surgical Navigation Developer']);
  assert.doesNotMatch(html, /class="sc-gallery"/);
});

test('non-story cases retain the legacy case sequence and omit story markup', () => {
  const html = render.caseStudyHtml(data, 'mandibular-fracture', '../../', false, 'en');
  assertInOrder(html, ['<h2>Problem</h2>', '<h2>Approach</h2>', '<h2>My role</h2>', '<h2>Results and evidence</h2>', '<h2>Limits and team result</h2>', 'sc-gallery', 'sc-case__links']);
  assert.doesNotMatch(html, /class="sc-story"|data-story-section=/);
});
```

The copy fixtures create four distinct section keys and six distinct PDF figure IDs so the extended sequence validator can also be exercised. Keep all fixture IDs distinct from canonical evidence IDs.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run:

```powershell
node --test --test-name-pattern="SMCNavi story|non-story cases" tests/portfolio.test.cjs
```

Expected: failure because `storySections` validation/rendering and story-backed PDF sequence resolution do not exist.

- [ ] **Step 4: Add schema constants, localization, public-copy traversal, and validation**

Implement these exact rules in `js/portfolio-render.js`:

```js
var storyLayouts = ['wide', 'grid'];
var storyMediaTypes = ['image', 'video'];
var storyDirections = ['forward', 'bidirectional'];
var storyMediaKeys = ['id', 'poster', 'preload', 'publicPath', 'status', 'translations', 'type', 'videoPolicy'];
var videoPolicyKeys = [
  'codec', 'height', 'maxBytes', 'requireFastStart', 'requireNoAudio',
  'targetDurationSeconds', 'toleranceSeconds', 'width'
];
```

- Change `pdfDiagramKindsBySlug['surgical-navigation']` from `coordinate-chain` to `system-flow`.
- Add `project.storySections` and `copy.roleLabel` to `localizePortfolioData`.
- When either project locale declares `roleLabel`, require a non-empty `roleLabel` in both locales; projects that omit it keep their current valid shape.
- Add every story translation, media translation, nested poster declaration, and diagram translation to `projectPublicCopy` so existing private-path, PII, prohibited-partner, and contribution-percentage checks cover the new surface.
- Extend `mediaItemErrors` so `preload` is allowed only for video and must be `none` or `metadata`; `videoPolicy` is allowed only for video and must contain exactly `videoPolicyKeys` with the canonical types and values. `maxBytes` must be an integer from `1` through `100000000`, durations must be finite positive numbers, tolerance must be from `0` through `1`, dimensions must be positive integers, codec must be `h264`, and both boolean requirements must be `true`.
- Add `storySectionsErrors(project, slug)` and a private `systemFlowDiagramErrors(diagram, label)` that enforce the canonical interfaces. `storySections` must be a non-empty array whose section keys are non-empty and unique and whose layouts belong to `storyLayouts`. Each locale must have a non-empty heading and at least one non-empty body or list. Story-media keys must be a subset of `storyMediaKeys`, so `autoplay`, `loop`, and undeclared link fields fail validation. Every story media item, including a pending item, requires caption and alt in both languages. Approved story media and nested posters must use a repository-relative path beginning `assets/projects/<slug>/`; external URLs are rejected. Approved story video requires an approved nested image poster. Story media and poster IDs must be unique against the project's lead/poster/reference/gallery IDs and against every preceding story record.
- Require a system-flow diagram to have at least two uniquely keyed nodes and exactly `nodes.length - 1` edges. Edge `i` must connect `nodes[i].key` to `nodes[i + 1].key`; endpoints must exist; every node has bilingual `label` and `detail`; every edge has a bilingual `label`; diagram copy has bilingual `title`, `caption`, and `boundaryLabel`.
- A project with non-empty `storySections` may use an empty `blocks` array. Projects without stories still require non-empty structural blocks.
- For a story project, `pdfSequence` must contain exactly `diagram`, `evidenceId`, `figureIds`, and `middle`; `middle` contains four unique known story keys; `diagram` contains exactly `storySectionKey` and resolves to a section containing the expected `system-flow` diagram; `figureIds` contains one through six unique approved story-media IDs. Legacy projects retain the exact current three-key sequence and four-block diagram contract.

Use one resolver inside validation so uniqueness checks compare the resolved diagram kind:

```js
function resolvedPdfDiagram(project) {
  var contract = project && project.pdfSequence && project.pdfSequence.diagram;
  if (contract && typeof contract.storySectionKey === 'string') {
    var section = (project.storySections || []).find(function (item) {
      return item && item.key === contract.storySectionKey;
    });
    return section && section.diagram ? section.diagram : null;
  }
  return contract || null;
}
```

- [ ] **Step 5: Implement safe story and system-flow HTML**

Add `mediaPreload`, `storyMediaFigureHtml`, `systemFlowDiagramHtml`, and `storySectionsHtml`. Use only `escapeHtml` and `assetHref` for user/data values. The generated structure must be:

```html
<div class="sc-story">
  <section class="sc-story__section sc-story__section--wide" data-story-section="system-architecture">
    <div class="sc-story__copy"><h2>System architecture</h2><p>Connection architecture.</p></div>
    <div class="sc-story__media sc-story__media--wide"></div>
  </section>
</div>
```

Render list copy as `<ul class="sc-story__list">`. Render approved images with `loading="lazy" decoding="async"`. Render approved videos as:

```js
'<video controls preload="' + escapeHtml(mediaPreload(item)) + '" tabindex="0" poster="' +
  escapeHtml(assetHref(base, item.poster.publicPath)) + '" aria-label="' + escapeHtml(itemCopy.alt) + '">' +
  '<source src="' + escapeHtml(assetHref(base, item.publicPath)) + '"></video>'
```

Render the flow as a `<figure class="sc-figure sc-flow-figure">` containing a labelled `.sc-flow__track`. Each `.sc-flow__node` shows translated `label` and `detail`; each `.sc-flow__edge` shows `→` or `⇄` plus its translated label; `.sc-flow__boundary` shows the explicit prototype boundary. Build the figure's `aria-label` from the translated title, node labels, edge labels, and boundary label.

Update `evidenceMediaHtml` to use `mediaPreload(media)` so only media declaring `preload: 'metadata'` change. The existing default remains `none`.

Update `caseStudyHtml` as one explicit branch:

```js
var hasStory = Boolean(sourceProject && Array.isArray(sourceProject.storySections) && sourceProject.storySections.length);
var story = hasStory ? storySectionsHtml(sourceProject, normalized, base, lead ? 2 : 1) : '';
var approach = hasStory
  ? story
  : '<section class="sc-case__section"><h2>' + escapeHtml(copy.approach) + '</h2><p>' +
      escapeHtml(project.summary) + '</p>' + blocksOfType(['system', 'text', 'list']) + '</section>';
var roleLabel = project.roleLabel
  ? '<p class="sc-case__role-label">' + escapeHtml(project.roleLabel) + '</p>'
  : '';
```

Keep the legacy string assembly unchanged apart from substituting `approach`, inserting `roleLabel` before `project.role`, and emitting `caseGalleryHtml` only when `hasStory` is false. Export the four helpers named in the interface section.

- [ ] **Step 6: Run focused and full renderer tests**

Run:

```powershell
node --test --test-name-pattern="SMCNavi story|non-story cases|Scholar case article|approved video contract" tests/portfolio.test.cjs
node --test
```

Expected: story tests pass; all legacy renderer tests remain green. PDF freshness tests may not fail yet because canonical data is not changed in this task.

- [ ] **Step 7: Inspect only this task's diff**

Run:

```powershell
git diff -- tests/portfolio.test.cjs js/portfolio-render.js
git diff --check
```

Expected: no unrelated project copy changes and no route changes.

---

### Task 3: Add long-form Scholar styling and responsive flow layout

**Files:**
- Modify: `tests/portfolio.test.cjs` near the Scholar CSS contract test
- Modify: `css/scholar.css:74-104`

**Interfaces:**
- Consumes: `.sc-story*` and `.sc-flow*` markup emitted by Task 2.
- Produces: wide/grid story layouts and a horizontal-to-vertical flow that never crops media or overflows narrow screens.

- [ ] **Step 1: Add a CSS contract test**

Add:

```js
test('SMCNavi long-form CSS provides wide, grid, and narrow flow layouts', () => {
  const scholarCss = read('css/scholar.css');
  for (const selector of [
    '.sc-story', '.sc-story__section', '.sc-story__media--grid', '.sc-case__role-label',
    '.sc-flow__track', '.sc-flow__node', '.sc-flow__edge', '.sc-flow__boundary'
  ]) {
    assert.match(scholarCss, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const narrow = cssAtRuleBodies(scholarCss, /@media\s*\(max-width:\s*760px\)/i).join('\n');
  assert.match(narrow, /\.sc-story__section--grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(narrow, /\.sc-story__media--grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(narrow, /\.sc-flow__track[\s\S]*flex-direction:\s*column/);
});
```

- [ ] **Step 2: Run the CSS test and confirm failure**

Run:

```powershell
node --test --test-name-pattern="SMCNavi long-form CSS" tests/portfolio.test.cjs
```

Expected: failure because the new selectors do not exist.

- [ ] **Step 3: Add the scoped CSS**

Add after the existing `.sc-case__links` rules:

```css
.sc-case__role-label { margin-bottom: .4rem; color: var(--sc-ink); font-weight: 700; }
.sc-story { display: grid; gap: 3rem; margin-top: 2.75rem; }
.sc-story__section { display: grid; gap: 1.35rem; padding-top: 2rem; border-top: 1px solid var(--sc-rule); }
.sc-story__section--grid { grid-template-columns: minmax(16rem, .72fr) minmax(0, 1.28fr); align-items: start; }
.sc-story__copy h2 { margin: 0 0 .7rem; }
.sc-story__copy p { max-width: 70ch; margin-bottom: 0; }
.sc-story__list { margin: .85rem 0 0; padding-left: 1.2rem; }
.sc-story__list li + li { margin-top: .35rem; }
.sc-story__media { min-width: 0; }
.sc-story__media--wide { display: grid; gap: 1.5rem; }
.sc-story__media--grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 1.25rem; }
.sc-story__media .sc-figure { margin: 0; }
.sc-flow-figure { margin-top: 0; }
.sc-flow { padding: 1rem; border: 1px solid var(--sc-rule); border-radius: 3px; background: var(--sc-bg); }
.sc-flow__track { display: flex; align-items: stretch; gap: .45rem; min-width: 0; }
.sc-flow__node { display: grid; align-content: center; flex: 1 1 0; min-width: 0; padding: .8rem .65rem; border: 1px solid var(--sc-rule); border-radius: 3px; background: #fafafa; }
.sc-flow__node strong, .sc-flow__node small { overflow-wrap: anywhere; }
.sc-flow__node small { margin-top: .25rem; color: var(--sc-muted); line-height: 1.4; }
.sc-flow__edge { display: grid; align-content: center; justify-items: center; flex: 0 1 5.5rem; min-width: 2.7rem; color: var(--sc-muted); text-align: center; }
.sc-flow__edge span { color: var(--sc-ink); font-size: 1.2rem; }
.sc-flow__edge small { font-size: .72rem; line-height: 1.25; overflow-wrap: anywhere; }
.sc-flow__boundary { margin: .8rem 0 0; padding-top: .7rem; border-top: 1px solid var(--sc-rule); color: var(--sc-muted); font-size: .85rem; font-weight: 600; }
```

Extend the existing `@media (max-width: 760px)` block:

```css
.sc-story { gap: 2.35rem; }
.sc-story__section--grid { grid-template-columns: 1fr; }
.sc-story__media--grid { grid-template-columns: 1fr; }
.sc-flow__track { flex-direction: column; }
.sc-flow__edge { min-height: 3.25rem; transform: none; }
.sc-flow__edge span { transform: rotate(90deg); }
```

Do not set fixed image/video heights or `object-fit: cover`; source aspect ratios must remain intact.

- [ ] **Step 4: Run CSS and renderer regression tests**

Run:

```powershell
node --test --test-name-pattern="SMCNavi long-form CSS|Scholar CSS|Scholar case article|non-story cases" tests/portfolio.test.cjs
git diff --check
```

Expected: all selected tests pass; only `css/scholar.css` owns the new case styles.

---

### Task 4: Extend evidence traversal and MP4 validation without weakening existing clips

**Files:**
- Modify: `tests/portfolio.test.cjs:64-84,500-765,3782-3816`
- Modify: `scripts/validate-portfolio.cjs:60-65,280-296,424-535,598-715,843-903`

**Interfaces:**
- Consumes: `StoryMedia.poster`, `StoryMedia.videoPolicy`, and renderer helper `storySectionsHtml`.
- Produces: recursive `canonicalMediaEntries(candidate)` and policy-aware `approvedMp4Errors(filePath, videoPolicy)`.

- [ ] **Step 1: Upgrade the synthetic MP4 fixture**

Change `validMp4` to accept these exact options while keeping its old defaults:

```js
function validMp4({
  durationSeconds = 20,
  width = 1280,
  height = 720,
  sampleEntry = 'avc1',
  includeAudio = false,
  fastStart = true,
  extraMoovBoxes = [],
  mdatPayload = Buffer.from([0])
} = {})
```

Its video `trak` must contain `tkhd` width/height fixed-point fields, `mdia/hdlr` with `vide`, and `minf/stbl/stsd` with one sample entry named by `sampleEntry`. When `includeAudio` is true, append a second `trak` whose handler is `soun`. Return `[ftyp, moov, mdat]` when `fastStart` is true and `[ftyp, mdat, moov]` otherwise.

- [ ] **Step 2: Add failing validator tests for nested media and the long-video policy**

Add three tests:

```js
test('SMCNavi story media and nested posters join the evidence register and public visual inventory', () => {
  const candidate = clone(data);
  const project = candidate.projects[0];
  project.storySections = [storySectionFixture()];
  project.storySections[0].media.push({
    id: 'story-video-01', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/story-video-01.mp4',
    preload: 'metadata',
    poster: {
      id: 'story-video-poster-01', type: 'image', status: 'approved',
      publicPath: 'assets/projects/surgical-navigation/story-video-poster-01.png'
    },
    translations: {
      ko: { caption: '영상', alt: '영상 설명' },
      en: { caption: 'Video', alt: 'Video description' }
    }
  });
  const entries = validator.canonicalMediaEntries(candidate);
  assert.ok(entries.some(({ item }) => item.id === 'story-image-01'));
  assert.ok(entries.some(({ item }) => item.id === 'story-video-01'));
  assert.ok(entries.some(({ item }) => item.id === 'story-video-poster-01'));
  const files = validator.publicPortfolioVisualFiles(root, candidate).map((file) => file.relativePath.replace(/\\/g, '/'));
  assert.ok(files.includes('assets/projects/surgical-navigation/story-video-poster-01.png'));
});

test('SMCNavi video policy accepts full duration and rejects drift, audio, codec, dimensions, and non-fast-start', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'smcnavi-video-policy-'));
  const filePath = path.join(temporaryRoot, 'demo.mp4');
  const policy = {
    maxBytes: 100000000,
    targetDurationSeconds: 159.833333,
    toleranceSeconds: 0.2,
    width: 1280,
    height: 720,
    codec: 'h264',
    requireNoAudio: true,
    requireFastStart: true
  };
  try {
    fs.writeFileSync(filePath, validMp4({ durationSeconds: 159.833333 }));
    assert.deepEqual(validator.approvedMp4Errors(filePath, policy), []);
    const failures = [
      [validMp4({ durationSeconds: 159.5 }), /duration/i],
      [validMp4({ durationSeconds: 159.833333, includeAudio: true }), /audio/i],
      [validMp4({ durationSeconds: 159.833333, sampleEntry: 'hvc1' }), /H\.264|codec/i],
      [validMp4({ durationSeconds: 159.833333, width: 960, height: 720 }), /1280.*720|dimensions/i],
      [validMp4({ durationSeconds: 159.833333, fastStart: false }), /fast-start/i]
    ];
    for (const [bytes, expected] of failures) {
      fs.writeFileSync(filePath, bytes);
      assert.match(validator.approvedMp4Errors(filePath, policy).join('\n'), expected);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('legacy approved videos retain the 20 MB and 15-30 second defaults', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-video-policy-'));
  const filePath = path.join(temporaryRoot, 'demo.mp4');
  try {
    fs.writeFileSync(filePath, validMp4({ durationSeconds: 31 }));
    assert.match(validator.approvedMp4Errors(filePath).join('\n'), /15-30 seconds/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
```

- [ ] **Step 3: Run the validator tests and confirm failure**

Run:

```powershell
node --test --test-name-pattern="SMCNavi story media|SMCNavi video policy|legacy approved videos" tests/portfolio.test.cjs
```

Expected: failure because nested story media are not traversed and `approvedMp4Errors` is neither policy-aware nor exported.

- [ ] **Step 4: Make canonical media traversal recursive**

Extend `canonicalMediaEntries(candidate)` so it retains the existing lead/video/poster/reference/gallery entries, then appends each story item with slot `story <section-key> media <index>` and each nested poster with slot `story <section-key> media <index> poster`.

Use this single function in `publicPortfolioVisualFiles` instead of rebuilding a shallower list. Add `project.storySections` to `projectPublicText` so validator PII/path/name scans cover headings, lists, captions, alt text, node details, edge labels, and boundary text.

- [ ] **Step 5: Parse the MP4 track contract and apply per-item policies**

Replace `mp4HasVideoTrack` with `mp4TrackInfo(buffer, moovChildren)` returning:

```js
{
  handlerTypes: string[],
  video: null | { sampleEntry: string, width: number, height: number }
}
```

Read `tkhd` width and height from the final eight payload bytes as unsigned 16.16 fixed-point numbers. Read the first `stsd` sample-entry type after its version/flags and entry-count fields. Treat `avc1` and `avc3` as H.264.

Change the validator signature to:

```js
function approvedMp4Errors(filePath, videoPolicy) {
  var policy = videoPolicy || {
    maxBytes: maxVideoBytes,
    minDurationSeconds: 15,
    maxDurationSeconds: 30
  };
}
```

For the default policy, preserve the exact existing 20 MiB and 15–30 second error behavior. For `VideoPolicy`, enforce decimal `maxBytes`, `abs(actualDuration - targetDurationSeconds) <= toleranceSeconds`, expected dimensions, H.264 sample entry, no `soun` handler, and `moov.start < first mdat.start`. Preserve all existing structural, metadata-box, private-path, PII, and prohibited-partner checks.

Build the canonical media map before validating register rows in `evidenceRegistryErrors`; pass the matched canonical item's `videoPolicy` to `approvedLocalEvidenceErrors(entry, rootDir, item)`. If an approved registered video has no canonical declaration, use the legacy default while also reporting the existing undeclared-evidence error.

For each approved story video, render `render.storySectionsHtml(project, 'en', '', 1)` and require controls, the declared preload, exact source and poster, and absence of autoplay/loop. Keep the current lead/video-alias requirement and adapt its preload assertion to `render.mediaPreload(lead)`.

Export `canonicalMediaEntries` and `approvedMp4Errors`.

- [ ] **Step 6: Run focused and full validator tests**

Run:

```powershell
node --test --test-name-pattern="SMCNavi story media|SMCNavi video policy|legacy approved videos|approved MP4 evidence|evidence registry|public visual" tests/portfolio.test.cjs
node --test
git diff --check
```

Expected: all tests pass against the pre-feature canonical data; existing short clips retain their limits.

---

### Task 5: Replace the surgical-navigation canonical copy, media declarations, and evidence ledger

**Files:**
- Modify: `tests/portfolio.test.cjs` near the project inventory, lifecycle, forbidden-copy, and PDF-sequence contracts
- Modify: `js/portfolio-data.js:164-236`
- Modify: `assets/projects/EVIDENCE_REGISTER.md`
- Modify: `assets/projects/surgical-navigation/README.md`

**Interfaces:**
- Consumes: story schema and recursive evidence traversal from Tasks 2 and 4.
- Produces: the exact public SMCNavi narrative, ten numbered web figures, one canonical system-flow diagram, and six representative PDF figure IDs.

- [ ] **Step 1: Add exact canonical-content tests**

Add a test named `SMCNavi canonical case carries the approved title, workflows, ownership, team boundary, and non-claims` that asserts:

```js
const project = data.projects.find((item) => item.slug === 'surgical-navigation');
assert.equal(project.period, '2023.07 – present');
assert.equal(project.evidenceState, 'prototype');
assert.equal(project.lifecycleState, 'ongoing');
assert.equal(project.translations.ko.title, 'SMCNavi · HoloLens 수술내비게이션');
assert.equal(project.translations.en.title, 'SMCNavi · HoloLens Surgical Navigation');
assert.equal(project.translations.ko.roleLabel, '3D 의료영상·수술내비게이션 개발자');
assert.equal(project.translations.en.roleLabel, '3D Medical Imaging · Surgical Navigation Developer');
assert.deepEqual(project.storySections.map((section) => section.key), [
  'smcnavi-overview',
  'smcnavi-workflows',
  'system-architecture',
  'registration-calibration',
  'hololens-interface'
]);
assert.deepEqual(project.storySections[1].translations.ko.items, [
  '상악종양 제거술 내비게이션',
  '하악종양 제거술 내비게이션',
  '양악수술 내비게이션',
  '하악운동 트래킹',
  '골이식 위치설정',
  '광대·안와 골절 미러링'
]);
assert.deepEqual(project.storySections[1].translations.en.items, [
  'Maxillary tumour-removal navigation',
  'Mandibular tumour-removal navigation',
  'Bimaxillary-surgery navigation',
  'Mandibular-motion tracking',
  'Bone-graft placement',
  'Zygomatic-orbital fracture mirroring'
]);
assert.deepEqual(project.pdfSequence.middle, [
  'smcnavi-overview', 'smcnavi-workflows', 'registration-calibration', 'hololens-interface'
]);
assert.deepEqual(project.pdfSequence.diagram, { storySectionKey: 'system-architecture' });
assert.equal(project.pdfSequence.figureIds.length, 6);
assert.deepEqual(project.blocks, []);
assert.deepEqual(project.links, []);
assert.deepEqual(render.dataErrors(data), []);
assert.equal(project.translations.ko.limitation, '장시간 안정성, 성능 최적화, 배포 설정, 패키징은 제품화 수준으로 마무리되지 않았습니다. 이 사례는 생산 배포, 실제 수술 사용, 임상 효능·안전성·정확도를 주장하지 않습니다.');
assert.equal(project.translations.en.limitation, 'Long-duration robustness, performance optimisation, deployment setup, and packaging were not completed to productisation level. This case does not claim production deployment, use in real surgery, or clinical efficacy, safety, or accuracy.');

const publicCaseCopy = JSON.stringify(project);
assert.doesNotMatch(publicCaseCopy, /Azure Spatial Anchors|Photon Unity Networking|\bASA\b|\bPUN\b|super app|digitrack-inc|특허출원|patent application/i);
```

Add a second test that renders Korean and English and asserts each workflow label, both organisation names, the role label, `Research prototype`/`연구 프로토타입`, both video filenames, and ten consecutive figure labels appear in the correct locale. Assert that no `.sc-gallery` or repository link appears.

- [ ] **Step 2: Run the content tests and confirm failure**

Run:

```powershell
node --test --test-name-pattern="SMCNavi canonical case|SMCNavi bilingual long-form" tests/portfolio.test.cjs
```

Expected: failure on the old title, status, blocks, gallery, and missing story sections.

- [ ] **Step 3: Replace the canonical project record with the approved public positioning**

Use these exact common fields:

```js
slug: 'surgical-navigation',
tier: 'medical-core',
period: '2023.07 – present',
evidenceState: 'prototype',
lifecycleState: 'ongoing',
capabilityKeys: ['registration', 'medical-navigation', 'xr-engineering'],
route: 'projects/surgical-navigation/',
tech: ['HoloLens 2', 'Optical tracking', '3D Slicer', 'Unity', 'MRTK', 'OpenIGTLink', 'Holographic Remoting']
```

Use these exact Korean project translations:

| Field | Copy |
| --- | --- |
| `title` | SMCNavi · HoloLens 수술내비게이션 |
| `shortTitle` | SMCNavi · HoloLens |
| `eyebrow` | 의료 코어 · 연구 프로토타입 |
| `thesis` | 추적·정합·캘리브레이션을 SMCNavi에 통합하고, 그 결과를 HoloLens 공간 인터페이스까지 연결했습니다. |
| `summary` | DIGITRACK이 삼성서울병원과 연구 협력으로 개발한 맞춤형 3D Slicer 수술내비게이션 플랫폼과 별도 HoloLens 공간 인터페이스 확장입니다. |
| `problem` | 구강악안면 내비게이션은 의료영상, 환자와 기구 좌표, 수술별 도구, 공간 표시가 한 흐름으로 맞아야 하지만 기능이 분절되면 정합 상태와 데이터 흐름을 검토하기 어렵습니다. |
| `roleLabel` | 3D 의료영상·수술내비게이션 개발자 |
| `role` | 전체 소프트웨어 아키텍처를 설계하고 DICOM·3D 모델 로딩, MPR·3D 시각화, 광학 추적 SDK와 데이터 파이프라인, 영상·환자·마커·기구 좌표 변환, 환자 정합과 피드백, 마커·비표준·장기구 캘리브레이션, 6개 워크플로와 미러링, HoloLens–PC 통신·공간 표시·상호작용, 팬텀 통합 시험과 검증 도구의 주 구현을 맡았습니다. |
| `teamResult` | DIGITRACK과 삼성서울병원 연구팀은 임상 워크플로와 요구사항 맥락, 수용 검토 기준, 통합 시연을 공동으로 검토했습니다. |
| `evidence` | 두 전체 길이 영상과 승인된 화면·좌표계·기구·팬텀 파생본은 위치, 모델, 영상, 상호작용 데이터가 SMCNavi에서 HoloLens 경로까지 연결된 연구 프로토타입을 보여줍니다. |
| `limitation` | 장시간 안정성, 성능 최적화, 배포 설정, 패키징은 제품화 수준으로 마무리되지 않았습니다. 이 사례는 생산 배포, 실제 수술 사용, 임상 효능·안전성·정확도를 주장하지 않습니다. |
| `collaboration` | 의료진의 워크플로·수용 기준과 개발팀의 추적·영상·XR 통합 검토를 분리해 기록합니다. |
| `mediaAlt` | HoloLens 2를 착용한 사용자의 시점과 팬텀 위 홀로그램, 추적 기구, MPR 화면이 이어지는 디지털 트윈 시연 영상. |
| `mediaCaption` | HoloLens 2 디지털 트윈과 추적 기구·영상 표시를 연결한 전체 길이 연구 프로토타입 시연입니다. 비식별 연구 영상이며 임상 결과 근거가 아닙니다. |
| `status` | 프로토타입 · 진행 중 |

Use these exact English project translations:

| Field | Copy |
| --- | --- |
| `title` | SMCNavi · HoloLens Surgical Navigation |
| `shortTitle` | SMCNavi · HoloLens |
| `eyebrow` | Medical Core · Research Prototype |
| `thesis` | Integrated tracking, registration, and calibration in SMCNavi, then carried the result into a HoloLens spatial interface. |
| `summary` | A custom 3D Slicer surgical-navigation platform developed by DIGITRACK with Samsung Medical Center in a research collaboration, plus a separate HoloLens spatial-interface extension. |
| `problem` | Oral and maxillofacial navigation must align medical images, patient and instrument coordinates, procedure-specific tools, and spatial presentation in one flow; fragmented functions make registration state and data flow difficult to inspect. |
| `roleLabel` | 3D Medical Imaging · Surgical Navigation Developer |
| `role` | Designed the overall software architecture and served as the primary implementer for DICOM and 3D-model loading, MPR and 3D visualisation, the optical-tracker SDK and data pipeline, image/patient/marker/instrument transforms, patient registration and feedback, marker/non-standard/long-instrument calibration, six workflows and mirroring, HoloLens–PC communication and interaction, and phantom integration tests and verification tooling. |
| `teamResult` | The DIGITRACK and Samsung Medical Center research team jointly reviewed the clinical-workflow and requirements context, acceptance criteria, and integration demonstrations. |
| `evidence` | Two full-length videos and approved interface, coordinate-frame, instrument, and phantom derivatives show a working research prototype carrying position, model, image, and interaction data from SMCNavi through the HoloLens path. |
| `limitation` | Long-duration robustness, performance optimisation, deployment setup, and packaging were not completed to productisation level. This case does not claim production deployment, use in real surgery, or clinical efficacy, safety, or accuracy. |
| `collaboration` | Clinical workflow and acceptance criteria remain distinct from the development team's tracking, imaging, and XR integration review. |
| `mediaAlt` | Digital-twin demonstration moving between a HoloLens 2 viewpoint, a hologram over a phantom, a tracked instrument, and MPR displays. |
| `mediaCaption` | Full-length research-prototype demonstration connecting the HoloLens 2 digital twin with tracked instruments and image presentation. It uses de-identified research imagery and is not evidence of clinical outcome. |
| `status` | Prototype · Ongoing |

Use these exact Korean card/summary fields:

| Field | Copy |
| --- | --- |
| `cardProblem` | 의료영상·추적·정합·수술별 기능을 SMCNavi와 HoloLens 경로로 연결합니다. |
| `cardOwnedRole` | 전체 SW 아키텍처와 3D Slicer·추적·정합·캘리브레이션·HoloLens 통합을 주 구현했습니다. |
| `cardEvidence` | 두 전체 길이 영상과 승인된 UI·좌표계·기구·팬텀 파생본이 연구 프로토타입 근거입니다. |
| `problemSummary` | 분절된 영상·추적·정합·공간 표시를 하나의 검토 가능한 흐름으로 연결합니다. |
| `ownedRole` | SMCNavi와 HoloLens 확장의 전체 소프트웨어 아키텍처 및 주 구현을 맡았습니다. |
| `verifiedEvidence` | 전체 길이 SMCNavi·HoloLens 영상과 승인된 기술 파생본이 근거입니다. |
| `visualAlt` | SMCNavi와 HoloLens를 연결한 팬텀 기반 수술내비게이션 연구 프로토타입. |
| `visualCaption` | SMCNavi–HoloLens 전체 길이 연구 프로토타입 시연. |

Use these exact English card/summary fields:

| Field | Copy |
| --- | --- |
| `cardProblem` | Connect medical images, tracking, registration, and procedure workflows through the SMCNavi and HoloLens path. |
| `cardOwnedRole` | Primarily implemented the full software architecture across 3D Slicer, tracking, registration, calibration, and HoloLens integration. |
| `cardEvidence` | Two full-length videos and approved interface, coordinate, instrument, and phantom derivatives evidence the research prototype. |
| `problemSummary` | Connect fragmented imaging, tracking, registration, and spatial presentation in one inspectable flow. |
| `ownedRole` | Owned the overall software architecture and primary implementation of SMCNavi and the HoloLens extension. |
| `verifiedEvidence` | Full-length SMCNavi and HoloLens videos plus approved technical derivatives provide the evidence. |
| `visualAlt` | Phantom-based surgical-navigation research prototype connecting SMCNavi and HoloLens. |
| `visualCaption` | Full-length SMCNavi–HoloLens research-prototype demonstration. |

- [ ] **Step 4: Declare lead media and the five story sections**

Use this lead policy exactly:

```js
media: {
  lead: {
    id: 'surgical-navigation-hololens-demo-01',
    type: 'video',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/surgical-navigation-hololens-demo-01.mp4',
    preload: 'metadata',
    videoPolicy: {
      maxBytes: 100000000,
      targetDurationSeconds: 159.833333,
      toleranceSeconds: 0.2,
      width: 1280,
      height: 720,
      codec: 'h264',
      requireNoAudio: true,
      requireFastStart: true
    }
  },
  video: {
    id: 'surgical-navigation-hololens-demo-01',
    type: 'video',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/surgical-navigation-hololens-demo-01.mp4',
    preload: 'metadata',
    videoPolicy: {
      maxBytes: 100000000,
      targetDurationSeconds: 159.833333,
      toleranceSeconds: 0.2,
      width: 1280,
      height: 720,
      codec: 'h264',
      requireNoAudio: true,
      requireFastStart: true
    }
  },
  poster: {
    id: 'surgical-navigation-hololens-poster-01',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/surgical-navigation-hololens-poster-01.png'
  },
  gallery: []
}
```

Declare story sections in this exact order, with these exact translations:

| Key / layout | Korean heading and copy | English heading and copy |
| --- | --- | --- |
| `smcnavi-overview` / `wide` | **SMCNavi 플랫폼 개요** — SMCNavi는 DICOM·3D 모델 로딩, MPR·3D 시각화, 광학 추적, 환자 정합, 기구 캘리브레이션, 수술별 UI를 하나의 맞춤형 3D Slicer 데스크톱 플랫폼에 통합합니다. HoloLens 기능은 SMCNavi와 연결되는 별도 PC 확장으로 구현했습니다. | **SMCNavi platform overview** — SMCNavi integrates DICOM and 3D-model loading, MPR and 3D visualisation, optical tracking, patient registration, instrument calibration, and procedure-specific UI in one custom 3D Slicer desktop platform. The HoloLens work is a separate PC-side extension connected to SMCNavi. |
| `smcnavi-workflows` / `wide` | **6개 구강악안면 워크플로** — 아래 기능은 소프트웨어로 구현·시연한 워크플로이며 임상 효능을 뜻하지 않습니다. Items: `상악종양 제거술 내비게이션`, `하악종양 제거술 내비게이션`, `양악수술 내비게이션`, `하악운동 트래킹`, `골이식 위치설정`, `광대·안와 골절 미러링`. | **Six oral and maxillofacial workflows** — The following are implemented and demonstrated software workflows; they are not evidence of clinical efficacy. Items: `Maxillary tumour-removal navigation`, `Mandibular tumour-removal navigation`, `Bimaxillary-surgery navigation`, `Mandibular-motion tracking`, `Bone-graft placement`, `Zygomatic-orbital fracture mirroring`. |
| `system-architecture` / `wide` | **SMCNavi–HoloLens 시스템 구조** — 광학 추적 관측은 SMCNavi의 변환·정합·캘리브레이션과 수술 워크플로로 들어갑니다. 승인된 변환·영상·모델 데이터는 OpenIGTLink로 PC 확장에 연결되고, 렌더링과 상호작용은 Holographic Remoting을 통해 HoloLens 2와 오갑니다. | **SMCNavi–HoloLens system architecture** — Optical-tracker observations enter SMCNavi's transforms, registration, calibration, and procedure workflows. Approved transform, image, and model data connect to the PC extension through OpenIGTLink; rendering and interaction travel between the extension and HoloLens 2 through Holographic Remoting. |
| `registration-calibration` / `grid` | **추적·정합·캘리브레이션** — 환자·기구와 영상 모델 사이의 변환 경로를 명시적으로 구성하고 각 단계의 입력과 피드백을 검토할 수 있게 했습니다. Items: `광학 추적 SDK 연결과 실시간 도구·마커 데이터 파이프라인`, `영상·환자·마커·기구 좌표계 사이의 변환 체인`, `환자 정합과 정합 상태 피드백`, `환자·기구 마커 캘리브레이션`, `비표준 기구와 장기구 캘리브레이션`. | **Tracking, registration, and calibration** — Built explicit transform paths between the patient, instruments, and image models so the inputs and feedback at each stage could be inspected. Items: `Optical-tracker SDK integration and the live tool/marker data pipeline`, `Transform chain across image, patient, marker, and instrument frames`, `Patient registration and registration-state feedback`, `Patient and instrument marker calibration`, `Non-standard and long-instrument calibration`. |
| `hololens-interface` / `grid` | **HoloLens 공간 인터페이스** — SMCNavi가 소유한 정합·워크플로 상태를 별도 PC 확장에서 렌더링하고 HoloLens 2의 공간 표시와 상호작용으로 연결했습니다. Items: `OpenIGTLink를 통한 변환과 승인된 영상·모델 데이터 교환`, `Unity·MRTK 기반 PC 렌더링과 공간 배치`, `Holographic Remoting을 통한 HoloLens 2 표시`, `HoloLens 상호작용 입력의 PC 확장 반환`, `광학 추적·SMCNavi·HoloLens 팬텀 통합 시험`. | **HoloLens spatial interface** — Rendered SMCNavi-owned registration and workflow state in a separate PC extension and connected it to HoloLens 2 spatial presentation and interaction. Items: `Transform and approved image/model exchange through OpenIGTLink`, `PC rendering and spatial placement with Unity and MRTK`, `HoloLens 2 presentation through Holographic Remoting`, `Return of HoloLens interaction input to the PC extension`, `Phantom integration tests across optical tracking, SMCNavi, and HoloLens`. |

The overview has no media. Use this complete supporting-video record as the first `smcnavi-workflows` media item:

```js
{
  id: 'surgical-navigation-smcnavi-features-01',
  type: 'video',
  status: 'approved',
  publicPath: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-features-01.mp4',
  preload: 'metadata',
  videoPolicy: {
    maxBytes: 100000000,
    targetDurationSeconds: 90.266667,
    toleranceSeconds: 0.2,
    width: 960,
    height: 720,
    codec: 'h264',
    requireNoAudio: true,
    requireFastStart: true
  },
  poster: {
    id: 'surgical-navigation-smcnavi-poster-01',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-poster-01.png'
  },
  translations: {
    ko: {
      caption: 'SMCNavi에서 6개 구강악안면 워크플로가 전환·시연되는 전체 기능 소개 영상입니다. 비식별 연구 영상이며 임상 결과 근거가 아닙니다.',
      alt: 'SMCNavi 화면에서 종양 제거, 양악수술, 하악운동, 골이식, 골절 미러링 워크플로가 차례로 시연되는 영상.'
    },
    en: {
      caption: 'Full feature video moving through six oral and maxillofacial workflows in SMCNavi. It uses de-identified research imagery and is not evidence of clinical outcome.',
      alt: 'Video moving through SMCNavi workflows for tumour removal, bimaxillary surgery, mandibular motion, bone-graft placement, and fracture mirroring.'
    }
  }
}
```

Use these exact image records and section order. Each `publicPath` is `assets/projects/surgical-navigation/<id>.png`.

| Section / ID | Korean caption / alt | English caption / alt |
| --- | --- | --- |
| `smcnavi-workflows` / `surgical-navigation-smcnavi-ui-01` | SMCNavi 통합 UI와 HoloLens–PC 연결 화면. 비식별 연구 영상 파생본이며 임상 결과 근거가 아닙니다. / 수술 유형 선택 UI, 팬텀에서 추적 기구를 사용하는 장면, HoloLens와 모니터 연결 화면을 묶은 그림. | Integrated SMCNavi UI and HoloLens–PC connection view. This derivative uses de-identified research imagery and is not evidence of clinical outcome. / Composite showing the procedure-selection UI, tracked instrument use on a phantom, HoloLens, and a connected monitor. |
| `smcnavi-workflows` / `surgical-navigation-smcnavi-workflows-01` | 6개 구강악안면 소프트웨어 워크플로. 비식별 연구 영상 파생본이며 임상 효능을 뜻하지 않습니다. / 상악·하악 종양 제거, 양악수술, 하악운동, 골이식 위치설정, 광대·안와 골절 미러링 화면을 2×3으로 배치한 그림. | Six oral and maxillofacial software workflows. This derivative uses de-identified research imagery and does not establish clinical efficacy. / Two-by-three composite of maxillary and mandibular tumour removal, bimaxillary surgery, mandibular motion, bone-graft placement, and zygomatic-orbital fracture mirroring. |
| `registration-calibration` / `surgical-navigation-gallery-02` | 좌표계 관계 — 광학 추적 장치 기준의 환자 마커·프로브 마커 변환. / 광학 추적 장치 기준으로 환자 마커와 프로브 마커 좌표 변환을 설명하는 개념도. | Coordinate frames: patient-marker and probe-marker transforms relative to the optical tracker. / Concept diagram of patient-marker and probe-marker transforms relative to the optical tracker. |
| `registration-calibration` / `surgical-navigation-gallery-03` | 비표준·장기구 캘리브레이션에 사용한 패시브 마커 어댑터 장착 기구. / 반사 마커 네 개가 달린 어댑터를 장착한 길이가 긴 수술 기구 사진. | Instrument with a passive-marker adapter used for non-standard and long-instrument calibration. / Long surgical instrument fitted with an adapter carrying four reflective markers. |
| `registration-calibration` / `surgical-navigation-bench-01` | 광학 추적 장치, SMCNavi, 두개골 팬텀을 연결한 공개 안전 벤치 프레임. / 광학 추적 장치, 모니터, 두개골 팬텀, 추적 기구가 함께 보이는 벤치 시연 프레임. | Public-safe bench frame connecting the optical tracker, SMCNavi, and a skull phantom. / Bench demonstration frame showing an optical tracker, monitor, skull phantom, and tracked instrument. |
| `hololens-interface` / `surgical-navigation-gallery-05` | HoloLens 공간 표시와 손·시선 상호작용 토글. / HoloLens에서 두개골 홀로그램과 손 추적·시선 추적 토글 패널을 함께 보여주는 화면. | HoloLens spatial presentation with hand- and eye-interaction toggles. / HoloLens view showing a skull hologram with hand-tracking and eye-tracking toggle controls. |
| `hololens-interface` / `surgical-navigation-gallery-06` | HoloLens, 광학 추적, 두개골 팬텀을 함께 연결한 통합 시연. / HoloLens를 착용한 사용자가 광학 추적 장치 앞에서 팬텀에 기구를 맞추는 장면. | Integration demonstration connecting HoloLens, optical tracking, and a skull phantom. / User wearing HoloLens aligning an instrument on a phantom in front of the optical tracker. |

- [ ] **Step 5: Add the one canonical bilingual system-flow diagram**

Use six nodes in this order:

| Key | Korean label / detail | English label / detail |
| --- | --- | --- |
| `tracker` | 광학 추적 장치 / 도구·마커 관측 | Optical tracker / Tool and marker observations |
| `smcnavi` | SMCNavi / 3D Slicer · 영상·모델 · 변환·정합·캘리브레이션 · 6개 워크플로 | SMCNavi / 3D Slicer · images and models · transforms, registration, calibration · six workflows |
| `openigtlink` | OpenIGTLink / 변환 및 승인된 영상·모델 데이터 | OpenIGTLink / Transforms and approved image/model data |
| `pc-extension` | HoloLens PC 확장 / Unity · MRTK · 렌더링 | HoloLens PC extension / Unity · MRTK · rendering |
| `remoting` | Holographic Remoting / PC 렌더 스트림 · 입력 반환 | Holographic Remoting / PC render stream · input return |
| `hololens` | HoloLens 2 / 공간 표시 · 상호작용 | HoloLens 2 / Spatial presentation · interaction |

Use five edges in this order:

| From → To | Direction | Korean / English label |
| --- | --- | --- |
| `tracker` → `smcnavi` | `forward` | 도구·마커 관측 / Tool and marker observations |
| `smcnavi` → `openigtlink` | `bidirectional` | 변환·영상·모델 / Transforms, images, models |
| `openigtlink` → `pc-extension` | `bidirectional` | 연결 데이터 / Connected data |
| `pc-extension` → `remoting` | `bidirectional` | 렌더링·입력 / Rendering and input |
| `remoting` → `hololens` | `bidirectional` | 홀로그램·상호작용 / Holograms and interaction |

Use `추적 관측에서 HoloLens 상호작용까지` / `From tracking observations to HoloLens interaction` as diagram titles. Use `설명용 시스템 관계 다이어그램이며 사진·실험·임상 결과 근거가 아닙니다.` / `Explanatory system-relationship diagram; it is not photographic, experimental, or clinical-outcome evidence.` as captions. Use `SMCNavi–HoloLens 경로 · 연구 프로토타입` / `SMCNavi–HoloLens path · Research prototype` as boundary labels.

- [ ] **Step 6: Replace the PDF sequence and structural blocks**

Use:

```js
pdfSequence: {
  middle: ['smcnavi-overview', 'smcnavi-workflows', 'registration-calibration', 'hololens-interface'],
  evidenceId: 'surgical-navigation-hololens-demo-01',
  diagram: { storySectionKey: 'system-architecture' },
  figureIds: [
    'surgical-navigation-smcnavi-features-01',
    'surgical-navigation-smcnavi-ui-01',
    'surgical-navigation-smcnavi-workflows-01',
    'surgical-navigation-gallery-02',
    'surgical-navigation-gallery-03',
    'surgical-navigation-gallery-05'
  ]
},
blocks: []
```

Keep `links: []`; do not add a repository link.

- [ ] **Step 7: Update the evidence register and public boundary README**

Keep the existing rows for `surgical-navigation-gallery-02`, `-03`, `-05`, and `-06` as `approved-public`. Change these old rows to `excluded` with source `-`:

```text
surgical-navigation-clip-01
surgical-navigation-poster-01
surgical-navigation-gallery-01
surgical-navigation-gallery-04
```

Add approved rows for:

```text
surgical-navigation-hololens-demo-01
surgical-navigation-hololens-poster-01
surgical-navigation-smcnavi-features-01
surgical-navigation-smcnavi-poster-01
surgical-navigation-smcnavi-ui-01
surgical-navigation-smcnavi-workflows-01
surgical-navigation-bench-01
```

Use these exact provenance notes; each source is the lower-case project-relative path declared in data:

| Evidence ID | Provenance / usage |
| --- | --- |
| `surgical-navigation-hololens-demo-01` | Approved full-length silent web derivative; caption in portfolio data. |
| `surgical-navigation-hololens-poster-01` | Approved poster frame from the public HoloLens derivative. |
| `surgical-navigation-smcnavi-features-01` | Approved full-length silent SMCNavi feature derivative; caption in portfolio data. |
| `surgical-navigation-smcnavi-poster-01` | Approved poster frame from the public SMCNavi feature derivative. |
| `surgical-navigation-smcnavi-ui-01` | Approved lower-region presentation derivative showing the integrated UI and HoloLens–PC view. |
| `surgical-navigation-smcnavi-workflows-01` | Approved lower-region presentation derivative showing six software workflows with the corrected public label. |
| `surgical-navigation-bench-01` | Approved public-safe bench frame extracted from the full-length HoloLens derivative. |

Use `Superseded by the approved full-length public derivative.` for the old clip and poster, `Obsolete architecture visual; not part of the implemented public system.` for gallery 01, and `Superseded by an approved public-safe video frame.` for gallery 04. These notes deliberately avoid the retired technology and internal product names.

Replace the README with:

```markdown
# Surgical Navigation Public Evidence

This directory contains only approved, de-identified, metadata-stripped public derivatives registered in `../EVIDENCE_REGISTER.md`.

The two MP4 files preserve the approved source durations and are published without audio. PNG files are approved posters, presentation-region derivatives, technical figures, or frames from an approved public video. They support a research-prototype account and do not establish clinical efficacy, production deployment, or use in real surgery.

Original recordings, reports, presentations, and intermediate exports remain outside this repository.
```

- [ ] **Step 8: Run the data tests and observe the intentional missing-asset boundary**

Run:

```powershell
node --test --test-name-pattern="SMCNavi canonical case|SMCNavi bilingual long-form|SMCNavi story" tests/portfolio.test.cjs
node -e "const d=require('./js/portfolio-data.js'); const r=require('./js/portfolio-render.js'); const e=r.dataErrors(d); if(e.length){console.error(e.join('\n')); process.exit(1)}"
node -e "const d=require('./js/portfolio-data.js'); const v=require('./scripts/validate-portfolio.cjs'); const e=v.evidenceRegistryErrors(d,process.cwd()); console.log(e.join('\n')); if(!e.some(x=>/missing approved local asset/i.test(x))) process.exit(1)"
```

Expected: data and renderer tests pass. The isolated evidence check fails only because the newly declared binaries do not exist yet; it must not report schema, state, ID, path, poster, preload, or register mismatches.

---

### Task 6: Generate and verify the approved public media derivatives

**Files:**
- Create: `assets/projects/surgical-navigation/surgical-navigation-hololens-demo-01.mp4`
- Create: `assets/projects/surgical-navigation/surgical-navigation-hololens-poster-01.png`
- Create: `assets/projects/surgical-navigation/surgical-navigation-smcnavi-features-01.mp4`
- Create: `assets/projects/surgical-navigation/surgical-navigation-smcnavi-poster-01.png`
- Create: `assets/projects/surgical-navigation/surgical-navigation-smcnavi-ui-01.png`
- Create: `assets/projects/surgical-navigation/surgical-navigation-smcnavi-workflows-01.png`
- Create: `assets/projects/surgical-navigation/surgical-navigation-bench-01.png`
- Delete: `assets/projects/surgical-navigation/surgical-navigation-clip-01.mp4`
- Delete: `assets/projects/surgical-navigation/surgical-navigation-poster-01.png`
- Delete: `assets/projects/surgical-navigation/surgical-navigation-gallery-01.png`
- Delete: `assets/projects/surgical-navigation/surgical-navigation-gallery-04.png`

**Interfaces:**
- Consumes: process-only source variables from Task 1 and exact video policies/data paths from Task 5.
- Produces: seven new approved public files with no intermediates in Git; existing gallery 02, 03, 05, and 06 remain untouched.

- [ ] **Step 1: Verify source properties before conversion**

Run:

```powershell
$mainSource = [Environment]::GetEnvironmentVariable('SMCNAVI_MAIN_VIDEO_SOURCE', 'Process')
$featureSource = [Environment]::GetEnvironmentVariable('SMCNAVI_FEATURE_VIDEO_SOURCE', 'Process')
$slideDeck = [Environment]::GetEnvironmentVariable('SMCNAVI_SLIDE_DECK_SOURCE', 'Process')
$mainProbe = ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,pix_fmt -of json $mainSource | ConvertFrom-Json
$featureProbe = ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,pix_fmt -of json $featureSource | ConvertFrom-Json
if ([math]::Abs([double]$mainProbe.format.duration - 159.833333) -gt 0.01) { throw 'Unexpected HoloLens source duration.' }
if ([math]::Abs([double]$featureProbe.format.duration - 90.266667) -gt 0.01) { throw 'Unexpected SMCNavi source duration.' }
if (($mainProbe.streams | Where-Object codec_type -eq 'video').width -ne 1920 -or ($mainProbe.streams | Where-Object codec_type -eq 'video').height -ne 1080) { throw 'Unexpected HoloLens source dimensions.' }
if (($featureProbe.streams | Where-Object codec_type -eq 'video').width -ne 1440 -or ($featureProbe.streams | Where-Object codec_type -eq 'video').height -ne 1080) { throw 'Unexpected SMCNavi source dimensions.' }
if (-not (Test-Path -LiteralPath $slideDeck -PathType Leaf)) { throw 'Approved slide deck is missing.' }
```

Expected: source durations and dimensions match the approved inputs.

- [ ] **Step 2: Encode the two full-length silent web videos**

Run:

```powershell
$assetDir = (Resolve-Path -LiteralPath assets\projects\surgical-navigation).Path
$mainOutput = Join-Path $assetDir 'surgical-navigation-hololens-demo-01.mp4'
$featureOutput = Join-Path $assetDir 'surgical-navigation-smcnavi-features-01.mp4'

ffmpeg -hide_banner -loglevel warning -y -i $mainSource `
  -map 0:v:0 -an -sn -dn -map_metadata -1 -map_chapters -1 `
  -vf "scale=1280:720:flags=lanczos,setsar=1" `
  -c:v libx264 -preset slow -crf 23 -maxrate 4500k -bufsize 9000k -pix_fmt yuv420p `
  -movflags +faststart $mainOutput
if ($LASTEXITCODE -ne 0) { throw 'HoloLens video encoding failed.' }

ffmpeg -hide_banner -loglevel warning -y -i $featureSource `
  -map 0:v:0 -an -sn -dn -map_metadata -1 -map_chapters -1 `
  -vf "scale=960:720:flags=lanczos,setsar=1" `
  -c:v libx264 -preset slow -crf 23 -maxrate 4500k -bufsize 9000k -pix_fmt yuv420p `
  -movflags +faststart $featureOutput
if ($LASTEXITCODE -ne 0) { throw 'SMCNavi feature video encoding failed.' }
```

Expected: both commands retain the complete input timeline and create files below the decimal 100 MB policy.

- [ ] **Step 3: Extract the two approved posters and the safe bench frame**

Run:

```powershell
ffmpeg -hide_banner -loglevel error -y -ss 20 -i $mainOutput -frames:v 1 -map_metadata -1 `
  (Join-Path $assetDir 'surgical-navigation-hololens-poster-01.png')
if ($LASTEXITCODE -ne 0) { throw 'HoloLens poster extraction failed.' }

ffmpeg -hide_banner -loglevel error -y -ss 15 -i $featureOutput -frames:v 1 -map_metadata -1 `
  (Join-Path $assetDir 'surgical-navigation-smcnavi-poster-01.png')
if ($LASTEXITCODE -ne 0) { throw 'SMCNavi poster extraction failed.' }

ffmpeg -hide_banner -loglevel error -y -ss 40 -i $mainOutput -frames:v 1 -map_metadata -1 `
  (Join-Path $assetDir 'surgical-navigation-bench-01.png')
if ($LASTEXITCODE -ne 0) { throw 'Bench-frame extraction failed.' }
```

Expected: the main poster foregrounds the HoloLens digital-twin view; the feature poster shows a SMCNavi workflow; the bench frame contains no unapproved internal product name.

- [ ] **Step 4: Export only slide 7 to a temporary 1920×1080 PNG**

Run:

```powershell
$slideTempDir = Join-Path $env:TEMP ('smcnavi-slide-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $slideTempDir | Out-Null
$slidePng = Join-Path $slideTempDir 'slide-07.png'
$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $presentation = $powerPoint.Presentations.Open($slideDeck, $true, $true, $false)
  $presentation.Slides.Item(7).Export($slidePng, 'PNG', 1920, 1080)
} finally {
  if ($presentation) { $presentation.Close() }
  if ($powerPoint) { $powerPoint.Quit() }
  if ($presentation) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
  if ($powerPoint) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
}
if (-not (Test-Path -LiteralPath $slidePng -PathType Leaf)) { throw 'Slide 7 export failed.' }
```

Expected: only a temporary full-slide render is created; the source deck is opened read-only and remains unchanged.

- [ ] **Step 5: Crop the two approved lower regions and correct the public workflow label**

Run:

```powershell
ffmpeg -hide_banner -loglevel error -y -i $slidePng `
  -vf "crop=836:508:18:540" -frames:v 1 -map_metadata -1 `
  (Join-Path $assetDir 'surgical-navigation-smcnavi-ui-01.png')
if ($LASTEXITCODE -ne 0) { throw 'SMCNavi UI crop failed.' }

ffmpeg -hide_banner -loglevel error -y -i $slidePng `
  -vf "crop=1040:470:862:540,drawbox=x=724:y=251:w=306:h=58:color=0xFA777B:t=fill,drawtext=fontfile='C\:/Windows/Fonts/malgunbd.ttf':text='광대·안와 골절 미러링':x=739:y=267:fontsize=20:fontcolor=white" `
  -frames:v 1 -map_metadata -1 `
  (Join-Path $assetDir 'surgical-navigation-smcnavi-workflows-01.png')
if ($LASTEXITCODE -ne 0) { throw 'SMCNavi workflow crop failed.' }
```

Expected: the first crop contains the integrated SMCNavi UI and HoloLens–PC view; the second contains only the six-workflow composite and uses `광대·안와 골절 미러링`. Slide header, portrait, individual name, patent note, planned-clinical-use text, and unrelated branding are outside both crops.

- [ ] **Step 6: Visually inspect all seven new derivatives before retiring old files**

Use `view_image` for the five PNGs and contact-sheet frames from both MP4s. Check legibility, no portrait/header leakage, no internal predecessor name, no unintended crop, and correct fracture label. If any check fails, regenerate from the same approved sources and repeat this step before continuing.

- [ ] **Step 7: Verify the new evidence set before deleting superseded binaries**

Run:

```powershell
node -e "const d=require('./js/portfolio-data.js'); const v=require('./scripts/validate-portfolio.cjs'); const e=v.evidenceRegistryErrors(d,process.cwd()); if(e.length){console.error(e.join('\n'));process.exit(1)}"
```

Expected: zero evidence-registry errors, including size, duration, fast-start, codec, dimensions, audio, metadata, poster, source path, and ID checks.

- [ ] **Step 8: Remove only the four explicitly retired files**

Resolve and verify each target remains under the exact project directory, then run:

```powershell
$retired = @(
  'surgical-navigation-clip-01.mp4',
  'surgical-navigation-poster-01.png',
  'surgical-navigation-gallery-01.png',
  'surgical-navigation-gallery-04.png'
)
foreach ($name in $retired) {
  $target = Join-Path $assetDir $name
  $relative = [IO.Path]::GetRelativePath($assetDir, $target)
  if ($relative.StartsWith('..') -or [IO.Path]::IsPathRooted($relative)) {
    throw "Refusing to remove out-of-scope path: $target"
  }
  if (Test-Path -LiteralPath $target -PathType Leaf) {
    Remove-Item -LiteralPath $target
  }
}
```

Expected: retained gallery 02, 03, 05, and 06 still exist; no other asset is removed. These removals are recoverable from Git until a later explicitly authorized commit.

- [ ] **Step 9: Run focused media verification**

Run:

```powershell
node --test --test-name-pattern="SMCNavi|approved MP4|evidence registry|public visual" tests/portfolio.test.cjs
node -e "const d=require('./js/portfolio-data.js'); const v=require('./scripts/validate-portfolio.cjs'); const e=v.evidenceRegistryErrors(d,process.cwd()); if(e.length){console.error(e.join('\n'));process.exit(1)}"
git diff --check
```

Expected: all selected tests and evidence checks pass. The full portfolio validator may report stale PDFs until Task 7.

---

### Task 7: Teach the PDF pipeline to consume story sections and the canonical flow diagram

**Files:**
- Modify: `tests/portfolio.test.cjs:1751-1938,2004-2010`
- Modify: `scripts/validate-portfolio.cjs:24`
- Modify: `scripts/generate-portfolio-pdfs.py:39,311-430,821-918,928-1108,1130-1229,1427-1485`
- Verify without expected edit: `scripts/export-portfolio-data.cjs`
- Verify without expected edit: `scripts/portfolio-pdf-source.cjs`
- Regenerate: `output/pdf/*.pdf`
- Regenerate: `assets/pdfs/*.pdf`
- Regenerate: `output/pdf/manifest.json`

**Interfaces:**
- Consumes: story sections, story-backed `pdfSequence.diagram`, six `figureIds`, recursive public evidence, and the existing schema-version-1 exporter.
- Produces: backward-compatible generator `3.1`, two six-page SMCNavi PDFs, unchanged public content for the other 14 project PDFs, coherent 32-artifact manifest.

- [ ] **Step 1: Before this task, invoke and read the `pdf:pdf` skill**

This task creates and visually verifies PDFs, so the executor must announce the PDF skill, read its full `SKILL.md`, and follow its render-and-inspect workflow. Keep its review outputs under the ignored `.superpowers/` directory.

- [ ] **Step 2: Add failing schema and generated-content tests**

Replace the surgical branch of the existing diagram-contract test so it resolves `project.pdfSequence.diagram.storySectionKey` to the `system-architecture` story section and expects `kind === 'system-flow'`, six nodes, five ordered edges, and one prototype boundary label. Keep the exact existing expectations for the other seven legacy diagrams.

Add a test named `SMCNavi PDF source preserves story sections, representative figures, and one canonical diagram`:

```js
const payload = require('../scripts/export-portfolio-data.cjs').exportData();
const project = payload.projects.find((item) => item.slug === 'surgical-navigation');
assert.equal(payload.schemaVersion, 1);
assert.equal(project.storySections.length, 5);
assert.deepEqual(project.pdfSequence.diagram, { storySectionKey: 'system-architecture' });
assert.equal(project.pdfSequence.figureIds.length, 6);
assert.equal(project.storySections.find((item) => item.key === 'system-architecture').diagram.kind, 'system-flow');
```

Extend the Python integration audit to extract both surgical PDFs and assert:

```js
for (const [locale, required] of [
  ['ko', ['SMCNavi · HoloLens 수술내비게이션', '광대·안와 골절 미러링', '3D 의료영상·수술내비게이션 개발자', '연구 프로토타입', '주장하지 않습니다']],
  ['en', ['SMCNavi · HoloLens Surgical Navigation', 'Zygomatic-orbital fracture mirroring', '3D Medical Imaging · Surgical Navigation Developer', 'Research prototype', 'This case does not claim']]
]) {
  const text = extracted[`surgical-navigation-${locale}.pdf`];
  for (const value of required) assert.ok(text.includes(value), `${locale}: missing ${value}`);
  assert.doesNotMatch(text, /Azure Spatial Anchors|Photon Unity Networking|\bASA\b|\bPUN\b|digitrack-inc|특허출원|patent application/i);
}
assert.equal(extracted.pages['surgical-navigation-ko.pdf'], 6);
assert.equal(extracted.pages['surgical-navigation-en.pdf'], 6);
```

- [ ] **Step 3: Run the PDF tests and confirm failure**

Run:

```powershell
node --test --test-name-pattern="SMCNavi PDF source|diagram contracts|integrated review renders" tests/portfolio.test.cjs
```

Expected: failure because the Python schema only accepts blocks and legacy four-node diagrams.

- [ ] **Step 4: Extend Python schema validation while preserving legacy projects**

Set `GENERATOR_VERSION = "3.1"` in Python and `pdfGeneratorVersion = '3.1'` in the Node validator. Change `EXPECTED_DIAGRAM_KIND['surgical-navigation']` from `coordinate-chain` to `system-flow`; leave the other seven mappings unchanged. Keep the top-level export `schemaVersion == 1`.

In `validate_export_schema`:

- Validate optional `storySections` using the canonical interface and the same ordering, translation, media, poster, video-policy, diagram-node, and diagram-edge rules as JavaScript.
- Permit empty `blocks` only when non-empty `storySections` exist; legacy projects still require at least four blocks.
- Resolve `middle` against story keys for a story project and block keys otherwise.
- Accept exactly `{middle, evidenceId, diagram, figureIds}` for story projects and the existing three keys for legacy projects.
- Require the story diagram reference to resolve to a `system-flow` diagram; validate the other seven legacy kinds unchanged.
- Require the six surgical `figureIds` to be unique, canonical, approved media IDs. A video ID is valid only when its approved poster is also canonical and registered.

- [ ] **Step 5: Add story/PDF resolver helpers and representative-media selection**

Implement the four Python helpers named in the interface section.

`canonical_project_media(project)` indexes lead, video, poster, references, gallery, story media, and nested story posters by ID. For a video item, `selected_media_image` returns the legacy top-level poster when it is the lead or the item's nested poster when it is story media.

`project_figures` keeps the existing path for projects without `figureIds`. For SMCNavi, it returns the lead poster first and then the six `figureIds` in declared order, using the selected media item's bilingual caption.

`resolve_sequence_sections` returns four localized story sections for SMCNavi and the existing four localized blocks for legacy projects. A story section body prints as a paragraph and `items` print as bullets; if both exist, print the body then bullets.

`resolve_sequence_diagram` returns the referenced story diagram or the legacy inline diagram object.

- [ ] **Step 6: Draw the six-node canonical flow without changing legacy diagram bytes**

Leave `TechnicalDocument.diagram()` unchanged for the seven legacy kinds. Add:

```py
def system_flow_diagram(self, diagram: dict[str, Any], locale: str, y: float) -> float:
```

The method uses the canonical node and edge arrays, draws six full-width stacked nodes with translated label/detail, places `→` or `⇄` plus the translated edge label between adjacent nodes, and ends with the translated `boundaryLabel`. Call `doc.ensure(360)` before drawing. The method returns the bottom y coordinate, matching the existing diagram contract.

In `generate_project_pdf`:

- use `resolve_sequence_sections` instead of iterating every block for story projects;
- print `roleLabel` in bold immediately before `role` when present;
- draw the referenced `system-flow` with `system_flow_diagram` and all legacy diagrams with the unchanged `diagram` method;
- retain standard evidence, team result, limitation, collaboration, technology, link, contact, metadata, and atomic-publication behavior.

- [ ] **Step 7: Run schema and temporary-generation tests**

Run:

```powershell
node --test --test-name-pattern="SMCNavi PDF source|diagram contracts|integrated review renders|approved poster instead" tests/portfolio.test.cjs
```

Expected: all selected tests pass, including the existing video-lead poster regression and atomic-failure tests.

- [ ] **Step 8: Export canonical JSON and regenerate PDFs atomically**

Run:

```powershell
$pdfInput = Join-Path $env:TEMP 'smcnavi-portfolio-pdf-input-20260822.json'
$pdfReview = Join-Path (Resolve-Path -LiteralPath .superpowers).Path 'reviews\smcnavi-pdf'
$pdfPython = if ($env:PORTFOLIO_PDF_PYTHON) {
  $env:PORTFOLIO_PDF_PYTHON
} else {
  (Resolve-Path -LiteralPath '.superpowers\sdd\2026-08-16-3d-registration-partner-portfolio\.venv-pdf\Scripts\python.exe').Path
}
node scripts/export-portfolio-data.cjs --output $pdfInput
if ($LASTEXITCODE -ne 0) { throw 'Portfolio PDF export failed.' }
& $pdfPython scripts/generate-portfolio-pdfs.py `
  --input $pdfInput `
  --output-dir output\pdf `
  --publish-root . `
  --review-dir $pdfReview
if ($LASTEXITCODE -ne 0) { throw 'Portfolio PDF generation failed.' }
```

Expected: 16 PDFs and their review pages are generated; both SMCNavi documents report exactly 6 pages; manifest has 32 `project-pdf` artifacts and generator version `3.1`.

- [ ] **Step 9: Inspect all SMCNavi PDF pages and compare unrelated PDFs**

Use the PDF skill's rendered page PNGs/contact sheets to inspect all 12 SMCNavi PDF pages. Check no clipping, overlap, tiny flow labels, broken Korean, portrait/header leakage, unsupported claims, or blank pages.

Then run:

```powershell
$pdfGuardPath = Join-Path $env:TEMP 'smcnavi-unrelated-project-pdfs-20260822.json'
$beforeRows = Get-Content -Raw -LiteralPath $pdfGuardPath | ConvertFrom-Json
$afterRows = Get-ChildItem -LiteralPath assets\pdfs -Filter '*.pdf' |
  Where-Object { $_.Name -notin @('surgical-navigation-ko.pdf', 'surgical-navigation-en.pdf') } |
  Sort-Object Name |
  ForEach-Object {
    [pscustomobject]@{
      Name = $_.Name
      Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
    }
  }
$changed = foreach ($before in $beforeRows) {
  $after = $afterRows | Where-Object Name -eq $before.Name
  if (-not $after -or $after.Sha256 -ne $before.Sha256) { $before.Name }
}
if ($changed.Count) { throw "Unrelated project PDFs changed: $($changed -join ', ')" }
```

Expected: no unrelated public PDF hash changes. If a shared generator edit changed unrelated bytes, restore those 14 generated PDFs from their pre-task Git versions only after confirming they have no concurrent user changes; then regenerate a manifest that truthfully matches every published artifact.

- [ ] **Step 10: Run PDF freshness checks**

Run:

```powershell
node --test --test-name-pattern="manifest freshness|manifest binds|SMCNavi PDF|integrated review" tests/portfolio.test.cjs
node scripts/validate-portfolio.cjs
git diff --check
```

Expected: no stale digest, generator hash, page count, artifact hash, evidence, or schema failure.

---

### Task 8: Complete automated, visual, `file://`, and claim-boundary verification

**Files:**
- Verify: all changed source, media, generated PDFs, and public routes
- No new tracked files

**Interfaces:**
- Consumes: completed Tasks 1–7.
- Produces: evidence-backed acceptance record with no commit, push, or deployment.

- [ ] **Step 1: Run the three required repository gates**

Run:

```powershell
node --test
node scripts/validate-portfolio.cjs
git diff --check
```

Expected: all commands exit 0; validator reports 8 projects, 5 capabilities, and 24 localized pages.

- [ ] **Step 2: Verify the two final MP4s with FFprobe**

Run:

```powershell
$checks = @(
  @{ Path = 'assets/projects/surgical-navigation/surgical-navigation-hololens-demo-01.mp4'; Duration = 159.833333; Width = 1280; Height = 720 },
  @{ Path = 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-features-01.mp4'; Duration = 90.266667; Width = 960; Height = 720 }
)
foreach ($check in $checks) {
  $probe = ffprobe -v error -show_entries format=duration,size:format_tags:stream=codec_name,codec_type,width,height,pix_fmt:stream_tags -of json $check.Path | ConvertFrom-Json
  $video = @($probe.streams | Where-Object codec_type -eq 'video')
  $audio = @($probe.streams | Where-Object codec_type -eq 'audio')
  if ($video.Count -ne 1 -or $audio.Count -ne 0) { throw "$($check.Path): expected one video stream and no audio." }
  if ($video[0].codec_name -ne 'h264' -or $video[0].pix_fmt -ne 'yuv420p') { throw "$($check.Path): expected H.264 yuv420p." }
  if ($video[0].width -ne $check.Width -or $video[0].height -ne $check.Height) { throw "$($check.Path): unexpected dimensions." }
  if ([math]::Abs([double]$probe.format.duration - $check.Duration) -gt 0.2) { throw "$($check.Path): duration drift exceeds 0.2 seconds." }
  if ([int64]$probe.format.size -ge 100000000) { throw "$($check.Path): file is not below 100,000,000 bytes." }
  $identityTags = @('title', 'artist', 'author', 'comment', 'description', 'creation_time', 'location')
  $formatTagNames = if ($probe.format.tags) { @($probe.format.tags.PSObject.Properties.Name) } else { @() }
  $streamTagNames = @($probe.streams | ForEach-Object {
    if ($_.tags) { $_.tags.PSObject.Properties.Name }
  })
  foreach ($tag in $identityTags) {
    if ($formatTagNames -contains $tag -or $streamTagNames -contains $tag) { throw "$($check.Path): inherited identifying metadata $tag." }
  }
}
```

Expected: exact codec, pixel format, dimensions, duration tolerance, size, and no audio/identity tag failures. The Node validator separately proves fast-start and prohibited MP4-box absence.

- [ ] **Step 3: Search the actual public surfaces for forbidden claims and links**

Run:

```powershell
$publicScope = @(
  'js/portfolio-data.js',
  'assets/projects/surgical-navigation/README.md',
  'assets/projects/EVIDENCE_REGISTER.md'
)
node -e "const p=require('./js/portfolio-data.js').projects.find(x=>x.slug==='surgical-navigation'); const ko='장시간 안정성, 성능 최적화, 배포 설정, 패키징은 제품화 수준으로 마무리되지 않았습니다. 이 사례는 생산 배포, 실제 수술 사용, 임상 효능·안전성·정확도를 주장하지 않습니다.'; const en='Long-duration robustness, performance optimisation, deployment setup, and packaging were not completed to productisation level. This case does not claim production deployment, use in real surgery, or clinical efficacy, safety, or accuracy.'; if(p.translations.ko.limitation!==ko||p.translations.en.limitation!==en) process.exit(1)"
if ($LASTEXITCODE -ne 0) { throw 'The approved explicit non-claim boundary changed.' }
$forbidden = 'Azure Spatial Anchors|Photon Unity Networking|\bASA\b|\bPUN\b|super app|digitrack-inc|특허출원|patent application'
$matches = rg -n -i --pcre2 $forbidden $publicScope
if ($LASTEXITCODE -eq 0) { $matches; throw 'Forbidden SMCNavi public claim or link found.' }
if ($LASTEXITCODE -ne 1) { throw 'Forbidden-copy search failed.' }
```

Expected: both approved non-claim sentences match exactly and the hard-forbidden technology, internal-link, and patent-progress patterns have no match.

- [ ] **Step 4: Start local HTTP preview**

Run in a persistent terminal:

```powershell
python -m http.server 8000
```

Expected: `http://127.0.0.1:8000/` serves the repository root with no build step.

- [ ] **Step 5: Invoke and read the in-app browser control skill, then inspect wide layouts**

At approximately 1440×1000, inspect:

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/projects/
http://127.0.0.1:8000/cv/
http://127.0.0.1:8000/contact/
http://127.0.0.1:8000/projects/surgical-navigation/
http://127.0.0.1:8000/en/projects/surgical-navigation/
```

Check the shared nav/footer, title hierarchy, `Prototype · Ongoing`, poster-led videos, captions, ten figure numbers, five story sections, six workflows, role/team separation, diagram order and boundary, PDF/contact links, no repository link, no broken image, no horizontal overflow, and no console error.

- [ ] **Step 6: Inspect the same six routes at a narrow viewport**

At approximately 390×844, repeat the six-route review. The story grid and media grid must be one column; flow nodes must be vertical; arrows and edge labels must not cross, clip, or force horizontal scrolling; native video controls must remain usable.

- [ ] **Step 7: Exercise both videos without waiting through playback**

On each localized surgical-navigation page, confirm both videos expose native controls, display the correct posters, do not start automatically, and report approximately 159.8s and 90.3s. Start, pause, seek near the end, and resume each video to prove the full files decode and the fast-start layout supports seeking. Confirm there is no audio control activity.

- [ ] **Step 8: Verify direct `file://` resolution**

Open these exact local files with the in-app browser:

```text
projects/surgical-navigation/index.html
en/projects/surgical-navigation/index.html
```

Check both videos, all story images, both posters, the two localized PDFs, nav language switch, and contact link. Inspect Home, Projects, CV, and Contact `file://` links for regressions as required by `AGENTS.md`.

- [ ] **Step 9: Verify PDF text, pages, links, and forbidden content**

Run:

```powershell
$pdfPython = if ($env:PORTFOLIO_PDF_PYTHON) { $env:PORTFOLIO_PDF_PYTHON } else { (Resolve-Path '.superpowers\sdd\2026-08-16-3d-registration-partner-portfolio\.venv-pdf\Scripts\python.exe').Path }
& $pdfPython -c @'
import re
from pathlib import Path
from pypdf import PdfReader

required = {
    "ko": ["SMCNavi", "광대·안와 골절 미러링", "3D 의료영상·수술내비게이션 개발자", "연구 프로토타입"],
    "en": ["SMCNavi", "Zygomatic-orbital fracture mirroring", "3D Medical Imaging · Surgical Navigation Developer", "Research prototype"],
}
for locale, needles in required.items():
    path = Path("assets/pdfs") / f"surgical-navigation-{locale}.pdf"
    reader = PdfReader(str(path))
    assert len(reader.pages) == 6, (path, len(reader.pages))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    for needle in needles:
        assert needle in text, (path, needle)
    assert not re.search(r"Azure Spatial Anchors|Photon Unity Networking|\bASA\b|\bPUN\b|digitrack-inc", text, re.I), path
    assert not reader.attachments, path
    assert any((annotation.get_object().get("/A") or {}).get("/URI") for page in reader.pages for annotation in (page.get("/Annots") or [])), path
print("SMCNavi PDF audit passed")
'@
if ($LASTEXITCODE -ne 0) { throw 'SMCNavi PDF audit failed.' }
```

Expected: both PDFs are six pages, contain required bilingual content and public links, contain no attachment or obsolete networking claim.

- [ ] **Step 10: Review the exact final diff and leave it uncommitted**

Run:

```powershell
git status --short --branch
git diff --stat
git diff --name-status
git diff --check
git diff -- js/portfolio-data.js js/portfolio-render.js css/scholar.css scripts/validate-portfolio.cjs scripts/generate-portfolio-pdfs.py tests/portfolio.test.cjs assets/projects/EVIDENCE_REGISTER.md assets/projects/surgical-navigation/README.md docs/superpowers/specs/2026-08-22-smcnavi-hololens-case-design.md docs/superpowers/plans/2026-08-22-smcnavi-hololens-case.md
```

Expected: only the scoped source/docs/evidence files, seven new assets, four approved deletions, the two SMCNavi PDFs in both generated/public locations, and the coherent manifest differ. No file is staged. Do not commit, push, or deploy.

---

## Acceptance summary

The plan is complete only when the implementation can demonstrate all of the following together:

- the Korean and English case pages present the same five-part SMCNavi story and six workflows;
- both full-duration videos and all approved figures are distributed next to their explanation with ten continuous figure numbers;
- the architecture is one canonical bilingual semantic flow consumed by web and PDF;
- the author’s primary implementation scope is concrete and distinct from team-owned clinical context and acceptance review;
- ASA/PUN, unapproved names/internal names, patent progress, repository link, real-surgery use, and clinical-effect claims are absent;
- both SMCNavi PDFs remain six pages and other project PDFs retain their prior public content;
- all automated, HTTP, narrow/wide, `file://`, media, and PDF gates pass;
- the working tree remains uncommitted, unpushed, and undeployed.
