import type { ColumnDescriptor } from 'jazz-tools'

import {
  buildRowMutationSubmission,
  isRowMutationDraftDirty,
  type RowMutationDraft,
} from '@tables/rowEditor/mutation/draft'
import type { TableRowId } from '@tables/tableTypes'

export type TableMutationFields = Readonly<Record<string, unknown>>

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

export interface TableMutationState {
  deletedRowIds: readonly TableRowId[]
  draftsByRowId: Readonly<Record<TableRowId, RowMutationDraft>>
}

export interface TableMutationLedger {
  entries: readonly TableMutationEntry[]
  hasInvalidDraft: boolean
}

export type TableMutationStateAction =
  | {
      draft: RowMutationDraft
      rowId: TableRowId
      schemaColumns: readonly ColumnDescriptor[]
      type: 'setDraft'
    }
  | { rowIds: readonly TableRowId[]; type: 'deleteRows' }
  | { rowIds: readonly TableRowId[]; type: 'restoreRows' }
  | { entryId: TableMutationEntry['entryId']; type: 'removeEntry' }
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
  return { deletedRowIds: [], draftsByRowId: {} }
}

export function reduceTableMutationState(
  state: TableMutationState,
  action: TableMutationStateAction,
): TableMutationState {
  switch (action.type) {
    case 'setDraft': {
      const draftsByRowId = { ...state.draftsByRowId }
      if (isRowMutationDraftDirty(action.draft, action.schemaColumns) === true) {
        // Raw drafts are canonical so invalid text survives closing either editor surface.
        draftsByRowId[action.rowId] = action.draft
      } else {
        delete draftsByRowId[action.rowId]
      }
      return { ...state, draftsByRowId }
    }
    case 'deleteRows': {
      const deletedRowIds = new Set(state.deletedRowIds)
      const draftsByRowId = { ...state.draftsByRowId }
      for (const rowId of action.rowIds) {
        deletedRowIds.add(rowId)
        delete draftsByRowId[rowId]
      }
      return { deletedRowIds: [...deletedRowIds], draftsByRowId }
    }
    case 'restoreRows': {
      const restored = new Set(action.rowIds)
      return {
        ...state,
        deletedRowIds: state.deletedRowIds.filter((rowId) => restored.has(rowId) === false),
      }
    }
    case 'removeEntry': {
      const [kind, rowId] = action.entryId.split(':', 2)
      if (kind === 'delete') {
        return reduceTableMutationState(state, { type: 'restoreRows', rowIds: [rowId] })
      }
      const draftsByRowId = { ...state.draftsByRowId }
      delete draftsByRowId[rowId]
      return { ...state, draftsByRowId }
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
  for (const rowId of state.deletedRowIds) {
    entries.push({ entryId: `delete:${rowId}`, kind: 'delete', rowId })
  }

  return { entries, hasInvalidDraft }
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
