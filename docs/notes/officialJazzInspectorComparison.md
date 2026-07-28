# Official Jazz Inspector comparison

## Table of contents

- [Purpose](#purpose)
- [Upstream findings](#upstream-findings)
- [Inspector strengths](#inspector-strengths)
- [Patterns to adopt](#patterns-to-adopt)
- [Patterns not to copy](#patterns-not-to-copy)
- [Interaction decisions](#interaction-decisions)
- [Editing surfaces](#editing-surfaces)
- [Pane editing](#pane-editing)
- [Inline editing](#inline-editing)
- [Mutation model](#mutation-model)
- [Update drafts](#update-drafts)
- [Insert drafts](#insert-drafts)
- [Live update reconciliation](#live-update-reconciliation)
- [Draft lifecycle](#draft-lifecycle)
- [Migration constraint](#migration-constraint)

## Purpose

This note records useful patterns from the official Jazz Inspector and settled decisions for Inspector's table mutation architecture. It should guide implementation without making the upstream grid component our architectural template.

Official source reviewed:

- `packages/inspector/src/components/data-explorer/TableDataGrid.tsx`
- `packages/inspector/src/components/data-explorer/row-mutation-form.ts`
- `packages/inspector/src/components/data-explorer/TableFilterBuilder.tsx`
- `packages/inspector/src/components/data-explorer/ColumnCustomizationModal.tsx`
- `packages/inspector/src/utility/generic-query-builder.ts`

## Upstream findings

The official inspector is strongest in grid workflows:

- It separates live source rows from staged dirty cell edits.
- It saves dirty-field patches instead of reconstructed rows.
- Incoming live updates do not overwrite staged values.
- Reverting a field to its current source value removes the staged edit.
- Inserts omit default-backed columns so the database applies defaults.
- Pagination requests `pageSize + 1` to derive whether another page exists.
- Column preferences reconcile removed and newly discovered schema columns.
- Provenance columns and live row-change feedback are first-class grid features.
- Relation labels use generic display-column heuristics.

Its main structural weakness is that querying, rendering, selection, editing, mutations, preferences, and live animations are concentrated in one large grid component.

## Inspector strengths

Keep the current Inspector direction:

- Application-owned schema classification and mutation logic.
- Reusable, constrained design-system value components.
- Schema-aware binary, timestamp, relation, and structured-value presentation.
- Explicit copy behavior and accessible failure feedback.
- On-demand relation resolution rather than one query per rendered relation cell.
- Separate query, mutation, table-state, and presentation modules.
- Deferred optional editing and interaction code.

## Patterns to adopt

- Dirty-field update patches with live source rows kept separately.
- Explicit insert states for omitted, null, valid, and invalid values.
- Omission of default-backed insert fields.
- Page-windowed `pageSize + 1` pagination.
- Schema-evolution-safe column preferences.
- Provenance columns when product work reaches them.
- Live insert, update, and removal feedback when selection and pagination semantics are ready.
- Relation display-label heuristics without adopting per-cell relation queries.
- Direct contract tests around generic Jazz query and table adapters.
- Schema validation for URL filters and sorting before query construction.

## Patterns not to copy

- A grid component that owns every query, mutation, and presentation concern.
- Runtime-only value formatting through `String` or `JSON.stringify`.
- One relation subscription per rendered cell.
- Permissive nested array, row, UUID, or relation parsing.
- Concurrent batch mutation retry semantics that can repeat partially successful work.
- Separate mutation rules for each editing surface.

## Interaction decisions

Selection, complete-row inspection, and editing are separate interactions:

- **Selection** identifies the active cell or row. It does not imply mutation.
- **Inspection** explains the value through compact presentation, the complete-row pane, copy actions, and relation navigation.
- **Editing** changes a staged row draft through an explicit edit action or editing shortcut.

Cells do not open hover cards or a separate inspection-only cell pane. Complete inspection remains available through the
complete-row pane, explicit commands, copy actions, and relation navigation.

Inspector will support two editing surfaces:

- Side-pane editing.
- Inline cell editing when the field type supports it.

## Editing surfaces

Pane and inline editing are simultaneously available. Row checkbox selection opens the complete-row pane. Cell double-click or
Enter starts schema-appropriate inline editing. JSON, Array, and Row values use an expanded code editor in an anchored inline dialog whose expand action
opens the complete-row pane focused on that field. Relation and binary cells open the complete-row pane directly. Timestamp cells
use an inline calendar when available. Generated, unsupported, and otherwise read-only values remain read-only in the grid.

The activation route does not change parsing, validation, dirty tracking, save, discard, or live-update behavior. A dirty draft
cannot move between surfaces or targets without Save and continue, Discard and continue, or Keep editing.

## Pane editing

- Selecting a row through its checkbox opens the row pane and makes that row the focused row.
- The pane edits one focused row even when several rows are checked.
- Pane fields stage changes without persisting them immediately.
- Save persists the focused row's dirty-field patch.
- Cancel discards the focused row draft and unchecks that row.
- When Cancel removes the only checked row, the row pane closes.
- When other checked rows remain, focus moves to the nearest checked row and the pane represents that row.
- Closing the pane through its close control or Escape is a presentation dismissal and preserves checked rows when no dirty draft
  requires a decision.
- Delete remains an explicit row mutation rather than a draft field change.

## Inline editing

- Single-click selection remains separate from editing.
- Double-click or Enter starts inline editing for a supported writable field.
- Inline editing stages the changed cell in its row draft; it does not persist immediately.
- Moving between fields in the same row preserves the row draft.
- Saving persists the complete dirty-field patch for that row, including changes staged through more than one inline cell.
- JSON, Array, and Row values can use an expanded code editor in an anchored inline dialog and open the complete-row pane through an explicit expand action.
- Relation and binary fields open the complete-row pane focused on their field.
- Full value inspection remains available through the complete-row pane; inline editing does not add hover details.
- Inline controls consume the same parsing, validation, NULL, omission, dirty, save, and discard rules as pane controls.

## Mutation model

The mutation business logic must not depend on the active editing surface. It owns:

- Latest live source row by semantic row identity.
- Dirty field values only.
- Raw input and parsed values where validation can fail.
- Field and row validation errors.
- Insert, update, and delete intent.
- Omitted, explicit null, valid, and invalid insert states.
- Patch construction and mutation failure state.

The core abstraction is a per-row draft. Pane and inline orchestration may decide how many row drafts can be retained, but mutation
parsing and patch construction operate on one row draft at a time. This avoids coupling the shared model to batch save and retry
semantics.

## Update drafts

An update draft stores the latest live source row separately from dirty field overlays. For each dirty field it can retain raw
input, a parsed value, and a validation error.

- Untouched fields display the latest live source value.
- Editing a field creates or updates its dirty overlay.
- Returning a field to its latest live source value removes the overlay.
- Invalid raw input remains in the draft and cannot enter the mutation patch.
- Save constructs a patch from valid dirty fields only.
- Untouched fields never enter the patch.
- Mutation failure preserves the draft and exposes a row-level failure state.
- Mutation success clears the saved dirty fields after the source row confirms the persisted values.

Value equality must follow schema semantics rather than reference identity so structured values, byte values, timestamps, and
other non-primitive representations can return to a clean state correctly.

## Insert drafts

Each insert field has one explicit state:

- `omitted`: leave the column out of the insert payload.
- `null`: send an explicit database NULL.
- `valid`: send the parsed value.
- `invalid`: retain raw input and a validation error without producing a payload value.

Default-backed fields begin omitted so Jazz can apply the stored default. Omission remains distinct from nullable NULL. Required
fields that cannot be omitted produce validation errors before mutation. The implementation must verify which default and
generated-column facts are available in stored schema metadata before deriving initial insert states.

## Live update reconciliation

Follow the official Jazz Inspector's live-update behavior:

- Preserve a staged dirty value when the corresponding live source field changes.
- Continue reflecting live changes for untouched fields.
- Save only dirty fields, so untouched live values are not overwritten.
- Do not introduce a blocking conflict-resolution flow as part of this model.

A remote change to a dirty field may produce a non-blocking changed-remotely indicator. It does not replace the user's staged
value or silently remove the dirty overlay. A remote change that makes the source value semantically equal to the staged value can
return that field to clean state.

## Draft lifecycle

- Changing fields inside one row preserves the row draft.
- Changing the focused row, editing surface, filter, sort, page, table, schema, or route cannot silently discard a dirty draft.
- A dirty transition requires an explicit choice to Save, Discard and continue, or remain on the active target.
- Row-pane Cancel discards the focused row draft and removes that row from checkbox selection.
- Opening read-only details does not disturb the active draft.
- Switching between a row pane's Details and read-only JSON representations does not discard the draft.
- Relation navigation cannot silently discard a dirty draft.
- Clean pane dismissal can preserve row selection; pane Cancel has the stronger discard-and-unselect behavior described above.

Both pane and inline editors must consume this same mutation layer. They may differ in layout and supported field types, but not in parsing, validation, dirty tracking, save, or discard semantics.

## Migration constraint

The table explorer still contains replacement and legacy paths. Do not create a broad schema-value registry until stable behavior has emerged from the replacement code.

Preferred sequence:

1. Centralize dirty tracking, parsing, validation, and patch construction.
2. Make the existing pane editor consume that mutation layer.
3. Remove superseded mutation paths.
4. Add inline editing as a second consumer.
5. Extract a broader schema-value operation registry only if the two surfaces demonstrate a stable shared abstraction.
