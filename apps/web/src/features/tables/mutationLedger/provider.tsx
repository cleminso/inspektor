import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { ColumnDescriptor } from 'jazz-tools'

import { useRegisterRuntimeScopeExitBlocker } from '@app/providers/runtimeScopeExitGuard'
import {
  createTableMutationState,
  reduceTableMutationState,
  selectTableMutationProjection,
  type TableMutationEntry,
  type TableMutationLedger,
  type TableMutationProjection,
  type TableMutationReviewOperation,
  type TableMutationState,
  type TableMutationStateAction,
} from '@tables/mutationLedger/ledger'
import {
  createUpdateRowDraft,
  rebaseUpdateRowDraft,
  setMutationFieldInput,
  type MutationFieldInput,
  type RowMutationDraft,
} from '@tables/rowEditor/mutation/draft'
import type { TableRowId, TableValuesByRowId } from '@tables/tableTypes'
import {
  useBoundRowDraftController,
  type RowDraftController,
} from '@tables/rowEditor/mutation/useRowDraftController'

interface TableMutationExecutionState {
  error: string | null
  status: 'applying' | 'failed' | 'idle'
}

type PublicMutationAction = Exclude<
  TableMutationStateAction,
  { type: 'acknowledgeAppliedEntries' } | { type: 'setDraft' }
>

type ProviderAction =
  | Exclude<TableMutationStateAction, { type: 'setDraft' }>
  | {
      rows: readonly (Record<string, unknown> & { id: string })[]
      schemaColumns: readonly ColumnDescriptor[]
      type: 'rebaseRows'
    }
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
  projection: TableMutationProjection
  schemaColumns: readonly ColumnDescriptor[]
  setExecution: Dispatch<SetStateAction<TableMutationExecutionState>>
  state: TableMutationState
}

const TableMutationLedgerContext = createContext<TableMutationLedgerContextValue | null>(null)
const idleExecution: TableMutationExecutionState = { error: null, status: 'idle' }

function reduceProviderState(
  state: TableMutationState,
  action: ProviderAction,
): TableMutationState {
  if (action.type === 'rebaseRows') {
    return action.rows.reduce((currentState, row) => {
      const currentDraft = currentState.draftsByRowId[row.id]
      if (currentDraft === undefined) {
        return currentState
      }
      return reduceTableMutationState(currentState, {
        type: 'setDraft',
        draft: rebaseUpdateRowDraft(currentDraft, row, action.schemaColumns),
        rowId: row.id,
      })
    }, state)
  }
  if (action.type !== 'updateDraft') {
    return reduceTableMutationState(state, action)
  }
  const currentDraft = rebaseUpdateRowDraft(
    state.draftsByRowId[action.rowId] ?? action.initialDraft,
    action.initialDraft.sourceValues,
    action.schemaColumns,
  )
  const draft = typeof action.update === 'function' ? action.update(currentDraft) : action.update
  return reduceTableMutationState(state, {
    type: 'setDraft',
    draft,
    rowId: action.rowId,
  })
}

interface StoredTableMutationState {
  execution: TableMutationExecutionState
  state: TableMutationState
}

function createStoredTableMutationState(): StoredTableMutationState {
  return { execution: idleExecution, state: createTableMutationState() }
}

const emptyStoredTableMutationState = createStoredTableMutationState()

interface TableMutationLedgerWorkspaceContextValue {
  discardPendingChanges: (scopeKey: string) => boolean
  dispatch: (scopeKey: string, action: ProviderAction) => void
  hasPendingChanges: (scopeKey: string) => boolean
  setExecution: (scopeKey: string, update: SetStateAction<TableMutationExecutionState>) => void
}

const TableMutationLedgerWorkspaceContext =
  createContext<TableMutationLedgerWorkspaceContextValue | null>(null)

/** Reactive ledger state is separate so command-only consumers do not rerender on draft edits. */
const TableMutationLedgerWorkspaceStateContext = createContext<Readonly<
  Record<string, StoredTableMutationState>
> | null>(null)

function hasUnresolvedMutationState(state: TableMutationState): boolean {
  return state.deletionOperations.length > 0 || Object.keys(state.draftsByRowId).length > 0
}

