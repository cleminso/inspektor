# Floating mutation widget

## Table of contents

- [Objective](#objective)
- [Scope](#scope)
- [State model](#state-model)
- [Interaction model](#interaction-model)
- [Review model](#review-model)
- [Grid staged-update presentation](#grid-staged-update-presentation)
- [Revert behavior](#revert-behavior)
- [Structured-value summaries](#structured-value-summaries)
- [Scrolling and rendering](#scrolling-and-rendering)
- [Apply behavior](#apply-behavior)
- [Component boundaries](#component-boundaries)
- [Non-goals](#non-goals)
- [Validation](#validation)

## Objective

Let a developer edit existing rows through either the row pane or an inline field editor, continue
the same draft through the other surface, and persist all staged updates and deletions with one
explicit `Apply changes` action.

Complete-row insertion remains an immediate mutation owned by `InsertRowForm`.

The implementation sequence is recorded in [Floating mutation widget implementation tasks](./tasks.md).

## Scope

The Tables workspace owns independent staged mutation states. Each state is identified by its
complete connection, branch, schema-hash, and table key.

The state survives:

- closing the row pane;
- closing the inline field editor;
- moving between the pane and inline editor for the same row;
- editing several rows in one table;
- switching filters, pages, representations, tables, or workspace tabs.

Returning to a table restores its complete mutation state. Apply and Discard clear only that
table's state. Closing its final workspace tab cannot silently discard unresolved state. Changing
connection, branch, or schema requires resolution because that complete scope identifies the
mutation target. Browser unload destroys all in-memory mutation states. The Inspector requests the
native unload warning, but each browser controls whether it appears and its displayed copy.

## State model

`TableMutationLedgerProvider` owns:

- one raw `RowMutationDraft` per edited row;
- staged deletion operations that retain the row IDs captured by each confirmed deletion;
- the current Apply status and error.

The raw row draft is the canonical update state. It preserves valid, incomplete, and invalid text.
Valid sparse update values and validation errors are derived from that draft rather than stored in
a second synchronized ledger.

A row cannot have both an update draft and a staged deletion. Staging deletion removes its update
draft and retains only the deletion in the mounted table state.

Apply entries and review operations are separate projections. Apply remains a deterministic list of
row patches and row deletions. Review preserves user intent: one edited row is one row-update
operation, and one confirmed deletion of several checked rows is one deletion operation. Query-backed
bulk mutation is outside this implementation, but the review projection must not prevent adding an
explicit bulk-operation identity.

## Interaction model

### Row pane

- Typing updates the provider-owned row draft immediately.
- The edit-pane Close action is the rightmost header control.
- Closing the pane changes presentation and selection only; it does not discard the draft.
- Reopening the row, or opening one of its cells inline, displays the same raw field input.

### Inline field editor

- Double-clicking an editable scalar or structured cell opens its explicit editor.
- Typing updates the same provider-owned row draft used by the pane.
- Close and Escape preserve the entered value, including invalid text.
- Enter and Tab complete valid scalar editing and move focus according to spreadsheet navigation.
- Invalid input remains open with field feedback.

### Deletion

- The complete-row pane exposes `Delete row` for one checked row and `Delete N checked rows` for
  multiple checked rows as a full-width footer action.
- Activating deletion replaces that action with a 75/25 `Confirm delete` and `Cancel` row.
- The pane snapshots the checked row IDs and requires confirmation.
- Confirming adds the row IDs to the mounted table state, closes the pane, and unchecks those rows.
- A staged-deletion row remains visible in the grid with a danger treatment and cannot open an inline editor.
- Its selection checkbox becomes an `Undo deletion` icon action, preventing the row from reopening in the row pane.
- Its cells are excluded from active-column emphasis.
- Undoing from the grid restores the checkbox and its focus; removing the deletion from the Floating widget or discarding the ledger
  also restores normal selection and editing.

### Review

The widget trigger shows the affected-row mutation count before its label. Expanded review groups
operations under Updated rows and Deleted rows, with each accordion trigger showing its operation count.

Review does not enumerate every target only to prove that it exists. A row update names the row and
changed columns without showing an `x fields` count. A confirmed deletion of several checked rows is
one operation summary rather than one review item per row. Each operation exposes `Undo operation`.
`Discard` remains the complete-ledger reset.

### Workspace navigation and close

- Table and workspace-tab navigation preserves staged state without displaying a notification.
- Closing a non-final view preserves the table-scoped ledger when another view for that table remains.
- Closing a table's final view while its ledger is unresolved opens an Alert Dialog.
- `Keep editing` cancels the close. `Discard and close` clears the ledger and closes the tab.

## Review model

Review answers four questions:

1. What operation is staged?
2. What scope does it affect?
3. How many rows does it affect?
4. How can the operation be inspected or undone?

Compact operation rows use these forms:

- one or several changed columns: `abc123`, with the changed column names as secondary content;
- one deletion: `abc123` under Deleted rows;
- one confirmed deletion batch: `24 selected rows`.

The compact row does not repeat the update or delete verb already established by its accordion heading,
and does not inline complete old and new values. Operation identity, scope, row count, and changed column
names remain available without making the Floating widget a value-diff editor. `Undo operation` remains
aligned to the end of each row.

## Grid staged-update presentation

A staged deletion affects the complete row, so it retains the danger-tinted row treatment and the
selection checkbox becomes `Undo deletion`. A sparse update affects only its changed cells, so the row
checkbox remains available and only staged cells receive pending-change presentation.

Staged-update cells use a warm amber treatment between yellow and orange. This treatment communicates
pending mutation intent, not success and not a warning. The implementation must add a dedicated
`stagedChangeColors` semantic family rather than reusing success or warning colors.

The staged-update presentation uses a subtle background and matching border without an additional edge
marker. The treatment remains visible when the cell receives focus or its column is selected. Opening
the inline editor replaces it with the existing blue editing treatment. Staged deletion overrides staged
update because deletion removes the complete row mutation draft.

Only valid fields included in the derived update patch receive staged-update presentation. Invalid raw
input remains recoverable in its editor but does not appear as an applicable grid mutation.

## Revert behavior

Recovery is available at four explicit scopes:

- the staged cell context menu exposes `Revert this change`;
- a row containing one or more staged updates exposes the row-scoped `Revert staged changes` item from the grid context menu;
- a review operation exposes `Undo`;
- the Floating widget exposes `Discard` for the complete table ledger.

`Revert this change` removes only the represented field overlay and preserves other staged or invalid
fields in the same row draft. `Revert staged changes` removes the complete row update draft. Undoing a
deletion from the grid removes that row from its deletion operation and removes the operation when no
targets remain. Every recovery action clears stale Apply-failure presentation and restores focus to the
originating grid target when that target remains mounted.

The grid context menu supplements visible review and Discard actions. It is not the only recovery path,
because filtered, paginated, hidden-column, and unloaded targets may not be represented in the grid.

## Structured-value summaries

Structured values do not render serialized JSON in compact operation labels. A staged JSON, Array, or
Row field uses its schema column name as secondary content beside the row identity. The review may
identify that the complete structured value is replaced, but it does not claim a path count unless a
separately specified structural-diff policy can produce that count reliably.

Detailed JSON comparison, array diff semantics, changed-path calculation, and before-versus-staged
value rendering are outside this implementation. The schema-derived editor and complete-row pane remain
the places to inspect the staged value.

## Scrolling and rendering

The accordion root and operation triggers do not scroll. Each expanded operation list owns its vertical
scroll viewport while the summary, Apply, and Discard controls remain fixed.

- Ten operation items or fewer fit their content without scrolling.
- More than ten operation items expose ten compact rows and scroll the remainder.
- Operation rows use constrained geometry so the ten-row boundary is deterministic.
- Lists with more than 100 operation items use virtual rendering inside the list viewport; the
  accordion structure itself is never virtualized.

A bulk operation remains one review item regardless of target count. A target preview, if introduced,
owns separate bounded rendering and is not required by this implementation.

## Apply behavior

Apply is available when staged work exists, no draft is invalid, and no Apply is already running.

The client sends valid sparse updates followed by deletions. This ordering is explicit but is not a
transaction or rollback promise.

The UI clears staged state only after every request succeeds. If a request fails, the complete
client-side staged state remains available and the widget displays the error. A following Apply
attempt submits the retained state again.

Duplicate Apply is blocked synchronously.

## Component boundaries

- The Tables workspace owns the keyed mutation-state registry and runtime-scope exit protection.
- `TableMutationLedgerProvider` selects raw drafts, deletion operations, review operations, and Apply status for one table.
- `useTableMutationEditorController` binds a row surface directly to its provider draft.
- `EditRowForm` renders the complete-row field projection.
- `RowEditorSidePanel` owns contextual deletion initiation and confirmation for checked rows.
- `FieldEditorMutationWidget` renders the inline field projection.
- `TableMutationWidget` projects staged review, Apply, Discard, and execution status.
- `DataGrid` owns constrained staged-cell presentation while the Tables application supplies mutation status and recovery commands.
- One shared grid context-menu composition maps semantic row and cell targets to application commands.
- `applyTableMutationLedger` executes the derived sparse updates and deletions.

## Non-goals

- Database-level transactions or rollback.
- Partial acknowledgement bookkeeping or retrying only an unattempted suffix.
- Continuous hidden queries for staged rows.
- Reconciliation against live row or schema changes.
- Missing-row detection before Apply.
- Persisting mutation ledgers across browser unload or runtime scopes.
- Generated table-specific mutation forms.
- Complete-row insertion in the staged ledger.

## Validation

- Pane edits remain after closing and reopening inline editing for the same row.
- Inline edits remain after closing and reopening the row pane.
- Several row drafts coexist without overwriting each other.
- Invalid raw text survives closure and blocks Apply.
- Deletion supersedes an update for the same row.
- Reverting one staged field preserves other fields in its row draft.
- Reverting one row update resets only that row.
- Undoing one deletion target preserves the rest of its deletion operation.
- Review groups plain-language operations without rendering field counts or exhaustive bulk targets.
- Staged-update presentation remains distinguishable under selection and focus in both color schemes.
- Grid context-menu recovery restores focus to its originating target when it remains mounted.
- Discard clears valid drafts, invalid drafts, and deletions.
- Apply submits all derived updates and deletions once.
- Apply success clears the mounted state; failure retains it.
- Switching tables and workspace tabs preserves each table's state.
- Returning to a table restores valid drafts, invalid input, deletions, and Apply failures.
- Closing the final tab for a table presents `Keep editing` and `Discard and close` before unresolved state can be discarded.
- Changing runtime scope remains blocked until affected mutation state is resolved.
- Browser unload requests the browser-controlled warning while unresolved mutation state exists and clears the in-memory registry.
