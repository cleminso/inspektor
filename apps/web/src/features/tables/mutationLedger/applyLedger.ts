import type {
  TableMutationEntry,
  TableMutationFields,
  TableMutationLedger,
} from '@tables/mutationLedger/ledger'

export interface TableMutationExecutor {
  deleteRow: (rowId: string) => Promise<void>
  updateRow: (rowId: string, fields: TableMutationFields) => Promise<void>
}

type TableMutationApplyResult =
  | {
      appliedEntryIds: readonly TableMutationEntry['entryId'][]
      status: 'complete'
    }
  | {
      appliedEntryIds: readonly TableMutationEntry['entryId'][]
      error: unknown
      status: 'failed'
    }

export async function applyTableMutationLedger(
  ledger: TableMutationLedger,
  executor: TableMutationExecutor,
): Promise<TableMutationApplyResult> {
  // Keep persistence ordering explicit; this is a client sequence, not a database transaction.
  const entries = [
    ...ledger.entries.filter((entry) => entry.kind === 'update'),
    ...ledger.entries.filter((entry) => entry.kind === 'delete'),
  ]
  const appliedEntryIds: TableMutationEntry['entryId'][] = []

  for (const entry of entries) {
    try {
      if (entry.kind === 'update') {
        await executor.updateRow(entry.rowId, entry.fields)
      } else {
        await executor.deleteRow(entry.rowId)
      }
      appliedEntryIds.push(entry.entryId)
    } catch (error) {
      return { appliedEntryIds, error, status: 'failed' }
    }
  }

  return { appliedEntryIds, status: 'complete' }
}
