# rafaam11.github.io

Jinmin Kim의 연구자풍 포트폴리오입니다. 수술 로보틱스·컴퓨터비전 R&D 엔지니어로서 해부학 구조, 수술 도구, 센서, 카메라, XR 기기, 로봇을 하나의 3D 좌표계로 연결해 온 작업을 정리합니다. 빌드 과정이 없는 정적 HTML/CSS/JavaScript 사이트이며 GitHub Pages가 `main` 브랜치의 루트를 직접 서비스합니다.

**URL:** https://rafaam11.github.io

공개 정보 구조는 `Home / News / Projects / CV / Contact`이며, 한국어는 루트, 영어는 `/en/`에 둡니다. 두 언어는 브라우저 감지 없이 대응 URL로 직접 전환되고 `file://` 미리보기도 지원합니다.

## 공개 프로젝트와 역량

**Surgical Robotics & Navigation**

1. SMCNavi · HoloLens Surgical Navigation
2. Maxillofacial Digital Occlusion Workflow
3. rTMS Coil Navigation Software (NeuroPilot)
4. Mandibular Fracture Reduction Optimization

**Computer Vision & 3D Spatial Computing**

5. SKADI Desktop App & API
6. Surface-guided Respiratory Tracking (SGRT)

**XR & Spatial Visualization**

7. OMFS VR — Multi-user surgical consultation

**Robotics & Automation**

8. Multi-sensor Registration for an Autonomous Forklift

**AI Build Lab**

9. AI Build Lab

다섯 역량 스택(현재 전문성)은 별도 라우트 없이 Home에 표시됩니다: Surgical Navigation & Optical Tracking, 3D Registration & Computer Vision, XR & Spatial Computing, Robot Vision & Sensor Integration, Product Engineering with AI. 연구 방향(Surgical Robotics, Physical AI 등)은 현재 전문성과 분리해 Home의 연구 방향 줄과 CV에만 씁니다.

실제 이미지·영상은 [공개 근거 레지스터](assets/projects/EVIDENCE_REGISTER.md)에 등록하고 승인된 파생본만 `assets/projects/<slug>/`에 둡니다. 프로젝트별 한국어·영어 PDF는 `assets/pdfs/`에 생성되고, 공개 안전 이력서 PDF(국문·영문)는 생성 대상이 아니라 추적되는 원본으로 `assets/cv/`에 있습니다. PDF 입력 내보내기와 생성기는 각각 `scripts/export-portfolio-data.cjs`, `scripts/generate-portfolio-pdfs.py`입니다.

## 콘텐츠 원칙

- 개인이 소유한 문제·결정·구현·검증과 팀 결과를 분리합니다.
- 기여율 퍼센트나 검증되지 않은 생산성·임상·운영 효과를 쓰지 않습니다.
- 승인된 기관·제품 실명만 쓰고, 타인의 이름·연구비·문서 번호·원본 경로는 노출하지 않습니다.
- AI는 정체성이 아니라 구현 증폭 수단으로 설명합니다.

## 로컬 실행과 검증

```powershell
python -m http.server 8000
node --test
node scripts/validate-portfolio.cjs
git diff --check
```

`http://localhost:8000`에서 확인하거나 `index.html`을 직접 열 수 있습니다. 배포는 별도 빌드 없이 `main` push 후 GitHub Pages의 **Deploy from a branch → main → / (root)** 설정으로 이루어집니다. 상세 수정 규칙은 [AGENTS.md](AGENTS.md)를 참고하세요.

## 공개 파일과 비공개 제작 자료

공개 clone에는 승인된 페이지·사진·영상·PDF와 공개 전용 `data/activity-media.json`(schema 2)만 둡니다. `docs/`는 현재 포지셔닝·가독성 명세 2개, `assets/img/`는 favicon과 프로필 WEBP만 허용합니다. 비공개 문서, 원본, 검토 시트, 원본 경로·해시, M-ID 원장은 저장소와 HTTP 웹 루트 밖에 보관합니다. `.gitignore`와 검증기는 강제 추가된 금지 파일도 검사하지만, `.gitignore`가 과거 커밋을 지우지는 않습니다.

원본 없는 clone에서도 다음 검사를 실행할 수 있습니다. Node.js, Python과 PyMuPDF, ffmpeg/ffprobe가 필요합니다.

```powershell
node --test
node scripts/validate-portfolio.cjs
node scripts/activity-media.cjs check
node scripts/check-local-preview.cjs http://127.0.0.1:8000/
git diff --check
```

제작 환경에서는 `PORTFOLIO_PRIVATE_ROOT`를 저장소 밖의 보관 폴더로 설정합니다. 이 폴더에는 `originals/`, `derived/`, `scratch/`, `activity-media.private.json`, `activity-media-ids.json`, `private-validation.json`을 둡니다. 원본은 읽기 전용으로 취급하며 M-ID는 원본 SHA-256에 고정됩니다. 비공개 fixture 형식은 `{ "schema": 1, "forbiddenPeople": ["검사할 비공개 인물명"] }`이며 실제 목록은 공개하지 않습니다. 누락·빈 목록·잘못된 형식은 검증 실패입니다.

```powershell
# PORTFOLIO_PRIVATE_ROOT를 설정한 소유자 환경에서 실행
node scripts/activity-media.cjs catalog
node scripts/activity-media.cjs sheet M001
node scripts/activity-media.cjs derive M001
# 비공개 JSON의 ko/en caption/alt, eventIds, order, takenAt를 검토하고 승인
node scripts/activity-media.cjs promote M001
node scripts/public-cv-summary.cjs --write
node scripts/validate-portfolio.cjs --private
node scripts/activity-media.cjs check --sources
```

`catalog`, `sheet`, `derive`는 비공개 위치에만 씁니다. 새 파생본이나 재편집본은 `draft`로 시작합니다. `promote`는 명시한 M-ID의 승인·캡션·이벤트·원본 해시·파일 크기·메타데이터·무음 영상 조건을 검사한 뒤 공개 파일과 JSON을 갱신합니다. 도구는 Git 커밋이나 푸시를 하지 않습니다. 공개 검사에는 원본이 필요 없으며, `check --sources`는 전체 비공개 원장과 원본을 반드시 요구합니다.
