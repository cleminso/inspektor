import {
  createContext,
  use,
  useCallback,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { ColumnDescriptor } from 'jazz-tools'

import {
  createTableMutationState,
  reduceTableMutationState,
  selectTableMutationLedger,
  type TableMutationEntry,
  type TableMutationLedger,
  type TableMutationState,
  type TableMutationStateAction,
} from '@tables/mutationLedger/ledger'
import { createUpdateRowDraft, type RowMutationDraft } from '@tables/rowEditor/mutation/draft'
import {
  useBoundRowDraftController,
  type RowDraftBinding,
  type RowDraftController,
} from '@tables/rowEditor/mutation/useRowDraftController'

export interface TableMutationExecutionState {
  error: string | null
  status: 'applying' | 'failed' | 'idle'
}

type PublicMutationAction = Exclude<TableMutationStateAction, { type: 'setDraft' }>

type ProviderAction =
  | PublicMutationAction
  | {
      initialDraft: RowMutationDraft
      rowId: string
      schemaColumns: readonly ColumnDescriptor[]
      type: 'updateDraft'
      update: SetStateAction<RowMutationDraft>
    }

interface TableMutationLedgerContextValue {
  dispatch: Dispatch<ProviderAction>
  execution: TableMutationExecutionState
  schemaColumns: readonly ColumnDescriptor[]
  setExecution: Dispatch<SetStateAction<TableMutationExecutionState>>
  state: TableMutationState
}

const TableMutationLedgerContext = createContext<TableMutationLedgerContextValue | null>(null)
const idleExecution: TableMutationExecutionState = { error: null, status: 'idle' }

function reduceProviderState(state: TableMutationState, action: ProviderAction): TableMutationState {
  if (action.type !== 'updateDraft') {
    return reduceTableMutationState(state, action)
  }
  const currentDraft = state.draftsByRowId[action.rowId] ?? action.initialDraft
  const draft = typeof action.update === 'function' ? action.update(currentDraft) : action.update
  return reduceTableMutationState(state, {
    type: 'setDraft',
    draft,
    rowId: action.rowId,
    schemaColumns: action.schemaColumns,
  })
}

export function TableMutationLedgerProvider({
  children,
  schemaColumns,
}: {
  children: ReactNode
  schemaColumns: readonly ColumnDescriptor[]
}): React.ReactElement {
  const [state, dispatch] = useReducer(reduceProviderState, undefined, createTableMutationState)
  const [execution, setExecution] = useState(idleExecution)
  const value = useMemo<TableMutationLedgerContextValue>(
    () => ({ dispatch, execution, schemaColumns, setExecution, state }),
    [execution, schemaColumns, state],
  )

  return <TableMutationLedgerContext value={value}>{children}</TableMutationLedgerContext>
}

function useMutationContext(): TableMutationLedgerContextValue {
  const context = use(TableMutationLedgerContext)
  if (context === null) {
    throw new Error('Table mutation hooks must be used within TableMutationLedgerProvider')
  }
  return context
}

export interface ScopedTableMutationLedger {
  discardAll: () => void
  dispatch: (action: PublicMutationAction) => void
  execution: TableMutationExecutionState
  hasInvalidEditor: boolean
  ledger: TableMutationLedger
  removeEntry: (entryId: TableMutationEntry['entryId']) => void
  setExecution: Dispatch<SetStateAction<TableMutationExecutionState>>
}

export function useTableMutationLedger(): ScopedTableMutationLedger {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const setExecution = context.setExecution
  const ledger = useMemo(
    () => selectTableMutationLedger(context.state, context.schemaColumns),
    [context.schemaColumns, context.state],
  )
  const dispatch = useCallback(
    (action: PublicMutationAction) => contextDispatch(action),
    [contextDispatch],
  )
  const discardAll = useCallback(() => {
    dispatch({ type: 'discardAll' })
    setExecution(idleExecution)
  }, [dispatch, setExecution])
  const removeEntry = useCallback(
    (entryId: TableMutationEntry['entryId']) => {
      dispatch({ type: 'removeEntry', entryId })
      setExecution(idleExecution)
    },
    [dispatch, setExecution],
  )

  return useMemo(
    () => ({
      discardAll,
      dispatch,
      execution: context.execution,
      hasInvalidEditor: ledger.hasInvalidDraft,
      ledger,
      removeEntry,
      setExecution,
    }),
    [context.execution, discardAll, dispatch, ledger, removeEntry, setExecution],
  )
}

interface UseTableMutationEditorControllerOptions {
  initialRowValues: Record<string, unknown>
  rowId: string
  schemaColumns: ColumnDescriptor[]
}

export type TableMutationEditorController = RowDraftController

export function useTableMutationEditorController({
  initialRowValues,
  rowId,
  schemaColumns,
}: UseTableMutationEditorControllerOptions): TableMutationEditorController {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const setExecution = context.setExecution
  const initialDraft = useMemo(() => createUpdateRowDraft(initialRowValues), [initialRowValues])
  const draft = context.state.draftsByRowId[rowId] ?? initialDraft
  const setDraft = useCallback<Dispatch<SetStateAction<RowMutationDraft>>>(
    (update) => {
      contextDispatch({ type: 'updateDraft', initialDraft, rowId, schemaColumns, update })
      setExecution((current) =>
        current.status === 'failed' ? idleExecution : current,
      )
    },
    [contextDispatch, initialDraft, rowId, schemaColumns, setExecution],
  )
  const binding = useMemo<RowDraftBinding>(() => ({ draft, setDraft }), [draft, setDraft])

  // Pane and inline editors bind to the same provider draft instead of synchronizing copies.
  return useBoundRowDraftController({
    binding,
    initialRowValues,
    mode: 'edit',
    schemaColumns,
  })
}
