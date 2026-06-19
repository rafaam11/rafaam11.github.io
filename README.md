# rafaam11.github.io

JinminKim의 개인 포트폴리오 사이트.

**URL:** https://rafaam11.github.io

상단 가로 네비게이션 + 멀티페이지 구조(Home / CV / Projects / Repositories)의 정적 사이트입니다.

```
index.html              # Home — 히어로 + 연구 여정 + News
cv/index.html           # CV
projects/index.html     # Projects 인덱스 (상세: projects/<slug>/)
repositories/index.html # GitHub 저장소 쇼케이스
js/nav.js               # 공유 상단 nav + footer 렌더
```

## 로컬 프리뷰

별도 빌드 없이 `index.html`을 브라우저에서 바로 열면 됩니다. 클린 URL까지 확인하려면 루트에서:

```
python -m http.server 8000   # → http://localhost:8000
```

## 수정 방법

페이지별 HTML에서 직접 수정합니다. 자세한 구조·관례는 [`CLAUDE.md`](CLAUDE.md) 참고.

Built with [startbootstrap-resume](https://github.com/StartBootstrap/startbootstrap-resume) (Bootstrap·components).
