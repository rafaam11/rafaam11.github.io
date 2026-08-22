# 구강악안면 디지털 교합 워크플로우 포트폴리오 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 승인된 합성 데이터 시연과 공개 가능한 기술 사실을 사용해 한·영 구강악안면 디지털 교합 사례, Home·CV 포지셔닝, 프로젝트 PDF를 현재 정적 포트폴리오에 추가한다.

**Architecture:** 기존 buildless 정적 사이트와 공유 렌더러를 유지한다. 선택적 storySections, periodLabel, statusLabel, relatedProjectSlugs 계약을 하위 호환 방식으로 추가하고, 한 개의 정본 프로젝트 데이터가 웹·증거 원장·PDF를 함께 구동한다. LLMwiki의 현재 Word CV에서 공개용 KO/EN PDF를 다시 만들고, 포트폴리오 JSON·HTML과 동일한 역할·검증 경계를 유지한다.

**Tech Stack:** 정적 HTML/CSS/JavaScript, CommonJS/브라우저 UMD, Node.js 내장 테스트 러너, PowerShell, FFmpeg/FFprobe, Python 3, ReportLab, Pillow, PyMuPDF, pypdf, Microsoft Word.

**Spec:** docs/superpowers/specs/2026-08-22-digital-occlusion-workflow-portfolio-design.md

## Global Constraints

- 공개 제목은 “구강악안면 디지털 교합 워크플로우” / “Maxillofacial Digital Occlusion Workflow”, slug는 “digital-occlusion-workflow”다.
- 표시 기간은 “2026.03 – 현재” / “2026.03 – present”, 표시 상태는 “진행 중 · 연구진 검증” / “Ongoing · Researcher Validation”이다.
- Medical Core에서 mandibular-fracture 바로 다음에 둔다. 프로젝트는 9개, 공개 HTML은 26개, 프로젝트 PDF는 18개, PDF 게시 아티팩트는 36개가 된다.
- 한국어는 root, 영어는 /en/이며 data-base, data-page, data-lang, data-route와 HTTP/file:// 경로 해석을 보존한다.
- 개인 역할은 기술 리드, Custom App 전체 아키텍처, end-to-end 워크플로우·UI/UX, 알고리즘·엔진 통합, 평가·내보내기, CMake/SuperBuild·테스트·패키징이다.
- 특징점·해부학 좌표 알고리즘과 Geometric, PyBullet, SOFA 엔진 자체는 협업 결과다. 엔진 개발을 개인 성과로 쓰지 않는다.
- 삼성서울병원 연구진의 개발 빌드 직접 사용과 피드백은 공개할 수 있다. 병원 설치, 실제 수술 사용, 의료기기, 임상 효능·정확도·안전성은 주장하지 않는다.
- 2023.04–2023.12의 이전 애플리케이션은 재설계 배경과 유지보수·검증 역할로만 언급하며 새 사례 기간에 포함하지 않는다.
- mandibular-fracture와는 문제 맥락만 관련된다. 직접 코드 계보나 논문 결과의 제품화를 주장하지 않는다.
- 공개 미디어는 합성 테스트 데이터만 포함한다. 앱 제목, 기관 로고, 로컬 경로, 작업표시줄, 식별 문자열, 원본 메타데이터를 제거한다.
- 공개 영상은 31.0초, 960×460, H.264, yuv420p, 24fps, 무음, fast-start이며 20 MiB 이하로 유지한다. autoplay와 loop를 쓰지 않고 preload="none"을 유지한다.
- 화면의 RMSE, Gap, FRE 값은 계산·표시 UI 근거일 뿐 성능 수치로 인용하지 않는다.
- 내부 프로젝트명, 사설 저장소 URL, 개인 이름, 절대 로컬 경로, 실제 환자 데이터는 tracked 파일과 생성 PDF에 넣지 않는다.
- 포트폴리오의 public/은 수정하지 않는다. 기존 여덟 사례의 route·카피·PDF 내용은 의도적으로 바꾸지 않는다.
- LLMwiki의 canonical Word/PDF는 구현 시작 전부터 수정 상태다. 현재 파일 위에만 편집하고 임시 SHA-256 백업을 남기며, 기존 binary 변경을 되돌리거나 별도 승인 없이 stage하지 않는다.
- 포트폴리오에도 다른 작업의 SMCNavi 설계·계획 변경이 있을 수 있다. 각 작업 시작 전에 live status와 관련 diff를 확인하고 다른 hunk를 보존한다.
- 이 계획 실행에서는 commit, push, GitHub Pages 배포, atlas 완료 전이를 하지 않는다. 최종 검증 결과와 정확한 diff를 먼저 사용자에게 제시한다.
- 최종 자동 검증은 node --test, node scripts/validate-portfolio.cjs, git diff --check 세 명령을 모두 포함한다.
- 브라우저 검증은 인앱 브라우저만 사용한다. 사용할 수 없으면 한계를 기록하고 다른 브라우저 제어 백엔드로 조용히 대체하지 않는다.

---

## File and interface map

