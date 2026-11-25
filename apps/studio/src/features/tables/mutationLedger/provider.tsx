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
import {
  createTableWriteWorkspace,
  unknownWriteWarning,
  retiredWriteWarning,
  type TableWriteAccess,
  type TableWriteCommand,
  type TableWriteCoordinator,
  type WriteWorkspaceEvent,
} from '@inspektor/core/write'

import { useRegisterRuntimeScopeExitBlocker } from '@app/providers/runtimeScopeExitGuard'
import { useRuntimeClient } from '@app/providers/inspectorProvider'
import {
  createTableMutationState,
  reduceTableMutationState,
  selectTableMutationProjection,
  type TableMutationEntry,
  type TableMutationProjection,
  type TableMutationReviewOperation,
  type TableMutationState,
  type TableMutationStateAction,
} from '@tables/mutationLedger/ledger'
import {
  createInsertRowDraft,
  createUpdateRowDraft,
  rebaseUpdateRowDraft,
  type RowMutationDraft,
} from '@tables/rowEditor/mutation/draft'
import type { DynamicTableRow, TableRowId } from '@tables/tableTypes'
import { useBoundRowDraftController } from '@tables/rowEditor/mutation/useRowDraftController'

interface TableMutationExecutionState {
  error: string | null
  status: 'applying' | 'failed' | 'idle' | 'retired'
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
      preserveSource: boolean
      rowId: string
      schemaColumns: readonly ColumnDescriptor[]
      type: 'updateDraft'
      update: SetStateAction<RowMutationDraft>
    }

interface TableMutationLedgerContextValue {
  writes: TableWriteCoordinator<DynamicTableRow>
  attachWrites: (access: TableWriteAccess<DynamicTableRow> | null) => void
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
  const storedDraft = state.draftsByRowId[action.rowId] ?? action.initialDraft
  const currentDraft =
    action.preserveSource === true
      ? storedDraft
      : rebaseUpdateRowDraft(storedDraft, action.initialDraft.sourceValues, action.schemaColumns)
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
  submittedCommand: TableWriteCommand | null
}

function createStoredTableMutationState(): StoredTableMutationState {
  return { execution: idleExecution, state: createTableMutationState(), submittedCommand: null }
}

const emptyStoredTableMutationState = createStoredTableMutationState()

interface TableMutationLedgerWorkspaceContextValue {
  writes: ReturnType<typeof createTableWriteWorkspace<DynamicTableRow>>
  isApplying: (scopeKey: string) => boolean
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
  return (
    state.deletionOperations.length > 0 ||
    state.insertionOperations.length > 0 ||
    Object.keys(state.draftsByRowId).length > 0
  )
}

