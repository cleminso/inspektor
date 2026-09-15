import type { ColumnDescriptor } from 'jazz-tools'

import {
  buildRowMutationValueProjection,
  revertMutationField,
  type RowMutationDraft,
} from '@tables/rowEditor/mutation/draft'
import type { TableRowId, TableValuesByRowId } from '@tables/tableTypes'

export type TableMutationFields = Readonly<Record<string, unknown>>
type DeletionOperationId = `delete-operation:${number}`
export type InsertionOperationId = `insert:${number}`

interface TableInsertMutationEntry {
  entryId: InsertionOperationId
  fields: TableMutationFields
  kind: 'insert'
}

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

export type TableMutationEntry =
  | TableInsertMutationEntry
  | TableUpdateMutationEntry
  | TableDeleteMutationEntry

interface TableDeletionOperation {
  operationId: DeletionOperationId
  rowIds: readonly TableRowId[]
}

interface TableInsertionOperation {
  draft: RowMutationDraft
  operationId: InsertionOperationId
  sourceRowId: TableRowId
}

export interface TableMutationState {
  deletionOperations: readonly TableDeletionOperation[]
  draftsByRowId: Readonly<Record<TableRowId, RowMutationDraft>>
  nextDeletionOperationId: number
  insertionOperations: readonly TableInsertionOperation[]
  nextInsertionOperationId: number
}

export interface TableMutationLedger {
  entries: readonly TableMutationEntry[]
  hasInvalidDraft: boolean
}

export type TableMutationReviewOperation =
  | {
      kind: 'insert'
      operationId: InsertionOperationId
      sourceRowId: TableRowId
    }
  | {
      fieldNames: readonly string[]
      kind: 'update'
      operationId: `update:${string}`
      rowId: TableRowId
    }
  | {
      kind: 'delete'
      operationId: DeletionOperationId
      rowIds: readonly TableRowId[]
    }

export interface TableMutationProjection {
  ledger: TableMutationLedger
  reviewOperations: readonly TableMutationReviewOperation[]
  stagedFieldsByRowId: Readonly<Record<TableRowId, ReadonlySet<string>>>
  stagedValuesByRowId: TableValuesByRowId
}

export type TableMutationStateAction =
  | {
      draft: RowMutationDraft
      rowId: TableRowId
      type: 'setDraft'
    }
  | { rowIds: readonly TableRowId[]; type: 'deleteRows' }
  | { draft: RowMutationDraft; sourceRowId: TableRowId; type: 'insertRow' }
  | { rowIds: readonly TableRowId[]; type: 'undoDeletions' }
  | { fieldName: string; rowId: TableRowId; type: 'revertUpdateField' }
  | { rowId: TableRowId; type: 'revertRowUpdate' }
  | { operationId: TableMutationReviewOperation['operationId']; type: 'undoReviewOperation' }
  | {
      entryIds: readonly TableMutationEntry['entryId'][]
      type: 'acknowledgeAppliedEntries'
    }
  | { type: 'discardAll' }

export function createTableMutationState(): TableMutationState {
  return {
    deletionOperations: [],
    draftsByRowId: {},
    insertionOperations: [],
    nextDeletionOperationId: 0,
    nextInsertionOperationId: 0,
  }
}

function selectDeletedRowIds(state: TableMutationState): Set<TableRowId> {
  return new Set(state.deletionOperations.flatMap((operation) => operation.rowIds))
}

