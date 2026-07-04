# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

JinminKim의 GitHub Pages 개인 포트폴리오 사이트. 순수 정적 HTML/CSS/JS 기반이며 빌드 과정이 없습니다.

- **URL:** https://rafaam11.github.io
- **구조:** 상단 가로 네비게이션 + 멀티페이지(Home / CV / Projects / Repositories), al-folio 학술 CV 스타일을 정적으로 재현
- **템플릿:** [startbootstrap-resume](https://github.com/StartBootstrap/startbootstrap-resume) (MIT) — Bootstrap·일부 컴포넌트 재사용
- **배포:** `main` 브랜치 push → GitHub Pages가 즉시 서빙 (Actions 불필요)
- **로컬 프리뷰:** `index.html`을 브라우저에서 바로 열면 nav/footer까지 렌더됨. 단 클린 URL(`cv/` 등) 확인은 루트에서 `python -m http.server` 후 접속 권장

## 파일 구조

```
index.html                 # Home — 히어로 + 연구 여정 내러티브 + News 피드
cv/index.html              # CV — 경력·학력·논문·특허·수상·자격증·스킬·언어
projects/index.html        # Projects 인덱스 (12개 카드 → 상세 페이지 링크)
projects/<slug>/index.html # 각 프로젝트 상세 (케이스 스터디)
repositories/index.html    # GitHub 저장소 쇼케이스 (도메인별)
css/styles.css             # startbootstrap-resume + Bootstrap 5 (컴포넌트·유틸 제공)
css/cv-theme.css           # navy 학술 CV 디자인 토큰·컴포넌트 (재사용)
css/site.css               # 멀티페이지 상단 nav·페이지 레이아웃·News·repo/skill 카드
css/case-study.css         # 프로젝트 상세 페이지 스타일
js/nav.js                  # 공유 상단 nav + footer 렌더 (단일 소스, file://·Pages 호환)
js/scripts.js              # (구) 사이드바 스크롤 — 신규 페이지에서는 미사용
assets/img/                # 프로필·로고 이미지
assets/diagrams/           # 손수 작성한 SVG 다이어그램
.nojekyll                  # GitHub Pages Jekyll 처리 비활성화 (삭제 금지)
```

### 구조 메모 (빌드 없는 멀티페이지)

- 상단 nav/footer는 각 페이지의 `<header id="site-nav">` / `<footer id="site-footer">` 플레이스홀더에 **`js/nav.js`가 DOM으로 렌더**한다. 파셜을 `fetch`하지 않으므로 `file://` 로컬 프리뷰에서도 동작.
- 각 페이지 `<body>`는 `data-base`(루트까지의 상대경로: 루트="" / 하위폴더="../")와 `data-page`(active 키: home·cv·projects·repositories)를 선언한다.
- 신규 페이지는 `#sideNav`·`section.resume-section` 셀렉터를 **쓰지 않는다** — 이 둘이 startbootstrap-resume의 좌측 사이드바 레이아웃을 발동시키기 때문. 새 페이지 nav는 `header > nav.topnav` 사용.

## 콘텐츠 수정 방법

내용은 페이지별 HTML에서 직접 수정합니다:

| 페이지 | 파일 | 내용 |
|---|---|---|
| Home | `index.html` | 히어로(이름·소속·소개), 연구 여정 내러티브, **News 피드** |
| CV | `cv/index.html` | General Info·경력·학력·논문·수상·특허·자격증·스킬·언어 |
| Projects | `projects/index.html` | 12개 프로젝트 카드 (상세는 `projects/<slug>/index.html`) |
| Repositories | `repositories/index.html` | GitHub 저장소 도메인별 카드 |

- **News 추가**: `index.html`의 `<ul class="news-list">` 맨 위에 `<li class="news-item">`을 추가(역시간순).
- **네비 항목 추가**: `js/nav.js`의 `links` 배열에 `{ key, label, href }`를 추가하고, 새 페이지 `<body>`의 `data-page`를 같은 `key`로 맞추면 active 표시가 동작.
- **디자인 토큰**: 색/뱃지/칩 등은 `css/cv-theme.css`, 레이아웃·News·카드는 `css/site.css`에서 조정.

## 프로필 사진 교체

`assets/img/profile_square.png`(정사각형 권장)를 덮어쓰면 Home 히어로에 자동 반영됩니다. 현재 파일이 ~7MB로 크므로 200–400KB 수준으로 압축 권장.

## 배포

수정 후 커밋·push하면 1분 내 `https://rafaam11.github.io` 에 반영됩니다.  
GitHub 저장소 Settings → Pages → Source가 **"Deploy from a branch" → `main` / `/ (root)`** 인지 확인하세요.
