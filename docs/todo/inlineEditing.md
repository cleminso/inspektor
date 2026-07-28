# Inline editing

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Mutation-boundary correctness](#mutation-boundary-correctness)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[28/07/26]

### Shared row mutation model

- [x] Keep Jazz schema and persistence semantics behind `ColumnDescriptor`, `ColumnType`, dynamic table proxies, and Jazz database mutations.
- [x] Keep mutation rules independent from the editing surface in `rowMutationDraft.ts` and `mutationParsing.ts`.
- [x] Represent update drafts as sparse dirty-field overlays over the latest live Jazz row.
- [x] Represent insert fields as value, explicit NULL, or omitted default intent.
- [x] Build updates from dirty fields only so untouched live values never enter the patch.
- [x] Preserve staged fields across live updates while continuing to update untouched fields.
- [x] Remove a staged field when its parsed value becomes semantically equal to the latest source value.
- [x] Preserve invalid raw input without allowing it into a Jazz mutation.
- [x] Keep binary fields read-only where a generic editor cannot preserve byte intent.

### Mutation and transition boundaries

- [x] Send generic inserts, sparse updates, and deletes through `useTableMutations` and Jazz's edge-acknowledged mutation API.
- [x] Protect one active dirty draft through clean, dirty, and saving lifecycle states.
- [x] Support Save and continue, Discard and continue, Keep editing, and explicit form Cancel.
- [x] Guard row-target, query-scope, pane, relation, and route transitions without putting field state in the guard.

### Pane proof of the shared model

- [x] Use the shared mutation model for pane insert and pane edit forms.
- [x] Keep form-only concerns such as expanded editors, focus, and duplicate-submit protection in `useRowEditorFields`.
- [x] Confirm that Details and JSON pane representations do not own or reset the row draft.

### Grid foundation

- [x] Keep cell identity based on semantic row and column IDs.
- [x] Keep cell selection separate from inspection and editing.
- [x] Keep row checkbox selection separate from the one row whose draft is active.
- [x] Keep table cells schema-driven without embedding Jazz mutation rules in cell renderers.

## Open product work

[28/07/26]

### Draft ownership

- [ ] Add one row-level inline draft owner above individual table cells, at the data-grid or `DataView` orchestration level.
- [ ] Preserve that draft when focus moves between editable cells in the same row.
- [ ] Keep the draft mounted when a cell renderer unmounts because of pagination, column visibility, or table rendering changes.
- [ ] Key the draft by semantic row identity so changing rows never retargets an existing draft.
- [ ] Expose field state and actions to cells without making each cell its own draft owner.
- [ ] Submit the complete sparse patch for the active row, including changes made in several inline cells.

### Editing preference and fallback

- [ ] Persist one workspace-level `pane` or `inline` editing preference in localStorage-backed user settings.
- [ ] Apply the draft transition guard before changing the editing preference.
- [ ] Define the inline suitability matrix from Jazz column descriptors and product constraints.
- [ ] Open pane editing for structured, binary, generated, unsupported, or otherwise unsuitable inline fields.
- [ ] Do not transfer an existing dirty draft between pane and inline surfaces without an explicit Save, Discard, or Keep editing decision.

### Activation, focus, and keyboard behavior

- [ ] Start inline editing for a supported selected cell through double-click or Enter.
- [ ] Keep single click as selection rather than mutation.
- [ ] Define Enter, Escape, Tab, Shift+Tab, and pointer behavior while an inline editor is active.
- [ ] Restore grid focus to a predictable cell after save, discard, or failed validation.
- [ ] Keep selection and focus stable when validation prevents leaving a field.
- [ ] Ensure screen readers receive the field label, type, dirty state, validation error, and save failure.

### Inline controls

- [ ] Add constrained inline controls for supported scalar fields without duplicating parsing or validation.
- [ ] Reuse the shared NULL semantics where the inline layout can express them clearly.
- [ ] Reuse enum and boolean choices without recreating Base UI interaction behavior.
- [ ] Use the existing timestamp conversion rules for inline timestamp input.
- [ ] Show a clear fallback action when the selected field requires pane editing.

### Guard and mutation integration

- [ ] Report semantic inline dirty state to `useDraftTransitionGuard`.
- [ ] Guard row changes, sorting, filtering, table changes, relation navigation, pane replacement, and route navigation.
- [ ] Keep the inline draft after validation or Jazz mutation failure.
- [ ] Let successful live-row reconciliation clear saved overlays without reconstructing the row.
- [ ] Skip normal inline post-save focus behavior when Save and continue proceeds to another destination.

### User-flow coverage

- [ ] Cover editing several cells in one row and saving one sparse patch.
- [ ] Cover restoring all changed cells to source values and returning the draft to clean.
- [ ] Cover a live source update to untouched and dirty fields while inline editing.
- [ ] Cover row change with Save, Discard, and Keep editing decisions.
- [ ] Cover unsuitable-field fallback to the pane.
- [ ] Cover validation and Jazz mutation failure without losing the draft.
- [ ] Cover keyboard activation, traversal, save, and cancel as complete user flows.

## Work outside the foundation scope

[28/07/26]

- [ ] Inline insertion through a temporary grid row is not part of the current inline editing scope; insertion remains pane-based.
- [ ] Several simultaneously dirty row drafts are not supported; the first inline implementation owns one active row draft.
- [ ] Batch save, partial retry, and cross-row transaction behavior are not part of the first inline implementation.
- [ ] Binary text editing is not added until the product defines an explicit byte encoding and round-trip contract.
- [ ] Structured JSON, Array, and Row editing remains in the pane unless a separate inline interaction is designed.
- [ ] Cell hover cards are not introduced as part of inline editing.

## Settled interaction decisions

[28/07/26]

- [x] Jazz owns schema, mutation conversion, permissions, persistence, and synchronization.
- [x] Inspector owns draft input, validation presentation, dirty tracking, live reconciliation, and transition protection.
- [x] One active inline row draft is owned above cell renderers.
- [x] Moving between fields in the same row preserves the row draft.
- [x] Moving to another row is a guarded target change when the current draft is dirty.
- [x] Saving from any inline cell submits every dirty field in that row's sparse patch.
- [x] Pane and inline editing consume the same parsing, NULL, validation, reconciliation, patch, and mutation rules.
- [x] Unsupported inline fields use pane fallback instead of a weaker inline parser.
- [x] Selection, inspection, and editing remain separate interactions.
- [x] A draft does not move between editing surfaces implicitly.
- [x] Inline editing applies to existing rows; row insertion remains in the pane.

## Open design decisions

[28/07/26]

- [ ] Decide whether Enter saves the row, advances to another cell, or does both based on modifier keys.
- [ ] Decide whether leaving an inline cell stages only, attempts save, or requires an explicit row-level save action.
- [ ] Decide how dirty cells and the active dirty row are indicated without competing with selection styles.
- [ ] Decide where row-level Save and Cancel actions appear while several cells in one row are staged.
- [ ] Decide whether validation keeps focus in the active cell or moves to the first invalid field in the row.
- [ ] Decide which reference fields are suitable for inline editing and how relation navigation remains available.
- [ ] Decide how column hiding behaves when the hidden column has a dirty staged value.
- [ ] Decide how pagination requests behave when the active dirty row would leave the loaded window.

## Mutation-boundary correctness

[28/07/26]

- [x] Restrict writable BigInt values to JavaScript's safe integer range because the installed Jazz boundary uses `Number`.
- [x] Encode JSON scalar strings for Jazz and reject JSON null because Jazz reads it back indistinguishably from SQL NULL.
- [x] Add direct contract tests that pass parsed values through the installed Jazz mutation converter and reader.
- [x] Remove update overlays for columns that disappear from the live schema so obsolete fields cannot keep a draft dirty.

## Validation checklist

[28/07/26]

- [ ] Run focused inline user-flow tests.
- [ ] Run shared row mutation draft and parsing tests.
- [ ] Run `pnpm --filter regarde.inspector typecheck`.
- [ ] Run `pnpm --filter regarde.inspector lint`.
- [ ] Run `pnpm --filter regarde.inspector build`.
- [ ] Inspect the production bundle when inline controls add or move deferred dependencies.
- [ ] Verify keyboard editing with focus outlines and screen-reader labels.
- [ ] Verify dirty transitions through row, filter, sort, table, relation, and route changes.
