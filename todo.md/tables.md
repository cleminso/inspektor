# Tables implementation

Verify the current table and pane-only editing flow. Older inline-editor, floating-widget, and batch Apply plans do not define this scope.

## Contents

Read the work and its evidence limits together.

- [Scope](#scope)
- [Work](#work)
- [Evidence](#evidence)

## Scope

Cover page rendering, selection, filtering, row editing, and navigation through the existing [Tables workspace](../apps/studio/src/features/tables/workspace/tableView.tsx).

Exclude inline mutation, matrix paste, query-wide writes, and new test infrastructure without approval. [Table operation ideas](../lat.md/ideas/tableOperations.md) are separate proposals.

## Work

The current source implements these surfaces. Runtime acceptance remains incomplete.

- [ ] [ready] Reproduce or close the reported blank-window scrolling issue.
  - Next action: exercise scrollbar jumps and rapid scrolling on pages larger than 100 rows in a production build.
  - Complete when: record the browser, page sizes, and observed result; fix a reproduced gap and verify it, or close the report with evidence.
  - Evidence: [TableView](../apps/studio/src/features/tables/workspace/tableView.tsx) selects virtual rendering for larger pages. The earlier report has no retained reproduction.
- [ ] [deferred] Re-establish connected Tables acceptance under an approved validation plan.
  - Trigger: approval of the post-migration validation method and a safe dataset.
  - Complete when: verify Save and refresh, Cancel, dirty Close and Escape, row/query transitions, direct Delete, Duplicate-to-Insert, filter URL round trips, and narrow-pane keyboard focus. Distinguish persistence failure from refresh failure.
  - Evidence: [edit form](../apps/studio/src/features/tables/rowEditor/editForm.tsx), [view state](../apps/studio/src/features/tables/workspace/useTableViewState.ts), and [filter draft](../apps/studio/src/features/tables/filters/filterDraft.ts).

## Evidence

Source inspection confirms pane Save wiring, current filter draft stages, and virtual rendering. It does not prove connected behavior.

[Studio's manifest](../apps/studio/package.json) has no test script. The former Studio suite and fixture were removed. Their failed assertions and Jazz alpha fixture blockers are not current acceptance results.