function removeDeletedRows(
  state: TableMutationState,
  rowIds: ReadonlySet<TableRowId>,
): TableMutationState {
  if (rowIds.size === 0) {
    return state
  }
  return {
    ...state,
    deletionOperations: state.deletionOperations
      .map((operation) => ({
        ...operation,
        rowIds: operation.rowIds.filter((rowId) => rowIds.has(rowId) === false),
      }))
      .filter((operation) => operation.rowIds.length > 0),
  }
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
      if (action.draft.kind === 'update' && Object.keys(action.draft.fieldInputs).length > 0) {
        if (draftsByRowId[action.rowId] === action.draft) {
          return state
        }
        draftsByRowId[action.rowId] = action.draft
      } else {
        delete draftsByRowId[action.rowId]
      }
      return { ...state, draftsByRowId }
    }
    case 'insertRow': {
      if (action.draft.kind !== 'insert') {
        return state
      }
      const operationId: InsertionOperationId = `insert:${state.nextInsertionOperationId}`
      return {
        ...state,
        insertionOperations: [
          ...state.insertionOperations,
          { draft: action.draft, operationId, sourceRowId: action.sourceRowId },
        ],
        nextInsertionOperationId: state.nextInsertionOperationId + 1,
      }
    }
    case 'deleteRows': {
      const deletedRowIds = selectDeletedRowIds(state)
      const rowIds = [...new Set(action.rowIds)].filter(
        (rowId) => deletedRowIds.has(rowId) === false,
      )
      if (rowIds.length === 0) {
        return state
      }
      const draftsByRowId = { ...state.draftsByRowId }
      for (const rowId of rowIds) {
        delete draftsByRowId[rowId]
      }
      return {
        ...state,
        deletionOperations: [
          ...state.deletionOperations,
          { operationId: `delete-operation:${state.nextDeletionOperationId}`, rowIds },
        ],
        draftsByRowId,
        nextDeletionOperationId: state.nextDeletionOperationId + 1,
      }
    }
    case 'undoDeletions': {
      return removeDeletedRows(state, new Set(action.rowIds))
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
    case 'undoReviewOperation':
      if (action.operationId.startsWith('insert:')) {
        return {
          ...state,
          insertionOperations: state.insertionOperations.filter(
            (operation) => operation.operationId !== action.operationId,
          ),
        }
      }
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
    case 'acknowledgeAppliedEntries': {
      const entryIds = new Set(action.entryIds)
      const draftsByRowId = { ...state.draftsByRowId }
      const appliedInsertIds = new Set<string>()
      const deletedRowIds = new Set<TableRowId>()
      for (const entryId of entryIds) {
        if (entryId.startsWith('update:')) {
          delete draftsByRowId[entryId.slice('update:'.length)]
        } else if (entryId.startsWith('insert:')) {
          appliedInsertIds.add(entryId)
        } else {
          deletedRowIds.add(entryId.slice('delete:'.length))
        }
      }
      return removeDeletedRows(
        {
          ...state,
          draftsByRowId,
          insertionOperations: state.insertionOperations.filter(
            (operation) => appliedInsertIds.has(operation.operationId) === false,
          ),
        },
        deletedRowIds,
      )
    }
    case 'discardAll':
      return createTableMutationState()
  }
}

export function selectTableMutationProjection(
  state: TableMutationState,
  schemaColumns: readonly ColumnDescriptor[],
): TableMutationProjection {
  const entries: TableMutationEntry[] = []
  const operations: TableMutationReviewOperation[] = []
  const stagedFieldsByRowId: Record<TableRowId, ReadonlySet<string>> = {}
  const stagedValuesByRowId: Record<TableRowId, Readonly<Record<string, unknown>>> = {}
  let hasInvalidDraft = false
  for (const operation of state.insertionOperations) {
    const values = buildRowMutationValueProjection(operation.draft, schemaColumns)
    hasInvalidDraft ||= Object.keys(values.errors).length > 0
    entries.push({
      entryId: operation.operationId,
      fields: values.submissionValues,
      kind: 'insert',
    })
    operations.push({
      kind: 'insert',
      operationId: operation.operationId,
      sourceRowId: operation.sourceRowId,
    })
  }

  for (const [rowId, draft] of Object.entries(state.draftsByRowId)) {
    const values = buildRowMutationValueProjection(draft, schemaColumns)
    const fieldNames = Object.keys(values.submissionValues).sort()
    hasInvalidDraft ||= Object.keys(values.errors).length > 0
    if (fieldNames.length === 0) {
      continue
    }

    entries.push({
      entryId: `update:${rowId}`,
      fields: values.submissionValues,
      kind: 'update',
      rowId,
    })
    operations.push({
      fieldNames,
      kind: 'update',
      operationId: `update:${rowId}`,
      rowId,
    })
    stagedFieldsByRowId[rowId] = new Set(fieldNames)
    stagedValuesByRowId[rowId] = values.displayValues
  }

  for (const operation of state.deletionOperations) {
    operations.push({
      kind: 'delete',
      operationId: operation.operationId,
      rowIds: operation.rowIds,
    })
    for (const rowId of operation.rowIds) {
      entries.push({ entryId: `delete:${rowId}`, kind: 'delete', rowId })
    }
  }

  return {
    ledger: { entries, hasInvalidDraft },
    reviewOperations: operations,
    stagedFieldsByRowId,
    stagedValuesByRowId,
  }
}
