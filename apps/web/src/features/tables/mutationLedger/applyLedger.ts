import type { TableMutationFields, TableMutationLedger } from '@tables/mutationLedger/ledger'

export interface TableMutationExecutor {
  deleteRow: (rowId: string) => Promise<void>
  updateRow: (rowId: string, fields: TableMutationFields) => Promise<void>
}

export async function applyTableMutationLedger(
  ledger: TableMutationLedger,
  executor: TableMutationExecutor,
): Promise<void> {
  // Keep persistence ordering explicit; this is a client sequence, not a database transaction.
  for (const entry of ledger.entries) {
    if (entry.kind === 'update') {
      await executor.updateRow(entry.rowId, entry.fields)
    }
  }
  for (const entry of ledger.entries) {
    if (entry.kind === 'delete') {
      await executor.deleteRow(entry.rowId)
    }
  }
}
