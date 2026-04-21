# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo 기반 GitHub Pages 개인 블로그. `main` 브랜치 push 시 GitHub Actions가 자동으로 빌드·배포합니다.

- **URL:** https://rafaam11.github.io
- **프레임워크:** Hugo Extended
- **테마:** PaperMod (`themes/PaperMod/` — git submodule)
- **댓글:** Utterances (GitHub Issues 기반)
- **배포:** `.github/workflows/hugo.yml` → GitHub Pages

## 개발 명령어

```bash
# 로컬 서버 (draft 포함 미리보기)
hugo server -D

# 새 포스트 생성 (archetypes/default.md 템플릿 사용)
hugo new posts/my-post-title.md

# 빌드 (배포용)
hugo --minify
```

## 아키텍처

```
content/posts/    # 블로그 포스트 (Markdown)
content/archives.md  # PaperMod Archive 레이아웃 활성화
layouts/partials/comments.html  # Utterances 댓글 스크립트 오버라이드
hugo.toml         # Hugo + PaperMod 설정 (baseURL, menu, params 등)
themes/PaperMod/  # git submodule — 직접 수정 금지, layouts/로 오버라이드
static/           # 이미지 등 정적 자산 (URL: /파일명)
```

## 포스트 작성 규칙

- 파일명은 영문 slug 사용 (한글 파일명은 배포 시 인코딩 이슈 가능)
- 프론트매터 필수: `title`, `date`, `draft`
- `draft: true`인 포스트는 로컬(`-D` 플래그)에서만 보이고 빌드에선 제외됨

## 테마 커스터마이징

PaperMod 오버라이드는 `themes/PaperMod/` 직접 수정 대신 루트 `layouts/`에 동명 파일을 만드세요. 현재 오버라이드:
- `layouts/partials/comments.html` — Utterances 댓글

## 배포

`main` push → GitHub Actions 자동 실행 → `https://rafaam11.github.io` 반영.  
첫 배포 전 GitHub 저장소 Settings → Pages → Source를 **"GitHub Actions"**로 설정 필요.
