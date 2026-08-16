# 3D Registration Partner Portfolio Specification

## Goal

Rebuild the portfolio around Jinmin Kim's identity as a 3D registration specialist who designs and implements spatial systems for medical and robotic applications. The primary audience is a technical or business partner considering a joint-development engagement.

## Public information architecture

- Navigation is `Home / Projects / CV / Contact` in Korean and English.
- Korean stays at the repository root and English stays under `/en/`; language switching always links equivalent URLs and never uses browser detection or local storage.
- Home contains a short expert declaration, an evidence-led hero mosaic, image-and-title project links, and a compact five-stack index.
- Projects groups four Medical Core cases, one Industrial Spotlight, and one AI Build Lab case.
- Project pages are concise web summaries with a deeper downloadable PDF.
- CV embeds a public-safe two-page PDF with image and open/download fallbacks.
- Contact invites joint-development enquiries by email and tells a partner which problem, data/sensors, target validation, and schedule to include.

## Canonical portfolio

1. Surgical Navigation Systems - ongoing lineage; integrated software leadership; spatial placement and registration feedback; actual phantom/equipment/HoloLens demonstration is the preferred evidence.
2. Mandibular Fracture Reduction Optimization - verified and completed; jointly led the research pipeline from problem definition through algorithms, simulation, experiment, and paper; presentation and award evidence leads.
3. Life Careverse - ongoing; led the Quest multi-user XR application; synchronized multi-user demonstration leads.
4. rTMS Navigation Prototype - ongoing prototype; led the Slicer-based integration; working prototype recording leads.
5. Multi-sensor Registration for an Autonomous Forklift - ongoing with an integration and field-validation milestone; owned RGB-ToF-SAM3 registration, SICK TiM/NAV350 PCD processing and robot localization, safety policy, and Zenoh output; registration and point-cloud imagery leads.
6. AI Build Lab - ongoing combined case for LLM Wiki, multi-cli-work, and the Daegu bus application; proves that personally experienced problems become designed, tested, released, and operated products with AI as an implementation amplifier.

Product or institution names appear only after explicit approval or independent public evidence. Otherwise use problem-centered public names.

## Capability order

1. 3D Geometry & Registration
2. Sensor Fusion & Localization
3. Medical Navigation & Visualization
4. XR Application Engineering
5. Product Engineering with AI

Capabilities are described through implemented systems and evidence, never proficiency ratings.

## Visual and evidence rules

- Use a neutral technical-document aesthetic: strong grid, restrained palette, high Korean readability, small measurement/evidence captions, and limited monospace accents.
- Actual photography, video frames, application UI, point clouds, experiments, and quantitative results are the primary visuals.
- Decorative SVG illustrations and autoplay carousels are removed. Diagrams are allowed only when they explain a real system relationship.
- Home project tiles expose an image and title only; status and role appear on Projects and detail pages.
- Video is self-hosted, click-to-play, `preload="none"`, poster-led, keyboard accessible, and never autoplayed. Public clips target 15-30 seconds and 20 MB or less.
- Originals remain in their existing private source locations. Only user-approved, redacted, metadata-stripped derivatives enter Git.
- Never publish patient data, CT/MRI, identifiable people, contracts, test certificates, internal code, secret infrastructure, or unapproved customer/institution names.
- Individual decisions, implementation, and verification are separate from team results. Do not use contribution percentages or unverified productivity, clinical, operational, or maintenance claims.

## PDF and CV deliverables

- Generate 6-8 page Korean and English PDFs for all six case studies: twelve project PDFs total.
- Use a common cover, typography, evidence-state system, footer, and contact page; customize the middle narrative and visual sequence per case.
- Generate public-safe Korean and English two-page CV PDFs from the approved career sources. Do not modify or publish the original source PDF.
- Render every PDF to page images for visual review; validate text extraction, page count, links, glyphs, clipping, and page numbering.

## Compatibility and validation

- Keep the site buildless, static, GitHub Pages root-deployed, and compatible with HTTP and `file://` previews.
- Preserve `data-base`, `data-page`, shared nav/footer, and explicit route-pairing contracts; supported page keys become `home`, `projects`, `cv`, and `contact`.
- Canonical target is 6 projects, 5 capabilities, and 20 localized HTML pages.
- Remove unselected legacy project HTML and the Capabilities/Research route from the public tree. Git history is the recovery path.
- Do not edit `public/` and do not remove `.nojekyll`.

