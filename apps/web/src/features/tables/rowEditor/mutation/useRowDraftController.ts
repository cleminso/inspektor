import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import type { ColumnDescriptor } from 'jazz-tools'

import {
  buildRowMutationSubmission,
  createInsertRowDraft,
  createUpdateRowDraft,
  getMutationFieldInput,
  setMutationFieldMode,
  setMutationFieldText,
  type RowMutationDraft,
  type RowMutationSubmission,
} from '@tables/rowEditor/mutation/draft'
import type { DetailPaneMode } from '@tables/tableTypes'

interface RowDraftBinding {
  draft: RowMutationDraft
  setDraft: Dispatch<SetStateAction<RowMutationDraft>>
}

interface RowDraftControllerState {
  draft: RowMutationDraft
}

interface RowDraftControllerActions {
  buildSubmission: () => RowMutationSubmission
  setFieldNull: (columnName: string, isNull: boolean) => void
  setFieldOmitted: (columnName: string, isOmitted: boolean) => void
  setFieldText: (columnName: string, text: string) => void
}

export interface RowDraftController {
  actions: RowDraftControllerActions
  state: RowDraftControllerState
}

interface UseRowDraftControllerOptions {
  initialRowValues: Readonly<Record<string, unknown>>
  mode: DetailPaneMode
  schemaColumns: readonly ColumnDescriptor[]
}

interface UseBoundRowDraftControllerOptions {
  binding: RowDraftBinding
  schemaColumns: readonly ColumnDescriptor[]
}

function createInitialDraft(
  mode: DetailPaneMode,
  initialRowValues: Readonly<Record<string, unknown>>,
  schemaColumns: readonly ColumnDescriptor[],
): RowMutationDraft {
  return mode === 'insert'
    ? createInsertRowDraft(initialRowValues, schemaColumns)
    : createUpdateRowDraft(initialRowValues)
}

function isStructuredColumn(column: ColumnDescriptor): boolean {
  return (
    column.column_type.type === 'Json' ||
    column.column_type.type === 'Array' ||
    column.column_type.type === 'Row'
  )
}

export function useRowDraftController({
  initialRowValues,
  mode,
  schemaColumns,
}: UseRowDraftControllerOptions): RowDraftController {
  const [ownedDraft, setOwnedDraft] = useState(() =>
    createInitialDraft(mode, initialRowValues, schemaColumns),
  )

  return useBoundRowDraftController({
    binding: { draft: ownedDraft, setDraft: setOwnedDraft },
    schemaColumns,
  })
}

export function useBoundRowDraftController({
  binding,
  schemaColumns,
}: UseBoundRowDraftControllerOptions): RowDraftController {
  const { draft, setDraft } = binding

  const setFieldText = useCallback(
    (columnName: string, text: string) => {
      const column = schemaColumns.find((candidate) => candidate.name === columnName)
      if (column === undefined) {
        return
      }
      setDraft((currentDraft) => {
        if (getMutationFieldInput(currentDraft, column).mode !== 'value') {
          return currentDraft
        }
        return setMutationFieldText(currentDraft, column, text)
      })
    },
    [schemaColumns, setDraft],
  )

  const setFieldNull = useCallback(
    (columnName: string, isNull: boolean) => {
      setDraft((currentDraft) => {
        const column = schemaColumns.find((candidate) => candidate.name === columnName)
        if (column === undefined) {
          return currentDraft
        }
        const currentInput = getMutationFieldInput(currentDraft, column)
        const shouldSeedStructuredValue =
          isNull === false && currentInput.text.length === 0 && isStructuredColumn(column) === true
        if (shouldSeedStructuredValue === true) {
          return setMutationFieldText(
            currentDraft,
            column,
            column.column_type.type === 'Array' ? '[]' : '{}',
          )
        }
        return setMutationFieldMode(currentDraft, column, isNull === true ? 'null' : 'value')
      })
    },
    [schemaColumns, setDraft],
  )

  const setFieldOmitted = useCallback(
    (columnName: string, isOmitted: boolean) => {
      const column = schemaColumns.find((candidate) => candidate.name === columnName)
      if (column === undefined) {
        return
      }
      setDraft((currentDraft) =>
        setMutationFieldMode(currentDraft, column, isOmitted === true ? 'omitted' : 'value'),
      )
    },
    [schemaColumns, setDraft],
  )

  const buildSubmission = useCallback(
    () => buildRowMutationSubmission(draft, schemaColumns),
    [draft, schemaColumns],
  )

  return useMemo(
    () => ({
      actions: {
        buildSubmission,
        setFieldNull,
        setFieldOmitted,
        setFieldText,
      },
      state: { draft },
    }),
    [buildSubmission, draft, setFieldNull, setFieldOmitted, setFieldText],
  )
}
