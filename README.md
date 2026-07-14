# rafaam11.github.io

Jinmin Kim의 3D spatial computing 포트폴리오. 빌드 과정이 없는 정적 HTML/CSS/JavaScript 사이트이며 GitHub Pages에서 서비스됩니다.

**URL:** https://rafaam11.github.io

사이트의 핵심 구조는 다음과 같습니다.

- Home: Capability Atlas, 검증된 영향, 업무 방식
- Projects: 12개 프로젝트를 5개 전이 가능한 역량으로 분류
- Capabilities: 문제 정의와 검증 방식
- CV: `Owned → Changed → Evidence` 중심의 경력 서술
- Contact: senior R&D / hands-on technical-lead IC 포지셔닝
- Project details: `Uncertainty → Probe → Evidence → Decision → Integration → Verified Outcome`

## 로컬 실행과 검증

```powershell
python -m http.server 8000
node --test
node scripts/validate-portfolio.cjs
```

`http://localhost:8000`에서 확인합니다. `index.html`을 직접 열어도 공유 nav/footer와 데이터 렌더링이 동작합니다.

콘텐츠 구조와 수정 규칙은 [AGENTS.md](AGENTS.md)를 참고하세요.

Built with [startbootstrap-resume](https://github.com/StartBootstrap/startbootstrap-resume) components and Bootstrap.
