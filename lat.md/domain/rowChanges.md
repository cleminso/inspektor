# Row changes

A row change retains user intent separately from live source data. Updates submit sparse field patches so untouched fields do not overwrite remote values.

## Contents

This contract owns mutation meaning, validation, and accepted outcomes.

- [Field intent](#field-intent)
- [Draft reconciliation](#draft-reconciliation)
- [Value constraints](#value-constraints)
- [Persistence outcome](#persistence-outcome)

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

[[packages/core/src/studio/write.ts]] coordinates native handles behind [[apps/studio/src/features/tables/rowEditor/mutation/useTableMutation.ts#useTableMutationExecutor]]. Server rejection remains a mutation failure; local validation cannot predict server acceptance.

A confirmed update followed by a failed refresh is already saved. Clear the submitted draft and report refresh failure; do not offer to repeat that write.

The current interface edits one row. Multi-row Apply, bulk writes, and automatic partial-write retries are not part of this contract. See [[changeRow]].
