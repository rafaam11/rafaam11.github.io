# Scholar Portfolio Design Specification

> 2026-08-21 · supersedes the visual and information-architecture sections of `2026-08-16-3d-registration-partner-portfolio.md`. Privacy, evidence, and validation rules from that spec remain in force unless restated here.

## Goal

Rebuild rafaam11.github.io as a clear, researcher-style personal site — the kind an academic or research engineer keeps — that shows *what Jinmin Kim actually builds* through real images and short clips. Primary readers: a prospective academic collaborator (medical imaging / 3D registration) and general visitors (recruiters, LinkedIn, acquaintances). The site is a visual showcase first, a prose document second.

## Positioning

- Identity line: a robotics software engineer who carries 3D registration, medical imaging, and robot systems from research to field deployment.
- Tone: short declarative sentences, no marketing adjectives, no "partner" sales framing. Contact invites joint research and research collaboration enquiries in neutral wording. Do not mention graduate admission, doctoral plans, or job changes anywhere on the site.
- Institution and product names are approved for public use as of 2026-08-21: DIGITRACK products (SKADI, SMCNavi, NeuroPilot, DOTORI), government programme names, partner hospitals (Samsung Medical Center, Seoul St. Mary's Hospital), partner organisations (AT&C, KERI, ETRI, KAIST, A4LAB, etc.). Names of other individuals (professors, executives, co-workers) stay out. Budgets, document numbers, patent numbers, target metrics set by the programme, and other institutions' metrics stay out. Only measurements the author performed may be quoted.

## Information architecture

Routes stay `Home / Projects / CV / Contact`, Korean at root and English under `/en/`, exactly 24 HTML pages (4 routes + 8 cases, two languages). No Research or Capabilities route.

### Home
1. Header: name (ko/en), identity line, two affiliation lines (DIGITRACK researcher / DGIST M.S. in Robotics), profile photo on the right (~160px), one contact line (Email · GitHub · LinkedIn · CV PDF).
2. Interests and capabilities as one paragraph (the five capability stacks compressed into a comma list).
3. Projects: four group subheadings, eight items. Each item = thumbnail (4:3, ~200px) on the left, title · period · two-line summary · links (detail / PDF / paper) on the right.
4. Publications (3), Patents (7 filed · 3 registered summary plus representative titles), Awards (9) as numbered lists rendered from `data/public-cv.json`.
5. One-line contact.

### Projects
Same eight items grouped the same way, with a longer three-line description (problem · owned role · evidence). Status appears as parenthesised text, never as a chip.

### Case page (figure-led article)
Title → meta line (period · role · status · collaboration) → lead figure or clip (Figure 1 with caption) → five subsections (Problem / Approach / My role / Results and evidence / Limitations and team result) → gallery (Figures 2–N, two-column figure grid with captions) → links (PDF · paper · repository). The former four `blocks` fold into the subsections.

### CV
Public summary block (existing `PUBLIC CV SUMMARY` markers) above the embedded PDF; no decoration.

### Contact
At most three paragraphs.

## Canonical portfolio (8 cases, 4 groups)

| Group | Slug | Status |
|---|---|---|
| Medical core | surgical-navigation | ongoing |
| Medical core | mandibular-fracture | completed / verified |
| Medical core | life-careverse | ongoing |
| Medical core | rtms-navigation | prototype |
| Medical core | respiratory-surface-guidance | research (2026.06 –) |
| Platform software | skadi-tracking-software | ongoing |
| Industrial | unmanned-forklift | ongoing |
| AI Build Lab | ai-build-lab | ongoing |

Slug order is a contract shared by `js/portfolio-data.js`, `js/portfolio-render.js`, `js/site-i18n.js`, `tests/portfolio.test.cjs`, and `scripts/generate-portfolio-pdfs.py`.

- **respiratory-surface-guidance** — surface-guided respiratory tracking for radiotherapy (SGRT optical surface part: far-field surface reconstruction and near-field real-time breathing tracking). Owned role: sensor validation campaign (in-house validation tool DtDepthScan on Qt/VTK/OpenCV), breathing-tracking algorithm (ROI depth → respiratory waveform → gating signal), sensor interface and transport protocol, day-to-day project execution. Evidence: author-measured precision σ, fps, and fill rate for five commercial 3D sensors across five distances. Early-stage research; no clinical or quantitative outcome claimed.
- **skadi-tracking-software** — the software layer (API, Viewer, 3D Slicer custom-app template) that lets surgical-navigation companies and research groups use the in-house SKADI optical tracker. Owned role: API and Viewer development and maintenance. Hardware and sales figures are the company's and stay out.

## Visual system — "Scholar"

- Tokens: background `#fff`, text `#1a1a1a`, muted `#555`, rule `#e5e5e5`, link `#1a56db` (underlined, same when visited). Pretendard Variable via the existing CDN link. Body 17px / 1.7. Content column max 880px. Section spacing 3rem.
- Hierarchy by weight and size only. No uppercase transforms, no monospace accents, no eyebrows or kickers, no chips or coloured bars, no gradients, shadows, icons, or decorative SVG, no 1px-gap grid boxes, no crosshair mosaic.
- Media: real photographs, UI captures, point clouds, experiment tables, and video frames are the primary visuals. Figures carry numbered captions ("그림 1." / "Figure 1."). Video is self-hosted, click-to-play, `controls preload="none"`, poster-led, never autoplayed; public clips are 15–30 s, 720p H.264, ≤10 MB. Images are PNG, long edge ≤1600px; thumbnails 4:3; posters 16:9.
- A case may declare one lead, one clip with poster, and a gallery of up to six images. Only approved media renders; pending items are skipped without placeholder boxes, and an empty gallery omits its section.
- Stylesheet: `css/scholar.css` replaces `css/spatial-signal.css`; `css/site.css` keeps nav and footer restyled to the same tokens; `css/cv-pdf.css` stays.

## Evidence and privacy rules

- `assets/projects/EVIDENCE_REGISTER.md` stays the single source of truth. Every lead, clip, poster, and gallery item has a register row; only `approved-public` rows have a public path.
- Originals stay outside Git in their private source folder. Candidate extraction, review sheets, and intermediate derivatives live outside this repository; only approved, cropped or blurred, metadata-stripped derivatives enter `assets/projects/<slug>/`.
- Never publish patient data, CT/MRI, identifiable people, contracts, certificates, internal code, secret infrastructure, other people's names, budgets, or document numbers.
- Individual decisions, implementation, and verification stay separate from team results. No contribution percentages. No unverified productivity, clinical, operational, or maintenance claims.

## PDF and CV

- Sixteen project PDFs (8 cases × ko/en) and two CV PDFs remain generated artifacts from the exporter/generator pipeline. The six-page project PDF contract is unchanged in this iteration; gallery images are web-only for now.
- The public CV is regenerated from the 2026-08 CV source after redaction (three fixed public contacts; no phone, address, or patent numbers).

## Compatibility and validation

- Buildless static site, GitHub Pages root deployment, HTTP and `file://` previews, `data-base`/`data-page`/`data-lang`/`data-route` contracts, `.nojekyll`, and untouched `public/` all remain.
- Required checks after every change: `node --test`, `node scripts/validate-portfolio.cjs`, `git diff --check`, plus a local HTTP preview of Home, Projects, CV, Contact, and at least one Korean and one English case at wide and narrow widths.
- Pushing to `main` deploys the live site; push only after the owner has reviewed the local preview.
