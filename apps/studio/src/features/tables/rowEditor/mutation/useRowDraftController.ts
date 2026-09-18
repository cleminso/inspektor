import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import type { ColumnDescriptor } from 'jazz-tools'

import {
  buildRowMutationSubmission,
  createInsertRowDraft,
  createUpdateRowDraft,
  setMutationFieldInput,
  type MutationFieldInput,
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
  setFieldInput: (columnName: string, input: MutationFieldInput) => void
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

export function useRowDraftController({
  initialRowValues,
  mode,
  schemaColumns,
}: UseRowDraftControllerOptions): RowDraftController {
  const [ownedDraft, setOwnedDraft] = useState(() =>
    mode === 'insert'
      ? createInsertRowDraft(initialRowValues, schemaColumns)
      : createUpdateRowDraft(initialRowValues),
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

  const setFieldInput = useCallback(
    (columnName: string, input: MutationFieldInput) => {
      const column = schemaColumns.find((candidate) => candidate.name === columnName)
      if (column === undefined) {
        return
      }
      setDraft((currentDraft) => setMutationFieldInput(currentDraft, column, input))
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
        setFieldInput,
      },
      state: { draft },
    }),
    [buildSubmission, draft, setFieldInput],
  )
}
