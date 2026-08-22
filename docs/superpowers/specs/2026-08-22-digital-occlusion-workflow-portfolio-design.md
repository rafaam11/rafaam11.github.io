# 구강악안면 디지털 교합 워크플로우 포트폴리오 설계

> 2026-08-22 · 사용자 인터뷰로 승인된 범위의 정본이다. 공개 포트폴리오에는 일반화한 프로젝트명만 사용하며, 내부 프로젝트명·사설 저장소·개인 이름·로컬 경로는 공개하지 않는다.

## 목표

삼성서울병원과 DIGITRACK의 장기 연구 협력에서 개발 중인 디지털 교합 소프트웨어를 독립된 아홉 번째 사례로 추가한다. 이 사례의 핵심은 개별 알고리즘을 새로 발명했다는 주장이 아니라, 분리되어 있던 특징점·교합·평가 기능을 연구진이 한 앱에서 직접 다룰 수 있는 사용자 친화적 end-to-end 워크플로우로 재설계하고 통합한 기술 리드의 역할이다.

주요 독자는 다음 세 집단을 같은 비중으로 둔다.

1. 박사과정 지도교수 후보와 연구 협력자
2. 의료·로봇 R&D 기술 리드
3. 병원·산업 공동개발 파트너

## 공개 포지셔닝

- Korean title: `구강악안면 디지털 교합 워크플로우`
- English title: `Maxillofacial Digital Occlusion Workflow`
- Slug: `digital-occlusion-workflow`
- Period: `2026.03 – 현재` / `2026.03 – present`
- Public status: `진행 중 · 연구진 검증` / `Ongoing · Researcher Validation`
- Role: `기술 리드 · 메인 개발자` / `Technical Lead · Primary Developer`
- Group: `의료 코어` / `Medical Core`
- Order: `하악골 골절 정복 최적화` 바로 다음
- Capabilities: `의료 내비게이션 및 시각화` primary, `3D 기하 및 정합` cross-capability
- Technologies: `3D Slicer`, `C++`, `Qt`, `Python`, `VTK`, `PyBullet`, `SOFA`
- Collaboration: 삼성서울병원 연구진과 DIGITRACK의 공동 연구개발

대표 문장은 다음으로 고정한다.

- KO: `분리된 특징점·교합·평가 기능을 연구진이 한 앱에서 직접 다룰 수 있는 사용자 친화적 end-to-end 워크플로우로 재설계했습니다.`
- EN: `Redesigned separate landmarking, occlusion, and evaluation tools into a user-friendly end-to-end workflow that researchers can operate in one application.`

`대규모 소프트웨어`는 사용 병원 수나 배포 규모를 뜻하지 않는다. 디지털 교합에서 계측, 하악 운동, 전체 구강악안면 수술계획으로 확장되는 넓은 기능 범위와 병원–기업의 장기 R&D 축을 뜻한다.

## 사실과 기여 경계

### 공개 가능한 현재 사실

- 8개 3D 모델을 준비하고 관리하는 전처리 흐름이 동작한다.
- 치아 특징점 30개(상악 15개, 하악 15개)와 악안면 특징점 30개를 한 앱에서 입력·가시화한다.
- 특징점으로 해부학적 좌표계를 구성한다.
- 자동 교합, 6-DOF 조정, 접촉 분석을 하나의 작업 흐름으로 연결한다.
- RMSE, Gap, FRE를 계산·표시하고 결과를 내보내는 평가 흐름이 동작한다.
- 개발·시연 빌드를 삼성서울병원 연구진이 직접 사용하며 워크플로우 사용성과 교합 결과를 검토 중이다.
- 병원 설치형 제품, 임상 배포, 의료기기, 임상 효능 검증 상태는 아니다.

화면에 보이는 RMSE, Gap, FRE 값은 인터페이스와 계산 파이프라인이 동작한다는 예시일 뿐, 정확도·성능 성과로 인용하지 않는다.

### 개인 소유 범위

- 임상 요구사항을 소프트웨어 구조와 우선순위로 번역하는 기술 리드
- C++/Qt 셸, Python 모듈, 공통 라이브러리로 구성된 3D Slicer Custom App 전체 아키텍처 설계
- 데이터 준비부터 특징점, 교합, 평가, 내보내기까지 end-to-end 워크플로우와 UI/UX 설계·주요 구현
- 특징점 알고리즘과 Geometric, PyBullet, SOFA 기반 교합 엔진의 상태 흐름·UI·시각화 통합
- 평가 지표 계산, 결과 가시화, 내보내기 파이프라인 구현
- CMake/SuperBuild, 테스트, 패키징·설치 프로그램 구성과 개선

