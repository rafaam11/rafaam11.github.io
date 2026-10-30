# Dense pages design (2026-10-31)

## Why

After the 3D figures shipped, the owner judged the site "far too wordy; long explanatory prose is hard to read". Measured on the live site on 2026-10-31:

| Page | Main text | Page height |
|---|---|---|
| Case: SMCNavi | 3,300 characters | 6,350 px |
| Case: forklift | 1,850 characters | 4,700 px |
| News (57 items) | 15,600 characters | 38,300 px |
| CV | 5,500 characters | 6,500 px |

## Decisions (owner interview, 2026-10-31)

- **Style.** Deck-like density: keyword tags, a three-cell summary grid, and one-line items. This relaxes the Scholar "no chips" rule for one device only, the 1px-border keyword tag.
- **Scope.** Nine case pages, News, and CV. Home and the Projects list are unchanged.
- **Removed from the web.** Limitation, team-result, and research-boundary prose. The PDFs keep it.
- **Web only.** The 18 case PDFs and the CV PDF stay byte-identical.
- **News.** One-line timeline rows. A small thumbnail appears when the item has media. Expanding a row shows the post and its photos. No link-preview cards.
- **CV.** Experience becomes a project table: project | period | what I did | result.

## The `web` field

Each case record has a top-level `web` field with `ko` and `en` objects:

```
{ thesis?, tags[3–6], brief{ problem[1–3], did[1–3], result[1–3], team?[0–3] }, points?[3–6],
  sections?{ <storySectionKey|consoleKey>: { items[], owned?, hidden? } }, sceneCaption? }
```

**Excluded from the PDF digest.** `web` is web-only. `scripts/portfolio-pdf-source.cjs` excludes it from the PDF digest.

**Length budgets** (checked by `validatePortfolioData`):

| Text | ko | en |
|---|---|---|
| One line | 38 characters | 70 characters |
| `thesis`, `sceneCaption`, `owned` | 50 characters | 90 characters |

**Line rules.** Every line is a noun phrase, not a sentence. Korean lines must not end in `~습니다`/`~입니다`, and no line ends with a period.

### Copy rules

1. Every line compresses a fact that is already in the case fields (`role`, `evidence`, `teamResult`, blocks, story sections). No new facts or numbers.
2. Team outputs go in `brief.team`. They render with a small "팀"/"Team" tag, so team results are never shown as personal results.
3. No research-direction terms in the tags. Current expertise and research direction stay separate.
4. Contribution percentages and nonpublic partner names are scanned the same way as the rest of the case copy.

## Case page layout (dense path)

The page shows these parts in order:

1. Header: title, period and state, tags, and a one-line thesis.
2. Brief grid: Problem / What I did / Result. Team lines are tagged.
3. Figure 1, the lead media.
4. Approach: the 3D figure as Figure 2, then the points.
5. Gallery, related projects, and links.

**Story layout.** Story sections keep their headings and figures. Their prose is replaced by `sections[key].items`. A section with `hidden: true` is not shown.

**Product-console layout.** Modules keep their titles, figures, and the API flow. The summary becomes item lines, and the role boundary panel becomes one "담당" line. The limits section is removed.

**Removed from the web page.** The problem and summary paragraphs, the role, the evidence prose and blocks, and the limitation and team-result sections.
