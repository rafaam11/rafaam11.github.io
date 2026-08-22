# SMCNavi · HoloLens Surgical Navigation Case Design

> 2026-08-22 · Applies only to the `surgical-navigation` case. This specification supersedes the single-clip, 15–30-second, 10 MB, and six-image case-media limits in `2026-08-21-scholar-portfolio-design.md` for this case only. The evidence, privacy, bilingual-route, and Scholar visual rules remain in force except for the narrow, explicitly approved de-identified-imagery exception defined below.

## Goal

Rebuild the surgical-navigation case as a long, figure-led account of the author's software work on SMCNavi and its HoloLens extension. The page must make three things immediately legible, in this order:

1. the HoloLens digital-twin and spatial-interface result;
2. the tracking, registration, and calibration depth behind it;
3. the author's end-to-end software ownership.

SMCNavi is the software core. The HoloLens work is a separate spatial-interface extension connected to SMCNavi as a working research prototype, not a production-ready integrated product.

## Public positioning

- Korean title: `SMCNavi · HoloLens 수술내비게이션`
- English title: `SMCNavi · HoloLens Surgical Navigation`
- Period: `2023.07 – present`
- Public status: `Prototype · Ongoing` / `프로토타입 · 진행 중`
- Data-state mapping: `evidenceState: 'prototype'`, `lifecycleState: 'ongoing'`.
- Role label: `3D 의료영상·수술내비게이션 개발자` / `3D Medical Imaging · Surgical Navigation Developer`
- Organisation context: developed by DIGITRACK in research collaboration with Samsung Medical Center.
- Core description: a custom 3D Slicer surgical-navigation platform integrating six oral and maxillofacial workflows with optical tracking, registration, instrument calibration, and a HoloLens spatial-interface prototype.

Do not call SMCNavi a “super app” in the portfolio. Do not expose internal predecessor or extension product names. The public story may explain that SMCNavi succeeded an earlier desktop navigation implementation and that the HoloLens client remained a separate extension, but it must do so without publishing unapproved internal names.

Show the role label as the opening line of the `My Role` section. It is case-specific and does not create a new site-wide job title or replace the portfolio's global identity line.

## Page sequence

The shared case shell remains, but this case opts into a long-form story between its lead media and the standard role/result/limitation sections.

1. **Header** — title, period, `Prototype · Ongoing`, and technologies.
2. **Lead media** — the complete HoloLens digital-twin demonstration.
3. **Project overview** — DIGITRACK development, Samsung Medical Center research collaboration, the problem, and the custom 3D Slicer platform.
4. **Six SMCNavi workflows** — full SMCNavi feature video, integrated-UI crop, and six-workflow crop.
5. **System architecture** — responsive HTML flow diagram from optical tracking through SMCNavi and the HoloLens extension.
6. **Registration and calibration** — coordinate transforms, patient registration, marker calibration, non-standard and long-instrument calibration, with technical figures.
7. **HoloLens spatial interface** — PC connection, model/image presentation, interaction, and phantom integration with the existing HoloLens figures.
8. **My Role** — the author's directly owned software work.
9. **Team Result** — jointly owned clinical requirements, workflow review, acceptance context, and integration demonstrations.
10. **Evidence and limitations** — working prototype evidence, productisation boundary, and explicit non-claims.
11. **PDF and contact links** — no public repository link.

Media must appear next to the explanation it supports. This case must not fall back to a large undifferentiated gallery at the bottom.

## Six public workflows

List all six workflows in both languages. Treat them as implemented and demonstrated software workflows, not evidence of clinical efficacy.

| Korean | English |
| --- | --- |
| 상악종양 제거술 내비게이션 | Maxillary tumour-removal navigation |
| 하악종양 제거술 내비게이션 | Mandibular tumour-removal navigation |
| 양악수술 내비게이션 | Bimaxillary-surgery navigation |
| 하악운동 트래킹 | Mandibular-motion tracking |
| 골이식 위치설정 | Bone-graft placement |
| 광대·안와 골절 미러링 | Zygomatic-orbital fracture mirroring |

The public text uses `광대·안와 골절 미러링`. The approved derivative of the source presentation must correct its older, narrower label to match this wording.

## Contribution boundary

### My Role

State that the author designed the overall software architecture and was the primary implementer. Support that statement with concrete owned work:

- DICOM and 3D-model loading;
- MPR and 3D visualisation;
- optical-tracker SDK integration and the tracking data pipeline;
- image, patient, marker, and instrument coordinate transforms;
- patient registration and registration feedback;
- marker, non-standard instrument, and long-instrument calibration;
- the six procedure workflows and mirroring functions;
- HoloLens–PC communication, spatial presentation, and interaction;
- phantom integration tests and verification tooling.

Do not use a contribution percentage. Do not turn clinical decisions, clinical requirements, or team acceptance results into individual claims.

### Team Result

Credit the DIGITRACK and Samsung Medical Center research team with the clinical workflow and requirement context, acceptance review, and joint integration demonstrations. Keep team outcomes distinct from the author's software ownership.

