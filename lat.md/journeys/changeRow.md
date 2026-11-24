# Change a row

A developer inserts, updates, duplicates, or deletes one row through the complete-row side pane. The pane is the only write surface.

## Contents

This journey connects explicit edit intent to validation and remote acceptance.

- [Update the current row](#update-the-current-row)
- [Insert or duplicate](#insert-or-duplicate)
- [Delete and leave](#delete-and-leave)

## Update the current row

The active row draft retains raw input while the developer changes fields or pane representations.

1. Open the row pane through its checkbox or activate a field.
2. Change supported fields in Details.
3. Select Save to validate and submit only the current row's dirty fields.
4. Wait for global acknowledgement.
5. Read the current row remotely to refresh the pane's source values.

Successful Save leaves the pane open and clean. Rejected writes retain the draft and expose the failure. A refresh failure after acknowledgement is reported as already saved, not as a retryable update.

Cancel removes valid and invalid edits from the current row and leaves the pane open. Details, JSON, and Provenance changes preserve the draft.

[[apps/studio/src/features/tables/workspace/tableView.tsx]] implements Save, Cancel, and post-write refresh. [[rowChanges]] owns payload meaning.

## Insert or duplicate

Insertion submits one valid row directly, without a staged grid row.

The insert pane derives fields from schema metadata. Discard closes without persistence. Insert more resets the form after success and keeps it open.

Duplicate reads the source row and opens a prefilled insert pane. It includes hidden schema fields but excludes automatic identity and provenance. It then uses the ordinary insert path.

The grid displays Jazz query results only. A successful insert appears where the remote filter and sort place it.

[[apps/studio/src/features/tables/rowEditor/insertForm.tsx]] owns insert controls. [[apps/studio/src/features/tables/workspace/useTableViewState.ts]] owns insert submission.

## Delete and leave

Deletion requires confirmation and targets one current row.

Pane and context-menu deletion use the direct delete path. Failure retains the row and shows the error. Deletion is not a staged operation or checkbox batch.

Dirty pane dismissal, row replacement, and guarded in-app navigation ask before discarding input. Keeping edits cancels the transition. Query-scope changes cannot use selection reset as implicit consent to discard.

These rules do not establish recovery after a browser crash, full reload, or an uncertain remote write. Runtime acceptance must verify each supported transition; documentation alone is not proof.
