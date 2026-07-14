# Portfolio Positioning Audit

Date: 2026-07-15  
Repository: `rafaam11.github.io`  
Scope: public portfolio content, information architecture, project attribution, AI-enabled working style, and relevant professional evidence from the user's LLM Wiki and Second Brain systems

## Purpose

The portfolio currently documents a broad technical history, but it does not consistently show what Jinmin personally decided, built, validated, or changed inside a team. This audit defines what to retain, correct, restructure, and substantiate before implementation.

The approved target is a senior R&D audience hiring a hands-on technical-lead IC in 3D spatial computing. AI is presented as a working method that accelerates implementation, not as the primary professional identity.

## Approved Result Shape

The user selected a phased result:

1. Establish positioning and defensible evidence.
2. Redesign information architecture and content structure.
3. Produce and execute a page-by-page implementation plan.

This audit and the companion design specification complete the first two design phases. They do not authorize content implementation yet.

## Current-State Summary

The live navigation is `Home / CV / Research Fields / Projects / Contact`, plus GitHub. The former Repositories page no longer exists, although repository guidance still describes it as part of the site.

The strongest current case studies are those that already expose ownership, constraints, decisions, and delivery evidence:

- Unmanned forklift
- Surgical Twin
- Mandibular fracture restoration
- rTMS navigation, with ongoing-result caveats
- LLM Wiki, with missing adoption and productivity evidence in the current page

Only six of twelve project pages currently contain all three of `Problem`, `Approach`, and `Result`. Team influence is rarely explicit, and project dates or statuses are duplicated across pages.

## Standard Audit Buckets

| Bucket | Findings | Approved treatment |
|---|---|---|
| Healthy | Shared navy academic theme, top navigation renderer, reusable case-study styling, strongest ownership-led project narratives, LLM Wiki master planning and architecture evidence | Retain and reuse. Preserve the calm academic visual character. |
| Possibly stale / mixed | Time-sensitive Home and CV statements, ongoing rTMS and Life Careverse results, radioactive digital-twin dates, plans mixed with shipped LLM Wiki behavior, old Second Brain claims and target metrics | Verify before publication. Label outcomes as `Verified`, `Ongoing`, or `Expected`. |
| Definitely stale / one-shot | Former Repositories route, retired first-generation automation, legacy Notion sync, empty/default vaults, old standalone prototype narratives without continuing evidence | Do not restore the Repositories page. Retain all twelve public portfolio projects, but describe completed prototypes honestly. Do not use retired tooling as current capability evidence. |
| Duplicates / near-duplicates | Project dates and statuses repeated across Home, Projects, and detail pages; obsolete repository descriptions repeated in `AGENTS.md`, `CLAUDE.md`, and `README.md`; old and current knowledge-system snapshots | Centralize shared project metadata. Update repository guidance to the same current structure. Preserve intentional historical archives without presenting them as current systems. |
| Rule violations | Repository documentation contradicts the live navigation; LLM Wiki README status contradicts its master plan; some expected benefits are worded close to achieved outcomes | Correct the public repository guidance. Use the LLM Wiki master plan and verified artifacts rather than stale README status. Separate facts, estimates, and expectations. |

## Triage Decisions

### Retain

- All twelve portfolio projects remain publicly discoverable.
- The broad range of medical, robotics, XR, digital-twin, and AI-tooling work is retained to demonstrate transferable adaptability.
- The existing academic navy design language remains the visual base.
- Home, Projects, Capabilities, CV, and Contact remain distinct pages.
- LLM Wiki remains a project and a compact proof that the user builds tools to solve personal workflow problems.

### Restructure

- Remove `Featured / More` hierarchy. All project cards receive equal geometry and visibility.
- Group projects by transferable capability rather than industry or chronology.
- Replace contribution percentages such as `95%`, `90%`, or `30%` with explicit ownership, decisions, artifacts, and evidence.
- Replace the current technology inventory emphasis with capability-to-evidence links.
- Present project narratives as decision trails: uncertainty, probe, evidence, decision, integration, outcome, team result, and limitation.

### Correct

- Update `AGENTS.md`, `CLAUDE.md`, and `README.md` to the actual navigation and SSOT structure.
- Reconcile divergent project periods and statuses.
- Keep the deleted Repositories route deleted.
- Do not describe ongoing governance rules as proven productivity improvements.
- Do not describe future forklift maintainability and feature velocity as achieved outcomes.

