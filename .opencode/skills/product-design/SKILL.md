---
name: product-design
description: Applies Inspector product-design judgment to user-visible UI decisions and records accepted reasoning beside the code. Use when shaping, implementing, reviewing, or hardening product interfaces, design-system semantics, interaction states, visual hierarchy, color, spatial decisions, accessibility, resilience, or product copy.
---

# Inspector Product Design

## Table of contents

- [Operating contract](#operating-contract)
- [Request modes](#request-modes)
- [Reference routing](#reference-routing)
- [Recording decisions](#recording-decisions)
- [Validation](#validation)

## Operating contract

- Start with the user's job and the product object being changed.
- Define the desired outcome and non-goals before choosing a component or treatment.
- Use accepted repository guidance and verified product behavior instead of taste.
- Treat shipped code as evidence, not automatic precedent.
- Separate observed facts, accepted decisions, assumptions, and unresolved questions.
- Choose the smallest coherent intervention.
- Resolve semantics, interaction, hierarchy, and state behavior before decoration.
- Cover every reachable state without inventing states the product cannot enter.
- Verify the rendered surface; source inspection alone does not establish visual quality.

## Request modes

- **Shape:** clarify the job, behavior, scope, states, and success criteria before implementation.
- **Implement:** apply accepted product and design-system decisions without reopening settled questions.
- **Review:** compare a rendered surface, screenshot, or diff against canonical guidance and product behavior.
- **Copy:** improve interface language without expanding into unrelated redesign.
- **Harden:** cover loading, empty, error, permission, destructive, responsive, and accessibility states.

Do not turn review into editing unless the user requests changes.

## Reference routing

For color systems, token naming, theming boundaries, or component color states:

1. Read [colorSystem.md](colorSystem.md).
2. Read [colorTokenLayers.md](colorTokenLayers.md) when adding, moving, exposing, or reviewing token ownership.
3. Load `create-inspector-component` when component implementation changes.
4. Load `document-inspector-component` when public component documentation or examples change.

Follow `AGENTS.md` for architecture, constrained APIs, implementation checklists, and validation order. Canonical component behavior remains with the component skills and source code rather than being duplicated here.

## Recording decisions

Record accepted reasoning according to its role:

- A **reference** defines a reusable product rule, vocabulary, ownership boundary, and validation criteria.
- An **exemplar** explains a concrete accepted decision, rejected alternatives, and why the pattern is worth repeating.
- `docs/todo/*.md` tracks implementation work, exclusions, and unresolved questions.
- `AGENTS.md` owns repository-wide operating constraints and skill-loading triggers.
- Tests and linters enforce deterministic parts of the decision.

Do not promote one implementation into guidance without evidence that it represents an accepted reusable decision. Keep coverage gaps explicit instead of inventing a standard.

## Validation

- Confirm the implementation follows the relevant reference and ownership boundary.
- Verify every reachable state affected by the change.
- Run focused tests and changed-file lint before package-wide validation.
- Verify visual and interaction outcomes in the browser for each supported color scheme and relevant viewport.
- Update the reference or exemplar only when product reasoning changes, not for value-only implementation edits.
- Report unresolved design questions separately from implementation defects.