### 팀 소유 범위

- 삼성서울병원 연구진: 임상 워크플로우 요구사항, 특징점·평가 지표 정의, 개발 빌드 직접 사용과 피드백
- DIGITRACK 협업진: 특징점 알고리즘과 교합 엔진의 구현·연구 지원
- 전체 협업팀: 워크플로우와 교합 결과에 대한 연구 검토

특징점과 해부학적 좌표 알고리즘은 협업 결과다. Geometric, PyBullet, SOFA 엔진 자체도 개인 구현으로 주장하지 않는다. 개인 기여는 이를 하나의 제품 흐름으로 설계·통합하고 사용 가능한 인터페이스와 평가 파이프라인으로 만든 범위에 한정한다.

### 이전 버전과 관련 사례

2023.04–2023.12의 이전 애플리케이션은 재설계 배경에서만 짧게 언급한다. 당시 개인 역할은 유지보수와 검증이었으며, 새 사례의 표시 기간에는 포함하지 않는다. 현재 프로젝트는 임상 지식과 일부 알고리즘을 이어받았지만 구조와 워크플로우를 다시 설계한 별도 개발이다.

`하악골 골절 정복 최적화` 사례와는 같은 구강악안면·교합 문제 맥락을 공유한다. 그러나 코드와 목표가 다른 별도 프로젝트이며, 논문 결과가 곧바로 제품화되었다고 쓰지 않는다. 두 사례 페이지에는 상호 `관련 프로젝트` 링크만 제공한다.

## 재설계 문제

이전 흐름의 문제를 다음처럼 설명한다.

- 특징점 추출이 별도 앱으로 분리되어 모델의 확대·축소와 이동, 참고 특징점 사진 대조가 불편했다.
- 교합 화면에서 필요한 여러 시점을 동시에 비교하기 어려웠다.
- 저장과 불러오기가 작업 단계와 분리되어 반복 사용이 번거로웠다.
- 악안면 특징점을 활용하지 못했다.
- 결과를 읽고 비교하는 평가 화면이 충분히 설계되지 않았다.
- 기존 키보드 단축키가 불편했다.

단축키 불편은 배경으로만 남긴다. 현재 버전에서 단축키 체계를 개선했다고 주장하지 않는다.

## 통합 워크플로우

웹과 PDF의 워크플로우 도식은 다음 순서를 동일하게 사용한다.

1. 8개 3D 모델 준비
2. 치아·악안면 특징점 입력 및 가시화
3. 해부학적 좌표계 구성
4. 자동 교합과 6-DOF 미세 조정
5. 접촉 상태 분석
6. RMSE·Gap·FRE 평가
7. 결과 저장·내보내기

사용자 중심 설계 결정은 다음 여섯 가지를 실제 화면 근거와 함께 보여준다.

- 확대·축소 가능한 특징점 입력 화면 옆에 참고 이미지를 배치
- 여러 시점을 동시에 확인하는 교합 작업 화면
- 프로젝트 저장·불러오기 흐름의 통합과 단순화
- 교합 과정을 확인하는 시뮬레이션 재생바
- 미세 조정을 위한 피봇 회전 핸들
- 모델 투명도와 특징점 가시성 제어

## 사례 페이지 구성

공유 사례 렌더러 안에서 다음 순서의 장문형 사례를 제공한다. 별도 마이크로사이트나 프레임워크를 만들지 않는다.

1. **Header** — 제목, 기간, 상태, 협업 맥락, 역할
2. **Lead media** — 특징점 → 다중 시점 교합 → 평가의 31초 무음 몽타주
3. **재설계 배경** — 이전 흐름의 불편과 현재 프로젝트의 경계
4. **통합 워크플로우** — 7단계 흐름과 구현된 현재 범위
5. **사용자 중심 설계** — 참고 이미지, 다중 시점, 저장·불러오기, 재생바, 피봇, 가시성 제어
6. **시스템 아키텍처와 소유권** — Custom App 구조, 세 엔진 통합, 개인·팀 역할
7. **검증과 한계** — 연구진 직접 사용, 진행 중인 검토, 정량 성과·임상 배포 비주장
8. **장기 방향** — 정상 교합 기반 하악 운동과 전체 구강악안면 수술계획으로의 확장
9. **관련 프로젝트** — 하악골 골절 정복 최적화

