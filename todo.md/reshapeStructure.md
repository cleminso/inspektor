# Workbench structure

Reshape Inspektor around complete product workflows. Existing hooks, controllers, and public core interfaces can change. Jazz remains the data authority.

## Contents

- [Direction](#direction)
- [Work](#work)
- [Validation](#validation)
- [Exclusions](#exclusions)

## Direction

Core owns headless product workflows. Studio owns interaction workflows and presentation. Platform adapters implement browser effects.

- **Connections:** discovery, validated entry, client lifetime, and recovery.
- **Exploration:** query intent, observation, supersession, result retention, and recovery.
- **Row editing:** drafts, validation, submission admission, native handles, settlement, and refresh outcomes.
- **Workspace:** composes feature instances and their lifetimes. Studio owns accepted routes, tabs, pane visibility, selection, focus, and confirmations.

Group core workflows under `workbench/`, with Jazz adapters separate. Derive private files from cohesive responsibilities; do not require one file per operation or a fixed template.

Expose semantic operations and feature-scoped observations. Hide reducers, execution setters, caller-owned locks, navigation refs, and hook-derived interface types.

## Work

Each item completes a consumer workflow, not only a folder move.

- [x] [done] Establish the row-editing feature and integrate Studio.
  - Core owns retained draft transitions, admission, submission, settlement, refresh outcomes, and duplicate-source loading.
  - Studio calls semantic operations without draft reducers, execution setters, or a shared write lock. Insert drafts remain form-local.
  - Evidence: [feature](../packages/core/src/workbench/rowEditing.ts), [checks](../packages/core/tests/rowEditing.ts), and [Studio adapter](../apps/studio/src/features/tables/rowChanges/provider.tsx).
- [x] [done] Reshape exploration around one query workflow.
  - Complete when query changes, observation, supersession, preparation, and recovery have one headless owner; Studio owns route commits and grid interaction.
  - Implemented in the [feature](../packages/core/src/workbench/exploration.ts) and [Studio adapter](../apps/studio/src/features/exploration/useTableExploration.ts).
  - Evidence: [focused assertions](../packages/core/tests/exploration.ts), affected-package checks, and independent implementation and assertion reviews.
- [x] [done] Reshape connections around one entry and lifetime workflow.
  - Complete when discovery, validated entry, replacement, and recovery expose cohesive operations and observations.
  - Preserve credential isolation, committed-route authority, stale-attempt suppression, and full-client cleanup.
  - The [connection owner](../packages/core/src/workbench/connection.ts) reuses discovery and session logic for startup, replacement, reconnect, and cleanup. Studio keeps browser and interaction effects. No cache or command framework was added.
  - Evidence: [focused assertions](../packages/core/tests/connectionRuntime.ts) and [browser attachment](../apps/studio/src/app/runtime/useConnectionRuntime.ts).
- [x] [done] Simplify workspace composition and feature consumers.
  - Complete when navigation, confirmations, and feature lifetime are explicit, without an application-wide controller or duplicated sequencing in callers.
  - Remove obsolete adapters and aliases after their consumers migrate.
  - Forms use core draft operations directly. Pane admission reads current feature state without an approval bypass; tab-close policy remains separate. Refused discard cannot continue navigation.
  - Evidence: [form binding](../apps/studio/src/features/tables/rowEditor/editorFields.tsx), [retained editing adapter](../apps/studio/src/features/tables/rowChanges/provider.tsx), and [pane coordination](../apps/studio/src/features/tables/workspace/tableView.tsx).

## Validation

Use existing core Node assertions and compiler checks. Do not add Studio test infrastructure for this work.

Run focused regressions, affected-package lint and typechecks, required builds and Worker checks, and `lat check`. Use targeted browser checks for changed integration. Complete independent implementation and assertion reviews.

The first slice passed core assertions, affected-package lint and typechecks, builds, Studio Worker dry-run, and `lat check`. Independent reviews covered implementation and assertions.

Core workflow assertions use simulated native handles. A local in-memory Jazz browser smoke check covered saving, persistence after reload, and delete confirmation from a closed pane. Hosted delivery and broader browser lifecycle cases remain unverified.

Exploration passed core assertions, affected-package lint and typechecks, builds, Studio Worker dry-run, `lat check`, and independent implementation and assertion reviews. Its focused assertions use controlled canonical descriptors. A local in-memory Jazz browser smoke check covered 100-row pagination, the five-row last page, and descending sorting with reset to page 1. Hosted transport recovery remains unverified.

Connections passed core assertions, affected-package lint and typechecks, builds, Studio Worker dry-run, `lat check`, and independent implementation and assertion reviews. Focused tests use real sessions with acquisition and reconnect doubles. A built Studio smoke check used local Jazz for entry, reload, resume with a retained draft, save, and saved data after reload. Visibility and clock signals were synthetic. Hosted transport and operating-system suspension remain unverified.

Internal cleanup passed Studio lint, typechecks, build, Worker dry-run, existing draft and row-editing assertions, and independent component and complete-diff reviews. Built-browser checks covered pane and tab confirmation, same-row activation, JSON draft display, save, insert-more reset, and saved data after reload. The refused-discard regression failed before the fix and passed after it, using a `discardAll` double. It does not prove a native pending-write scenario.

## Exclusions

These items are not part of this structure change.

- New product capabilities or a generic command framework.
- Event sourcing, another Jazz cache, or local permission enforcement.
- Native application integration.
- Changing insert-draft retention without a separate product decision.
- Broad test infrastructure or unrelated UI changes.
- Designing or publishing a developer-facing toolkit.