function countUnresolvedMutationState(state: TableMutationState): number {
  return (
    state.deletionOperations.reduce((count, operation) => count + operation.rowIds.length, 0) +
    Object.keys(state.draftsByRowId).length
  )
}

/** Owns scoped table ledgers across active table-view mounts within one runtime workspace. */
export function TableMutationLedgerWorkspaceProvider({
  children,
}: {
  children: ReactNode
}): React.ReactElement {
  const [entriesByScope, setEntriesByScope] = useState<
    Readonly<Record<string, StoredTableMutationState>>
  >({})
  const entriesByScopeRef = useRef(entriesByScope)
  const applyingScopesRef = useRef(new Set<string>())
  useLayoutEffect(() => {
    entriesByScopeRef.current = entriesByScope
  }, [entriesByScope])
  const hasPending = Object.values(entriesByScope).some((entry) =>
    hasUnresolvedMutationState(entry.state),
  )
  useRegisterRuntimeScopeExitBlocker(hasPending)

  useEffect(() => {
    if (hasPending === false) {
      return
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = true
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasPending])

  const dispatch = useCallback((scopeKey: string, action: ProviderAction) => {
    setEntriesByScope((current) => {
      const currentEntry = current[scopeKey] ?? createStoredTableMutationState()
      if (
        currentEntry.execution.status === 'applying' &&
        action.type !== 'acknowledgeAppliedEntries'
      ) {
        return current
      }
      const state = reduceProviderState(currentEntry.state, action)
      if (state === currentEntry.state) {
        return current
      }
      return { ...current, [scopeKey]: { ...currentEntry, state } }
    })
  }, [])
  const discardPendingChanges = useCallback((scopeKey: string) => {
    if (applyingScopesRef.current.has(scopeKey)) {
      return false
    }
    setEntriesByScope((current) => {
      if (current[scopeKey] === undefined) {
        return current
      }
      const next = { ...current }
      delete next[scopeKey]
      return next
    })
    return true
  }, [])
  const setExecution = useCallback(
    (scopeKey: string, update: SetStateAction<TableMutationExecutionState>) => {
      if (typeof update !== 'function') {
        if (update.status === 'applying') {
          applyingScopesRef.current.add(scopeKey)
        } else {
          applyingScopesRef.current.delete(scopeKey)
        }
      }
      setEntriesByScope((current) => {
        const currentEntry = current[scopeKey] ?? createStoredTableMutationState()
        const execution = typeof update === 'function' ? update(currentEntry.execution) : update
        return { ...current, [scopeKey]: { ...currentEntry, execution } }
      })
    },
    [],
  )
  const hasPendingChanges = useCallback((scopeKey: string) => {
    const entry = entriesByScopeRef.current[scopeKey]
    return entry !== undefined && hasUnresolvedMutationState(entry.state)
  }, [])
  const value = useMemo<TableMutationLedgerWorkspaceContextValue>(
    () => ({
      discardPendingChanges,
      dispatch,
      hasPendingChanges,
      setExecution,
    }),
    [discardPendingChanges, dispatch, hasPendingChanges, setExecution],
  )

  return (
    <TableMutationLedgerWorkspaceContext value={value}>
      <TableMutationLedgerWorkspaceStateContext value={entriesByScope}>
        {children}
      </TableMutationLedgerWorkspaceStateContext>
    </TableMutationLedgerWorkspaceContext>
  )
}

interface TableMutationWorkspace {
  discardPendingChanges: (scopeKey: string) => boolean
  hasPendingChanges: (scopeKey: string) => boolean
}

/** Returns stable commands that read the latest workspace state without subscribing the caller. */
export function useTableMutationWorkspace(): TableMutationWorkspace {
  const context = use(TableMutationLedgerWorkspaceContext)
  if (context === null) {
    throw new Error(
      'Table mutation workspace hooks must be used within TableMutationLedgerWorkspaceProvider',
    )
  }
  return context
}

/** Provides one table's mutation ledger from the nearest workspace-owned scope. */
export function TableMutationLedgerProvider({
  children,
  schemaColumns,
  scopeKey,
}: {
  children: ReactNode
  schemaColumns: readonly ColumnDescriptor[]
  scopeKey: string
}): React.ReactElement {
  const workspace = use(TableMutationLedgerWorkspaceContext)
  const entriesByScope = use(TableMutationLedgerWorkspaceStateContext)
  if (workspace === null || entriesByScope === null) {
    throw new Error(
      'TableMutationLedgerProvider must be used within TableMutationLedgerWorkspaceProvider',
    )
  }
  const workspaceDispatch = workspace.dispatch
  const workspaceSetExecution = workspace.setExecution
  const workspaceEntry = entriesByScope[scopeKey] ?? emptyStoredTableMutationState
  const state = workspaceEntry.state
  const execution = workspaceEntry.execution
  const projection = useMemo(
    () => selectTableMutationProjection(state, schemaColumns),
    [schemaColumns, state],
  )
  const dispatch = useCallback<Dispatch<ProviderAction>>(
    (action) => {
      workspaceDispatch(scopeKey, action)
    },
    [scopeKey, workspaceDispatch],
  )
  const setExecution = useCallback<Dispatch<SetStateAction<TableMutationExecutionState>>>(
    (update) => {
      workspaceSetExecution(scopeKey, update)
    },
    [scopeKey, workspaceSetExecution],
  )
  const value = useMemo<TableMutationLedgerContextValue>(
    () => ({ dispatch, execution, projection, schemaColumns, setExecution, state }),
    [dispatch, execution, projection, schemaColumns, setExecution, state],
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

interface ScopedTableMutationLedger {
  discardAll: () => void
  execution: TableMutationExecutionState
  ledger: TableMutationLedger
  rebaseRows: (rows: readonly (Record<string, unknown> & { id: string })[]) => void
  revertField: (rowId: string, fieldName: string) => void
  revertRowUpdate: (rowId: string) => void
  reviewOperations: readonly TableMutationReviewOperation[]
  stageDeletions: (rowIds: readonly TableRowId[]) => void
  stagedFieldsByRowId: Readonly<Record<string, ReadonlySet<string>>>
  stagedValuesByRowId: TableValuesByRowId
  stagedCount: number
  undoDeletions: (rowIds: readonly TableRowId[]) => void
  undoReviewOperation: (operationId: TableMutationReviewOperation['operationId']) => void
}

interface TableMutationApplicationCommands {
  acknowledgeAppliedEntries: (entryIds: readonly TableMutationEntry['entryId'][]) => void
  setExecution: (execution: TableMutationExecutionState) => void
}

export function useTableMutationApplicationCommands(): TableMutationApplicationCommands {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const acknowledgeAppliedEntries = useCallback(
    (entryIds: readonly TableMutationEntry['entryId'][]) => {
      contextDispatch({ type: 'acknowledgeAppliedEntries', entryIds })
    },
    [contextDispatch],
  )
  return { acknowledgeAppliedEntries, setExecution: context.setExecution }
}

function haveEqualStagedFields(
  left: Readonly<Record<string, ReadonlySet<string>>>,
  right: Readonly<Record<string, ReadonlySet<string>>>,
): boolean {
  const leftEntries = Object.entries(left)
  const rightEntries = Object.entries(right)
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(([rowId, fields]) => {
      const nextFields = right[rowId]
      return (
        nextFields !== undefined &&
        fields.size === nextFields.size &&
        [...fields].every((fieldName) => nextFields.has(fieldName))
      )
    })
  )
}

export function useTableMutationLedger(): ScopedTableMutationLedger {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const setExecution = context.setExecution
  const projection = context.projection
  const ledger = projection.ledger
  const reviewOperations = projection.reviewOperations
  const selectedStagedFields = projection.stagedFieldsByRowId
  const stagedFieldsRef = useRef(selectedStagedFields)
  if (haveEqualStagedFields(stagedFieldsRef.current, selectedStagedFields) === false) {
    stagedFieldsRef.current = selectedStagedFields
  }
  const stagedFieldsByRowId = stagedFieldsRef.current
  const stagedValuesByRowId = projection.stagedValuesByRowId
  const stagedCount = countUnresolvedMutationState(context.state)
  const recover = useCallback(
    (action: PublicMutationAction) => {
      contextDispatch(action)
      setExecution((current) => (current.status === 'applying' ? current : idleExecution))
    },
    [contextDispatch, setExecution],
  )
  const discardAll = useCallback(() => recover({ type: 'discardAll' }), [recover])
  const rebaseRows = useCallback(
    (rows: readonly (Record<string, unknown> & { id: string })[]) => {
      contextDispatch({ type: 'rebaseRows', rows, schemaColumns: context.schemaColumns })
    },
    [context.schemaColumns, contextDispatch],
  )
  const revertField = useCallback(
    (rowId: string, fieldName: string) => recover({ type: 'revertUpdateField', rowId, fieldName }),
    [recover],
  )
  const revertRowUpdate = useCallback(
    (rowId: string) => recover({ type: 'revertRowUpdate', rowId }),
    [recover],
  )
  const undoDeletions = useCallback(
    (rowIds: readonly TableRowId[]) => recover({ type: 'undoDeletions', rowIds }),
    [recover],
  )
  const stageDeletions = useCallback(
    (rowIds: readonly TableRowId[]) => recover({ type: 'deleteRows', rowIds }),
    [recover],
  )
  const undoReviewOperation = useCallback(
    (operationId: TableMutationReviewOperation['operationId']) =>
      recover({ type: 'undoReviewOperation', operationId }),
    [recover],
  )

  return {
    discardAll,
    execution: context.execution,
    ledger,
    rebaseRows,
    revertField,
    revertRowUpdate,
    reviewOperations,
    stageDeletions,
    stagedFieldsByRowId,
    stagedValuesByRowId,
    stagedCount,
    undoDeletions,
    undoReviewOperation,
  }
}

interface UseTableMutationEditorControllerOptions {
  initialRowValues: Record<string, unknown>
  rowId: string
}

interface TableMutationEditorController extends RowDraftController {
  commitFieldInput: (columnName: string, input: MutationFieldInput) => void
}

export function useTableMutationEditorController({
  initialRowValues,
  rowId,
}: UseTableMutationEditorControllerOptions): TableMutationEditorController {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const schemaColumns = context.schemaColumns
  const setExecution = context.setExecution
  const initialDraft = useMemo(() => createUpdateRowDraft(initialRowValues), [initialRowValues])
  const storedDraft = context.state.draftsByRowId[rowId]
  const draft = useMemo(
    () =>
      storedDraft === undefined
        ? initialDraft
        : rebaseUpdateRowDraft(storedDraft, initialRowValues, schemaColumns),
    [initialDraft, initialRowValues, schemaColumns, storedDraft],
  )
  const setDraft = useCallback<Dispatch<SetStateAction<RowMutationDraft>>>(
    (update) => {
      contextDispatch({ type: 'updateDraft', initialDraft, rowId, schemaColumns, update })
      setExecution((current) => (current.status === 'failed' ? idleExecution : current))
    },
    [contextDispatch, initialDraft, rowId, schemaColumns, setExecution],
  )
  useEffect(() => {
    if (storedDraft !== undefined && draft !== storedDraft) {
      contextDispatch({
        type: 'updateDraft',
        initialDraft,
        rowId,
        schemaColumns,
        update: draft,
      })
    }
  }, [
    context.execution.status,
    contextDispatch,
    draft,
    initialDraft,
    rowId,
    schemaColumns,
    storedDraft,
  ])
  const controller = useBoundRowDraftController({
    binding: { draft, setDraft },
    schemaColumns,
  })
  const commitFieldInput = useCallback(
    (columnName: string, input: MutationFieldInput) => {
      const column = schemaColumns.find((candidate) => candidate.name === columnName)
      if (column === undefined) {
        return
      }
      setDraft((currentDraft) => setMutationFieldInput(currentDraft, column, input))
    },
    [schemaColumns, setDraft],
  )

  return useMemo(() => ({ ...controller, commitFieldInput }), [commitFieldInput, controller])
}
