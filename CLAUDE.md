# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JinminKim의 GitHub Pages 개인 포트폴리오 사이트. 순수 정적 HTML/CSS/JS 기반이며 빌드 과정이 없습니다.

- **URL:** https://rafaam11.github.io
- **템플릿:** [startbootstrap-resume](https://github.com/StartBootstrap/startbootstrap-resume) (MIT)
- **배포:** `main` 브랜치 push → GitHub Pages가 즉시 서빙 (Actions 불필요)
- **로컬 프리뷰:** `index.html` 파일을 브라우저에서 바로 열면 됨

## 파일 구조

```
index.html      # 포트폴리오 본문 — 모든 섹션 포함. 내용 수정은 여기서만
css/styles.css  # 템플릿 스타일 (직접 수정 가능)
js/scripts.js   # 사이드바 네비 스크롤 스크립트
assets/img/     # 프로필 사진 등 이미지
.nojekyll       # GitHub Pages Jekyll 처리 비활성화 (삭제 금지)
```

## 콘텐츠 수정 방법

`index.html` 내 `<!-- TODO -->` 주석 위치에 실제 내용을 채우면 됩니다:

| 섹션 | id | 내용 |
|---|---|---|
| 자기소개 | `#about` | 이름, 직함, 소개글, 소셜 링크 |
| 경력 | `#experience` | 회사명, 직책, 기간, 담당 업무 |
| 학력 | `#education` | 학교명, 전공, 기간 |
| 기술 | `#skills` | Font Awesome 아이콘 교체, 역량 목록 |
| 프로젝트 | `#projects` | 프로젝트명, 기술 스택, 설명, 링크 |
| 수상/자격증 | `#awards` | 수상명, 자격증명, 연도 |

## 프로필 사진 교체

`assets/img/profile.jpg` 파일을 본인 사진(정사각형 권장)으로 덮어쓰면 자동 반영됩니다.

## 배포

수정 후 커밋·push하면 1분 내 `https://rafaam11.github.io` 에 반영됩니다.  
GitHub 저장소 Settings → Pages → Source가 **"Deploy from a branch" → `main` / `/ (root)`** 인지 확인하세요.