## 시스템 아키텍처

웹과 PDF는 하나의 이중언어 구조화 데이터에서 다음 관계를 렌더링한다.

```text
3D Slicer Custom App
├─ C++ / Qt shell
├─ Python workflow modules
├─ Shared library and project state
├─ Landmark and anatomical-frame integration
├─ Occlusion integration
│  ├─ Geometric engine
│  ├─ PyBullet engine
│  └─ SOFA engine
└─ Evaluation, visualization, and export
```

도식은 엔진을 개인 구현으로 오해하지 않도록 `협업 엔진`과 `통합·상태 흐름·UI는 개인 소유`를 분리해 표기한다. 브랜드명이 들어간 내부 문서 이미지를 그대로 공개하지 않고, 확인된 구조만 일반 제목의 semantic HTML/CSS와 PDF 벡터 도식으로 다시 그린다.

## 공개 미디어

승인된 로컬 원본과 중간 파일은 Git 밖에 유지한다. 공개 저장소에는 아래 파생본만 넣는다.

### 영상과 포스터

- Evidence ID: `digital-occlusion-workflow-demo-01`
- File: `assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-demo-01.mp4`
- Composition: 약 31초, 특징점 입력 → 다중 시점 교합 → 평가 화면
- Output: 960×460, H.264, `yuv420p`, fast-start, 무음, 메타데이터 제거
- Player: native controls, no autoplay, no loop, `preload="none"`
- Poster ID: `digital-occlusion-workflow-poster-01`
- Poster file: `assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-poster-01.png`

화면 상단의 애플리케이션 제목, 기관 로고, 로컬 경로와 하단 작업표시줄은 모두 잘라낸다. 합성 테스트 데이터만 보이도록 유지하며 실제 사람·환자 데이터로 해석될 수 있는 캡션을 쓰지 않는다. 영상 캡션은 `합성 테스트 데이터로 시연한 개발 빌드`임을 명시한다.

### 화면 근거

1. `digital-occlusion-workflow-landmark-01` / `digital-occlusion-workflow-landmark-01.png` — 참고 이미지와 특징점 입력
2. `digital-occlusion-workflow-occlusion-01` / `digital-occlusion-workflow-occlusion-01.png` — 다중 시점 교합과 접촉 히트맵
3. `digital-occlusion-workflow-evaluation-01` / `digital-occlusion-workflow-evaluation-01.png` — RMSE·Gap·FRE 평가 UI

세 화면도 영상과 같은 안전 영역만 사용하고 식별 문자열과 메타데이터를 제거한다. 모든 영상·이미지는 `approved` 상태와 이중언어 caption/alt를 갖고 `assets/projects/EVIDENCE_REGISTER.md`에 등록한다.

### 도식

- 7단계 통합 워크플로우 도식
- Custom App과 세 교합 엔진의 통합 아키텍처 도식

도식은 검토한 내부 문서의 사실만 사용하되 내부 명칭·로고·경로를 복제하지 않는다. 한 개의 이중언어 도식 정의를 웹 렌더러와 PDF 생성기가 함께 소비한다. 도식은 설명용 재구성이므로 화면 증거 ID를 부여하지 않는다.

## 데이터와 렌더링 계약

