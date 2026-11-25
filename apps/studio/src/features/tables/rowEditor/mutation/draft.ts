import type { ColumnDescriptor } from 'jazz-tools'
import {
  changeFieldMode,
  editField,
  insertDraft,
  projectDraft,
  resolveField,
  type DraftValues,
  type FieldIntent,
  type RowDraft,
} from '@inspektor/core/draft'

export {
  fieldIntent as getMutationFieldInput,
  formatColumnDefault,
  projectDraft as buildRowMutationValueProjection,
  rebaseDraft as rebaseUpdateRowDraft,
  revertUpdateField as revertMutationField,
  setIntentMode as setMutationFieldInputMode,
  setIntentText as setMutationFieldInputText,
  updateDraft as createUpdateRowDraft,
  valuesEqual as areMutationValuesEqual,
} from '@inspektor/core/draft'

export type MutationFieldMode = FieldIntent['mode']
export type MutationFieldInput = FieldIntent
export type RowMutationDraft = RowDraft
export type RowMutationSubmission = ReturnType<typeof buildRowMutationSubmission>

/** Keep the established UI argument order; core owns all draft rules. */
export function createInsertRowDraft(
  sourceValues: DraftValues,
  columns: readonly ColumnDescriptor[],
): RowDraft {
  return insertDraft(columns, sourceValues)
}

export function getMutationFieldError(
  draft: RowDraft,
  column: ColumnDescriptor,
  input: FieldIntent,
): string | undefined {
  const resolved = resolveField(draft, column, input)
  return resolved.kind === 'invalid' ? resolved.error : undefined
}

export function setMutationFieldInput(
  draft: RowDraft,
  column: ColumnDescriptor,
  input: FieldIntent,
): RowDraft {
  const result = editField(draft, column, input)
  return result.kind === 'changed' ? result.draft : draft
}

export function setMutationFieldText(
  draft: RowDraft,
  column: ColumnDescriptor,
  text: string,
): RowDraft {
  return setMutationFieldInput(draft, column, { mode: 'value', text })
}

export function setMutationFieldMode(
  draft: RowDraft,
  column: ColumnDescriptor,
  mode: MutationFieldMode,
): RowDraft {
  const result = changeFieldMode(draft, column, mode)
  return result.kind === 'changed' ? result.draft : draft
}

export function buildRowMutationSubmission(draft: RowDraft, columns: readonly ColumnDescriptor[]) {
  const projection = projectDraft(draft, columns)
  return { errors: projection.errors, values: projection.submissionValues }
}
