# 3D Systems Portfolio Redesign

Date: 2026-07-15
Status: Approved design, pending written-spec review
Companion audit: `docs/superpowers/specs/2026-07-15-portfolio-positioning-audit.md`

## Objective

Redesign the static portfolio so a senior R&D hiring manager can understand, within the first screen:

1. Jinmin's primary domain is 3D spatial computing across robotics, medical navigation, digital twins, and XR.
2. His recurring role is a hands-on technical-lead IC who connects difficult components into a working, validated system.
3. He defines problems from mathematical and domain fundamentals, then reduces uncertainty through rapid micro-PoCs.
4. He uses AI agents aggressively for implementation while retaining human responsibility for technical judgment, validation, review, and merge decisions.
5. Team outcomes and personal contributions are explicitly separated.

## Audience and Positioning

Primary audience: hiring managers for senior R&D and applied physical-system roles.
Desired role: hands-on technical-lead IC, without people-management positioning.
Primary identity: domain-first 3D spatial-computing research engineer.
Secondary differentiator: AI-accelerated development and reusable validation tooling.

### Positioning Statement

> I turn uncertain 3D spatial problems into systems teams can test, trust, and extend.

Supporting message:

> I define problems from mathematical and domain fundamentals, reduce uncertainty through rapid micro-PoCs, and integrate validated technology into robotics, navigation, digital-twin, and XR systems. I use AI agents to remove implementation bottlenecks while retaining responsibility for technical judgment and verification.

The public site's primary copy remains English to preserve the current site convention. Korean interview evidence is translated during implementation without changing its factual scope.

## Message Hierarchy

### Home Hero

- Eyebrow: `3D Spatial Computing · Research Engineer`
- Positioning statement
- One concise supporting paragraph
- Existing profile image
- Links to Projects, CV, GitHub, and Contact

### Capability Atlas

The first major Home section uses the approved **B1 Pure Atlas** layout. Capabilities appear before quantified impact so the professional domain is understood before evidence is scanned.

1. 3D Registration & Navigation
2. Sensor Perception & Safety
3. Digital Twin & Validation
4. Clinical-to-XR Translation
5. AI-Enabled Tool Building

Each capability states what problems Jinmin solves and links to related projects, papers, patents, or tools. The section remains calm and academic: no animated dashboards, oversized gradients, or marketing-style metric walls.

### Proven Impact

Immediately after the full Capability Atlas, show a compact evidence strip:

- Sensor-validation tooling: approximately `3–4 months → 1–2 weeks`
- Field-validation travel: approximately `weekly 1–2 trips → monthly 1–2 trips`
- HoloLens SDK validation: `4–5 micro-PoCs`, with typical feature checks in `1–2 days`

Every approximate value uses wording that makes its estimate status clear. Customer and partner identities are omitted.

### How I Work

1. **Define from First Principles** — understand coordinate systems, registration, sensors, and clinical or field workflows before implementation.
2. **Probe with Small Experiments** — build parallel micro-PoCs to expose uncertainty and reduce failure cost.
3. **Integrate and Multiply** — merge validated technology into the main system and convert repeated friction into tools, Skills, and shared validation practices.

AI is described within this operating model, not as a separate identity banner.

## Information Architecture

Approved navigation:

`Home / Projects / Capabilities / CV / Contact`

GitHub remains an external action. The deleted Repositories page is not restored.

| Page | Purpose |
|---|---|
| Home | Positioning, Capability Atlas, proven impact, working principles, and recent updates |
| Projects | All twelve projects, organized as capability chapters with equal card geometry |
| Capabilities | Problem-solving capabilities connected to projects, publications, patents, and tools |
| CV | Evidence-led career history, education, publications, patents, awards, qualifications, skills, and languages |
| Contact | Desired role and public collaboration routes without unsupported end-to-end claims |

## Projects Page

Use the approved **P1 Capability Chapters** layout. Remove `Featured / More`.

All cards use the same component and information order:

- Project title
- One-line problem
- Personally owned role
- One verified artifact or result
- Status: `Completed`, `Ongoing`, or `Research`
- Primary and cross-capability tags

The twelve projects remain equally discoverable. Different chapter lengths are accepted and use whitespace rather than artificial filler.

### Primary Capability Mapping

| Capability chapter | Primary projects |
|---|---|
| 3D Registration & Navigation | Surgical Twin, rTMS Navigation, Mandibular Fracture Restoration, C-arm Navigation |
| Sensor Perception & Safety | Unmanned Forklift, Quadruped Robot |
| Digital Twin & Validation | Radioactive Digital Twin |
| Clinical-to-XR Translation | Life Careverse, Orthognathic AR, Oral-facial AR, AR Distance Meter |
| AI-Enabled Tool Building | LLM Wiki |

Cross-capability tags may reference additional strengths, such as Digital Twin on the Unmanned Forklift project, without duplicating a card into multiple chapters.

## Project Detail Pages

Use the approved **D2 Decision Timeline** structure.

### Required Sequence

1. **Uncertainty** — the material question or constraint at the start
2. **Probe** — the smallest useful experiment
3. **Evidence** — what the experiment revealed
4. **Decision** — what changed because of that evidence
5. **Integration** — how the validated approach entered the real system
6. **Verified Outcome** — demonstration, inspection, paper, patent, registration, user study, measured change, or delivered artifact
7. **My Decisions / Team Result** — a final side-by-side attribution summary
8. **Limitation / Current Status** — what remains uncertain, ongoing, or ended for nontechnical reasons

