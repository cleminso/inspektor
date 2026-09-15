import { describe, expect, it, vi } from 'vitest'

import { applyTableMutationLedger } from '@tables/mutationLedger/applyLedger'
import type { TableMutationLedger } from '@tables/mutationLedger/ledger'

const ledger = {
  hasInvalidDraft: false,
  entries: [
    { entryId: 'update:row-1', fields: { name: 'Grace' }, kind: 'update', rowId: 'row-1' },
    { entryId: 'insert:0', fields: { name: 'Ada copy' }, kind: 'insert' },
    { entryId: 'delete:row-2', kind: 'delete', rowId: 'row-2' },
  ],
} satisfies TableMutationLedger

describe('applyTableMutationLedger', () => {
  it('applies updates, inserts, then deletions', async () => {
    const calls: string[] = []

    const result = await applyTableMutationLedger(ledger, {
      updateRow: async () => {
        calls.push('update')
      },
      insertRow: async () => {
        calls.push('insert')
        return 'row-copy'
      },
      deleteRow: async () => {
        calls.push('delete')
      },
    })

    expect(calls).toEqual(['update', 'insert', 'delete'])
    expect(result).toEqual({
      appliedEntryIds: ['update:row-1', 'insert:0', 'delete:row-2'],
      status: 'complete',
    })
  })

  it('reports applied, failed, and unattempted entries after partial failure', async () => {
    const error = new Error('Delete rejected')
    const deleteRow = vi.fn().mockRejectedValue(error)

    const result = await applyTableMutationLedger(
      {
        ...ledger,
        entries: [...ledger.entries, { entryId: 'delete:row-3', kind: 'delete', rowId: 'row-3' }],
      },
      {
        updateRow: vi.fn().mockResolvedValue(undefined),
        insertRow: vi.fn().mockResolvedValue('row-copy'),
        deleteRow,
      },
    )

    expect(result).toEqual({
      appliedEntryIds: ['update:row-1', 'insert:0'],
      error,
      status: 'failed',
    })
    expect(deleteRow).toHaveBeenCalledOnce()
  })
})
