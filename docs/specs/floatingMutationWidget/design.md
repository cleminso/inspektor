# Floating mutation widget

## Table of contents

- [Objective](#objective)
- [Scope](#scope)
- [State model](#state-model)
- [Interaction model](#interaction-model)
- [Apply behavior](#apply-behavior)
- [Component boundaries](#component-boundaries)
- [Non-goals](#non-goals)
- [Validation](#validation)

## Objective

Let a developer edit existing rows through either the row pane or an inline field editor, continue
the same draft through the other surface, and persist all staged updates and deletions with one
explicit Apply action.

Complete-row insertion remains an immediate mutation owned by `InsertRowForm`.

## Scope

One mounted `TableView` owns one staged mutation state. Its identity is the complete connection,
branch, schema-hash, and table key already used to remount table state.

The state survives:

- closing the row pane;
- closing the inline field editor;
- moving between the pane and inline editor for the same row;
- editing several rows in the mounted table view.

Changing the mounted table identity resets the state. Preserving independent mutation ledgers for
several tables is outside this foundation.

## State model

`TableMutationLedgerProvider` owns:

- one raw `RowMutationDraft` per edited row;
- one deduplicated list of row IDs staged for deletion;
- the current Apply status and error.

The raw row draft is the canonical update state. It preserves valid, incomplete, and invalid text.
Valid sparse update values and validation errors are derived from that draft rather than stored in
a second synchronized ledger.

A row cannot have both an update draft and a staged deletion. Staging deletion removes its update
deletion in the mounted table state.

## Interaction model

### Row pane

- Typing updates the provider-owned row draft immediately.
- Closing the pane changes presentation and selection only; it does not discard the draft.
- Reopening the row, or opening one of its cells inline, displays the same raw field input.

### Inline field editor

- Double-clicking an editable scalar or structured cell opens its explicit editor.
- Typing updates the same provider-owned row draft used by the pane.
- Close and Escape preserve the entered value, including invalid text.
- Enter and Tab complete valid scalar editing and move focus according to spreadsheet navigation.
- Invalid input remains open with field feedback.

### Deletion

- Selected-row deletion requires confirmation.
- Confirming adds the row IDs to the mounted table state.
- A reviewed deletion can be removed before Apply.

### Review

The widget shows update and deletion counts. Review lists affected row IDs and field counts, and
allows one update or deletion to be removed.

## Apply behavior

Apply is available when staged work exists, no draft is invalid, and no Apply is already running.

The client sends valid sparse updates followed by deletions. This ordering is explicit but is not a

The UI clears staged state only after every request succeeds. If a request fails, the complete
client-side staged state remains available and the widget displays the error. A following Apply
attempt submits the retained state again.

Duplicate Apply is blocked synchronously.

## Component boundaries

- `TableMutationLedgerProvider` owns raw drafts, deletion IDs, and Apply status for one table view.
- `useTableMutationEditorController` binds a row surface directly to its provider draft.
- `EditRowForm` renders the complete-row projection.
- `FieldEditorMutationWidget` renders the inline field projection.
- `TableMutationWidget` owns disclosure, deletion confirmation, review, Apply, and Discard UI.
- `applyTableMutationLedger` executes the derived sparse updates and deletions.

## Non-goals

- Database-level transactions or rollback.
- Partial acknowledgement bookkeeping or retrying only an unattempted suffix.
- Continuous hidden queries for staged rows.
- Reconciliation against live row or schema changes.
- Missing-row detection before Apply.
- Keeping independent ledgers for unmounted tables or runtime scopes.
- Generated table-specific mutation forms.
- Complete-row insertion in the staged ledger.

## Validation

- Pane edits remain after closing and reopening inline editing for the same row.
- Inline edits remain after closing and reopening the row pane.
- Several row drafts coexist without overwriting each other.
- Invalid raw text survives closure and blocks Apply.
- Deletion supersedes an update for the same row.
- Removing one update resets only that row.
- Discard clears valid drafts, invalid drafts, and deletions.
- Apply submits all derived updates and deletions once.
- Apply success clears the mounted state; failure retains it.
