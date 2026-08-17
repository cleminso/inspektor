# Floating mutation widget implementation tasks

## Table of contents

- [Implementation boundaries](#implementation-boundaries)
- [Tasks](#tasks)
- [Validation commands](#validation-commands)

## Implementation boundaries

- Keep `Apply changes` as the only persistence boundary for staged updates and deletions.
- Keep complete-row insertion outside the staged ledger.
- Do not implement query-backed bulk mutation, JSON structural diffing, or target-preview virtualization.
- Preserve raw invalid input even when valid fields in the same row are reverted.
- Use semantic row IDs and column IDs; do not discover grid targets through DOM queries.
- Use one shared grid context-menu composition rather than mounting one context-menu root per rendered cell.
- Do not hand-edit generated route trees or generated prop metadata.

## Tasks

- [x] 1. Add field- and row-scoped revert primitives to the mutation domain.
  - Add a pure update-draft operation that removes one field overlay without disturbing sibling overlays, source values, or invalid sibling input.
  - Add reducer actions for reverting one update field and one complete row update.
  - Keep deletion-over-update and clean-draft removal invariants intact.
  - Acceptance: reverting the final valid field removes its applicable update while unrelated invalid raw input remains recoverable.
  - Verify: focused draft and ledger reducer tests fail before implementation and pass after it.
  - Files: `apps/web/src/features/tables/rowEditor/mutation/draft.ts`, `draft.test.ts`, `apps/web/src/features/tables/mutationLedger/ledger.ts`, `ledger.test.ts`.

- [x] 2. Preserve deletion-operation identity independently from Apply entries.
  - Replace the flat canonical deletion-ID list with deletion operations created by each confirmed delete action.
  - Derive deduplicated row deletion entries for Apply while retaining operation ID, target rows, and affected-row count for review.
  - Removing one row from a deletion operation must preserve the remaining targets and remove an empty operation.
  - Treat each edited row as one row-update review operation without changing its raw-draft ownership.
  - Acceptance: one confirmed 24-row deletion renders one review operation and still produces 24 deterministic Apply entries.
  - Verify: reducer, selector, workspace-preservation, Apply-order, and delete-over-update tests.
  - Files: `apps/web/src/features/tables/mutationLedger/ledger.ts`, `ledger.test.ts`, `provider.tsx`, `provider.test.tsx`.

- [x] 3. Expose constrained recovery and review projections from the provider.
  - Expose commands for reverting one field, reverting one row update, undoing one deletion target, and undoing one review operation.
  - Reset stale Apply failure state after every recovery command.
  - Expose stable staged-field membership keyed by row ID and column ID for visible grid projection.
  - Expose review operations separately from the row-level Apply ledger.
  - Acceptance: mounted pane and inline editor projections update immediately after every recovery scope.
  - Verify: provider identity, mounted-editor synchronization, failure reset, and workspace-remount tests.
  - Files: `apps/web/src/features/tables/mutationLedger/provider.tsx`, `provider.test.tsx`, `apps/web/src/features/tables/floatingWidget/floatingWidget.test.tsx`.

- [x] 4. Add the staged-change semantic color family.
  - Add `stagedChangeColors` with constrained background and border roles derived from the warm amber palette in both color schemes.
  - Keep the family independent from warning, success, selection, and component names.
  - Add token contract coverage for the staged-change background and border.
  - Acceptance: product components can consume staged-change intent without importing primitive palette values or implying validation severity.
  - Verify: token tests plus browser comparison in both color schemes and forced colors.
  - Files: `packages/design-system/src/tokens/semantics.stylex.ts`, `tokens.stylex.test.ts`, `packages/design-system/src/components/dataGrid/dataGridColors.stylex.ts`, `dataGrid.test.tsx`.

- [x] 5. Add a constrained staged-update cell status to `DataGrid`.
  - Add a cell-status contract parallel to the existing constrained row-status contract.
  - Link the private Data Grid staged-update background and border roles to `stagedChangeColors`.
  - Keep the staged-update background visible when the cell or its column is selected; inline editing uses the existing blue editing treatment.
  - Ensure staged deletion suppresses staged-update presentation.
  - Acceptance: only cells reported as staged updates receive the treatment, with no layout or gridline change.
  - Verify: style contract and component-state tests in light, dark, compact, selected, focused, and forced-colors states.
  - Files: `packages/design-system/src/components/dataGrid/dataGrid.tsx`, `dataGridContext.ts`, `dataGrid.styles.ts`, `dataGridColors.stylex.ts`, `dataGrid.test.tsx`.

- [x] 6. Project valid staged fields into the product grid.
  - Derive staged cell membership from applicable update fields rather than raw dirty-field keys.
  - Pass cell status through `DataGrid.Root` without rebuilding schema columns or row models for unrelated ledger changes.
  - Preserve the row checkbox for staged updates and retain the existing deletion-row precedence.
  - Acceptance: scalar and structured staged fields highlight immediately, semantic reversion removes the highlight, and invalid-only fields do not highlight.
  - Verify: Table View integration tests for one field, several fields, invalid sibling input, field reversion, hidden columns, and staged deletion.
  - Files: `apps/web/src/features/tables/workspace/tableView.tsx`, `tableView.test.tsx`, `packages/design-system/src/components/dataGrid/dataGrid.test.tsx`.

- [x] 7. Establish one shared grid context-menu bridge.
  - Audit the installed Base UI Context Menu API and tagged source before changing the wrapper.
  - Connect the existing semantic Data Grid row and cell context-menu targets to one shared Context Menu without per-cell roots, DOM discovery, or positional matching.
  - Keep column-header context menus independent.
  - Preserve native context-menu positioning, keyboard focus management, dismissal, and originating-target identity.
  - Acceptance: right-clicking a cell captures its semantic row and column target, row-scoped commands derive from that row ID, and only one menu root is mounted.
  - Verify: Context Menu and Data Grid integration tests for pointer opening, target precedence, dismissal, and focus restoration.
  - Files: `packages/design-system/src/components/contextMenu/contextMenu.tsx`, `contextMenu.test.tsx`, `packages/design-system/src/components/dataGrid/dataGrid.tsx`, `dataGrid.test.tsx`.

- [x] 8. Add staged recovery commands to the shared grid context menu.
  - Show `Revert this change` only for an applicable staged data cell.
  - Show `Revert staged changes` only for a row with an applicable staged update.
  - Include both commands when the targeted cell is staged and its row contains staged updates; keep cell scope before row scope.
  - Do not offer update recovery for the synthetic selection column or staged-deletion rows.
  - Restore focus to the originating cell after cell revert and to the originating row target after row revert when still mounted.
  - Acceptance: commands remove exactly their stated scope and disappear when that scope becomes clean.
  - Verify: product integration tests for cell scope, row scope, structured fields, sibling invalid input, and menu reopening.
  - Files: `apps/web/src/features/tables/grid/tableGridContextMenu.tsx`, `tableGridContextMenu.test.tsx`, `apps/web/src/features/tables/workspace/tableView.tsx`, `tableView.test.tsx`.

- [x] 9. Replace affected-row review with operation review.
  - Remove `x fields` and per-target `X` controls from compact review rows.
  - Render row updates and deletion operations using the plain-language rules in the design specification.
  - Show operation counts on the Updates and Deletions accordion triggers without a redundant total summary.
  - Add an explicit `Undo` action with an accessible name that includes the operation summary.
  - Describe JSON, Array, and Row changes by column name without serializing their staged values.
  - Acceptance: a 24-row deletion is one review item, update rows show their identity and changed columns, and no field-count copy remains.
  - Verify: selector and Floating widget tests for singular, plural, mixed, structured, long-identity, invalid, and failed-Apply states.
  - Files: `apps/web/src/features/tables/mutationLedger/ledger.ts`, `ledger.test.ts`, `apps/web/src/features/tables/floatingWidget/floatingWidget.tsx`, `floatingWidget.test.tsx`.

- [x] 10. Move scrolling to operation lists and bound large rendering.
  - Keep the accordion root, operation triggers, summary, errors, Apply, and Discard outside every scroll viewport.
  - Fit ten operation rows or fewer to content and expose a ten-row viewport above that count.
  - Use a constrained review-row height token rather than measuring arbitrary content.
  - Render up to 100 operation items directly and virtualize lists above that threshold; do not virtualize accordion items.
  - Acceptance: short sections do not scroll, long sections scroll independently, and 1,000 manual row operations do not mount 1,000 interactive rows.
  - Verify: layout contract tests plus browser checks for both sections open, keyboard traversal, removal near viewport boundaries, narrow width, and both color schemes.
  - Files: `apps/web/src/features/tables/floatingWidget/floatingWidget.tsx`, `floatingWidget.test.tsx`, and the narrowest required design-system scroll-area or spatial-token files.

- [ ] 11. Close documentation and cross-package validation.
  - Update the Inline Editing checklist with completed blocks without changing older dated blocks.
  - Regenerate design-system prop metadata only if a public Data Grid or Context Menu contract changes.
  - Verify that staged update, staged deletion, selection, active target, focus, invalid input, Apply failure, and recovery remain distinct.
  - Acceptance: source, behavior specification, design document, checklist, and executable behavior agree.
  - Verify: all commands below plus running-product keyboard, pointer, focus-restoration, theme, high-zoom, and narrow-viewport checks.

## Validation commands

- `pnpm --filter @inspector/ds test`
- `pnpm --filter @inspector/ds typecheck`
- `pnpm --filter @inspector/ds lint`
- `pnpm --filter @inspector/ds build`
- `pnpm --filter inspector.design-system test`
- `pnpm --filter inspector.design-system gen:props`
- `pnpm --filter inspector.design-system check:props`
- `pnpm --filter inspector.design-system typecheck`
- `pnpm --filter inspector.design-system build`
- `pnpm --filter regarde.inspector test`
- `pnpm --filter regarde.inspector typecheck`
- `pnpm --filter regarde.inspector lint`
- `pnpm --filter regarde.inspector build`
