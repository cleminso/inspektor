# Row changes

A row change retains user intent separately from live source data. Updates submit sparse field patches so untouched fields do not overwrite remote values.

## Contents

This contract owns mutation meaning, validation, and accepted outcomes.

- [Field intent](#field-intent)
- [Draft reconciliation](#draft-reconciliation)
- [Value constraints](#value-constraints)
- [Persistence outcome](#persistence-outcome)
- [Workflow ownership](#workflow-ownership)

## Field intent

Omission, SQL NULL, empty values, and invalid input have different meanings.

- An untouched update field is absent from the patch.
- A default-backed insert field starts omitted. Jazz applies the stored default.
- Explicit SQL NULL requires a nullable column.
- Empty text and empty collections remain values when the schema permits them.
- Invalid input retains its raw text and error. It cannot enter a mutation payload.

[[packages/core/src/studio/draft.ts#insertDraft]] records omission for default-backed fields. The same module resolves field modes and builds sparse updates.

## Draft reconciliation

Live source rows and dirty field overlays remain separate.

[[packages/core/src/studio/draft.ts#rebaseDraft]] replaces source values while retaining dirty input. An overlay becomes clean when its parsed value equals the current source value under schema-aware equality.

Structured input keeps the user's text during validation and representation changes. Parsing does not silently reformat that text. This avoids losing invalid input or changing an unfinished edit.

This is not a conflict-resolution or compare-and-swap guarantee.

## Value constraints

Studio validates generic inputs before sending them to Jazz.

[[packages/core/src/studio/draft.ts#parseFieldText]] enforces numeric bounds, enum membership, UUID shape, and structured values.

- Named Row values reject unknown fields. Positional Row values require complete tuples.
- Missing nullable Row members become NULL. Missing required members fail validation.
- JSON text `null` is rejected. Nullable columns use the explicit SQL-NULL mode.
- BigInt input stays within JavaScript's safe integer range to prevent precision loss.
- Binary values, including nested binary fields, remain read-only. A text editor cannot infer their encoding.

Draft submission encodes JSON at the Jazz boundary. Parsed values remain available for semantic equality.

## Persistence outcome

Insert, update, and delete wait for Jazz global durability.

[[packages/core/src/studio/write.ts]] coordinates native handles inside the row-editing feature. Server rejection remains a mutation failure; local validation cannot predict server acceptance.

A confirmed update followed by a failed refresh is already saved. Clear the submitted draft and report refresh failure; do not offer to repeat that write.

The current interface edits one row. Multi-row Apply, bulk writes, and automatic partial-write retries are not part of this contract. See [[changeRow]].

## Workflow ownership

One headless row-editing feature owns retained updates, admission, submission, native settlement, and refresh outcomes. Studio owns confirmation, focus, and presentation.

[[packages/core/src/workbench/rowEditing.ts#createRowEditingWorkspace]] composes draft rules and the native write workspace. Its operations hide reducers, settlement tickets, execution setters, and shared write locks from callers.

Update drafts and native verdicts survive pane replacement. Commands retain their original client owner; a replacement client cannot resume or repeat them. Retaining a verdict record does not keep a retired client usable.

Admission is synchronous and remains closed through post-save refresh and duplicate-source loading. Duplicate reads are interaction work, not pending writes. Invalid raw input counts as retained intent even when it has no valid grid overlay.

Studio subscribes to feature snapshots and registers browser exit protection. It does not dispose the retained state container during effect cleanup: React can replay that cleanup. The feature borrows clients and starts no external work during construction.

Insert drafts remain form-local. Their submitted commands use the same admission and settlement workflow as updates and deletes.
