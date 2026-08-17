import type { ColumnDescriptor } from 'jazz-tools'

import {
  buildRowMutationSubmission,
  isRowMutationDraftDirty,
  revertMutationField,
  type RowMutationDraft,
} from '@tables/rowEditor/mutation/draft'
import type { TableRowId } from '@tables/tableTypes'

export type TableMutationFields = Readonly<Record<string, unknown>>
export type DeletionOperationId = `delete-operation:${number}`

interface TableUpdateMutationEntry {
  entryId: `update:${string}`
  fields: TableMutationFields
  kind: 'update'
  rowId: TableRowId
}

interface TableDeleteMutationEntry {
  entryId: `delete:${string}`
  kind: 'delete'
  rowId: TableRowId
}

export type TableMutationEntry = TableUpdateMutationEntry | TableDeleteMutationEntry

export interface TableDeletionOperation {
  operationId: DeletionOperationId
  rowIds: readonly TableRowId[]
}

export interface TableMutationState {
  deletionOperations: readonly TableDeletionOperation[]
  draftsByRowId: Readonly<Record<TableRowId, RowMutationDraft>>
  nextDeletionOperationId: number
}

export interface TableMutationLedger {
  entries: readonly TableMutationEntry[]
  hasInvalidDraft: boolean
}

export type TableMutationReviewOperation =
  | {
      affectedRowCount: 1
      fieldNames: readonly string[]
      kind: 'update'
      operationId: `update:${string}`
      rowId: TableRowId
    }
  | {
      affectedRowCount: number
      kind: 'delete'
      operationId: DeletionOperationId
      rowIds: readonly TableRowId[]
    }

export interface TableMutationReview {
  affectedRowCount: number
  operationCount: number
  operations: readonly TableMutationReviewOperation[]
}

export type TableMutationStateAction =
  | {
      draft: RowMutationDraft
      rowId: TableRowId
      schemaColumns: readonly ColumnDescriptor[]
      type: 'setDraft'
    }
  | { rowIds: readonly TableRowId[]; type: 'deleteRows' }
  | { entryId: TableMutationEntry['entryId']; type: 'removeEntry' }
  | { fieldName: string; rowId: TableRowId; type: 'revertUpdateField' }
  | { rowId: TableRowId; type: 'revertRowUpdate' }
  | { operationId: DeletionOperationId; rowId: TableRowId; type: 'undoDeletionTarget' }
  | { operationId: TableMutationReviewOperation['operationId']; type: 'undoReviewOperation' }
  | { type: 'discardAll' }

export interface TableMutationCounts {
  delete: number
  total: number
  update: number
}

export interface AffectedTableRows {
  deletes: readonly { entryId: TableDeleteMutationEntry['entryId']; rowId: TableRowId }[]
  updates: readonly {
    entryId: TableUpdateMutationEntry['entryId']
    fieldCount: number
    fieldNames: readonly string[]
    rowId: TableRowId
  }[]
}

export function createTableMutationState(): TableMutationState {
  return { deletionOperations: [], draftsByRowId: {}, nextDeletionOperationId: 0 }
}

function selectDeletedRowIds(state: TableMutationState): Set<TableRowId> {
  return new Set(state.deletionOperations.flatMap((operation) => operation.rowIds))
}

export function reduceTableMutationState(
  state: TableMutationState,
  action: TableMutationStateAction,
): TableMutationState {
  switch (action.type) {
    case 'setDraft': {
      if (selectDeletedRowIds(state).has(action.rowId)) {
        return state
      }
      const draftsByRowId = { ...state.draftsByRowId }
      if (isRowMutationDraftDirty(action.draft, action.schemaColumns) === true) {
        draftsByRowId[action.rowId] = action.draft
      } else {
        delete draftsByRowId[action.rowId]
      }
      return { ...state, draftsByRowId }
    }
    case 'deleteRows': {
      const deletedRowIds = selectDeletedRowIds(state)
      const rowIds = [...new Set(action.rowIds)].filter((rowId) => deletedRowIds.has(rowId) === false)
      if (rowIds.length === 0) {
        return state
      }
      const draftsByRowId = { ...state.draftsByRowId }
      for (const rowId of rowIds) {
        delete draftsByRowId[rowId]
      }
      return {
        deletionOperations: [
          ...state.deletionOperations,
          { operationId: `delete-operation:${state.nextDeletionOperationId}`, rowIds },
        ],
        draftsByRowId,
        nextDeletionOperationId: state.nextDeletionOperationId + 1,
      }
    }
    case 'removeEntry': {
      if (action.entryId.startsWith('delete:')) {
        const rowId = action.entryId.slice('delete:'.length)
        return {
          ...state,
          deletionOperations: state.deletionOperations
            .map((operation) => ({
              ...operation,
              rowIds: operation.rowIds.filter((candidate) => candidate !== rowId),
            }))
            .filter((operation) => operation.rowIds.length > 0),
        }
      }
      const rowId = action.entryId.slice('update:'.length)
      const draftsByRowId = { ...state.draftsByRowId }
      delete draftsByRowId[rowId]
      return { ...state, draftsByRowId }
    }
    case 'revertUpdateField': {
      const draft = state.draftsByRowId[action.rowId]
      if (draft === undefined) {
        return state
      }
      const revertedDraft = revertMutationField(draft, action.fieldName)
      if (revertedDraft === draft) {
        return state
      }
      const draftsByRowId = { ...state.draftsByRowId }
      if (Object.keys(revertedDraft.fieldInputs).length === 0) {
        delete draftsByRowId[action.rowId]
      } else {
        draftsByRowId[action.rowId] = revertedDraft
      }
      return { ...state, draftsByRowId }
    }
    case 'revertRowUpdate': {
      if (state.draftsByRowId[action.rowId] === undefined) {
        return state
      }
      const draftsByRowId = { ...state.draftsByRowId }
      delete draftsByRowId[action.rowId]
      return { ...state, draftsByRowId }
    }
    case 'undoDeletionTarget':
      return {
        ...state,
        deletionOperations: state.deletionOperations
          .map((operation) =>
            operation.operationId === action.operationId
              ? { ...operation, rowIds: operation.rowIds.filter((rowId) => rowId !== action.rowId) }
              : operation,
          )
          .filter((operation) => operation.rowIds.length > 0),
      }
    case 'undoReviewOperation':
      if (action.operationId.startsWith('update:')) {
        return reduceTableMutationState(state, {
          type: 'revertRowUpdate',
          rowId: action.operationId.slice('update:'.length),
        })
      }
      return {
        ...state,
        deletionOperations: state.deletionOperations.filter(
          (operation) => operation.operationId !== action.operationId,
        ),
      }
    case 'discardAll':
      return createTableMutationState()
  }
}

