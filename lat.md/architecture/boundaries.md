# Workspace boundaries

The headless core owns inspection behavior. Applications own presentation and platform integration. The design system owns reusable UI.

## Contents

Use these rules when assigning code or choosing validation.

- [Owners](#owners)
- [Core boundary](#core-boundary)
- [Studio coordination](#studio-coordination)
- [Validation](#validation)

## Owners

Each workspace has one primary responsibility.

| Workspace                | Responsibility                                                                  |
| ------------------------ | ------------------------------------------------------------------------------- |
| `apps/studio`            | Routes, React projections, browser adapters, and workbench presentation.        |
| `packages/core`          | Headless connection, session, query, draft, and write workflows; Jazz adapters. |
| `packages/design-system` | Reusable components, interaction, tokens, and brand presentation.               |
| `apps/design-system`     | Public component documentation, examples, and registry contracts.               |
| `apps/website`           | Public routes, copy, metadata, analytics, and page assembly.                    |

Applications consume public `@inspektor/ds` exports, not package-private source paths. Studio does not recreate Base UI behavior.

See [[designSystem|Design system]] for presentation rules, [[importBoundaryPlaybook|Import boundaries]] for optional dependencies, and [[website|Website]] for the public request boundary.

## Core boundary

The accepted rewrite separates workbench decisions from Jazz access without creating another database authority. [Core work](../../todo.md/core.md) tracks implementation and integration.

- Domain modules own connection intent, session coordination, query intent, drafts, local validation, write coordination, and preference contracts. The internal `src/studio/` folder is not a public namespace.
- `jazz/` implements Jazz access contracts using public SDK APIs where available. Exported diagnostic APIs stay isolated behind adapters; unexported helpers are not deep-imported or copied.
- React, routing, browser storage, downloads, and browser lifecycle implementations stay outside core.
- Jazz types remain authoritative at the SDK boundary. Effect manages execution, observation, and resource lifetime. [[jazzAccess#Rows and writes]] owns write authority and settlement.
- Modules use lowercase filenames. Model states, failures, and behavior scenarios before fixing public service APIs.

Clients import explicit public `@inspektor/core/connection`, `/session`, `/query`, `/draft`, `/write`, `/workbench/connection`, `/workbench/rowEditing`, and `/workbench/exploration` entries. Jazz adapters use `/jazz/client`, `/jazz/query`, and `/jazz/schema`. Other package paths are private. Workspace builds select source through `inspektor-source`; other ESM consumers use emitted modules and declarations. Core does not import application aliases or UI packages.

## Studio coordination

Studio separates accepted intent, resource attachment, retained workspace state, and presentation. These are application responsibilities, not new database authorities.

- Connections adapt profile commands, credential retention, and browser persistence.
- Entry resolves route intent into validated target evidence or repair navigation.
- Runtime attaches the accepted target to core resource lifetime and projects observations.
- The exploration feature owns query preparation and recovery. Studio coordinates route commits, tabs, and history.
- The core row-editing feature retains update drafts, submission admission, and native settlement outside keyed panes. Studio attaches feature observations and applies pane outcomes.
- Presentation owns pane transitions, focus, clipboard, and rendered feedback. Insert drafts keep their existing form-local lifetime.

[[routing#Accepted workspace selection]] owns selection authority. [[rowChanges]] owns retained intent and write outcomes. Browser storage and lifecycle are adapters, not alternate workflow owners.

Headless product features group complete workflows under `workbench/`; Jazz adapters remain separate. [Workbench structure](../../todo.md/reshapeStructure.md) records internal integration and its validation limits. Existing primitive entries remain available; developer-facing toolkit design is separate.

## Validation

Checks prove different boundaries. Source consumption does not prove package distribution, and a build does not prove browser behavior.

- Design-system tests own reusable component correctness.
- The documentation app tests its registry, catalog, shell, and demo contracts, not every component page.
- Website tests cover local behavior; Playwright covers built-site browser behavior.
- Studio has no automated test suite. Use lint, typecheck, build, and Worker checks; report runtime verification separately.
- Core checks use Node assertions and compiler checks. Local real Jazz checks use isolated in-memory storage; browser and external-provider acceptance remain separate.

Use the [workflow validation reference](../../.opencode/skills/inspector-workflow/references/validation.md).
