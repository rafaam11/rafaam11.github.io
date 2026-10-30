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

**Section entries (rollout to all nine cases, 2026-10-31).** `sections[key]` is `{ items[1–8], owned? }` or `{ hidden: true }` alone. `owned` follows the headline budget (ko ≤50, en ≤90) and is a noun phrase. A hidden story section is not rendered; if it holds figures they move to the end of the previous visible section (or the start of the next one), so figure numbers stay consecutive. Digital occlusion hides `verification-boundary`.

**Product-console dense variant.** Valid keys are `history`, the `consoleModules[].key`s (`desktop-app`, `api`) and the `applicationTracks[].key`s (`medical`, `industrial`); console sections cannot be hidden. The page keeps `data-case-layout="product-console"` and the section order: dense header, brief, history (items replace the naming paragraph), 3D figure (`sceneCaption`), desktop app, API (flow diagram kept), medical, industrial, public resources, links. Each module and track keeps its title, figures and "Figure N" evidence links; items replace the summary and one `<p class="sc-owned">` line tagged `담당`/`My part` replaces the role and team boundary panel. The limits section is not rendered on the web; the PDF keeps it.

**Removed from the web page.** The problem and summary paragraphs, the role, the evidence prose and blocks, and the limitation and team-result sections.

## News timeline

`js/local-feed.js` replaces the post cards with one row per event, grouped under a year `h2`: date (`MM.DD`, the month, or the year alone, as the record's precision allows), category tags in the 1px-border `.sc-tag` style, the title (`h3`) and the existing one-line `body` (at most two lines while closed), the links, and a 56px thumbnail when the event has activity media. Rows with a `post` or media are native `<details>`; the summary is the row and opening it shows the `post` paragraphs and the media grid with its lightbox. Links and the thumbnail sit outside the summary, so the summary holds no nested links; clicking the thumbnail toggles the row. A `#news-<id>` fragment opens and scrolls to its row on load and on `hashchange`, resetting the filters if they hide it. Avatars, the "더 보기" clamp and the link-preview cards are removed. Home's selected activities become three small cards (120px thumbnail, date, title link). Filters, counts, ids, the static no-JS list and the news data are unchanged. Measured at 1280px (ko): page height 38,339 → 5,907 px, main text 15,648 → 5,672 characters.

## CV

`scripts/public-cv-summary.cjs` renders the dense CV from web-only fields in `data/public-cv.json`; the CV PDFs, their pinned hashes and the PDF source digest are unchanged (`scripts/portfolio-pdf-source.cjs` strips the fields below).

- **Intro.** `identity.translations.<locale>.brief` (one or two noun-phrase lines, ko ≤70, en ≤160 characters) replaces the summary paragraph. The `interests` list follows on its own line labelled 연구 방향 / Research direction, so current expertise and research direction stay separate. `summary` stays for the PDF review and the Home JSON-LD.
- **Experience.** Each DIGITRACK area carries `rows` (`{ project, slug?, period, did[1–4], result }`, 1–8 rows) and optional `keywords` (1–6) that fold the non-project bullets. The area renders its title, the keywords as 1px-border tags, then a table: 프로젝트 | 기간 | 한 일 | 결과 (Project | Period | What I did | Result). The project cell links to `../projects/<slug>/index.html` when a slug exists (the same href as the publications' related-project links); an empty period shows "—"; `did` joins with " · ". `items` stay in the data for `check-cv-pdf-sync.py` and are not rendered when `rows` exist. Lines follow the case budgets (ko ≤38, en ≤70, noun phrases, no new facts). The four tables share fixed column widths; at ≤760px each row stacks into a block (project and period, then labelled did and result lines) with no horizontal scroll.
- **Education, skills.** Education notes keep their text with tighter, meta-sized spacing. Skills and languages keep the `<dl>`, but each `dd` is a list of 1px-border tags split on its separators.
- **Publications, patents, awards.** Structure and counts unchanged (paper and presentation counts are never summed); only the row spacing is tighter.
- Measured at 1280px (ko): page height 6,532 → 5,675 px, main text 5,535 → 4,373 characters.
