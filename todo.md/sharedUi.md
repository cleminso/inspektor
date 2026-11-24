# Shared UI implementation

Close specific interaction and accessibility gaps in reusable design-system components.

## Contents

Read the work and its validation limits together.

- [Scope](#scope)
- [Work](#work)
- [Evidence](#evidence)

## Scope

The design-system package owns reusable interaction behavior. Its documentation app consumes public components.

Exclude a component-by-component readiness inventory and image baselines without an accepted workflow.

## Work

Keep each behavior under its component owner.

- [ ] [ready] Add Arrow Left parent navigation from JSON continuation items.
  - Complete when: both actionable continuation items and exhausted-budget items move focus to their parent without expanding the render budget; focused regression coverage passes.
  - Evidence: the continuation handler in [JsonView](../packages/design-system/src/studio/jsonView/jsonView.tsx) handles Enter, Space, vertical arrows, Home, and End, but not Arrow Left.
- [ ] [ready] Add rendered accessibility checks and a defined composite-widget smoke procedure.
  - Complete when: representative dialog, menu, combobox, grid, and tree compositions have rendered role/name/state checks, automated accessibility scans, and a documented keyboard and assistive-technology procedure.
  - Evidence: [existing grid tests](../packages/design-system/src/studio/dataGrid/dataGrid.test.tsx) and [tree tests](../packages/design-system/src/studio/jsonView/jsonView.test.tsx) provide a test boundary. The package has no accessibility-scan dependency in its [manifest](../packages/design-system/package.json).
  - Limit: static lint and DOM checks do not establish assistive-technology acceptance.

## Evidence

Source inspection confirms the continuation-handler gap. Runtime verification remains open.