| File | Responsibility |
| --- | --- |
| js/portfolio-data.js | 아홉 번째 사례의 한·영 정본 카피, storySections, 미디어, related slug, PDF 선택 계약 |
| js/portfolio-render.js | 새 선택 필드 검증·기간·상태 현지화, 장문 사례·다이어그램·관련 사례 렌더링 |
| js/site-i18n.js | 아홉 번째 slug와 26-route locale pairing |
| css/scholar.css | story, media grid, semantic flow, related case 반응형 스타일 |
| scripts/validate-portfolio.cjs | 중첩 미디어, 31초 영상 정책, 9/26/18/36 인벤토리, 개인정보·경로 검사 |
| scripts/generate-portfolio-pdfs.py | story section, 두 semantic diagram, 대표 화면을 사용하는 18개 PDF 생성 |
| scripts/export-portfolio-data.cjs | 수정 없이 전체 새 필드가 export되는지 회귀 검증 |
| scripts/portfolio-pdf-source.cjs | 수정 없이 schemaVersion 1과 sourceDigest를 유지하는지 회귀 검증 |
| tests/portfolio.test.cjs | 데이터·렌더러·route·media·CV·PDF 계약의 실패 우선 테스트 |
| index.html, en/index.html | 승인된 2문장 Home 포지셔닝, meta description, fallback 목록 |
| projects/index.html, en/projects/index.html | Medical Core fallback 목록 |
| projects/digital-occlusion-workflow/index.html | 한국어 사례 shell |
| en/projects/digital-occlusion-workflow/index.html | 영어 사례 shell |
| data/public-cv.json | 삼성서울병원 협력 경력의 디지털 교합 항목 |
| cv/index.html, en/cv/index.html | public-cv-summary.cjs가 갱신하는 CV HTML |
| assets/projects/digital-occlusion-workflow/ | 공개 영상, 포스터, 화면 세 장, 공개 경계 README |
| assets/projects/EVIDENCE_REGISTER.md | 새 영상·이미지 5건의 승인 상태 |
| assets/pdfs/, output/pdf/, output/pdf/manifest.json | 18개 지역화 프로젝트 PDF와 36개 게시 아티팩트 |
| assets/cv/ | Word에서 다시 만든 공개 KO/EN CV PDF |
| LLMwiki canonical Word/PDF 및 tools/cv-media/cv-maps/*.json | 저자 CV 정본과 현지화 매핑 |

### Canonical interfaces

모든 JavaScript, validator, Python generator, 테스트에서 아래 필드명을 동일하게 사용한다.

~~~ts
type VideoPolicy = {
  maxBytes: number;
  targetDurationSeconds: number;
  toleranceSeconds: number;
  width: number;
  height: number;
  frameRate?: number;
  codec: 'h264';
  pixelFormat?: 'yuv420p';
  requireNoAudio: true;
  requireFastStart: true;
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
  translations?: {
    ko: { caption: string; alt: string };
    en: { caption: string; alt: string };
  };
};

type SystemFlowDiagram = {
  kind: 'system-flow';
  boundary: string;
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
  placement?: 'before-standard' | 'after-standard';
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
  figureIds: string[];
} & (
  | {
      diagram: { storySectionKey: string };
      diagrams?: never;
    }
  | {
      diagram?: never;
      diagrams: Array<{ storySectionKey: string }>;
    }
);
~~~

렌더러가 내보낼 테스트용 helper는 다음과 같다.

~~~js
storySectionsErrors(project, slug) -> string[]
storySectionsHtml(projectRecord, locale, base, firstFigureNumber, placement?) -> string
storyFigureCount(projectRecord, placement?) -> number
systemFlowDiagramHtml(diagram, locale) -> string
relatedProjectsHtml(data, project, locale, base, isFile) -> string
projectStateLabel(project, locale) -> string
~~~

filesystem validator는 다음 helper를 내보낸다.

~~~js
canonicalMediaEntries(candidate) -> Array<{ project, item, slot }>
approvedMp4Errors(filePath, videoPolicy?) -> string[]
~~~

PDF generator는 다음 helper를 정의한다.

~~~py
resolve_sequence_sections(project: dict[str, Any], locale: str) -> list[tuple[dict[str, Any], dict[str, Any]]]
resolve_sequence_diagrams(project: dict[str, Any]) -> list[dict[str, Any]]
canonical_project_media(project: dict[str, Any]) -> dict[str, dict[str, Any]]
selected_media_image(project: dict[str, Any], item: dict[str, Any], local_evidence: dict[str, Path]) -> Path | None
~~~

---

### Task 1: Freeze both live baselines and bind the approved private source

**Files:**
- Read: AGENTS.md
- Read: docs/superpowers/specs/2026-08-22-digital-occlusion-workflow-portfolio-design.md
- Read: all files in the map above
- Read: LLMwiki AGENTS.md and tools/cv-media/cv-maps/README.md
- Test: existing portfolio and CV pipeline

**Interfaces:**
- Consumes: approved design, atlas issue #684, the current live Word CV, and one approved source video supplied in the conversation.
- Produces: isolated portfolio implementation workspace, process-only source binding, baseline test evidence, and temporary hash guards.

- [ ] **Step 1: Inspect both repositories and stop for active shared-contract work**

Run in the portfolio source checkout and LLMwiki respectively:

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput -or -not (Test-Path -LiteralPath $wikiRootInput -PathType Container)) {
  throw 'LLMWIKI_ROOT must point to the current LLMwiki workspace without printing its value.'
}
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path

git status --short --branch
git log -8 --format="%h %ad %s" --date=iso
git rev-parse HEAD
git rev-parse origin/main
git diff -- docs/superpowers/specs/2026-08-22-smcnavi-hololens-case-design.md docs/superpowers/plans/2026-08-22-smcnavi-hololens-case.md
git diff -- tests/portfolio.test.cjs js/portfolio-render.js css/scholar.css

git -C $wikiRoot status --short --branch
git -C $wikiRoot diff --numstat -- docs/cv/CV_김진민_2026-08.docx docs/cv/CV_김진민_2026-08.pdf tools/cv-media/cv-maps/cv-map-ko.json tools/cv-media/cv-maps/cv-map-en.json
~~~

Expected: the executor records all pre-existing paths. If tests/portfolio.test.cjs or the shared story renderer contains uncommitted SMCNavi work, do not copy, overwrite, or independently reimplement it; wait for that work to land or ask the owner to pause it. If an automatic commit process is still moving main/origin/main, stop before editing and ask the owner whether it should be paused.

- [ ] **Step 2: Invoke the worktree skill from the stable live baseline**

Announce and read superpowers:using-git-worktrees. After Step 1 is stable, create the isolated portfolio worktree from the latest local HEAD so commit e081488, the approved spec, and any completed shared story-contract work are included. Keep this plan open from the source checkout; do not copy uncommitted files into the worktree.

- [ ] **Step 3: Bind both external roots only to the process**

The implementation session sets LLMWIKI_ROOT from the current workspace context and DIGITAL_OCCLUSION_SOURCE_VIDEO from the approved conversation input. Keep both values out of tracked files and command output. At the start of every new PowerShell process that needs either binding, resolve it again with this preamble:

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
$sourceVideo = [Environment]::GetEnvironmentVariable('DIGITAL_OCCLUSION_SOURCE_VIDEO', 'Process')
if (-not $wikiRootInput -or -not (Test-Path -LiteralPath $wikiRootInput -PathType Container)) {
  throw 'LLMWIKI_ROOT must point to the current LLMwiki workspace.'
}
if (-not $sourceVideo -or -not (Test-Path -LiteralPath $sourceVideo -PathType Leaf)) {
  throw 'DIGITAL_OCCLUSION_SOURCE_VIDEO must point to the approved source video.'
}
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
$probe = ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of json -i $sourceVideo | ConvertFrom-Json
$video = @($probe.streams | Where-Object codec_type -eq 'video')
if ($video.Count -ne 1 -or $video[0].width -ne 1280 -or $video[0].height -ne 720) {
  throw 'The approved source must contain one 1280x720 video stream.'
}
if ([math]::Abs([double]$probe.format.duration - 212.033) -gt 0.1) {
  throw 'The approved source duration does not match the reviewed 212.033-second recording.'
}
~~~

Expected: the source contract passes and no absolute value enters git diff.

- [ ] **Step 4: Run the unmodified portfolio baseline**

~~~powershell
node --test
node scripts/validate-portfolio.cjs
node -e "const v=require('./scripts/validate-portfolio.cjs');console.log('BASELINE_PUBLIC_VISUALS='+v.publicPortfolioVisualFiles(process.cwd()).length)"
git diff --check
~~~

Expected: all commands exit 0 before feature edits. Record BASELINE_PUBLIC_VISUALS because completed SMCNavi work may have changed the earlier visual baseline. A baseline failure is diagnosed separately.

- [ ] **Step 5: Save binary checksum guards outside both repositories**

~~~powershell
$portfolioGuard = Join-Path $env:TEMP 'digital-occlusion-existing-pdfs-20260822.json'
$existing = Get-ChildItem -LiteralPath assets\pdfs -Filter '*.pdf' | Sort-Object Name | ForEach-Object {
  [pscustomobject]@{ Name = $_.Name; Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant() }
}
$existing | ConvertTo-Json | Set-Content -LiteralPath $portfolioGuard -Encoding utf8

$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
$cvGuard = Join-Path $env:TEMP 'digital-occlusion-cv-source-20260822.json'
$cvSources = @(
  Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.docx'
  Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.pdf'
)
$cvRows = $cvSources | ForEach-Object {
  [pscustomobject]@{ Name = [IO.Path]::GetFileName($_); Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_).Hash.ToLowerInvariant() }
}
$cvRows | ConvertTo-Json | Set-Content -LiteralPath $cvGuard -Encoding utf8
~~~

Expected: the PDF guard has 16 existing project PDFs and the CV guard has the two current canonical files.

- [ ] **Step 6: Record the no-write checkpoint**

~~~powershell
git status --short --branch
~~~

Expected: no implementation file has changed in this task.

---

### Task 2: Add the optional story, localized period/status, and related-project contracts

**Files:**
- Modify: tests/portfolio.test.cjs near data schema and case renderer tests
- Modify: js/portfolio-render.js:17-40,117-125,246-295,311-375,414-613,633-670,679-806,833-847
- Modify: js/site-i18n.js:45-105

**Interfaces:**
- Consumes: the canonical types above and the existing legacy project renderer.
- Produces: validated storySections, localized period/status overrides, semantic system flow, reciprocal internal links, and byte-equivalent legacy case output.

- [ ] **Step 1: Confirm and reuse the landed SMCNavi story contract**

Run the existing `SMCNavi story` and `non-story cases` tests. Require the landed baseline to expose `storyDiagramFixture`, `storySectionFixture`, `storySectionsErrors`, `storySectionsHtml`, `systemFlowDiagramHtml`, and `mediaPreload`. Do not add a second fixture family or replace `.sc-flow*` markup/styles.

~~~powershell
node --test --test-name-pattern="SMCNavi story|non-story cases" tests/portfolio.test.cjs
~~~

Expected: pass before this task's new assertions are added. If the shared implementation has not landed, return to Task 1 and wait rather than recreating it here.

- [ ] **Step 2: Write failing contract tests**

Add tests with these exact assertions:

~~~js
test('story contract validates status labels, placement, media, and graph endpoints', () => {
  const candidate = clone(data);
  const project = candidate.projects.find((item) => item.slug === 'surgical-navigation');
  project.translations.ko.periodLabel = '2023.07 – 현재';
  project.translations.en.periodLabel = '2023.07 – present';
  project.translations.ko.statusLabel = '진행 중 · 연구진 검증';
  project.translations.en.statusLabel = 'Ongoing · Researcher Validation';
  project.storySections[0].placement = 'before-standard';
  project.relatedProjectSlugs = ['mandibular-fracture'];
  assert.deepEqual(render.dataErrors(candidate), []);

  const mutations = [
    [(value) => { value.translations.en.periodLabel = ''; }, /periodLabel/i],
    [(value) => { value.translations.en.statusLabel = ''; }, /statusLabel/i],
    [(value) => { value.storySections[0].placement = 'sidebar'; }, /placement/i],
    [(value) => { value.storySections.find((section) => section.diagram).diagram.edges[0].to = 'missing'; }, /edge endpoint/i],
    [(value) => { value.relatedProjectSlugs = [value.slug]; }, /self reference/i],
    [(value) => { value.relatedProjectSlugs = ['mandibular-fracture', 'mandibular-fracture']; }, /duplicate related/i]
  ];
  for (const [mutate, expected] of mutations) {
    const changed = clone(candidate);
    mutate(changed.projects.find((item) => item.slug === 'surgical-navigation'));
    assert.match(render.dataErrors(changed).join('\n'), expected);
  }
});

test('story renderer places sections around standard evidence and renders localized related links', () => {
  const candidate = clone(data);
  const project = candidate.projects.find((item) => item.slug === 'surgical-navigation');
  project.translations.ko.periodLabel = '2023.07 – 현재';
  project.translations.en.periodLabel = '2023.07 – present';
  project.translations.ko.statusLabel = '진행 중 · 연구진 검증';
  project.translations.en.statusLabel = 'Ongoing · Researcher Validation';
  project.storySections[0].placement = 'before-standard';
  project.storySections[0].translations.ko.heading = '통합 워크플로우';
  project.storySections[0].translations.en.heading = 'Integrated workflow';
  project.storySections.push({
    key: 'roadmap',
    layout: 'wide',
    placement: 'after-standard',
    translations: {
      ko: { heading: '장기 방향', body: '전체 수술계획으로 확장합니다.' },
      en: { heading: 'Long-term direction', body: 'Expands toward complete surgical planning.' }
    }
  });
  project.relatedProjectSlugs = ['mandibular-fracture'];
  const html = render.caseStudyHtml(candidate, project.slug, '../../', false, 'ko');
  assert.match(html, /2023\.07 – 현재/);
  assert.match(html, /진행 중 · 연구진 검증/);
  assertInOrder(html, ['통합 워크플로우', '내 역할', '결과와 근거', '한계와 팀 성과', '장기 방향', '관련 프로젝트'], 'story order');
  assert.match(html, /href="\.\.\/\.\.\/projects\/mandibular-fracture\/"[^>]*>하악골 골절 정복 최적화<\/a>/);
  assert.match(html, /class="sc-flow__track"/);
});

test('legacy cases retain their renderer output when optional story fields are absent', () => {
  const baseline = render.caseStudyHtml(data, 'mandibular-fracture', '../../', false, 'ko');
  const candidate = clone(data);
  assert.equal(render.caseStudyHtml(candidate, 'mandibular-fracture', '../../', false, 'ko'), baseline);
});

test('story PDF sequence accepts one legacy diagram or an ordered diagram array, never both', () => {
  const candidate = clone(data);
  const project = candidate.projects.find((item) => item.slug === 'surgical-navigation');
  const second = clone(project.storySections.find((section) => section.key === 'system-architecture'));
  second.key = 'system-architecture-secondary';
  second.media = [];
  project.storySections.push(second);
  project.pdfSequence.diagrams = [
    { storySectionKey: 'system-architecture' },
    { storySectionKey: 'system-architecture-secondary' }
  ];
  delete project.pdfSequence.diagram;
  assert.deepEqual(render.dataErrors(candidate), []);

  project.pdfSequence.diagram = { storySectionKey: 'system-architecture' };
  assert.match(render.dataErrors(candidate).join('\n'), /diagram.*diagrams|never both/i);
  delete project.pdfSequence.diagram;
  project.pdfSequence.diagrams[1].storySectionKey = 'missing';
  assert.match(render.dataErrors(candidate).join('\n'), /unknown story section|does not resolve/i);
});
~~~

- [ ] **Step 3: Run the focused tests and confirm failure**

~~~powershell
node --test --test-name-pattern="story contract|story renderer|story PDF sequence|legacy cases retain" tests/portfolio.test.cjs
~~~

Expected: at least the status-label, placement, or related-project assertions fail. If completed concurrent shared-contract work already satisfies an assertion, retain its implementation and use the remaining red assertions; do not introduce an artificial failure or duplicate its fixtures.

- [ ] **Step 4: Extend public-copy collection, localization, and validation**

In js/portfolio-render.js:

- Add periodLabel and statusLabel to the optional translated fields. Require each in both locales when either is declared; localize period as copy.periodLabel || project.period and status as project.statusLabel.
- Add storySections and relatedProjectSlugs to localized project records.
- Push every story translation, story media translation, diagram translation, node translation, and edge translation into projectPublicCopy.
- Permit blocks to be empty only when storySections is a non-empty valid array.
- Validate unique story keys, layout, placement, bilingual body-or-items, media IDs, approved paths, video poster/policy, unique node keys, edge endpoints, directions, and bilingual labels.
- Keep the landed SMCNavi video-policy keys required and allow only frameRate and pixelFormat as additional optional keys. When present, frameRate must be a positive integer and pixelFormat must equal `yuv420p`; this case sets both. Do not force either field onto existing SMCNavi media.
- Validate relatedProjectSlugs after all canonical slugs are known; reject unknown, duplicate, and self references.
- For a story-backed pdfSequence, accept exactly one of the landed singular diagram object or a non-empty diagrams array. Resolve every reference to a unique story section containing a system-flow diagram; reject both forms together, unknown sections, and duplicate references. Keep the singular SMCNavi contract valid.
- Keep every existing record valid without optional fields.

Use these exact defaults:

~~~js
var storyLayouts = ['wide', 'grid'];
var storyPlacements = ['before-standard', 'after-standard'];

function storyPlacement(section) {
  return section && section.placement ? section.placement : 'before-standard';
}

function projectStateLabel(project, locale) {
  if (project && typeof project.statusLabel === 'string' && project.statusLabel.trim()) {
    return project.statusLabel.trim();
  }
  var states = [project.evidenceState, project.lifecycleState].filter(function (state, index, values) {
    return state && values.indexOf(state) === index;
  });
  return states.map(function (state) { return stateLabel(state, locale); }).join(' · ');
}
~~~

- [ ] **Step 5: Extend story placement and add related links without rewriting the flow renderer**

Keep the landed `systemFlowDiagramHtml(diagram, locale)` and `.sc-flow*` DOM byte-for-byte. Extend `storySectionsHtml` with an optional placement argument; default missing placement to `before-standard`, filter before rendering, and return an empty string when the filtered set is empty. It continues numbering approved media only; semantic flow diagrams retain their titled, unnumbered figure treatment so SMCNavi's ten numbered media figures remain unchanged.

Add `storyFigureCount(projectRecord, placement)` to count approved story image/video figures for the requested placement. Add `relatedProjectsHtml(data, project, locale, base, isFile)` to resolve each target title and route through canonical data and `i18n.routeHref`, rendering one `.sc-related-projects` section after all standard/story content.

caseStudyHtml uses this order only when storySections exists:

~~~js
header + lead + problemSection +
storySectionsHtml(sourceProject, normalized, base, lead ? 2 : 1, 'before-standard') +
roleSection + evidenceSection + limitSection +
storySectionsHtml(sourceProject, normalized, base,
  (lead ? 2 : 1) + storyFigureCount(sourceProject, 'before-standard'), 'after-standard') +
relatedProjectsHtml(data, sourceProject, normalized, base, isFile) +
links
~~~

The SMCNavi branch is unchanged because all of its sections omit placement and therefore remain between the standard problem and role sections. The non-story legacy branch retains the current problem/approach/gallery/subcase order exactly.

- [ ] **Step 6: Add localized related heading and export the helpers**

Add “관련 프로젝트” / “Related projects” to pageCopy and expose all six helper names from module.exports.

- [ ] **Step 7: Run focused and full renderer tests**

~~~powershell
node --test --test-name-pattern="story contract|story renderer|story PDF sequence|legacy cases retain|case renderer|canonical records" tests/portfolio.test.cjs
node --test
git diff --check
~~~

Expected: the new tests and all existing tests pass; filesystem validator remains at the existing 8-project baseline.

- [ ] **Step 8: Review checkpoint without staging**

~~~powershell
git diff -- js/portfolio-render.js js/site-i18n.js tests/portfolio.test.cjs
git status --short
~~~

Expected: only this task’s shared-contract hunks plus preserved concurrent work appear. Do not stage.

---

### Task 3: Reproduce and inspect the approved public media derivatives

**Files:**
- Create in temporary review directory: one MP4 and four PNGs
- No tracked file in this task

**Interfaces:**
- Consumes: DIGITAL_OCCLUSION_SOURCE_VIDEO and approved source ranges 34–42s, 75–87s, 198–209s.
- Produces: five reviewed, metadata-stripped derivatives ready for Task 4.

- [ ] **Step 1: Create a dedicated temporary review directory**

~~~powershell
$mediaReview = Join-Path $env:TEMP 'digital-occlusion-media-review-20260822'
if (-not (Test-Path -LiteralPath $mediaReview)) {
  New-Item -ItemType Directory -Path $mediaReview | Out-Null
}
$sourceVideo = [Environment]::GetEnvironmentVariable('DIGITAL_OCCLUSION_SOURCE_VIDEO', 'Process')
if (-not $sourceVideo) { throw 'Missing process-only source video binding.' }
~~~

- [ ] **Step 2: Encode the approved 31-second montage**

~~~powershell
$demo = Join-Path $mediaReview 'digital-occlusion-workflow-demo-01.mp4'
ffmpeg -y -hide_banner -loglevel error -i $sourceVideo -filter_complex @"
[0:v]trim=start=34:end=42,setpts=PTS-STARTPTS[v0];
[0:v]trim=start=75:end=87,setpts=PTS-STARTPTS[v1];
[0:v]trim=start=198:end=209,setpts=PTS-STARTPTS[v2];
[v0][v1][v2]concat=n=3:v=1:a=0,crop=1280:614:0:80,scale=960:460:flags=lanczos,fps=24,format=yuv420p[v]
"@ -map '[v]' -an -map_metadata -1 -c:v libx264 -crf 22 -preset slow -fflags +bitexact -flags:v +bitexact -movflags +faststart $demo
if ($LASTEXITCODE -ne 0) { throw 'Approved montage encoding failed.' }
~~~

Expected: one 31-second video ordered landmark → multi-view occlusion → evaluation.

- [ ] **Step 3: Extract poster and three evidence frames**

~~~powershell
$frames = @(
  @{ Time = 16; Name = 'digital-occlusion-workflow-poster-01.png' },
  @{ Time = 5; Name = 'digital-occlusion-workflow-landmark-01.png' },
  @{ Time = 15; Name = 'digital-occlusion-workflow-occlusion-01.png' },
  @{ Time = 26; Name = 'digital-occlusion-workflow-evaluation-01.png' }
)
foreach ($frame in $frames) {
  $target = Join-Path $mediaReview $frame.Name
  ffmpeg -y -hide_banner -loglevel error -ss $frame.Time -i $demo -frames:v 1 -map_metadata -1 -fflags +bitexact $target
  if ($LASTEXITCODE -ne 0) { throw "Frame extraction failed: $($frame.Name)" }
}
~~~

Expected: each PNG is 960×460. The poster emphasizes the multi-view occlusion workspace.

- [ ] **Step 4: Verify stream, timing, dimensions, size, and tags**

~~~powershell
$probe = ffprobe -v error -show_entries format=duration,size:format_tags:stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate:stream_tags -of json $demo | ConvertFrom-Json
$video = @($probe.streams | Where-Object codec_type -eq 'video')
$audio = @($probe.streams | Where-Object codec_type -eq 'audio')
if ($video.Count -ne 1 -or $audio.Count -ne 0) { throw 'Expected one video stream and no audio.' }
if ($video[0].codec_name -ne 'h264' -or $video[0].pix_fmt -ne 'yuv420p') { throw 'Expected H.264 yuv420p.' }
if ($video[0].width -ne 960 -or $video[0].height -ne 460 -or $video[0].r_frame_rate -ne '24/1') { throw 'Unexpected video geometry or frame rate.' }
if ([math]::Abs([double]$probe.format.duration - 31.0) -gt 0.2) { throw 'Duration drift exceeds 0.2 seconds.' }
if ([int64]$probe.format.size -gt 20971520) { throw 'Public video exceeds 20 MiB.' }
$bytes = [IO.File]::ReadAllBytes($demo)
$boxes = [Text.Encoding]::ASCII.GetString($bytes)
$moovOffset = $boxes.IndexOf('moov', [StringComparison]::Ordinal)
$mdatOffset = $boxes.IndexOf('mdat', [StringComparison]::Ordinal)
if ($moovOffset -lt 0 -or $mdatOffset -lt 0 -or $moovOffset -gt $mdatOffset) {
  throw 'MP4 is missing fast-start ordering (moov before mdat).'
}
$identityTags = @('title','artist','author','comment','description','creation_time','location')
$allTags = @($probe.format.tags.PSObject.Properties.Name) + @($probe.streams | ForEach-Object {
  if ($_.tags) { $_.tags.PSObject.Properties.Name }
})
foreach ($tag in $identityTags) {
  if ($allTags -contains $tag) { throw "Identifying metadata remains: $tag" }
}
~~~

- [ ] **Step 5: Visually inspect all five derivatives**

Use view_image for all PNGs and a fresh contact sheet of the MP4. Confirm:

- no application title, institution logo, local path, taskbar, person, or patient identifier;
- landmark frame shows the reference image next to the editable 3D view;
- occlusion frame shows multiple views and contact-distance visualization;
- evaluation frame shows RMSE, Gap, FRE UI without treating displayed values as outcomes;
- crop does not remove required controls or labels.

If any boundary fails, adjust only the crop or selected timestamp, rerun Steps 2–5, and retain the same public dimensions and sequence.

- [ ] **Step 6: Record hashes for Task 4**

~~~powershell
$mediaHashGuard = Join-Path $env:TEMP 'digital-occlusion-media-review-20260822.json'
$mediaHashes = Get-ChildItem -LiteralPath $mediaReview -File | Sort-Object Name | ForEach-Object {
  [pscustomobject]@{
    Name = $_.Name
    Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  }
}
$mediaHashes | ConvertTo-Json | Set-Content -LiteralPath $mediaHashGuard -Encoding utf8
$mediaHashes | Format-Table -AutoSize
~~~

Expected: five stable review hashes and no tracked changes.

---

### Task 4: Add the ninth canonical case, routes, assets, and evidence

**Files:**
- Modify: tests/portfolio.test.cjs
- Modify: js/portfolio-data.js
- Modify: js/portfolio-render.js:21-31,444-559
- Modify: js/site-i18n.js:7-17
- Modify: scripts/validate-portfolio.cjs:47-65,280-295,651-920,1214-1420,2040-2080
- Modify: AGENTS.md
- Modify: index.html, en/index.html
- Modify: projects/index.html, en/projects/index.html
- Create: projects/digital-occlusion-workflow/index.html
- Create: en/projects/digital-occlusion-workflow/index.html
- Create: assets/projects/digital-occlusion-workflow/README.md
- Create: five approved assets under assets/projects/digital-occlusion-workflow/
- Modify: assets/projects/EVIDENCE_REGISTER.md

**Interfaces:**
- Consumes: Task 2 contracts and Task 3 reviewed files.
- Produces: canonical 9-project/26-route web case with registered evidence and reciprocal related links.

- [ ] **Step 1: Write failing inventory, data, route, and claim tests**

Update the canonical slug fixture to:

~~~js
[
  'surgical-navigation',
  'mandibular-fracture',
  'digital-occlusion-workflow',
  'life-careverse',
  'rtms-navigation',
  'respiratory-surface-guidance',
  'skadi-tracking-software',
  'unmanned-forklift',
  'ai-build-lab'
]
~~~

Add:

~~~js
test('digital occlusion case preserves approved role, validation, and roadmap boundaries', () => {
  const project = data.projects.find((item) => item.slug === 'digital-occlusion-workflow');
  assert.ok(project);
  assert.equal(project.tier, 'medical-core');
  assert.equal(project.period, '2026.03 – present');
  assert.equal(project.translations.ko.periodLabel, '2026.03 – 현재');
  assert.equal(project.translations.en.periodLabel, '2026.03 – present');
  assert.equal(project.translations.ko.roleLabel, '기술 리드 · 메인 개발자');
  assert.equal(project.translations.en.roleLabel, 'Technical Lead · Primary Developer');
  assert.deepEqual(project.capabilityKeys, ['medical-navigation', 'registration']);
  assert.deepEqual(project.relatedProjectSlugs, ['mandibular-fracture']);
  assert.equal(project.translations.ko.statusLabel, '진행 중 · 연구진 검증');
  assert.equal(project.translations.en.statusLabel, 'Ongoing · Researcher Validation');
  assert.match(project.translations.ko.role, /기술 리드|전체 아키텍처/);
  assert.match(project.translations.ko.teamResult, /삼성서울병원 연구진|DIGITRACK/);
  assert.match(project.translations.ko.limitation, /병원 설치|임상|의료기기/);
  assert.doesNotMatch(JSON.stringify(project), /기여율|실제 수술|임상 효능|사설 저장소/i);
});

test('digital occlusion routes and fallback order are canonical in both languages', () => {
  assert.equal(i18n.routeDescriptors.length * 2, 26);
  for (const file of [
    'projects/digital-occlusion-workflow/index.html',
    'en/projects/digital-occlusion-workflow/index.html'
  ]) assert.ok(fs.existsSync(path.join(root, file)), file);
  for (const file of ['index.html', 'projects/index.html', 'en/index.html', 'en/projects/index.html']) {
    const html = read(file);
    assertInOrder(html, ['mandibular-fracture', 'digital-occlusion-workflow', 'life-careverse'], file);
  }
});

test('digital occlusion media and captions are registered as approved synthetic-data evidence', () => {
  const project = data.projects.find((item) => item.slug === 'digital-occlusion-workflow');
  const entries = validator.canonicalMediaEntries({ projects: [project] });
  assert.deepEqual(entries.map((entry) => entry.item.id), [
    'digital-occlusion-workflow-demo-01',
    'digital-occlusion-workflow-demo-01',
    'digital-occlusion-workflow-poster-01',
    'digital-occlusion-workflow-landmark-01',
    'digital-occlusion-workflow-occlusion-01',
    'digital-occlusion-workflow-evaluation-01'
  ]);
  assert.match(project.translations.ko.mediaCaption, /합성 테스트 데이터/);
  assert.match(project.storySections[2].media[2].translations.ko.caption, /성능 결과가 아닙니다/);
});
~~~

Update stale test names and error expectations from 8/24/16/32 to 9/26/18/36.

- [ ] **Step 2: Run the focused tests and confirm failure**

~~~powershell
node --test --test-name-pattern="digital occlusion|canonical records|case shells|root inventory" tests/portfolio.test.cjs
~~~

Expected: failure because the slug, data, routes, assets, and register rows do not exist.

- [ ] **Step 3: Add the canonical project record**

Insert the new project immediately after mandibular-fracture. Use these exact summary fields:

~~~js
project({
  slug: 'digital-occlusion-workflow',
  tier: 'medical-core',
  period: '2026.03 – present',
  evidenceState: 'ongoing',
  lifecycleState: 'research',
  capabilityKeys: ['medical-navigation', 'registration'],
  route: 'projects/digital-occlusion-workflow/',
      tech: ['3D Slicer', 'C++', 'Qt', 'Python', 'VTK', 'PyBullet', 'SOFA'],
  media: {
    lead: {
      id: 'digital-occlusion-workflow-demo-01',
      type: 'video',
      status: 'approved',
      publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4',
      preload: 'none',
      videoPolicy: {
        maxBytes: 20971520,
        targetDurationSeconds: 31,
        toleranceSeconds: 0.2,
        width: 960,
        height: 460,
        frameRate: 24,
        codec: 'h264',
        pixelFormat: 'yuv420p',
        requireNoAudio: true,
        requireFastStart: true
      }
    },
    video: {
      id: 'digital-occlusion-workflow-demo-01',
      type: 'video',
      status: 'approved',
      publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4',
      preload: 'none'
    },
    poster: {
      id: 'digital-occlusion-workflow-poster-01',
      type: 'image',
      status: 'approved',
      publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-poster-01.png'
    },
    gallery: []
  },
  pdf: {
    ko: 'assets/pdfs/digital-occlusion-workflow-ko.pdf',
    en: 'assets/pdfs/digital-occlusion-workflow-en.pdf'
  },
  pdfSequence: {
    middle: ['integrated-workflow', 'user-centered-decisions', 'system-architecture', 'verification-boundary'],
    evidenceId: 'digital-occlusion-workflow-demo-01',
    diagrams: [
      { storySectionKey: 'integrated-workflow' },
      { storySectionKey: 'system-architecture' }
    ],
    figureIds: [
      'digital-occlusion-workflow-landmark-01',
      'digital-occlusion-workflow-occlusion-01',
      'digital-occlusion-workflow-evaluation-01'
    ]
  },
  relatedProjectSlugs: ['mandibular-fracture'],
  blocks: [],
  links: [],
  translations: {
    ko: {
      title: '구강악안면 디지털 교합 워크플로우',
      shortTitle: '디지털 교합 워크플로우',
      eyebrow: '의료 코어 · 임상 워크플로우 통합',
      thesis: '분리된 특징점·교합·평가 기능을 연구진이 한 앱에서 직접 다룰 수 있는 사용자 친화적 end-to-end 워크플로우로 재설계했습니다.',
      summary: '8개 3D 모델 준비, 치아·악안면 특징점, 해부학적 좌표계, 자동 교합·6-DOF 조정·접촉 분석, RMSE·Gap·FRE 평가와 내보내기를 하나의 Custom App으로 연결했습니다.',
      problem: '이전 흐름은 특징점 앱이 분리되어 참고 이미지 대조와 확대·이동이 불편했고, 교합의 다중 시점, 저장·불러오기, 악안면 특징점, 평가 화면이 충분히 통합되지 않았습니다.',
      role: '기술 리드·메인 개발자로 C++/Qt 셸, Python 모듈, 공통 라이브러리의 전체 Custom App 아키텍처를 설계하고 end-to-end UI/UX, 알고리즘·엔진 통합, 평가·내보내기, CMake/SuperBuild·테스트·패키징을 주도했습니다.',
      teamResult: '삼성서울병원 연구진은 임상 워크플로우·특징점·평가 지표를 함께 정의하고 개발 빌드를 직접 검토합니다. DIGITRACK 협업 팀은 특징점 알고리즘과 교합 엔진 구현·연구를 지원했습니다.',
      evidence: '특징점 입력, 다중 시점 교합, 접촉 가시화, RMSE·Gap·FRE 평가와 내보내기가 동작하는 개발 빌드 영상·화면과 연구진 직접 사용 피드백이 근거입니다.',
      limitation: '현재는 개발·시연 빌드의 연구진 검증 단계입니다. 병원 설치, 실제 수술 사용, 의료기기 상태, 임상 효능·정확도·안전성을 주장하지 않으며 화면 값도 성능 결과로 인용하지 않습니다.',
      collaboration: '삼성서울병원과 DIGITRACK의 장기 R&D로 디지털 교합에서 정상 교합 기반 하악 운동과 전체 구강악안면 수술계획으로 확장하는 방향을 검토하고 있습니다.',
      mediaAlt: '합성 테스트 데이터에서 특징점 입력, 다중 시점 교합, 평가 화면이 이어지는 개발 빌드 시연.',
      mediaCaption: '합성 테스트 데이터로 특징점 입력, 다중 시점 교합, 평가 흐름을 시연한 개발 빌드입니다.',
      periodLabel: '2026.03 – 현재',
      roleLabel: '기술 리드 · 메인 개발자',
      status: '진행 중 · 연구진 검증',
      statusLabel: '진행 중 · 연구진 검증',
      ownedRole: '전체 Custom App 아키텍처, 워크플로우·UI/UX, 협업 알고리즘·엔진 통합, 평가·내보내기 파이프라인'
    },
    en: {
      title: 'Maxillofacial Digital Occlusion Workflow',
      shortTitle: 'Digital Occlusion Workflow',
      eyebrow: 'Medical Core · Clinical Workflow Integration',
      thesis: 'Redesigned separate landmarking, occlusion, and evaluation tools into a user-friendly end-to-end workflow that researchers can operate in one application.',
      summary: 'Connected eight-model preparation, dental and maxillofacial landmarks, anatomical frames, automatic occlusion, 6-DOF adjustment, contact analysis, RMSE/Gap/FRE evaluation, and export in one Custom App.',
      problem: 'The earlier flow separated landmarking into another application, made reference comparison and view navigation awkward, lacked multi-view occlusion, fragmented save/load, omitted maxillofacial landmarks, and had no sufficiently integrated result screen.',
      role: 'As technical lead and primary developer, designed the complete Custom App architecture across the C++/Qt shell, Python modules, and shared library, and led the end-to-end UI/UX, algorithm and engine integration, evaluation/export, CMake/SuperBuild, testing, and packaging.',
      teamResult: 'Samsung Medical Center researchers jointly define the clinical workflow, landmarks, and evaluation metrics and directly review development builds. The DIGITRACK team supports the landmark algorithms and occlusion-engine implementation and research.',
      evidence: 'A working development build demonstrates landmarking, multi-view occlusion, contact visualization, RMSE/Gap/FRE evaluation, and export, with direct researcher use and feedback.',
      limitation: 'The software is under researcher validation as a development and demonstration build. This case does not claim hospital installation, use in real surgery, medical-device status, or clinical efficacy, accuracy, or safety; displayed values are not performance outcomes.',
      collaboration: 'The long-term Samsung Medical Center and DIGITRACK R&D direction expands from digital occlusion toward normal-occlusion-based mandibular motion and complete oral and maxillofacial surgical planning.',
      mediaAlt: 'Development-build demonstration moving from landmarking through multi-view occlusion to evaluation on synthetic test data.',
      mediaCaption: 'Development-build demonstration of landmarking, multi-view occlusion, and evaluation using synthetic test data.',
      periodLabel: '2026.03 – present',
      roleLabel: 'Technical Lead · Primary Developer',
      status: 'Ongoing · Researcher Validation',
      statusLabel: 'Ongoing · Researcher Validation',
      ownedRole: 'Complete Custom App architecture, workflow and UI/UX, collaborative algorithm and engine integration, and evaluation/export pipeline'
    }
  }
})
~~~

- [ ] **Step 4: Add the six story sections and two diagrams**

Use these stable keys and placements:

~~~js
[
  ['redesign-background', 'wide', 'before-standard'],
  ['integrated-workflow', 'wide', 'before-standard'],
  ['user-centered-decisions', 'grid', 'before-standard'],
  ['system-architecture', 'wide', 'before-standard'],
  ['verification-boundary', 'wide', 'before-standard'],
  ['long-term-direction', 'wide', 'after-standard']
]
~~~

Assign this complete array to the project record:

~~~js
storySections: [
  {
    key: 'redesign-background',
    layout: 'wide',
    placement: 'before-standard',
    translations: {
      ko: {
        heading: '왜 다시 설계했는가',
        body: '2023.04–2023.12 유지보수·검증을 담당했던 이전 애플리케이션에서는 특징점 추출이 별도 도구로 분리되어 모델 확대·축소와 이동, 참고 사진 대조가 불편했습니다. 교합은 필요한 여러 시점을 함께 보기 어려웠고 저장·불러오기가 작업 흐름과 분리되어 있었습니다. 악안면 특징점을 활용하지 못했고 결과를 읽는 평가 화면도 충분히 설계되지 않았습니다. 임상 지식과 일부 협업 알고리즘은 이어받되, 2026.03부터 애플리케이션 구조와 워크플로우를 다시 설계했습니다. 키보드 단축키의 불편은 재설계 배경이지만 현재 버전에서 개선했다고 주장하지 않습니다.'
      },
      en: {
        heading: 'Why the workflow was redesigned',
        body: 'In the earlier application that I maintained and validated from 2023.04 to 2023.12, landmark extraction was separated into another tool, making zoom, pan, and reference-image comparison awkward. Occlusion lacked the views needed for simultaneous comparison, while save/load sat outside the working flow. Maxillofacial landmarks were not used and the evaluation screen was under-designed. Clinical knowledge and some collaborative algorithms carry forward, but the application structure and workflow have been redesigned since 2026.03. Awkward keyboard shortcuts remain background context; this case does not claim that shortcut design was improved.'
      }
    }
  },
  {
    key: 'integrated-workflow',
    layout: 'wide',
    placement: 'before-standard',
    translations: {
      ko: {
        heading: '한 앱으로 연결한 7단계 워크플로우',
        body: '데이터 준비부터 평가와 내보내기까지 프로젝트 상태가 한 흐름 안에서 이어집니다.',
        items: [
          '8개 3D 모델 준비',
          '치아 특징점 30개(상악 15개·하악 15개)와 악안면 특징점 30개 입력·가시화',
          '특징점 기반 해부학적 좌표계 구성',
          '자동 교합, 6-DOF 미세 조정, 피봇 회전',
          '접촉 상태와 거리 가시화',
          'RMSE·Gap·FRE 평가',
          '프로젝트 저장과 결과 내보내기'
        ]
      },
      en: {
        heading: 'A seven-stage workflow in one application',
        body: 'Project state remains connected from data preparation through evaluation and export.',
        items: [
          'Prepare eight 3D models',
          'Enter and visualize 30 dental landmarks (15 upper and 15 lower) plus 30 maxillofacial landmarks',
          'Construct anatomical frames from the landmarks',
          'Run automatic occlusion, 6-DOF fine adjustment, and pivot rotation',
          'Visualize contact state and distance',
          'Evaluate RMSE, Gap, and FRE',
          'Save the project and export results'
        ]
      }
    },
    diagram: {
      kind: 'system-flow',
      boundary: 'research-validation',
      translations: {
        ko: {
          title: '데이터 준비에서 평가까지',
          caption: '현재 구현된 7단계 디지털 교합 작업 흐름입니다.',
          boundaryLabel: '현재 구현 · 연구진 검증 중'
        },
        en: {
          title: 'Data preparation through evaluation',
          caption: 'The seven-stage digital-occlusion workflow implemented in the current build.',
          boundaryLabel: 'Implemented scope · Under researcher validation'
        }
      },
      nodes: [
        { key: 'prep', translations: { ko: { label: '모델 준비', detail: '8개 3D 모델' }, en: { label: 'Model preparation', detail: 'Eight 3D models' } } },
        { key: 'landmarks', translations: { ko: { label: '특징점', detail: '치아 30개 · 악안면 30개' }, en: { label: 'Landmarks', detail: '30 dental · 30 maxillofacial' } } },
        { key: 'frame', translations: { ko: { label: '해부학 좌표계', detail: '특징점 기반 기준 구성' }, en: { label: 'Anatomical frame', detail: 'Landmark-based reference' } } },
        { key: 'occlusion', translations: { ko: { label: '교합·미세 조정', detail: '자동 교합 · 6-DOF · 피봇 회전' }, en: { label: 'Occlusion and adjustment', detail: 'Automatic occlusion · 6-DOF · pivot rotation' } } },
        { key: 'contact', translations: { ko: { label: '접촉 분석', detail: '접촉 상태 · 거리 가시화' }, en: { label: 'Contact analysis', detail: 'Contact state · distance view' } } },
        { key: 'evaluation', translations: { ko: { label: '평가', detail: 'RMSE · Gap · FRE' }, en: { label: 'Evaluation', detail: 'RMSE · Gap · FRE' } } },
        { key: 'export', translations: { ko: { label: '저장·내보내기', detail: '프로젝트 · 평가 결과' }, en: { label: 'Save and export', detail: 'Project · evaluation results' } } }
      ],
      edges: [
        { from: 'prep', to: 'landmarks', direction: 'forward', translations: { ko: { label: '준비된 모델' }, en: { label: 'Prepared models' } } },
        { from: 'landmarks', to: 'frame', direction: 'forward', translations: { ko: { label: '입력 특징점' }, en: { label: 'Entered landmarks' } } },
        { from: 'frame', to: 'occlusion', direction: 'forward', translations: { ko: { label: '해부학 기준' }, en: { label: 'Anatomical reference' } } },
        { from: 'occlusion', to: 'contact', direction: 'forward', translations: { ko: { label: '조정 자세' }, en: { label: 'Adjusted pose' } } },
        { from: 'contact', to: 'evaluation', direction: 'forward', translations: { ko: { label: '접촉·거리 결과' }, en: { label: 'Contact and distance results' } } },
        { from: 'evaluation', to: 'export', direction: 'forward', translations: { ko: { label: '평가 결과' }, en: { label: 'Evaluation results' } } }
      ]
    }
  },
  {
    key: 'user-centered-decisions',
    layout: 'grid',
    placement: 'before-standard',
    translations: {
      ko: {
        heading: '연구진이 직접 쓰는 화면으로',
        body: '기능 수를 늘리는 것보다 연구진이 반복 작업을 끊김 없이 수행하고 결과를 비교할 수 있게 하는 데 우선순위를 두었습니다.',
        items: [
          '확대·축소 가능한 특징점 입력 화면 옆에 참고 이미지 배치',
          '교합 상태를 동시에 비교하는 다중 시점 화면',
          '프로젝트 저장·불러오기 흐름 통합과 단순화',
          '교합 과정을 확인하는 시뮬레이션 재생바',
          '미세 조정을 위한 피봇 회전 핸들',
          '모델 투명도와 특징점 가시성 제어'
        ]
      },
      en: {
        heading: 'Designed for direct researcher use',
        body: 'The priority was not feature count, but helping researchers repeat the workflow without interruption and compare its results.',
        items: [
          'A reference image beside the zoomable landmark-entry view',
          'Multiple simultaneous views of the occlusal state',
          'A unified and simplified project save/load flow',
          'A playback bar for reviewing the occlusion process',
          'Pivot rotation handles for fine adjustment',
          'Model-opacity and landmark-visibility controls'
        ]
      }
    },
    media: [
      {
        id: 'digital-occlusion-workflow-landmark-01',
        type: 'image',
        status: 'approved',
        publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-landmark-01.png',
        translations: {
          ko: { caption: '참고 이미지와 확대·축소 가능한 3D 뷰를 한 화면에서 확인하며 특징점을 입력합니다. 합성 테스트 데이터 화면입니다.', alt: '왼쪽 참고 이미지와 특징점 목록, 오른쪽 3D 턱 모델과 치아 특징점이 함께 보이는 화면.' },
          en: { caption: 'Researchers enter landmarks while viewing a reference image beside a zoomable 3D view. The screen uses synthetic test data.', alt: 'Screen with a reference image and landmark list on the left and a 3D jaw model with dental landmarks on the right.' }
        }
      },
      {
        id: 'digital-occlusion-workflow-occlusion-01',
        type: 'image',
        status: 'approved',
        publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-occlusion-01.png',
        translations: {
          ko: { caption: '교합 상태와 접촉 거리 맵을 여러 시점에서 동시에 비교하는 작업 화면입니다. 합성 테스트 데이터 화면입니다.', alt: '주 시점과 세 보조 시점에서 붉은 접촉 거리 맵이 표시된 하악 모델을 비교하는 교합 화면.' },
          en: { caption: 'The occlusion workspace compares the occlusal state and contact-distance map across several views. The screen uses synthetic test data.', alt: 'Occlusion screen comparing a mandibular model with a red contact-distance map in one main and three secondary views.' }
        }
      },
      {
        id: 'digital-occlusion-workflow-evaluation-01',
        type: 'image',
        status: 'approved',
        publicPath: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-evaluation-01.png',
        translations: {
          ko: { caption: 'RMSE·Gap·FRE 계산과 결과 내보내기를 한 흐름으로 묶은 평가 화면입니다. 표시값은 UI 예시이며 성능 결과가 아닙니다.', alt: '왼쪽 평가 항목과 결과 표, 오른쪽 접촉 거리 맵이 함께 보이는 RMSE·Gap·FRE 평가 화면.' },
          en: { caption: 'The evaluation screen combines RMSE, Gap, and FRE calculation with result export. Displayed values illustrate the UI, not performance outcomes.', alt: 'RMSE, Gap, and FRE evaluation screen with evaluation controls and result tables on the left and a contact-distance map on the right.' }
        }
      }
    ]
  },
  {
    key: 'system-architecture',
    layout: 'wide',
    placement: 'before-standard',
    translations: {
      ko: {
        heading: 'Custom App 아키텍처와 소유권',
        body: '3D Slicer Custom App의 C++/Qt 셸, Python 워크플로우 모듈, 공통 상태·라이브러리를 한 구조로 설계했습니다. 협업 알고리즘과 엔진은 개인 구현으로 재귀속하지 않고, 이를 상태 흐름·UI·시각화·평가로 통합한 범위를 구분합니다.'
      },
      en: {
        heading: 'Custom App architecture and ownership',
        body: 'The 3D Slicer Custom App is structured around a C++/Qt shell, Python workflow modules, and shared state and libraries. Collaborative algorithms and engines are not reassigned as individual implementations; the individually owned integration into state flow, UI, visualization, and evaluation remains explicit.'
      }
    },
    diagram: {
      kind: 'system-flow',
      boundary: 'ownership-boundary',
      translations: {
        ko: {
          title: 'Custom App 통합 구조',
          caption: '협업 알고리즘·엔진과 개인이 소유한 아키텍처·통합 범위를 분리한 구조입니다.',
          boundaryLabel: '개인 소유와 팀 결과 분리'
        },
        en: {
          title: 'Custom App integration structure',
          caption: 'Architecture separating collaborative algorithms and engines from individually owned architecture and integration.',
          boundaryLabel: 'Individual ownership separated from team results'
        }
      },
      nodes: [
        { key: 'shell', translations: { ko: { label: 'C++ / Qt 셸', detail: '개인: 전체 아키텍처' }, en: { label: 'C++ / Qt shell', detail: 'Individual: complete architecture' } } },
        { key: 'workflow', translations: { ko: { label: 'Python 워크플로우', detail: '개인: workflow · UI/UX' }, en: { label: 'Python workflow', detail: 'Individual: workflow · UI/UX' } } },
        { key: 'shared-state', translations: { ko: { label: '공통 상태·라이브러리', detail: '개인: 상태·데이터 흐름' }, en: { label: 'Shared state and library', detail: 'Individual: state and data flow' } } },
        { key: 'landmarks', translations: { ko: { label: '특징점·해부학 좌표', detail: '협업 알고리즘 · 개인 통합' }, en: { label: 'Landmarks and anatomical frames', detail: 'Collaborative algorithms · individual integration' } } },
        { key: 'engines', translations: { ko: { label: '교합 엔진', detail: 'Geometric · PyBullet · SOFA 협업 엔진 · 개인 통합' }, en: { label: 'Occlusion engines', detail: 'Collaborative Geometric · PyBullet · SOFA engines · individual integration' } } },
        { key: 'evaluation-export', translations: { ko: { label: '평가·가시화·내보내기', detail: '지표 공동 정의 · 개인 계산·구현' }, en: { label: 'Evaluation, visualization, and export', detail: 'Metrics jointly defined · calculation and implementation individually owned' } } }
      ],
      edges: [
        { from: 'shell', to: 'workflow', direction: 'bidirectional', translations: { ko: { label: 'UI 명령·화면 상태' }, en: { label: 'UI commands and view state' } } },
        { from: 'workflow', to: 'shared-state', direction: 'bidirectional', translations: { ko: { label: '프로젝트 상태' }, en: { label: 'Project state' } } },
        { from: 'shared-state', to: 'landmarks', direction: 'bidirectional', translations: { ko: { label: '특징점·좌표 데이터' }, en: { label: 'Landmark and frame data' } } },
        { from: 'shared-state', to: 'engines', direction: 'bidirectional', translations: { ko: { label: '자세·접촉 상태' }, en: { label: 'Pose and contact state' } } },
        { from: 'shared-state', to: 'evaluation-export', direction: 'forward', translations: { ko: { label: '평가 입력·결과' }, en: { label: 'Evaluation input and results' } } }
      ]
    }
  },
  {
    key: 'verification-boundary',
    layout: 'wide',
    placement: 'before-standard',
    translations: {
      ko: {
        heading: '현재 검증 상태와 한계',
        body: '기능 동작과 임상 활용 가능성을 같은 주장으로 섞지 않습니다.',
        items: [
          '구현됨: 8개 모델 준비, 치아·악안면 특징점, 해부학 좌표계, 자동 교합·6-DOF·접촉 분석, 평가·내보내기',
          '검증 중: 연구진이 개발·시연 빌드를 직접 사용하며 워크플로우 사용성과 교합 결과를 검토',
          '주장하지 않음: 병원 설치, 실제 수술 사용, 의료기기 상태, 임상 효능·정확도·안전성, 화면 예시값의 성능 해석'
        ]
      },
      en: {
        heading: 'Current validation state and limitations',
        body: 'Functional operation and clinical applicability remain separate claims.',
        items: [
          'Implemented: eight-model preparation, dental and maxillofacial landmarks, anatomical frames, automatic occlusion, 6-DOF and contact analysis, evaluation, and export',
          'Under review: researchers directly use development and demonstration builds to review workflow usability and occlusion output',
          'Not claimed: hospital installation, use in real surgery, medical-device status, clinical efficacy, accuracy or safety, or performance interpretation of displayed example values'
        ]
      }
    }
  },
  {
    key: 'long-term-direction',
    layout: 'wide',
    placement: 'after-standard',
    translations: {
      ko: {
        heading: '디지털 교합에서 전체 수술계획으로',
        body: '다음 연구 방향은 정상 교합 기반 하악 운동을 연결하고, 장기적으로 디지털 교합·계측·하악 운동을 포함하는 전체 구강악안면 수술계획 소프트웨어로 확장하는 것입니다. 이는 구현 완료가 아닌 삼성서울병원과 DIGITRACK의 장기 R&D 방향입니다.'
      },
      en: {
        heading: 'From digital occlusion to complete surgical planning',
        body: 'The next research direction connects normal-occlusion-based mandibular motion and, over the longer term, expands toward complete oral and maxillofacial surgical-planning software spanning digital occlusion, measurement, and mandibular motion. This is the long-term Samsung Medical Center and DIGITRACK R&D direction, not completed functionality.'
      }
    }
  }
]
~~~

- [ ] **Step 5: Add reciprocal relation and canonical slug order**

Add digital-occlusion-workflow after mandibular-fracture in js/site-i18n.js, js/portfolio-render.js, Python constants later, and every test fixture. Add:

~~~js
relatedProjectSlugs: ['digital-occlusion-workflow']
~~~

to mandibular-fracture without changing its existing title, role, evidence, limitation, media, or PDF sequence.

- [ ] **Step 6: Copy reviewed media and register all evidence**

Create the exact asset directory, copy the five reviewed Task 3 files, and reject any hash drift before editing the register:

~~~powershell
$mediaReview = Join-Path $env:TEMP 'digital-occlusion-media-review-20260822'
$mediaHashGuard = Join-Path $env:TEMP 'digital-occlusion-media-review-20260822.json'
$targetDir = 'assets\projects\digital-occlusion-workflow'
$expected = @(Get-Content -Raw -LiteralPath $mediaHashGuard | ConvertFrom-Json)
if ($expected.Count -ne 5) { throw 'Expected exactly five approved media hashes.' }
if (-not (Test-Path -LiteralPath $targetDir)) { New-Item -ItemType Directory -Path $targetDir | Out-Null }
foreach ($row in $expected) {
  $source = Join-Path $mediaReview $row.Name
  $target = Join-Path $targetDir $row.Name
  Copy-Item -LiteralPath $source -Destination $target
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLowerInvariant()
  if ($actual -ne $row.Sha256) { throw "Copied media hash drifted: $($row.Name)" }
}
~~~

Add these register rows:

~~~markdown
| digital-occlusion-workflow-demo-01 | digital-occlusion-workflow | video | approved-public | assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4 | Approved synthetic-data development-build montage; caption in canonical portfolio data. |
| digital-occlusion-workflow-poster-01 | digital-occlusion-workflow | image | approved-public | assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-poster-01.png | Approved poster from the multi-view occlusion segment. |
| digital-occlusion-workflow-landmark-01 | digital-occlusion-workflow | image | approved-public | assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-landmark-01.png | Approved synthetic-data landmark and reference-image view. |
| digital-occlusion-workflow-occlusion-01 | digital-occlusion-workflow | image | approved-public | assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-occlusion-01.png | Approved synthetic-data multi-view occlusion and contact visualization. |
| digital-occlusion-workflow-evaluation-01 | digital-occlusion-workflow | image | approved-public | assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-evaluation-01.png | Approved synthetic-data evaluation UI; displayed values are not performance outcomes. |
~~~

Create README.md with this exact public boundary:

~~~markdown
# Digital Occlusion Workflow Public Media

These five files are the complete approved public-media set for this case:

- `digital-occlusion-workflow-demo-01.mp4`
- `digital-occlusion-workflow-poster-01.png`
- `digital-occlusion-workflow-landmark-01.png`
- `digital-occlusion-workflow-occlusion-01.png`
- `digital-occlusion-workflow-evaluation-01.png`

They are cropped, metadata-stripped derivatives of a synthetic-data development recording and contain no real patient data. The source recording, internal project or repository names, local paths, and other source artifacts remain private and must not be copied into this repository. Displayed evaluation values are UI examples, not performance outcomes, clinical-validation results, or medical-device claims.
~~~

- [ ] **Step 7: Extend recursive media and per-item video validation**

Make canonicalMediaEntries and publicPortfolioVisualFiles include every story media item and nested poster. When the canonical lead/video alias shares one ID and path, build the evidence lookup so the policy-bearing declaration wins; reject conflicting policies instead of silently overwriting them. Pass that declaration's videoPolicy to approvedMp4Errors. The binary policy-aware branch verifies max bytes, duration tolerance, width, height, H.264, no audio, and moov before mdat; legacy media without videoPolicy retains the current 15–30-second and 20 MiB contract. Keep declared frameRate/pixelFormat in the schema, but verify their actual 24fps/yuv420p values with FFprobe in Tasks 3 and 8 rather than adding an FFprobe runtime dependency to the Node validator.

Export canonicalMediaEntries and approvedMp4Errors for tests.

- [ ] **Step 8: Add both localized route shells and fallback links**

Create the KO shell with:

~~~html
<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="구강악안면 디지털 교합 워크플로우의 통합 UI/UX, 엔진 연결, 연구진 검증 범위와 한계를 설명합니다.">
<link rel="canonical" href="https://rafaam11.github.io/projects/digital-occlusion-workflow/">
<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/projects/digital-occlusion-workflow/"><link rel="alternate" hreflang="en" href="https://rafaam11.github.io/en/projects/digital-occlusion-workflow/"><link rel="alternate" hreflang="x-default" href="https://rafaam11.github.io/projects/digital-occlusion-workflow/">
<title>구강악안면 디지털 교합 워크플로우 · Jinmin Kim</title><link rel="icon" href="../../assets/img/favicon.ico">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"><link rel="stylesheet" href="../../css/site.css"><link rel="stylesheet" href="../../css/scholar.css">
</head><body class="td-shell sc-case-page" data-base="../../" data-page="projects" data-lang="ko" data-route="projects/digital-occlusion-workflow/"><header id="site-nav"></header>
<main id="main-content" data-portfolio="case-study" data-project="digital-occlusion-workflow" tabindex="-1"><article class="td-case-fallback"><h1>구강악안면 디지털 교합 워크플로우</h1><p>특징점·교합·평가를 연구진이 한 앱에서 다루는 end-to-end 워크플로우로 재설계했습니다.</p><a href="../../assets/pdfs/digital-occlusion-workflow-ko.pdf">사례 PDF 열기</a></article></main>
<footer id="site-footer"></footer><script src="../../js/site-i18n.js"></script><script src="../../js/portfolio-data.js"></script><script src="../../js/portfolio-render.js"></script><script src="../../js/nav.js"></script></body></html>
~~~

Create the EN shell with:

~~~html
<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="The integrated UI/UX, engine connections, researcher-validation scope, and limits of the Maxillofacial Digital Occlusion Workflow.">
<link rel="canonical" href="https://rafaam11.github.io/en/projects/digital-occlusion-workflow/">
<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/projects/digital-occlusion-workflow/"><link rel="alternate" hreflang="en" href="https://rafaam11.github.io/en/projects/digital-occlusion-workflow/"><link rel="alternate" hreflang="x-default" href="https://rafaam11.github.io/projects/digital-occlusion-workflow/">
<title>Maxillofacial Digital Occlusion Workflow · Jinmin Kim</title><link rel="icon" href="../../../assets/img/favicon.ico">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"><link rel="stylesheet" href="../../../css/site.css"><link rel="stylesheet" href="../../../css/scholar.css">
</head><body class="td-shell sc-case-page" data-base="../../../" data-page="projects" data-lang="en" data-route="projects/digital-occlusion-workflow/"><header id="site-nav"></header>
<main id="main-content" data-portfolio="case-study" data-project="digital-occlusion-workflow" tabindex="-1"><article class="td-case-fallback"><h1>Maxillofacial Digital Occlusion Workflow</h1><p>Redesigned landmarking, occlusion, and evaluation as an end-to-end workflow that researchers can operate in one application.</p><a href="../../../assets/pdfs/digital-occlusion-workflow-en.pdf">Open case-study PDF</a></article></main>
<footer id="site-footer"></footer><script src="../../../js/site-i18n.js"></script><script src="../../../js/portfolio-data.js"></script><script src="../../../js/portfolio-render.js"></script><script src="../../../js/nav.js"></script></body></html>
~~~

Add the digital-occlusion-workflow fallback card immediately after mandibular-fracture in index.html, en/index.html, projects/index.html, and en/projects/index.html. Use the same localized title and one-sentence summary as the route shells, with links resolved from each shell's existing depth.

- [ ] **Step 9: Update dynamic counts and public documentation**

Replace only canonical counts:

- AGENTS.md: 9 projects, 26 HTML pages, 18 project PDFs; Medical Core 6.
- js/portfolio-render.js validation error: exactly nine projects.
- scripts/validate-portfolio.cjs messages: 18 localized project PDFs, 18 manifest documents, 36 published artifacts, 26-route inventory.
- tests/portfolio.test.cjs names and expectations: eighteen shells/PDFs; unique approved PNG/MP4 derivatives equal the stable Task 1 baseline plus the five files in this case. Replace any stale literal from the pre-SMCNavi baseline, but do not assume 54.

Do not hard-code counts where i18n.canonicalCaseSlugs.length already provides the truth.

- [ ] **Step 10: Run focused data, route, evidence, and media tests**

~~~powershell
node --test --test-name-pattern="digital occlusion|canonical records|case shells|root inventory|evidence|approved MP4" tests/portfolio.test.cjs
node -e "const d=require('./js/portfolio-data.js');const r=require('./js/portfolio-render.js');const v=require('./scripts/validate-portfolio.cjs');const e=[...r.dataErrors(d),...v.evidenceRegistryErrors(d,process.cwd())];if(e.length){console.error(e.join('\n'));process.exit(1)}"
git diff --check
~~~

Expected: focused tests pass. Full validator may still report the two missing new PDFs until Task 7.

- [ ] **Step 11: Review checkpoint without staging**

~~~powershell
git status --short
git diff --stat
git diff -- js/portfolio-data.js js/portfolio-render.js js/site-i18n.js scripts/validate-portfolio.cjs tests/portfolio.test.cjs AGENTS.md index.html en/index.html projects/index.html en/projects/index.html assets/projects/EVIDENCE_REGISTER.md assets/projects/digital-occlusion-workflow/README.md
~~~

Expected: no private source value or unrelated case rewrite appears.

---

### Task 5: Style and visually verify the long-form web case

**Files:**
- Modify: css/scholar.css:74-118
- Modify: tests/portfolio.test.cjs near Scholar CSS and renderer accessibility tests

**Interfaces:**
- Consumes: Task 2 story DOM and Task 4 project data/media.
- Produces: a visually verified use of the landed wide/narrow story and flow system plus a visible related-case link.

- [ ] **Step 1: Invoke the frontend design skill**

Announce and read frontend-design:frontend-design. Apply it within the approved restrained Scholar visual system; do not introduce a new palette, decorative SVG, carousel, lightbox, or framework.

- [ ] **Step 2: Add failing CSS and accessibility tests**

~~~js
test('story CSS keeps media and system flow responsive without decorative components', () => {
  const css = read('css/scholar.css');
  for (const selector of [
    '.sc-story__section',
    '.sc-story__media--grid',
    '.sc-flow__track',
    '.sc-flow__node',
    '.sc-flow__edge',
    '.sc-related-projects'
  ]) assert.match(css, new RegExp(selector.replace(/[.*+?^$()|[\]{}]/g, '\\$&')));
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.sc-story__media--grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.sc-flow__track[\s\S]*flex-direction:\s*column/);
  assert.doesNotMatch(css, /carousel|lightbox|animation-name|filter:\s*drop-shadow/i);
});

test('digital occlusion story uses headings, captions, controls, and no autoplay', () => {
  const html = render.caseStudyHtml(data, 'digital-occlusion-workflow', '../../', false, 'ko');
  assert.equal(count(html, '<h1'), 1);
  assert.ok(count(html, '<h2') >= 7);
  assert.match(html, /<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")/);
  assert.doesNotMatch(html, /\bautoplay\b|\bloop\b/);
  assert.equal(count(html, '<figcaption>'), 6);
});
~~~

- [ ] **Step 3: Run the focused tests and confirm failure**

~~~powershell
node --test --test-name-pattern="story CSS|digital occlusion story uses" tests/portfolio.test.cjs
~~~

Expected: failure only because the new `.sc-related-projects` style is absent; the landed SMCNavi story and flow selectors already pass.

- [ ] **Step 4: Add the restrained related-case style**

Keep every landed `.sc-story*` and `.sc-flow*` rule. Add only the related-project treatment, preserving existing variables:

~~~css
.sc-related-projects { margin-top: 2.5rem; }
.sc-related-projects ul { margin: .5rem 0 0; padding-left: 1.3rem; }
.sc-related-projects li + li { margin-top: .35rem; }
~~~

- [ ] **Step 5: Run focused tests and a local HTTP review**

~~~powershell
node --test --test-name-pattern="story CSS|digital occlusion story uses|Scholar CSS" tests/portfolio.test.cjs
python -m http.server 8000
~~~

Invoke browser:control-in-app-browser and inspect:

- http://127.0.0.1:8000/projects/digital-occlusion-workflow/
- http://127.0.0.1:8000/en/projects/digital-occlusion-workflow/

At approximately 1440×1000 and 390×844, confirm no overflow, four continuous numbered media figures plus two titled semantic diagrams, readable diagrams, one-column narrow grids, usable native controls, visible captions, exact status, and reciprocal related link. Confirm the existing SMCNavi page retains its landed figure numbering and horizontal-to-vertical flow behavior. If the in-app browser is unavailable, record that limitation and stop visual claims.

- [ ] **Step 6: Review checkpoint without staging**

~~~powershell
git diff --check
git diff -- css/scholar.css tests/portfolio.test.cjs
git status --short
~~~

---

### Task 6: Synchronize the canonical Word CV, public CV data, and Home positioning

**Files:**
- Modify in LLMwiki: docs/cv/CV_김진민_2026-08.docx
- Regenerate in LLMwiki: docs/cv/CV_김진민_2026-08.pdf
- Modify in LLMwiki: tools/cv-media/cv-maps/cv-map-en.json
- Verify in LLMwiki: tools/cv-media/cv-maps/cv-map-ko.json
- Regenerate in LLMwiki: docs/cv/_work/cv-out/cv-{ko,en}.docx and cv-{ko,en}.pdf
- Modify in portfolio: data/public-cv.json
- Modify in portfolio: index.html, en/index.html
- Regenerate in portfolio: cv/index.html, en/cv/index.html
- Replace in portfolio: assets/cv/jinmin-kim-cv-{ko,en}.pdf
- Modify: tests/portfolio.test.cjs

**Interfaces:**
- Consumes: current live Word CV, approved concise Word copy, approved full web-CV copy, and existing localization/publishing tools.
- Produces: current canonical Word/PDF, two sanitized 2-page public CV PDFs, matching JSON/HTML, and approved Home positioning.

- [ ] **Step 1: Invoke the document and PDF skills before binary edits**

Announce and read documents:documents and pdf:pdf. Follow their render-and-inspect workflows. Keep review renders under ignored .superpowers/ or the process temp directory.

- [ ] **Step 2: Recheck the live CV hashes and protect existing user changes**

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
$cvGuard = Get-Content -Raw -LiteralPath (Join-Path $env:TEMP 'digital-occlusion-cv-source-20260822.json') | ConvertFrom-Json
$currentDocx = Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.docx'
$currentPdf = Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.pdf'
foreach ($row in $cvGuard) {
  $path = if ($row.Name.EndsWith('.docx')) { $currentDocx } else { $currentPdf }
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  if ($hash -ne $row.Sha256) { throw "CV source changed after planning: $($row.Name)" }
}
~~~

Expected: no external edit occurred after Task 1. If it did, re-read and merge instead of overwriting.

- [ ] **Step 3: Add failing Home and public-CV tests**

~~~js
test('Home positions the current Samsung Medical Center surgical-planning collaboration in both languages', () => {
  assert.match(read('index.html'), /현재 삼성서울병원과 장기 협력하며, 디지털 교합에서 전체 구강악안면 수술계획으로 확장되는 대규모 소프트웨어를 개발하고 있습니다\./);
  assert.match(read('en/index.html'), /currently developing large-scale software with Samsung Medical Center through a long-term collaboration, expanding from digital occlusion toward end-to-end oral and maxillofacial surgical planning\./i);
});

test('public CV records the ongoing digital occlusion technical-lead scope without deployment claims', () => {
  const cv = JSON.parse(read('data/public-cv.json'));
  const area = cv.experience[0].areas[0];
  const ko = area.translations.ko.items.join('\n');
  const en = area.translations.en.items.join('\n');
  assert.match(ko, /2026\.03–현재.*기술 리드·메인 개발자.*연구진 검증/);
  assert.match(en, /Since 2026\.03.*technical lead and primary developer.*researcher validation is ongoing/i);
  assert.doesNotMatch(ko + en, /병원 설치|실제 수술|clinical efficacy|medical-device status/i);
});
~~~

- [ ] **Step 4: Run focused tests and confirm failure**

~~~powershell
node --test --test-name-pattern="Home positions|public CV records" tests/portfolio.test.cjs
~~~

- [ ] **Step 5: Update the current Word CV without replacing prior binary work**

Use the document skill to locate the paragraph beginning with “삼성서울병원 구강악안면외과와 협업”. Preserve its paragraph style and bold groups. Replace only its final parenthetical detail with:

~~~text
(수술내비게이션·HoloLens 2·Meta Quest 통합, 2026.03– 디지털 교합 SW 기술 리드: Custom App 아키텍처·UI/UX·특징점·교합 엔진 통합·평가/내보내기, 연구진 검증 중)
~~~

Apply that replacement and export the canonical PDF through Word without rebuilding the document:

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
$currentDocx = Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.docx'
$currentPdf = Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.pdf'
$replacement = '(수술내비게이션·HoloLens 2·Meta Quest 통합, 2026.03– 디지털 교합 SW 기술 리드: Custom App 아키텍처·UI/UX·특징점·교합 엔진 통합·평가/내보내기, 연구진 검증 중)'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$document = $null
try {
  $document = $word.Documents.Open($currentDocx)
  $matches = @($document.Paragraphs | Where-Object { $_.Range.Text.Trim().StartsWith('삼성서울병원 구강악안면외과와 협업') })
  if ($matches.Count -ne 1) { throw "Expected one Samsung collaboration paragraph, found $($matches.Count)." }
  $paragraph = $matches[0]
  $paragraphText = $paragraph.Range.Text.TrimEnd([char[]]"`r`a")
  $open = $paragraphText.LastIndexOf('(')
  if ($open -lt 0) { throw 'Samsung collaboration paragraph has no final parenthetical detail.' }
  $target = $paragraph.Range.Duplicate
  $target.SetRange($paragraph.Range.Start + $open, $paragraph.Range.End - 1)
  $target.Text = $replacement
  $document.Save()
  $document.ExportAsFixedFormat($currentPdf, 17)
} finally {
  if ($document) { $document.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
  $word.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
~~~

Keep the current source filename and do not add a third page. Re-open the paragraph after save and verify all text before the replaced range, paragraph style, and bold run boundaries are unchanged.

- [ ] **Step 6: Re-dump groups and update the English localization map**

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
$pdfPython = if ($env:PORTFOLIO_PDF_PYTHON) { $env:PORTFOLIO_PDF_PYTHON } else { (Resolve-Path '.superpowers\sdd\2026-08-16-3d-registration-partner-portfolio\.venv-pdf\Scripts\python.exe').Path }
Push-Location -LiteralPath $wikiRoot
try {
  & $pdfPython tools\cv-media\docx-localize.py --source docs\cv\CV_김진민_2026-08.docx --target NUL --mapping tools\cv-media\cv-maps\cv-map-en.json --dump
  if ($LASTEXITCODE -ne 0) { throw 'CV group dump failed.' }
} finally {
  Pop-Location
}
~~~

Find the same Samsung collaboration paragraph by text, not by assuming its old index. Update cv-map-en.json for its final group to:

~~~text
(surgical navigation, HoloLens 2, and Meta Quest integration; since 2026.03, technical lead for digital-occlusion software: Custom App architecture, UI/UX, landmark and occlusion-engine integration, evaluation/export, under researcher validation)
~~~

Re-run --dump and verify every cv-map-ko.json and cv-map-en.json paragraph/group key exists.

- [ ] **Step 7: Regenerate localized Word/PDF files and publish sanitized CV PDFs**

Regenerate both localized DOCX files, export them with Word format 17, and publish them from the portfolio worktree:

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
$portfolioRoot = (Get-Location).Path
$pdfPython = if ($env:PORTFOLIO_PDF_PYTHON) { $env:PORTFOLIO_PDF_PYTHON } else { (Resolve-Path '.superpowers\sdd\2026-08-16-3d-registration-partner-portfolio\.venv-pdf\Scripts\python.exe').Path }
$sourceDocx = Join-Path $wikiRoot 'docs\cv\CV_김진민_2026-08.docx'
$outDir = Join-Path $wikiRoot 'docs\cv\_work\cv-out'
$localize = Join-Path $wikiRoot 'tools\cv-media\docx-localize.py'
$koMap = Join-Path $wikiRoot 'tools\cv-media\cv-maps\cv-map-ko.json'
$enMap = Join-Path $wikiRoot 'tools\cv-media\cv-maps\cv-map-en.json'
$koDocx = Join-Path $outDir 'cv-ko.docx'
$enDocx = Join-Path $outDir 'cv-en.docx'
$koPdf = Join-Path $outDir 'cv-ko.pdf'
$enPdf = Join-Path $outDir 'cv-en.pdf'
& $pdfPython $localize --source $sourceDocx --target $koDocx --mapping $koMap
if ($LASTEXITCODE -ne 0) { throw 'Korean CV localization failed.' }
& $pdfPython $localize --source $sourceDocx --target $enDocx --mapping $enMap
if ($LASTEXITCODE -ne 0) { throw 'English CV localization failed.' }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  foreach ($row in @(@{ Docx = $koDocx; Pdf = $koPdf }, @{ Docx = $enDocx; Pdf = $enPdf })) {
    $document = $word.Documents.Open($row.Docx, $false, $true)
    try { $document.ExportAsFixedFormat($row.Pdf, 17) }
    finally { $document.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
  }
} finally {
  $word.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}

& $pdfPython (Join-Path $wikiRoot 'tools\cv-media\publish-cv-pdf.py') --source $koPdf --target (Join-Path $portfolioRoot 'assets\cv\jinmin-kim-cv-ko.pdf') --title '김진민 (Jinmin Kim) — Curriculum Vitae'
if ($LASTEXITCODE -ne 0) { throw 'Korean public CV publish failed.' }
& $pdfPython (Join-Path $wikiRoot 'tools\cv-media\publish-cv-pdf.py') --source $enPdf --target (Join-Path $portfolioRoot 'assets\cv\jinmin-kim-cv-en.pdf') --title 'Jinmin Kim — Curriculum Vitae'
if ($LASTEXITCODE -ne 0) { throw 'English public CV publish failed.' }
~~~

Expected: each command reports 2 pages, public links, and no prohibited name, phone, path, or authoring metadata.

- [ ] **Step 8: Update public-cv JSON and Home copy**

Insert immediately after the existing Samsung collaboration item:

~~~json
"2026.03–현재 삼성서울병원 연구진과 구강악안면 디지털 교합 워크플로우를 공동 개발. 기술 리드·메인 개발자로 Custom App 아키텍처, end-to-end UI/UX, 특징점·교합 엔진 통합, 평가·내보내기 파이프라인을 담당하며 연구진 검증을 진행 중."
~~~

and:

~~~json
"Since 2026.03, co-developing a maxillofacial digital-occlusion workflow with Samsung Medical Center researchers. As technical lead and primary developer, owning the Custom App architecture, end-to-end UI/UX, landmark and occlusion-engine integration, and the evaluation/export pipeline while researcher validation is ongoing."
~~~

Replace the Home ledes with these exact strings:

~~~html
<p class="sc-intro__lede">3D 정합·의료영상·로봇 시스템을 연구에서 현장까지 잇는 로봇SW 엔지니어입니다. 현재 삼성서울병원과 장기 협력하며, 디지털 교합에서 전체 구강악안면 수술계획으로 확장되는 대규모 소프트웨어를 개발하고 있습니다.</p>
~~~

~~~html
<p class="sc-intro__lede">I am a robotics software engineer connecting 3D registration, medical imaging, and robotic systems from research to the field. I am currently developing large-scale software with Samsung Medical Center through a long-term collaboration, expanding from digital occlusion toward end-to-end oral and maxillofacial surgical planning.</p>
~~~

Replace the two Home meta descriptions with:

~~~html
<meta name="description" content="3D 정합·의료영상·로봇 시스템을 연구에서 현장까지 잇고, 삼성서울병원과 장기 협력하며 디지털 교합에서 전체 구강악안면 수술계획으로 확장되는 대규모 소프트웨어를 개발하는 로봇SW 엔지니어 김진민의 포트폴리오입니다.">
~~~

~~~html
<meta name="description" content="Portfolio of Jinmin Kim, a robotics software engineer connecting 3D registration, medical imaging, and robotic systems from research to the field while developing large-scale software with Samsung Medical Center from digital occlusion toward end-to-end oral and maxillofacial surgical planning.">
~~~

- [ ] **Step 9: Regenerate CV HTML and verify two-page documents visually**

~~~powershell
node scripts/public-cv-summary.cjs --write
node --test --test-name-pattern="Home positions|public CV records|public CV|CV summary" tests/portfolio.test.cjs
node scripts/validate-portfolio.cjs
git diff --check
~~~

The portfolio validator may still report missing new project PDFs; no CV-specific error may remain.

Render the canonical Word CV, both localized Word files, canonical PDF, and both public PDFs. Verify A4 two pages, no clipped last line, Korean/English glyphs, preserved bold spans, working public links, and identical digital-occlusion meaning.

- [ ] **Step 10: Review cross-repository diffs without staging**

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
git status --short
git diff -- data/public-cv.json index.html en/index.html cv/index.html en/cv/index.html tests/portfolio.test.cjs
git -C $wikiRoot status --short
git -C $wikiRoot diff -- tools/cv-media/cv-maps/cv-map-ko.json tools/cv-media/cv-maps/cv-map-en.json
~~~

Expected: pre-existing LLMwiki changes remain visible and untouched outside the current CV paragraph/map. Do not stage either repository.

---

### Task 7: Extend the PDF pipeline and generate the 18 localized project PDFs

**Files:**
- Modify: tests/portfolio.test.cjs
- Modify: scripts/validate-portfolio.cjs:24,1244-1420
- Modify: scripts/generate-portfolio-pdfs.py:29-50,311-467,928-1189,1428-1500
- Verify without expected edit: scripts/export-portfolio-data.cjs
- Verify without expected edit: scripts/portfolio-pdf-source.cjs
- Regenerate: output/pdf/*.pdf
- Regenerate: assets/pdfs/*.pdf
- Regenerate: output/pdf/manifest.json

**Interfaces:**
- Consumes: 9-project canonical data, story sections, two diagram references, three story image IDs, all registered evidence, and updated public CV data.
- Produces: generator 3.2, two new 6–8 page case PDFs, unchanged content for the existing 16 PDFs, and a coherent 18-document/36-artifact manifest.

- [ ] **Step 1: Invoke the PDF skill for generation and review**

Announce and read pdf:pdf. Use its render-and-inspect workflow and keep page PNGs under ignored .superpowers/reviews/digital-occlusion-pdf/.

- [ ] **Step 2: Add failing schema, generation, and manifest tests**

~~~js
test('PDF source preserves the digital occlusion story, two diagrams, and three selected figures', () => {
  const payload = require('../scripts/export-portfolio-data.cjs').exportData();
  const project = payload.projects.find((item) => item.slug === 'digital-occlusion-workflow');
  assert.equal(payload.schemaVersion, 1);
  assert.equal(project.storySections.length, 6);
  assert.deepEqual(project.pdfSequence.diagrams, [
    { storySectionKey: 'integrated-workflow' },
    { storySectionKey: 'system-architecture' }
  ]);
  assert.deepEqual(project.pdfSequence.figureIds, [
    'digital-occlusion-workflow-landmark-01',
    'digital-occlusion-workflow-occlusion-01',
    'digital-occlusion-workflow-evaluation-01'
  ]);
});

test('PDF manifest expands to eighteen documents and thirty-six published artifacts', () => {
  const manifest = JSON.parse(read('output/pdf/manifest.json'));
  assert.equal(manifest.documents.length, 18);
  assert.equal(manifest.artifacts.length, 36);
  assert.equal(manifest.generatorVersion, '3.2');
});
~~~

Extend the integration PDF audit to require:

~~~js
{
  ko: ['구강악안면 디지털 교합 워크플로우', '기술 리드', '연구진 검증', 'RMSE', 'Gap', 'FRE', '개인 소유와 팀 결과 분리'],
  en: ['Maxillofacial Digital Occlusion Workflow', 'Technical Lead', 'Researcher Validation', 'RMSE', 'Gap', 'FRE', 'Individual ownership separated from team results']
}
~~~

and reject hospital deployment, real-surgery use, clinical efficacy, internal project names, private URLs, and local paths.

- [ ] **Step 3: Run focused PDF tests and confirm failure**

~~~powershell
node --test --test-name-pattern="PDF source preserves the digital occlusion|PDF manifest expands|diagram contracts|integrated review renders" tests/portfolio.test.cjs
~~~

Expected: failure on the ninth slug, story PDF sequence, and missing artifacts.

- [ ] **Step 4: Extend schema validation while preserving legacy projects**

Set GENERATOR_VERSION and pdfGeneratorVersion to “3.2”. Add digital-occlusion-workflow after mandibular-fracture in EXPECTED_SLUGS.

For projects with non-empty storySections:

- permit empty blocks;
- validate unique story keys, translations, media, diagrams, and placements;
- resolve pdfSequence.middle against story keys;
- accept either the existing singular diagram reference used by another long-form case or the new diagrams array, never both;
- require every diagram reference to resolve to a story section containing kind “system-flow”;
- accept 1–6 unique figureIds that resolve to approved canonical image media or an approved video with an approved poster;
- retain the existing exact legacy three-key pdfSequence and four-node diagram rules for projects without storySections.

Keep top-level PDF input schemaVersion at 1.

- [ ] **Step 5: Implement shared story/PDF resolver helpers**

canonical_project_media indexes lead, video, top-level poster, references, gallery, story media, and nested story posters by ID.

~~~py
def resolve_sequence_sections(project, locale):
    source = project.get("storySections") or project.get("blocks")
    by_key = {item["key"]: item for item in source}
    return [(by_key[key], localized(by_key[key], locale)) for key in project["pdfSequence"]["middle"]]

def resolve_sequence_diagrams(project):
    sequence = project["pdfSequence"]
    references = sequence.get("diagrams")
    if references is None:
        single = sequence.get("diagram")
        references = [single] if isinstance(single, dict) and "storySectionKey" in single else []
    by_key = {section["key"]: section for section in project.get("storySections", [])}
    return [by_key[reference["storySectionKey"]]["diagram"] for reference in references]
~~~

selected_media_image returns the item itself for an approved image, the nested poster for story video, and the top-level poster for the lead video.

- [ ] **Step 6: Render both semantic diagrams and selected figures**

Add:

~~~py
def system_flow_diagram(self, diagram: dict[str, Any], locale: str, y: float) -> float:
~~~

Draw translated nodes as full-width stacked boxes and edges as → or ⇄ labels, ending with boundaryLabel. Use the same canonical nodes/edges as the web. Avoid crossed arrows and call doc.ensure before each diagram.

For a story project, generate_project_pdf:

- uses resolve_sequence_sections;
- prints body then bullets;
- draws both resolved semantic diagrams in declared order;
- selects the lead poster plus figureIds in order;
- prints role, teamResult, evidence, limitation, collaboration, technologies, and links from canonical fields;
- uses copy.periodLabel || project.period so the Korean PDF shows `2026.03 – 현재` and the English PDF shows `2026.03 – present`;
- uses copy.status for the exact cover label.

The legacy generator path and existing diagram drawing remain unchanged.

- [ ] **Step 7: Preserve the existing PDF link surface**

Keep relatedProjectSlugs as a web-only navigation contract. Do not add it to public_project_links or the external project.links array: the approved reciprocal relation is required on the two web case pages, while omitting it from PDFs lets the existing mandibular-fracture PDF remain byte-identical. The new PDF still includes the canonical portfolio, email, and project links already emitted by the generator.

- [ ] **Step 8: Export canonical input and regenerate atomically**

~~~powershell
$pdfInput = Join-Path $env:TEMP 'digital-occlusion-portfolio-pdf-input-20260822.json'
$pdfReview = Join-Path (Resolve-Path -LiteralPath .superpowers).Path 'reviews\digital-occlusion-pdf'
$pdfPython = if ($env:PORTFOLIO_PDF_PYTHON) { $env:PORTFOLIO_PDF_PYTHON } else { (Resolve-Path '.superpowers\sdd\2026-08-16-3d-registration-partner-portfolio\.venv-pdf\Scripts\python.exe').Path }
node scripts/export-portfolio-data.cjs --output $pdfInput
if ($LASTEXITCODE -ne 0) { throw 'Portfolio PDF export failed.' }
& $pdfPython scripts/generate-portfolio-pdfs.py --input $pdfInput --output-dir output\pdf --publish-root . --review-dir $pdfReview
if ($LASTEXITCODE -ne 0) { throw 'Portfolio PDF generation failed.' }
~~~

Expected: 18 PDFs, 18 document records, 36 artifact records, generator 3.2.

- [ ] **Step 9: Inspect both new PDFs and compare existing PDF content**

Render every page of digital-occlusion-workflow-ko.pdf and digital-occlusion-workflow-en.pdf. Confirm 6–8 pages, readable diagrams, no clipped caption, correct bilingual copy, representative poster and three screens, role/team separation, explicit limitation, public links, and no blank page.

Compare the existing 16 PDFs against the Task 1 guard:

~~~powershell
$before = Get-Content -Raw -LiteralPath (Join-Path $env:TEMP 'digital-occlusion-existing-pdfs-20260822.json') | ConvertFrom-Json
$changed = foreach ($row in $before) {
  $path = Join-Path 'assets\pdfs' $row.Name
  if (-not (Test-Path -LiteralPath $path)) { $row.Name; continue }
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  if ($hash -ne $row.Sha256) { $row.Name }
}
if ($changed.Count) { throw "Existing project PDF bytes changed: $($changed -join ', ')" }
~~~

Expected: no existing PDF hash change. The new two PDF pairs and manifest are the only project-PDF additions.

- [ ] **Step 10: Run PDF freshness and full automated checks**

~~~powershell
node --test --test-name-pattern="PDF source preserves the digital occlusion|PDF manifest expands|manifest freshness|integrated review renders" tests/portfolio.test.cjs
node scripts/validate-portfolio.cjs
git diff --check
~~~

Expected: no stale source digest, generator hash, evidence, page count, or artifact hash.

---

### Task 8: Complete automated, visual, file://, privacy, and final-diff verification

**Files:**
- Verify: every changed source, route, media, CV, project PDF, manifest, and LLMwiki CV map/source
- No new tracked file

**Interfaces:**
- Consumes: completed Tasks 1–7.
- Produces: evidence-backed acceptance record and an unstaged, uncommitted implementation for owner review.

- [ ] **Step 1: Invoke verification-before-completion**

Announce and read superpowers:verification-before-completion before any completion claim.

- [ ] **Step 2: Run the three repository gates**

~~~powershell
node --test
node scripts/validate-portfolio.cjs
git diff --check
~~~

Expected: all exit 0; validator reports 9 projects, 5 capabilities, and 26 localized pages.

- [ ] **Step 3: Verify the final MP4 contract**

Run the Task 3 FFprobe assertions against assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4. Additionally call:

~~~powershell
node -e "const v=require('./scripts/validate-portfolio.cjs');const d=require('./js/portfolio-data.js');const p=d.projects.find(x=>x.slug==='digital-occlusion-workflow');const e=v.approvedMp4Errors(p.media.lead.publicPath,p.media.lead.videoPolicy);if(e.length){console.error(e.join('\n'));process.exit(1)}"
~~~

Expected: 31.0±0.2s, 960×460, 24fps, H.264 yuv420p, no audio, fast-start, ≤20 MiB, no prohibited metadata.

- [ ] **Step 4: Search actual public text and generated artifacts for forbidden boundaries**

~~~powershell
$publicTextScope = @(
  'js/portfolio-data.js',
  'assets/projects/digital-occlusion-workflow/README.md',
  'assets/projects/EVIDENCE_REGISTER.md',
  'projects/digital-occlusion-workflow/index.html',
  'en/projects/digital-occlusion-workflow/index.html',
  'index.html',
  'en/index.html',
  'data/public-cv.json',
  'cv/index.html',
  'en/cv/index.html'
)
$forbidden = 'digitrack-inc|[A-Za-z]:\\|file://|PatientName|PatientID|실제 수술 사용|임상 효능|clinical efficacy|engine implementation by me'
$matches = rg -n -i --pcre2 $forbidden $publicTextScope
if ($LASTEXITCODE -eq 0) { $matches; throw 'Forbidden public claim or source value found.' }
if ($LASTEXITCODE -ne 1) { throw 'Public-boundary search failed.' }
~~~

Run the project’s existing public PII validator over all PDFs and text. Confirm no private repository link, individual collaborator name, patient identifier, or absolute path.

- [ ] **Step 5: Start local HTTP preview and inspect wide layouts**

~~~powershell
python -m http.server 8000
~~~

With the in-app browser at approximately 1440×1000 inspect:

- /
- /projects/
- /cv/
- /contact/
- /projects/digital-occlusion-workflow/
- /en/projects/digital-occlusion-workflow/
- /projects/mandibular-fracture/
- /en/projects/mandibular-fracture/

Check project order, exact status, Home two-sentence positioning, CV bullet, poster-led video, four continuous numbered media figures, two titled diagrams, captions, role/team separation, roadmap boundary, reciprocal link, PDF links, shared nav/footer, and console errors.

- [ ] **Step 6: Inspect the same routes at a narrow viewport**

At approximately 390×844, confirm one-column media, stacked diagram nodes, no crossed/clipped labels, no horizontal scroll, readable captions, and usable video controls.

- [ ] **Step 7: Exercise video and direct file:// paths**

On both localized case pages, confirm no autoplay/audio, start/pause/seek near 8s, 20s, and 30s, and successful decoding. Open:

~~~text
projects/digital-occlusion-workflow/index.html
en/projects/digital-occlusion-workflow/index.html
~~~

through file:// in the in-app browser. Verify video, poster, three screens, KO/EN switch, reciprocal related link, PDFs, nav, and contact link.

- [ ] **Step 8: Verify project and CV PDFs**

Use the PDF skill outputs and pypdf to assert:

- digital-occlusion-workflow KO/EN: 6–8 pages, at least one URI link, no attachment, required title/status/role/RMSE/Gap/FRE/ownership-boundary text;
- public CV KO/EN: exactly 2 A4 pages, at least one URI link, no attachment, approved digital-occlusion technical-lead text;
- every project output PDF equals its assets/pdfs counterpart;
- manifest has 18 documents and 36 artifacts with current hashes.

- [ ] **Step 9: Check LLMwiki source preservation**

~~~powershell
$wikiRootInput = [Environment]::GetEnvironmentVariable('LLMWIKI_ROOT', 'Process')
if (-not $wikiRootInput) { throw 'Missing process-only LLMwiki binding.' }
$wikiRoot = (Resolve-Path -LiteralPath $wikiRootInput).Path
git -C $wikiRoot status --short
git -C $wikiRoot diff --numstat -- docs/cv/CV_김진민_2026-08.docx docs/cv/CV_김진민_2026-08.pdf tools/cv-media/cv-maps/cv-map-ko.json tools/cv-media/cv-maps/cv-map-en.json
~~~

Expected: the canonical Word/PDF contain the new approved meaning, pre-existing unrelated LLMwiki paths remain intact, and no LLMwiki file is staged.

- [ ] **Step 10: Review the exact final portfolio diff and leave it uncommitted**

~~~powershell
git status --short --branch
git diff --stat
git diff --name-status
git diff --check
git diff -- AGENTS.md js/portfolio-data.js js/portfolio-render.js js/site-i18n.js css/scholar.css scripts/validate-portfolio.cjs scripts/generate-portfolio-pdfs.py tests/portfolio.test.cjs data/public-cv.json index.html en/index.html projects/index.html en/projects/index.html cv/index.html en/cv/index.html assets/projects/EVIDENCE_REGISTER.md assets/projects/digital-occlusion-workflow/README.md output/pdf/manifest.json
~~~

Expected: only scoped source/docs/evidence/media/routes, two new project PDFs in both locations, regenerated public CV PDFs, and coherent manifest differ. No file is staged. Do not commit, push, deploy, or mark atlas #684 complete.

---

## Acceptance summary

The implementation is ready for owner review only when all of these are true together:

- 9 projects appear in the approved order across canonical data, Home, Projects, and both locale routes;
- the new KO/EN case shows the same six-section story, 31-second synthetic-data montage, three evidence screens, two semantic diagrams, and reciprocal mandibular link;
- the author’s architecture/workflow/UI/integration/evaluation ownership is concrete and separate from collaborative algorithms, engines, clinical definitions, and team review;
- current implementation, ongoing researcher validation, and future mandibular-motion/full-surgical-planning direction are clearly separated;
- Home, public CV JSON/HTML/PDF, and canonical Word CV carry the approved Samsung Medical Center collaboration boundary;
- 18 project PDFs and 36 PDF artifacts have a current manifest, while the previous 16 project PDFs retain their bytes;
- all automated, HTTP, narrow/wide, file://, media, privacy, Word, and PDF gates pass;
- both repositories remain uncommitted, unpushed, undeployed, and ready for explicit owner review.