## Evidence and claim boundary

The page may state that the prototype transmitted and presented live position, model, image, and interaction data end to end. The reason it remains a prototype is incomplete technical productisation: long-duration robustness, performance optimisation, deployment setup, and packaging remained unfinished.

The page must not claim:

- routine or production deployment;
- clinical efficacy, safety, accuracy, productivity, or maintenance benefit;
- institution-specific use in real surgery;
- regulatory approval;
- patent progress or ownership;
- programme target metrics or other organisations' measurements.

The public page and generated PDFs must omit unapproved individual names, standalone portraits from source documents, the public SMCNavi repository link, Azure Spatial Anchors, Photon Unity Networking, and any suggestion that those two services were implemented. ASA was considered early but was not used.

Patient-derived imagery in the two approved source videos and the two approved slide derivatives is de-identified and cleared for public release. This exact, bounded derivative set is the only exception in this case to the earlier blanket prohibition on publishing CT/MRI imagery; it does not authorise additional patient-derived files or source documents. People visible in the source videos have public-release consent. Public captions should still identify the material as de-identified research imagery and phantom/integration demonstration evidence, not clinical-outcome evidence.

## Technical architecture

Render the architecture as semantic HTML and CSS, not as the obsolete ASA/PUN image and not as a decorative SVG fallback. The canonical flow is:

`Optical tracker → SMCNavi (3D Slicer) ⇄ OpenIGTLink ⇄ HoloLens PC extension (Unity · MRTK) ⇄ Holographic Remoting ⇄ HoloLens 2`

The diagram must communicate the following data flow:

- the tracker supplies tool and marker observations to SMCNavi;
- SMCNavi owns medical-image/model display, transforms, registration, calibration, and the procedure workflows;
- OpenIGTLink carries transforms and approved image/model data between SMCNavi and the PC-side HoloLens extension;
- the PC-side extension performs rendering and sends it through Holographic Remoting;
- HoloLens interaction returns to the PC-side extension;
- the SMCNavi-to-HoloLens path is labelled `Research prototype`, because it worked end to end but was not technically productised.

The web renderer and PDF generator must consume one canonical bilingual diagram definition. Do not maintain a second, contradictory diagram copy.

## Optional long-form data contract

Add an optional `storySections` collection to a project record. A story section owns:

- a stable key;
- bilingual heading and body or list content;
- a layout value of `wide` or `grid`;
- zero or more approved image/video media records;
- an optional bilingual system-flow diagram definition.

Lead media remains in `project.media.lead` with its poster so Home and Projects thumbnails continue to work. Supporting media lives with the story section that explains it. A video record may opt into `preload: 'metadata'`; the renderer default for existing cases remains unchanged.

For `surgical-navigation`, `storySections` replaces the old approach blocks and bottom gallery as the web narrative. The standard `problem`, `summary`, `role`, `evidence`, `limitation`, and `teamResult` fields remain canonical for cards, standard case sections, and PDF summaries. Existing projects without `storySections` render byte-for-byte equivalent structure.

Validation requirements for every story-media item:

- stable unique evidence ID;
- supported type (`image` or `video`);
- explicit approval state;
- repository-relative public path for approved items;
- an existing file with the expected extension;
- bilingual caption and alt text;
- a registered evidence row;
- an approved poster with its own evidence ID for video;
- no unsafe URL, path traversal, autoplay, or unregistered external link.

The runtime renders approved, valid media only. The validator must fail loudly for malformed, missing, duplicated, or unregistered records rather than relying on runtime omission alone.

For a story diagram, validation must also require unique node keys, valid edge endpoints, bilingual node and edge labels, and one explicit prototype-boundary label. Diagram data does not need an evidence ID because it is a semantic rendering of the documented architecture rather than a source-media derivative.

## Public media derivatives

Only approved derivatives enter Git. Originals and intermediate files remain outside the repository.

### Videos

1. `surgical-navigation-hololens-demo-01.mp4`
   - complete source duration, approximately 159.8 seconds;
   - 16:9 at 1280×720;
   - H.264, `yuv420p`, fast-start;
   - no audio stream and no inherited metadata;
   - poster: `surgical-navigation-hololens-poster-01.png`.
2. `surgical-navigation-smcnavi-features-01.mp4`
   - complete source duration, approximately 90.3 seconds;
   - original 4:3 composition preserved at 960×720;
   - H.264, `yuv420p`, fast-start;
   - no audio stream and no inherited metadata;
   - poster: `surgical-navigation-smcnavi-poster-01.png`.

Both videos use native controls, no autoplay, no loop, and `preload="metadata"`. Re-encoding may change container duration only within a 0.2-second tolerance. Each file must remain below GitHub's 100 MB single-file limit without distorting its aspect ratio.

### Presentation derivatives

Export only the approved lower visual region of the referenced presentation slide:

- `surgical-navigation-smcnavi-ui-01.png` — integrated navigation UI and HoloLens–PC view;
- `surgical-navigation-smcnavi-workflows-01.png` — the two-by-three workflow composite.