Only material decisions belong in the timeline. Routine implementation steps do not become timeline nodes.

### Attribution Model

Replace contribution percentages with:

- Team context
- My responsibility
- Decisions I owned
- What I built
- Human verification
- Team impact
- Current status

For AI-assisted work, add:

| Human-owned | AI-assisted |
|---|---|
| Problem definition and priorities | UI implementation |
| Domain and sensor interpretation | Data structures and binding |
| Calibration and registration strategy | Repetitive application code |
| Sampling, ICP, and acceptance strategy | Initial tool integration |
| Visual and quantitative verification | Candidate revisions |
| PR review and final merge decision | Implementation acceleration |

## CV Redesign

Keep the existing academic sections, but change employment bullets to three evidence types:

- **Owned** — systems and decisions personally owned
- **Changed** — methods, architectures, or workflows personally changed
- **Evidence** — delivered artifacts, measured effects, validation, registration, papers, patents, or team adoption

Add AI-enabled development as a current working capability, with human/AI responsibility boundaries. Do not list AI products as an undifferentiated tool cloud.

## Capabilities Page

Rename `Research Fields` to `Capabilities`.

Each capability answers:

1. What class of problem does this solve?
2. Which principles and technical methods does Jinmin use?
3. How does he validate correctness?
4. Which projects, publications, patents, or tools prove it?

Technology names remain supporting metadata, not the main content.

## Shared Data and SSOT

Create a plain browser-compatible JavaScript data module, such as `js/projects-data.js`. Do not use JSON fetched at runtime, because direct `file://` preview must continue to work.

The shared data source contains only duplicated, stable metadata:

- `slug`
- `title`
- `period`
- `status`
- `primaryCapability`
- `crossCapabilities`
- `problemSummary`
- `ownedRole`
- `verifiedEvidence`
- `evidenceState`: `verified`, `ongoing`, or `expected`
- public links

Home, Projects, and Capabilities render their shared project references from this source. Detailed decision narratives remain in each project's HTML file.

If required metadata is missing, the renderer must skip the malformed card, log a clear warning, and preserve the rest of the page. The content validator must fail before commit for missing required records or broken project routes.

## Visual System

- Retain the navy academic palette and current restrained reading widths.
- Use a serif display face for identity and chapter headings; retain a highly readable sans-serif for body and metadata.
- Use thin rules, restrained gold accents, and whitespace for hierarchy.
- Capability colors remain muted and accessible; color is never the only capability label.
- Avoid generic gradient heroes, decorative AI imagery, terminal motifs, skill-progress bars, and dense dashboard styling.
- Preserve mobile reading order: Hero, Capability Atlas, Proven Impact, How I Work, updates.

## Privacy and Claim Governance

- Anonymize customers, hospitals, industrial partners, and nonpublic project-company relationships.
- Retain names inherent to public papers, patents, awards, and formal CV affiliations.
- Approximate metrics use `approximately` or `roughly`.
- Ongoing team-governance improvements are described as current practices, not proven productivity outcomes.
- Expected future maintainability, stability, and feature velocity remain explicitly expected.
- Team outcomes always appear separately from the mechanism Jinmin personally owned.

## Validation

Add a lightweight, manually invoked content validation script. It does not become a build system.

The validator checks:

- all twelve project records exist;
- every project has exactly one primary capability;
- slugs match real detail-page paths;
- periods and statuses have a single canonical value;
- required attribution and evidence-state fields are present;
- expected outcomes are not rendered as verified;
- shared public metadata does not contain prohibited customer or partner names.

Browser verification covers:

- direct `file://` preview;
- local `python -m http.server` preview;
- GitHub Pages-compatible relative paths;
- keyboard and screen-reader navigation;
- desktop and mobile widths;
- readable selectable text for key role, skill, date, and outcome information;
- all project cards and detail links;
- no dependency on the removed Repositories route.

## Repository Documentation

Update `AGENTS.md`, `CLAUDE.md`, and `README.md` to reflect:

- current navigation;
- Capabilities rather than Research Fields;
- no Repositories page;
- shared project metadata SSOT;
- project-detail decision timeline;
- content validation command;
- continued no-build deployment through GitHub Pages.

## Implementation Phases

### Phase 1: Foundation

- Introduce shared project metadata and renderer utilities.
- Add content validation.
- Add new content and status tokens.
- Correct repository documentation and canonical dates/statuses.

### Phase 2: Core Surfaces

- Rebuild Home around the Pure Capability Atlas.
- Rebuild Projects as capability chapters.
- Convert Research Fields into Capabilities.
- Rewrite CV role bullets and align Contact claims.

### Phase 3: Case Studies and QA

- Convert all twelve project detail pages to the decision-timeline model.
- Add human/AI attribution where applicable.
- Add privacy-safe evidence and limitation statements.
- Complete file, HTTP, mobile, accessibility, and link verification.

## Non-Goals

- No framework migration, static-site generator, package build, CMS, or server-side component system
- No restoration of the Repositories page
- No removal or archival of the twelve projects
- No public exposure of private LLM Wiki notes or detailed ingestion internals
- No claim that ongoing governance or greenfield architecture has already produced long-term maintenance benefits
- No redesign that replaces the established academic portfolio character with a generic AI-startup aesthetic
