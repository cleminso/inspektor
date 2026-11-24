# Jazz alignment and Inspektor policies

Inspektor adopts Jazz's sparse mutation and live-source patterns while keeping query, mutation, table state, and presentation separate.

The side-pane-only contract is approved. [The Row Editor ledger](../todo/rowEditor.md) owns implementation and runtime acceptance;
this note does not establish that the refactor has shipped.

## Table of contents

This note records upstream findings, Inspektor policy differences, and the current-row mutation contract.

- [Purpose](#purpose)
- [Upstream findings](#upstream-findings)
- [Inspektor strengths](#inspektor-strengths)
- [Patterns to adopt](#patterns-to-adopt)
- [Patterns not to copy](#patterns-not-to-copy)
- [Verified field representation contracts](#verified-field-representation-contracts)
- [Mutation state table](#mutation-state-table)
- [Installed optional JSON boundary](#installed-optional-json-boundary)
- [Nested Row fields](#nested-row-fields)
- [Deliberate Inspektor policy differences](#deliberate-inspektor-policy-differences)
- [Structured draft formatting](#structured-draft-formatting)
- [Verification scope](#verification-scope)
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

This note records useful patterns from the official Jazz Inspektor and settled decisions for Inspektor's table mutation architecture. It should guide implementation without making the upstream grid component our architectural template.

Official source reviewed:

- `packages/inspector/src/studio/data-explorer/TableDataGrid.tsx`
- `packages/inspector/src/studio/data-explorer/row-mutation-form.ts`
- `packages/inspector/src/studio/data-explorer/TableFilterBuilder.tsx`
- `packages/inspector/src/studio/data-explorer/ColumnCustomizationModal.tsx`
- `packages/inspector/src/utility/generic-query-builder.ts`

## Upstream findings

The official Inspektor is strongest in grid workflows:

- It separates live source rows from pending dirty cell edits.
- It saves dirty-field patches instead of reconstructed rows.
- Incoming live updates do not overwrite pending values.
- Reverting a field to its current source value removes the pending edit.
- Inserts omit default-backed columns so the database applies defaults.
- Pagination requests `pageSize + 1` to derive whether another page exists.
- Column preferences reconcile removed and newly discovered schema columns.
- Provenance columns and live row-change feedback are first-class grid features.
- Relation labels use generic display-column heuristics.

Its main structural weakness is that querying, rendering, selection, editing, mutations, preferences, and live animations are concentrated in one large grid component.

## Inspektor strengths

Keep the current Inspektor direction:

- Application-owned schema classification and mutation logic.
- Reusable, constrained design-system value components.
- Schema-aware binary, timestamp, relation, and structured-value presentation.
- Explicit copy behavior and accessible failure feedback.
- On-demand relation resolution rather than one query per rendered relation cell.
- Separate query, mutation, table-state, and presentation modules.
- Deferred optional editing and interaction code.

## Patterns to adopt

Inspektor should adopt Jazz patterns that preserve mutation intent, pagination correctness, and schema compatibility.

- Dirty-field update patches with live source rows kept separately.
- Explicit insert states for omitted, null, valid, and invalid values.
- Omission of default-backed insert fields.
- Page-windowed `pageSize + 1` pagination.
- Schema-evolution-safe column preferences.
- Jazz queries select `$createdAt`, `$createdBy`, `$updatedAt`, and `$updatedBy`. Timestamp columns
  are visible and sortable. Author columns are hidden by default and read-only. Alpha.54 does not
  support ordering by the root author objects.
- Alpha.54 also supports eight nested author paths under `$createdBy` and `$updatedBy`. The grid
  exposes each root author object so its account and identity values stay together.
- Live insert, update, and removal feedback when selection and pagination semantics are ready.
- Relation display-label heuristics without adopting per-cell relation queries.
- Direct contract tests around generic Jazz query and table adapters.
- Schema validation for URL filters and sorting before query construction.

## Patterns not to copy

Inspektor should avoid upstream patterns that combine unrelated ownership or weaken validation and retry safety.

- A grid component that owns every query, mutation, and presentation concern.
- Runtime-only value formatting through `String` or `JSON.stringify`.
- One relation subscription per rendered cell.
- Permissive nested array, row, UUID, or relation parsing.
- Concurrent batch mutation retry semantics that can repeat partially successful work.
- Separate mutation rules for each editing surface.

## Verified field representation contracts

These contracts are derived from the Jazz mutation converter and the official Inspektor. They are the default answers for future field-editing work unless an upstream Jazz change requires another review.

### Mutation state table

Mutation fields distinguish source availability, omission, SQL NULL, empty values, valid values, and invalid input.

| Inspektor concept  | Jazz input                                       | Jazz behavior                                                                                  | Inspektor policy                                                                                        |
| ------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Unavailable source | Not a mutation input                             | Jazz has no unavailable mutation value.                                                        | Keep source unavailability distinct in presentation and prevent it from becoming a mutation implicitly. |
| Omitted            | Property absent or `undefined`                   | `toWriteRecord` skips the field. Insert defaults may apply; updates leave the field unchanged. | Represent omission explicitly and leave the property out of the payload.                                |
| SQL NULL           | `null`                                           | Converts to Jazz `Null` for nullable columns and fails for required columns.                   | Use an explicit nullable-only `null` mode rather than inferring NULL from empty text.                   |
| Empty              | A present empty value such as `""` or `[]`       | Remains a value when valid for the column type.                                                | Keep empty values distinct from omission and SQL NULL; validate them by column type.                    |
| Valid              | A present non-null value                         | Converts according to the column descriptor.                                                   | Parse and validate before adding the value to a mutation payload.                                       |
| Invalid            | A value rejected by Inspektor or Jazz validation | Must not produce a write record.                                                               | Retain raw input and its error, but exclude it from mutation payloads.                                  |

Jazz evidence:

- `packages/jazz-tools/src/runtime/value-converter.ts` documents and implements top-level `undefined` omission in `toWriteRecord`.
- `packages/jazz-tools/src/runtime/value-converter.test.ts` covers explicit nullable `null`, skipped `undefined`, unknown columns, required-field `null`, and JSON-schema failures.
- `packages/inspector/src/studio/data-explorer/TableDataGrid.test.tsx` covers omitted insert defaults and explicit nullable values.

Omission is operation-dependent: it requests the stored default during insert and means unchanged during update. Unavailable source data is presentation state, not another spelling of omission.

### Installed optional JSON boundary

Installed Jazz alpha.59 accepts populated optional JSON but rejects SQL-NULL writes. The direct isolated contract distinguishes the supported round-trip from this remaining runtime defect.

The removed alpha.59 contract covered required JSON, omitted optional JSON, populated objects, and explicit SQL NULL. It observed successful round-trips for required, omitted, and populated values; explicit NULL writes failed with `Protocol: value does not match type Internal(InternalValueType(StoredScalar(Json)))`. The Studio and fixture tests are removed. Re-establish this contract against the selected Jazz release before relying on it. The upstream issue is [#2733](https://github.com/garden-co/jazz/issues/2733); its proposed fix is [PR #3007](https://github.com/garden-co/jazz/pull/3007).

### Nested Row fields

Jazz's TypeScript `Row` converter processes declared object fields in descriptor order.

Missing and explicit `undefined` members both reach `toValue(undefined)` and become Jazz `Null`. The native encoder accepts that value for nullable members and rejects it for required members.

Jazz ignores unknown object keys because it projects declared keys instead of enumerating input keys.

Inspektor follows the compatible part of that behavior and adds earlier validation:

- An absent or explicit `undefined` nullable member normalizes to `null`.
- An absent, explicit `undefined`, or explicit `null` required member is invalid.
- Named Row objects reject unknown fields instead of relying on Jazz to ignore them.
- Positional Row tuples must be complete and are converted to named records in descriptor order.
- Nested members are recursively validated before the mutation reaches Jazz.

The upstream behavior is implemented in `packages/jazz-tools/src/runtime/value-converter.ts`. Inspektor's stricter checks are product validation, not a different storage meaning.

### Deliberate Inspektor policy differences

Strict Row validation and JSON-null rejection are deliberate Inspektor policies layered above Jazz's permissive converter:

- Inspektor rejects unknown Row fields, incomplete tuples, and missing required members before invoking Jazz. Jazz's TypeScript converter projects known Row fields, ignores unknown keys, and defers required-member rejection to native encoding.
- Inspektor rejects JSON text that parses to JavaScript `null`. Jazz's top-level converter treats that value as SQL NULL rather than preserving a distinguishable JSON null, so Inspektor requires the explicit SQL-NULL field mode where the column is nullable.

These checks provide earlier errors and preserve visible mutation intent. Do not relax them merely to mirror the converter unless Jazz introduces distinct JSON-null storage semantics or stricter public Row validation.

### Structured draft formatting

The official Inspektor formats source values when editing begins, then preserves user-edited structured text exactly.

It formats a source object with `JSON.stringify`, stores later edits as raw `text`, overlays that exact text in the grid, and parses it only when Save constructs the mutation. It does not reformat a queued user draft.

See `packages/inspector/src/studio/data-explorer/TableDataGrid.tsx` and `row-mutation-form.ts`.

Inspektor uses the same ownership rule:

- Source-derived structured values may be formatted when an editor draft is created.
- User-edited structured text is preserved exactly while dirty and across pane representation changes.
- Validation parses the text without replacing it with canonical output.
- Canonical formatting requires an explicit user action; Save, rebasing, and reopening do not format implicitly.

### Verification scope

The upstream official Inspektor separates focused Vitest JSDOM component coverage from standalone Playwright E2E acceptance.

Upstream component tests cover Enum editor activation, NULL actions, insert omission and default behavior, queued overlays, and live-source reconciliation.

Upstream Playwright E2E covers the real inline editor, local staging and Discard, Save, and persistence after navigation or refresh.

Inspektor follows this acceptance split:

- Pure tests cover state transitions, parsing, nested Row validation, omission, NULL, dirty equality, and payload construction.
- Isolated Jazz contracts cover optional JSON required/omitted controls and the exact protocol error for unsupported optional writes without involving Inspektor's fixture seeder.
- Component tests cover control composition, validation timing, focus, keyboard behavior, and local draft preservation.
- Playwright E2E covers production-only boundaries: requested-field activation in Details or Provenance, the real deferred structured editor, current-row Cancel, and a representative Save observed after reload.
- Playwright E2E does not repeat every column type when focused tests exercise the same mutation contract. Add a type-specific E2E case only when that type crosses a distinct browser, deferred-module, focus, or runtime serialization boundary.

For structured pane editing, routing alone is insufficient. Browser acceptance must open the real editor and preserve its raw input.
A representative Save-and-reload test owns general persistence. The canonical checklist is in [Row Editor](../todo/rowEditor.md).

## Interaction decisions

Selection, complete-row inspection, and editing are separate interactions:

These decisions complement the detailed table behavior in [[lat.md/tableExplorerBehaviors#Table Explorer selection and pane behavior]].

- **Selection** identifies the active cell or row. It does not imply mutation.
- **Inspection** explains the value through compact presentation, the complete-row pane, copy actions, and relation navigation.
- **Editing** changes a provider-owned row draft through an explicit edit action or editing shortcut.

Cells do not open hover cards or a separate inspection-only cell pane. Complete inspection remains available through the
complete-row pane, explicit commands, copy actions, and relation navigation.

The side pane is the only write surface. Floating field editors and the pending-change widget are removed.

## Editing surfaces

The complete-row pane owns all editing and full-value inspection.

Row checkbox selection opens the pane for one row only. Another checkbox replaces that target; unchecking closes the pane.
Dirty replacement or deselection asks before discarding. Checkbox range selection is disabled; multi-cell rectangles remain available.

Cell double-click or Enter opens Details at the selected application field or ID, including read-only values.
Synthetic `$createdAt`, `$createdBy`, `$updatedAt`, and `$updatedBy` cells open the existing read-only Provenance representation
and focus the requested metadata field there. Details does not duplicate synthetic metadata.
Schema-derived controls, parsing, validation, NULL, and omission rules remain unchanged.

## Pane editing

The pane edits one focused row and saves only that row's sparse patch.

- Selecting a row through its checkbox opens the row pane and makes that row the focused row.
- Only one row can be selected and edited. Previous and next follow filtered and sorted page rows across page boundaries, not a checked-row batch.
- Footer actions run left to right: `Delete row` / `Close` when clean, and `Save` / `Cancel` when dirty.
- Cancel discards current-row overlays and invalid input while keeping the pane open.
- Save validates all dirty input, sends a sparse current-row patch, and waits for global durability.
- Successful Save keeps the pane open and clean. Failure retains raw edits and shows the error.
- Dirty Close, Escape, row switching, and navigation ask before discarding; keeping edits cancels the transition.
- Delete confirmation directly deletes the single current row; there is no checkbox batch deletion scope.

## Inline editing

Inline field editing is superseded by requested-field activation in the row pane.

Single click remains selection. Double-click and Enter focus application fields and ID in Details, or synthetic metadata in
Provenance, without creating a floating editor, field-local Save, or another persistence path. Read-only values remain inspectable.

## Mutation model

The mutation business logic remains separate from pane presentation. It owns:

- Source row captured when editing starts.
- Dirty field values only.
- Raw input and parsed values where validation can fail.
- Field and row validation errors.
- Insert, update, and delete intent.
- Omitted, explicit null, valid, and invalid insert states.
- Patch construction and mutation failure state.

[[apps/studio/src/features/tables/rowEditor/mutation/draft.ts#createUpdateRowDraft]] and [[apps/studio/src/features/tables/rowEditor/mutation/draft.ts#createInsertRowDraft]] create the corresponding provider-owned drafts.

The core abstraction is a per-row draft. The internal ledger may remain as draft storage and lifecycle infrastructure, but only one
row is edited at a time. It does not expose table-wide Apply, review, staged deletion, or batch retry to the user.

## Update drafts

An update draft stores its captured source row separately from dirty field overlays. For each dirty field it can retain raw
input, a parsed value, and a validation error.

- Untouched fields display the captured source value while the draft remains mounted.
- Editing a field creates or updates its dirty overlay.
- Returning a field to its captured source value removes the overlay.
- Invalid raw input remains in the draft and cannot enter the mutation patch.
- Save is blocked by invalid input and constructs a patch from valid dirty fields in the current row only.
- Untouched fields never enter the patch.
- Mutation failure preserves the draft and exposes a row-level failure state.
- Complete mutation success clears the saved dirty fields.

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

Duplicate opens a prefilled insert pane, excluding automatic identity and provenance. It uses the existing direct Insert path
with unchanged `Discard` and `Insert more` behavior, not a staged insertion.

## Live update reconciliation

Sparse dirty-field patches avoid overwriting untouched database values. Existing live-source reconciliation rules remain intact;
this refactor does not introduce another conflict policy or changed-remotely UI.

## Draft lifecycle

One current-row draft survives field and representation changes, but destructive target transitions require consent.

- Changing fields inside one row preserves the draft.
- Switching Details, JSON, or Provenance preserves dirty values and raw invalid input.
- Cancel resets the current row and keeps the pane open; successful Save keeps it open and clean.
- Dirty Close, Escape, row-target changes, and pane replacement ask before discarding.
- Query, relation, table, workspace, and runtime-scope transitions must not silently lose dirty input.
- Retained internal storage must not cause Save to write another row or revive a user-facing batch workflow.

## Migration constraint

The table explorer still contains replacement and legacy paths. Do not create a broad schema-value registry until stable behavior has emerged from the replacement code.

Preferred sequence:

1. Retain shared dirty tracking, parsing, validation, and sparse patch construction.
2. Give the pane current-row Save, Cancel, and guarded transitions.
3. Remove floating field editors, the pending-change widget, and staged duplicate/delete entry points.
4. Retain useful internal draft storage and lifecycle protection without a user batch workflow.

No Effect rewrite or Jazz upgrade is part of this change.