### Delete

No portfolio project, current page, or inventoried knowledge-system artifact is approved for deletion in this audit. The deletion-verification gate is therefore not applicable.

## Confirmed Positioning Evidence

### Surgical Twin

- Personally connected camera, medical-image, and rigid-registration coordinate systems.
- Analyzed the HoloLens SDK and built approximately four to five micro-PoCs.
- Typical feature feasibility checks took roughly one to two days; validated functions could be integrated in approximately one to two weeks.
- Eye-tracking instability was reframed as noisy sensor data and mitigated using a ten-frame mean with outlier exclusion.
- The team completed the work without outsourcing the SDK integration.
- The result passed demonstration, inspection, quantitative project targets, and final-report inclusion.
- No follow-on project occurred because company strategy shifted from medical to industrial work, not because the PoC failed.

### Life Careverse

- Translated clinical concepts such as midline, overjet, overbite, articulator workflows, surgical tools, timing, and direction into implementable XR scenarios.
- Converted orthognathic-surgery consultation content into clinically meaningful slide and 3D-model arrangements.
- Used rapid prototypes to create agreement with external clinical stakeholders.
- Evidence includes requirement approval, adoption after demonstration, software copyright registration, and progression to patient-consented research testing and surveys.

### Unmanned Forklift and LiteSim

- Personally designed and implemented SafetyGate, vision-recognition, and LiDAR/ToF obstacle-sensor areas.
- Built module-specific LiteSim digital-twin validators because repeated physical-forklift testing was expensive and operationally constrained.
- Used LiteSim to check sensor blind spots, obstacle-response acceleration/deceleration gates, and coordinate-system issues before field deployment.
- The tool expanded from individual use to the full development team.
- Field-validation travel decreased from roughly one to two trips per week to one to two trips per month.
- LiteSim also accelerated team communication and management reporting.

### AI-Enabled Development

- The user owns problem definition, domain interpretation, development scenarios, calibration and registration strategy, sampling decisions, ICP strategy, acceptance criteria, and final review.
- AI agents implement UI, data structures, binding, and other repetitive application code.
- Visual overlays are a primary validation mechanism.
- Requirement context is developed through an interview-first agent workflow.
- Comparable sensor-validation tooling decreased from an estimated three to four months of implementation to approximately one to two weeks.
- The user personally defined human-owned review items, PR validation before merge to `dev`, Skills for core implementation procedures, and a master Markdown planning SSOT.
- The new governance is ongoing. Its rationale is supported by a prior document-drift incident that caused duplicate work and redevelopment, but post-adoption improvement has not yet been measured.

### LLM Wiki

- Built by the user alone with AI agents; multiple Git author identities do not represent human collaborators.
- Motivated by accumulated information that was rarely reused, unclear storage destinations, fragmented knowledge and tasks, and the constraints of existing tools.
- Demonstrates a recurring behavior: when available tools do not fit the user's working model, the user designs and builds a usable system.
- Detailed ingestion internals are intentionally outside the portfolio narrative.

## Privacy and Attribution Rules

- Anonymize customers, hospitals, industrial partners, and nonpublic company-project identities in case studies.
- Retain public academic affiliations when they are inherent to published papers, patents, awards, or the CV.
- Publish the user's role, decisions, technical method, defensible metrics, and verification evidence.
- Distinguish team outcomes from personal mechanisms.
- Mark estimates as approximate and current initiatives as ongoing.

## Key Risks

- Over-positioning AI could obscure the stronger 3D spatial-computing identity.
- Equal project visibility could flatten evidence quality unless every card states its evidence level honestly.
- A decision-timeline template could become long; timelines must include only decisions that materially changed the project.
- Centralized metadata must not grow into a full content-management system or introduce a build step.
- Institution anonymization must not accidentally remove public publication attribution.

## Audit Outcome

The portfolio should shift from an institution-and-project inventory to evidence of a repeatable operating model:

> Define 3D problems from mathematical and domain fundamentals, probe uncertainty through small parallel experiments, integrate validated technology into working systems, and turn recurring friction into tools that improve team execution.