- `js/portfolio-data.js`의 canonical project 배열에 아홉 번째 프로젝트를 추가한다.
- `js/portfolio-render.js`, `js/site-i18n.js`, 테스트의 slug 목록을 같은 순서로 9개로 확장한다.
- 공개 HTML은 24개에서 26개로, 프로젝트 PDF는 16개에서 18개로 늘린다.
- 한국어 route는 `projects/digital-occlusion-workflow/`, 영어 route는 `en/projects/digital-occlusion-workflow/`다.
- Home과 Projects의 정적 fallback 목록에도 동일한 위치로 추가한다.
- `evidenceState: 'ongoing'`, `lifecycleState: 'research'`를 유지하되, 이 사례는 선택적 이중언어 `statusLabel`로 승인 문구인 `진행 중 · 연구진 검증` / `Ongoing · Researcher Validation`을 표시한다. 기존 사례는 현재 상태 조합 렌더링을 그대로 사용한다.
- 선택적 `storySections`는 stable key, 이중언어 heading/body/items, layout, 연결할 media ID, 선택적 diagram을 갖는다. 이 사례만 새 장문형 데이터를 사용하며 기존 사례의 출력은 바뀌지 않는다.
- 선택적 `relatedProjectSlugs`는 존재하는 slug만 허용하고 자기 참조와 중복을 거부한다. 새 사례와 `mandibular-fracture`에 서로를 등록한다.
- workflow/architecture diagram은 고유 node key, 유효한 edge endpoint, 이중언어 node/edge label, ownership label을 검증한다.
- 승인된 영상은 승인된 포스터가 반드시 있어야 하며, 경로·확장자·evidence register가 모두 일치하지 않으면 validator가 실패한다.

## Home 포지셔닝

기존의 넓은 정체성 문장을 유지하고 현재 연구개발 축을 두 번째 문장으로 추가한다.

- KO: `3D 정합·의료영상·로봇 시스템을 연구에서 현장까지 잇는 로봇SW 엔지니어입니다. 현재 삼성서울병원과 장기 협력하며, 디지털 교합에서 전체 구강악안면 수술계획으로 확장되는 대규모 소프트웨어를 개발하고 있습니다.`
- EN: `I am a robotics software engineer connecting 3D registration, medical imaging, and robotic systems from research to the field. I am currently developing large-scale software with Samsung Medical Center through a long-term collaboration, expanding from digital occlusion toward end-to-end oral and maxillofacial surgical planning.`

Home의 meta description도 같은 사실 경계를 따르되 더 강한 배포·임상 표현을 추가하지 않는다.

## CV 동기화

포트폴리오 `data/public-cv.json`의 삼성서울병원 협력 경력에 다음 의미의 이중언어 항목을 추가한다.

- KO: `2026.03–현재 삼성서울병원 연구진과 구강악안면 디지털 교합 워크플로우를 공동 개발. 기술 리드·메인 개발자로 Custom App 아키텍처, end-to-end UI/UX, 특징점·교합 엔진 통합, 평가·내보내기 파이프라인을 담당하며 연구진 검증을 진행 중.`
- EN: `Since 2026.03, co-developing a maxillofacial digital-occlusion workflow with Samsung Medical Center researchers. As technical lead and primary developer, owning the Custom App architecture, end-to-end UI/UX, landmark and occlusion-engine integration, and the evaluation/export pipeline while researcher validation is ongoing.`

같은 내용을 LLMwiki의 canonical Word CV와 PDF에 반영한 뒤, 기존 현지화·공개 파이프라인으로 한국어·영어 공개 CV PDF를 다시 만든다. 포트폴리오의 CV HTML 요약은 `node scripts/public-cv-summary.cjs --write`로 갱신하고 `assets/cv/`의 두 공개 PDF를 교체한다. 모든 표면에서 현재 구현, 연구진 검증 중, 장기 로드맵을 명확히 분리하며 A4 2페이지 계약을 유지한다.

## PDF 계약

- `digital-occlusion-workflow-ko.pdf`
- `digital-occlusion-workflow-en.pdf`

두 프로젝트 PDF는 기존 6–8페이지 사례 형식을 유지한다. 포스터, 워크플로우 도식, 아키텍처 도식, 대표 화면 세 장을 사용하고 원본 영상은 삽입하지 않는다. 역할·팀 결과·검증 상태·한계는 웹과 동일해야 한다.

`output/pdf/manifest.json`, `output/pdf/`, `assets/pdfs/`는 정확히 18개의 지역화 프로젝트 PDF와 36개의 게시 아티팩트를 추적하도록 갱신한다. 다른 프로젝트 PDF의 내용은 동등하게 유지한다.

## 변경 파일 범위

### 포트폴리오 저장소

