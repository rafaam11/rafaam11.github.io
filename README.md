# rafaam11.github.io

개발과 일상을 기록하는 개인 블로그.

**URL:** https://rafaam11.github.io

## Stack

- [Hugo](https://gohugo.io/) + [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme
- Deployed via GitHub Actions → GitHub Pages
- Comments powered by [Utterances](https://utteranc.es/)

## Local Development

```bash
# Hugo Extended 설치 필요 (Windows)
winget install Hugo.Hugo.Extended

# submodule 초기화 (최초 clone 후)
git submodule update --init --recursive

# 로컬 서버 실행
hugo server -D
```
