# rafaam11.github.io

Jinmin Kim의 연구자풍 포트폴리오입니다. 3D 정합, 의료영상, 로봇 시스템을 연구에서 현장까지 잇는 작업을 정리합니다. 빌드 과정이 없는 정적 HTML/CSS/JavaScript 사이트이며 GitHub Pages가 `main` 브랜치의 루트를 직접 서비스합니다.

**URL:** https://rafaam11.github.io

공개 정보 구조는 `Home / Projects / CV / Contact`이며, 한국어는 루트, 영어는 `/en/`에 둡니다. 두 언어는 브라우저 감지 없이 대응 URL로 직접 전환되고 `file://` 미리보기도 지원합니다.

## 공개 프로젝트와 역량

1. Surgical Navigation Systems
2. Mandibular Fracture Reduction Optimization
3. Life Careverse
4. rTMS Navigation Prototype
5. Multi-sensor Registration for an Autonomous Forklift
6. AI Build Lab

다섯 역량 스택은 별도 라우트가 아니라 Home과 Projects의 프로젝트 근거에 연결됩니다: 3D Geometry & Registration, Sensor Fusion & Localization, Medical Navigation & Visualization, XR Application Engineering, Product Engineering with AI.

실제 이미지·영상은 [공개 근거 레지스터](assets/projects/EVIDENCE_REGISTER.md)에 등록하고 승인된 파생본만 `assets/projects/<slug>/`에 둡니다. 프로젝트별 한국어·영어 PDF는 `assets/pdfs/`, 공개 안전 이력서 PDF와 페이지 미리보기는 `assets/cv/`에 있습니다. PDF 입력 내보내기와 생성기는 각각 `scripts/export-portfolio-data.cjs`, `scripts/generate-portfolio-pdfs.py`입니다.

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