- `AGENTS.md`
- `index.html`, `en/index.html`
- `projects/index.html`, `en/projects/index.html`
- `projects/digital-occlusion-workflow/index.html`
- `en/projects/digital-occlusion-workflow/index.html`
- `cv/index.html`, `en/cv/index.html`
- `js/portfolio-data.js`
- `js/portfolio-render.js`
- `js/site-i18n.js`
- `css/scholar.css`
- `data/public-cv.json`
- `scripts/validate-portfolio.cjs`
- `scripts/export-portfolio-data.cjs`
- `scripts/generate-portfolio-pdfs.py`
- `scripts/public-cv-summary.cjs`는 데이터 계약상 필요할 때만 수정
- `tests/portfolio.test.cjs`
- `assets/projects/EVIDENCE_REGISTER.md`
- `assets/projects/digital-occlusion-workflow/README.md`
- 승인 파생본 under `assets/projects/digital-occlusion-workflow/`
- 생성된 18개 프로젝트 PDF 집합과 `output/pdf/manifest.json`
- `assets/cv/`의 한국어·영어 공개 CV PDF

### LLMwiki 저장소

- canonical Word CV와 그 PDF
- localized 한국어·영어 CV 산출물
- 기존 CV 공개 파이프라인이 요구하는 최소 데이터·스크립트 변경

`public/`, 승인된 원본 영상, 사설 저장소, 다른 프로젝트의 서술은 범위 밖이다.

## 검증과 수용 기준

1. `node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check`가 모두 통과한다.
2. validator가 9개 프로젝트, 26개 HTML route, 18개 프로젝트 PDF, 36개 PDF 게시 아티팩트를 정확히 검사한다.
3. 한국어와 영어 Home, Projects, 새 사례, CV가 동일한 사실·역할·검증·한계 구조를 갖는다.
4. 새 사례가 Medical Core에서 하악골 골절 사례 바로 다음에 나타난다.
5. 두 사례의 관련 링크가 HTTP와 `file://`에서 대응 언어 페이지로 이동한다.
6. `ffprobe`로 공개 영상이 약 31초, 960×460, H.264 `yuv420p`, 무음, fast-start이며 식별 메타데이터가 없음을 확인한다.
7. 영상과 화면 세 장에서 앱 제목, 로고, 로컬 경로, 작업표시줄, 사람·환자 식별 정보가 보이지 않는다.
8. RMSE·Gap·FRE의 화면 값이 성능 수치나 임상 결과로 인용되지 않는다.
9. Home, Projects, CV, 새 한국어·영어 사례를 wide/narrow viewport에서 확인하고 영상, 도식, 캡션, related link, PDF link의 overflow와 접근성을 점검한다.
10. 새 KO/EN 프로젝트 PDF와 KO/EN CV PDF를 페이지 이미지로 렌더링해 글리프, 잘림, 링크, 페이지 번호를 확인한다. CV는 A4 2페이지를 유지한다.
11. 공개 tree와 생성물에서 내부 프로젝트명, 사설 저장소 URL, 개인 이름, 로컬 절대 경로, 환자 데이터, 임상 배포·효능 주장, 엔진 개인 구현 주장이 발견되지 않는다.
12. 변경 전후 비교에서 기존 여덟 사례의 데이터·route·PDF가 의도치 않게 바뀌지 않는다.

인앱 브라우저를 사용할 수 없으면 그 한계를 결과에 명시하고 다른 브라우저 제어 도구로 조용히 대체하지 않는다.

## 비목표

- 내부 프로젝트명이나 사설 GitHub URL 공개
- 이전 버전을 새 사례의 수행 기간 또는 주도 개발 실적으로 포함
- 하악골 골절 연구의 직접 제품화 주장
- 특징점 알고리즘이나 Geometric, PyBullet, SOFA 엔진 자체를 개인 구현으로 주장
- 키보드 단축키 개선 주장
- 정량 정확도·생산성·임상 효과 주장
- 병원 설치, 실제 수술 사용, 의료기기·규제 상태 주장
- 실제 환자 데이터 또는 사람 영상 공개
- 별도 마이크로사이트, 새 프레임워크, 자동재생 영상
- 다른 사례의 재설계 또는 `public/` 수정
- 별도 요청 없는 push 또는 GitHub Pages 배포

## 작업 경계

구현 전에 live worktree와 관련 diff를 다시 확인하고 다른 에이전트나 자동 루틴의 변경을 보존한다. 구현 검증 후에는 관련 파일만 별도 커밋하며, push와 GitHub Pages 배포는 사용자의 명시적 요청이 있을 때만 수행한다.