export function selectTableMutationLedger(
  state: TableMutationState,
  schemaColumns: readonly ColumnDescriptor[],
): TableMutationLedger {
  const entries: TableMutationEntry[] = []
  let hasInvalidDraft = false

  for (const [rowId, draft] of Object.entries(state.draftsByRowId)) {
    const submission = buildRowMutationSubmission(draft, schemaColumns)
    hasInvalidDraft ||= Object.keys(submission.errors).length > 0
    if (Object.keys(submission.values).length > 0) {
      entries.push({ entryId: `update:${rowId}`, fields: submission.values, kind: 'update', rowId })
    }
  }
  for (const operation of state.deletionOperations) {
    for (const rowId of operation.rowIds) {
      entries.push({ entryId: `delete:${rowId}`, kind: 'delete', rowId })
    }
  }
  return { entries, hasInvalidDraft }
}

export function selectTableMutationReview(
  state: TableMutationState,
  schemaColumns: readonly ColumnDescriptor[],
): TableMutationReview {
  const operations: TableMutationReviewOperation[] = []
  for (const [rowId, draft] of Object.entries(state.draftsByRowId)) {
    const fieldNames = Object.keys(buildRowMutationSubmission(draft, schemaColumns).values).sort()
    if (fieldNames.length > 0) {
      operations.push({
        affectedRowCount: 1,
        fieldNames,
        kind: 'update',
        operationId: `update:${rowId}`,
        rowId,
      })
    }
  }
  for (const operation of state.deletionOperations) {
    operations.push({
      affectedRowCount: operation.rowIds.length,
      kind: 'delete',
      operationId: operation.operationId,
      rowIds: operation.rowIds,
    })
  }
  return {
    affectedRowCount: operations.reduce((count, operation) => count + operation.affectedRowCount, 0),
    operationCount: operations.length,
    operations,
  }
}

export function selectStagedFieldsByRowId(
  state: TableMutationState,
  schemaColumns: readonly ColumnDescriptor[],
): Readonly<Record<TableRowId, ReadonlySet<string>>> {
  return Object.fromEntries(
    Object.entries(state.draftsByRowId).flatMap(([rowId, draft]) => {
      const fieldNames = Object.keys(buildRowMutationSubmission(draft, schemaColumns).values)
      return fieldNames.length === 0 ? [] : [[rowId, new Set(fieldNames)]]
    }),
  )
}

export function selectTableMutationCounts(ledger: TableMutationLedger): TableMutationCounts {
  const counts = { delete: 0, total: ledger.entries.length, update: 0 }
  for (const entry of ledger.entries) {
    counts[entry.kind] += 1
  }
  return counts
}

export function selectAffectedRows(ledger: TableMutationLedger): AffectedTableRows {
  const updates: AffectedTableRows['updates'][number][] = []
  const deletes: AffectedTableRows['deletes'][number][] = []
  for (const entry of ledger.entries) {
    if (entry.kind === 'delete') {
      deletes.push({ entryId: entry.entryId, rowId: entry.rowId })
    } else {
      const fieldNames = Object.keys(entry.fields).sort()
      updates.push({
        entryId: entry.entryId,
        fieldCount: fieldNames.length,
        fieldNames,
        rowId: entry.rowId,
      })
    }
  }
  return { deletes, updates }
}