Exclude the slide header, individual portrait and name, patent note, planned-clinical-use statement, and unrelated branding. Correct the fracture-mirroring label in the public derivative to `광대·안와 골절 미러링`. Preserve the underlying screenshots; do not synthesise or cosmetically reconstruct their technical content.

### Existing figures

Retain and re-caption the public-safe technical and HoloLens figures:

- `surgical-navigation-gallery-02.png` — coordinate frames;
- `surgical-navigation-gallery-03.png` — tracked non-standard/long instrument;
- `surgical-navigation-gallery-05.png` — HoloLens spatial view and interaction controls;
- `surgical-navigation-gallery-06.png` — consented phantom demonstration.

Replace `surgical-navigation-gallery-04.png`, whose screen exposes an unapproved internal name, with a public-safe setup frame extracted from the approved full-length video: `surgical-navigation-bench-01.png`.

Retire and remove from the current public tree:

- the obsolete ASA/PUN `surgical-navigation-gallery-01.png`;
- the superseded short lead clip and its old poster;
- the old setup image after its safe replacement is registered.

Update `assets/projects/surgical-navigation/README.md` so it describes the actual approved public derivatives rather than a pending-review boundary.

## Rendering and responsive behaviour

- Main and supporting videos are numbered figures with captions.
- A `wide` media group occupies the article width and preserves source aspect ratio.
- A `grid` group is two columns at wide widths and one column on narrow screens.
- Images use lazy loading and async decoding. Videos remain poster-led and never autoplay.
- Captions remain visible without interaction and do not repeat unsupported claims from source slides.
- The architecture diagram becomes a vertical sequence on narrow screens without crossed arrows, clipped labels, or horizontal overflow.
- All media and PDF paths resolve over both HTTP and `file://` using the page's existing `data-base` contract.

## PDF contract

Regenerate the Korean and English surgical-navigation PDFs through the existing exporter/generator pipeline. The PDFs must mirror the new title, public positioning, six workflows, role/team boundary, corrected architecture, evidence, and limitations. The web page may show more imagery than the PDF; the PDF should use representative evidence without increasing its established page-count contract or embedding the two full video files.

Other project PDFs must remain content-equivalent. Generator or exporter changes must be backward-compatible with projects that have no `storySections`.

## Files in scope

- `js/portfolio-data.js`
- `js/portfolio-render.js`
- `css/scholar.css`
- `scripts/validate-portfolio.cjs`
- `scripts/export-portfolio-data.cjs`
- `scripts/generate-portfolio-pdfs.py`
- `tests/portfolio.test.cjs`
- `assets/projects/EVIDENCE_REGISTER.md`
- `assets/projects/surgical-navigation/README.md`
- approved derivatives under `assets/projects/surgical-navigation/`
- generated surgical-navigation PDFs and `output/pdf/manifest.json`

No route is added or removed. `public/`, CV sources, and unrelated project content are out of scope.

## Working-tree safety

The repository may contain concurrent Life Careverse, PDF-generator, evidence-register, and generated-PDF changes. Before each implementation phase, inspect the live status and relevant diffs. Preserve every unrelated change. Apply surgical-navigation edits as narrow patches, avoid broad formatting rewrites, and do not stage, revert, or overwrite unrelated files or hunks.

Do not commit, push, or deploy until the owner explicitly requests deployment. GitHub Pages remains branch deployment from `main` at `/`.

## Verification and acceptance

Implementation is acceptable only when all of the following pass:

1. The two published video durations match their respective source durations within 0.2 seconds.
2. `ffprobe` reports no audio stream and no inherited identifying metadata.
3. Both videos preserve aspect ratio, decode in a browser, use fast-start, and remain below 100 MB each.
4. The Korean and English pages contain the same six workflows, technical structure, contribution boundary, evidence state, and limitations.
5. The public repository tree and generated PDFs contain no ASA/PUN claim, unapproved individual name or standalone portrait, patent-progress statement, public SMCNavi repository link, real-surgery-use claim, or clinical-effect claim. Consented people may remain visible inside the approved demonstration videos and figures.
6. Evidence IDs, approved paths, files, posters, captions, and alt text agree across data, register, renderer, and validator.
7. Automated checks pass:
   - `node --test`
   - `node scripts/validate-portfolio.cjs`
   - `git diff --check`
8. The PDF exporter/generator completes, the two surgical-navigation PDFs are updated, the manifest is coherent, and unrelated PDFs remain valid.
9. In-app browser review passes for Home, Projects, CV, Contact, one Korean case, and one English case at wide and narrow widths, with focused review of both surgical-navigation pages.
10. Direct `file://` review confirms both localized case pages and their video, image, and PDF links resolve.

If the in-app browser is unavailable, record that limitation instead of silently substituting another browser-control backend.

## Non-goals

- no public GitHub repository link;
- no new route, carousel, lightbox, autoplay, or third-party video host;
- no redesign of the other seven cases;
- no publication of source reports or presentations;
- no new clinical, operational, accuracy, or productivity claim;
- no deployment as part of design or implementation unless separately requested.