function countUnresolvedMutationState(state: TableMutationState): number {
  return (
    state.deletionOperations.reduce((count, operation) => count + operation.rowIds.length, 0) +
    state.insertionOperations.length +
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
  const lockedScopesRef = useRef(new Set<string>())
  const updateEntries = useCallback(
    (
      update: (
        current: Readonly<Record<string, StoredTableMutationState>>,
      ) => Readonly<Record<string, StoredTableMutationState>>,
    ) => {
      const next = update(entriesByScopeRef.current)
      if (next === entriesByScopeRef.current) return
      entriesByScopeRef.current = next
      setEntriesByScope(next)
    },
    [],
  )
  const ticketsRef = useRef(
    new Map<
      string,
      {
        coordinator: object
        operation: object
        draft: RowMutationDraft | undefined
      }
    >(),
  )
  // Native settlement outlives keyed views. Pane continuations own only presentation.
  const [writes] = useState(() =>
    createTableWriteWorkspace<DynamicTableRow>({
      onTransition: (event: WriteWorkspaceEvent) => {
        const { scopeKey, command } = event
        if (event.status === 'applying') {
          const current = entriesByScopeRef.current[scopeKey] ?? createStoredTableMutationState()
          ticketsRef.current.set(scopeKey, {
            coordinator: event.coordinator,
            operation: event.operation,
            draft:
              command.kind === 'insert' ? undefined : current.state.draftsByRowId[command.rowId],
          })
          lockedScopesRef.current.add(scopeKey)
          updateEntries((entries) => ({
            ...entries,
            [scopeKey]: {
              ...current,
              execution: { status: 'applying', error: null },
              submittedCommand: command,
            },
          }))
          return
        }
        const ticket = ticketsRef.current.get(scopeKey)
        if (ticket?.coordinator !== event.coordinator || ticket.operation !== event.operation)
          return
        const retired =
          event.status === 'retired' ||
          entriesByScopeRef.current[scopeKey]?.execution.status === 'retired'
        // Native settlement changes the verdict, not the retired owner's admission lock.
        if (retired === false) lockedScopesRef.current.delete(scopeKey)
        updateEntries((entries) => {
          const current = entries[scopeKey] ?? createStoredTableMutationState()
          if (event.status === 'retired') {
            return {
              ...entries,
              [scopeKey]: {
                ...current,
                execution: { status: 'retired', error: unknownWriteWarning },
              },
            }
          }
          if (event.status === 'failed' || event.status === 'rejected') {
            return {
              ...entries,
              [scopeKey]: {
                ...current,
                execution:
                  retired === true
                    ? {
                        status: 'retired',
                        error: retiredWriteWarning(
                          event.status === 'rejected' ? 'rejected' : undefined,
                        ),
                      }
                    : { status: 'failed', error: String(event.error) },
              },
            }
          }
          let state = current.state
          if (command.kind !== 'insert' && state.draftsByRowId[command.rowId] === ticket.draft) {
            state = reduceTableMutationState(state, {
              type: 'acknowledgeAppliedEntries',
              entryIds: [
                command.kind === 'delete' ? `delete:${command.rowId}` : `update:${command.rowId}`,
              ],
            })
          }
          return {
            ...entries,
            [scopeKey]: {
              state,
              execution:
                retired === true
                  ? { status: 'retired', error: retiredWriteWarning('confirmed') }
                  : idleExecution,
              submittedCommand: null,
            },
          }
        })
      },
    }),
  )
  const client = useRuntimeClient()
  const previousOwnerRef = useRef(client)
  useLayoutEffect(() => {
    const previous = previousOwnerRef.current
    previousOwnerRef.current = client
    if (previous !== null && previous !== client) writes.retireOwner(previous)
  }, [client, writes])
  const hasPending = Object.values(entriesByScope).some(
    (entry) =>
      entry.execution.status === 'applying' ||
      entry.execution.status === 'retired' ||
      hasUnresolvedMutationState(entry.state),
  )
  useRegisterRuntimeScopeExitBlocker(hasPending)

  useEffect(() => {
    if (hasPending === false) {
      return
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasPending])

  const dispatch = useCallback(
    (scopeKey: string, action: ProviderAction) => {
      if (lockedScopesRef.current.has(scopeKey) === true) {
        return
      }
      updateEntries((current) => {
        const currentEntry = current[scopeKey] ?? createStoredTableMutationState()
        // A matching live value can be an optimistic echo, not global acceptance. A rejected write
        // must keep its original baseline and raw inputs until Save succeeds or Cancel discards it.
        if (currentEntry.execution.status === 'failed' && action.type === 'rebaseRows') {
          return current
        }
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
        if (
          currentEntry.execution.status === 'idle' &&
          hasUnresolvedMutationState(state) === false
        ) {
          const next = { ...current }
          delete next[scopeKey]
          return next
        }
        return { ...current, [scopeKey]: { ...currentEntry, state } }
      })
    },
    [updateEntries],
  )
  const discardPendingChanges = useCallback(
    (scopeKey: string) => {
      if (lockedScopesRef.current.has(scopeKey) === true) {
        return false
      }
      // Tab-close navigation follows this command before React commits the workspace update.
      updateEntries((current) => {
        if (current[scopeKey] === undefined) {
          return current
        }
        const next = { ...current }
        delete next[scopeKey]
        return next
      })
      return true
    },
    [updateEntries],
  )
  const setExecution = useCallback(
    (scopeKey: string, update: SetStateAction<TableMutationExecutionState>) => {
      if (entriesByScopeRef.current[scopeKey]?.execution.status === 'retired') return
      if (writes.table(scopeKey).getSnapshot().reloadRequired === true) return
      if (writes.table(scopeKey).getSnapshot().pendingWrite !== null) return
      if (typeof update !== 'function') {
        if (update.status === 'applying') {
          lockedScopesRef.current.add(scopeKey)
        } else {
          lockedScopesRef.current.delete(scopeKey)
        }
      }
      updateEntries((current) => {
        const currentEntry = current[scopeKey] ?? createStoredTableMutationState()
        const execution = typeof update === 'function' ? update(currentEntry.execution) : update
        if (
          execution.status === 'idle' &&
          hasUnresolvedMutationState(currentEntry.state) === false
        ) {
          if (current[scopeKey] === undefined) {
            return current
          }
          const next = { ...current }
          delete next[scopeKey]
          return next
        }
        return { ...current, [scopeKey]: { ...currentEntry, execution } }
      })
    },
    [updateEntries, writes],
  )
  const hasPendingChanges = useCallback((scopeKey: string) => {
    const entry = entriesByScopeRef.current[scopeKey]
    return (
      entry !== undefined &&
      (entry.execution.status === 'applying' ||
        entry.execution.status === 'retired' ||
        hasUnresolvedMutationState(entry.state))
    )
  }, [])
  const isApplying = useCallback(
    (scopeKey: string) => entriesByScopeRef.current[scopeKey]?.execution.status === 'applying',
    [],
  )
  const value = useMemo<TableMutationLedgerWorkspaceContextValue>(
    () => ({
      discardPendingChanges,
      dispatch,
      hasPendingChanges,
      isApplying,
      setExecution,
      writes,
    }),
    [discardPendingChanges, dispatch, hasPendingChanges, isApplying, setExecution, writes],
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
  isApplying: (scopeKey: string) => boolean
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
  const writes = workspace.writes.table(scopeKey)
  const attachWrites = useCallback(
    (access: TableWriteAccess<DynamicTableRow> | null) => {
      workspace.writes.attach(scopeKey, access)
    },
    [scopeKey, workspace.writes],
  )
  const value = useMemo<TableMutationLedgerContextValue>(
    () => ({
      dispatch,
      execution,
      projection,
      schemaColumns,
      setExecution,
      state,
      writes,
      attachWrites,
    }),
    [dispatch, execution, projection, schemaColumns, setExecution, state, writes, attachWrites],
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

export function useTableWriteCoordinator() {
  const context = useMutationContext()
  return { coordinator: context.writes, attach: context.attachWrites }
}

/**
 * Returns the current table projection and the commands that mutate or apply it.
 *
 * Ledger state remains owned by the workspace provider, so replacing this table-scoped provider
 * must not discard drafts when a user switches between table views.
 */
export function useTableMutationLedger() {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const setExecution = context.setExecution
  const {
    hasInvalidInsertionDraft,
    invalidUpdateRowIds,
    ledger,
    reviewOperations,
    stagedFieldsByRowId,
  } = context.projection
  const stagedCount = countUnresolvedMutationState(context.state)
  const acknowledgeAppliedEntries = useCallback(
    (entryIds: readonly TableMutationEntry['entryId'][]) => {
      contextDispatch({ type: 'acknowledgeAppliedEntries', entryIds })
    },
    [contextDispatch],
  )
  const recover = useCallback(
    (action: PublicMutationAction) => {
      contextDispatch(action)
      setExecution((current) =>
        current.status === 'applying' || current.status === 'retired' ? current : idleExecution,
      )
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
  const stageInsert = useCallback(
    (sourceRowId: TableRowId, sourceValues: Readonly<Record<string, unknown>>) => {
      const snapshot = structuredClone(sourceValues)
      recover({
        type: 'insertRow',
        draft: createInsertRowDraft(snapshot, context.schemaColumns),
        sourceRowId,
      })
    },
    [context.schemaColumns, recover],
  )
  const undoReviewOperation = useCallback(
    (operationId: TableMutationReviewOperation['operationId']) =>
      recover({ type: 'undoReviewOperation', operationId }),
    [recover],
  )

  return {
    acknowledgeAppliedEntries,
    discardAll,
    execution: context.execution,
    hasInvalidInsertionDraft,
    invalidUpdateRowIds,
    ledger,
    rebaseRows,
    revertField,
    revertRowUpdate,
    reviewOperations,
    stageDeletions,
    stageInsert,
    stagedFieldsByRowId,
    stagedValuesByRowId: context.projection.stagedValuesByRowId,
    stagedCount,
    setExecution,
    undoDeletions,
    undoReviewOperation,
  }
}

interface UseTableMutationEditorControllerOptions {
  initialRowValues: Record<string, unknown>
  rowId: string
}

export function useTableMutationEditorController({
  initialRowValues,
  rowId,
}: UseTableMutationEditorControllerOptions) {
  const context = useMutationContext()
  const contextDispatch = context.dispatch
  const schemaColumns = context.schemaColumns
  const initialDraft = useMemo(() => createUpdateRowDraft(initialRowValues), [initialRowValues])
  const storedDraft = context.state.draftsByRowId[rowId]
  const draft = useMemo(
    () =>
      storedDraft === undefined
        ? initialDraft
        : context.execution.status !== 'idle'
          ? storedDraft
          : rebaseUpdateRowDraft(storedDraft, initialRowValues, schemaColumns),
    [context.execution.status, initialDraft, initialRowValues, schemaColumns, storedDraft],
  )
  const setDraft = useCallback<Dispatch<SetStateAction<RowMutationDraft>>>(
    (update) => {
      contextDispatch({
        type: 'updateDraft',
        initialDraft,
        preserveSource: context.execution.status !== 'idle',
        rowId,
        schemaColumns,
        update,
      })
    },
    [context.execution.status, contextDispatch, initialDraft, rowId, schemaColumns],
  )
  useEffect(() => {
    if (storedDraft !== undefined && draft !== storedDraft) {
      contextDispatch({
        type: 'updateDraft',
        initialDraft,
        preserveSource: context.execution.status !== 'idle',
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
  return useBoundRowDraftController({
    binding: { draft, setDraft },
    schemaColumns,
  })
}
