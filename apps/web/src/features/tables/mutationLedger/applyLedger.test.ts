import { describe, expect, it, vi } from 'vitest'

import { applyTableMutationLedger } from '@tables/mutationLedger/applyLedger'
import type { TableMutationLedger } from '@tables/mutationLedger/ledger'

const ledger = {
  hasInvalidDraft: false,
  entries: [
    { entryId: 'update:row-1', fields: { name: 'Grace' }, kind: 'update', rowId: 'row-1' },
    { entryId: 'delete:row-2', kind: 'delete', rowId: 'row-2' },
  ],
} satisfies TableMutationLedger

describe('applyTableMutationLedger', () => {
  it('applies updates before deletions', async () => {
    const calls: string[] = []

    await applyTableMutationLedger(ledger, {
      updateRow: async () => {
        calls.push('update')
      },
      deleteRow: async () => {
        calls.push('delete')
      },
    })

    expect(calls).toEqual(['update', 'delete'])
  })

  it('rejects on the first failed operation', async () => {
    const deleteRow = vi.fn()

    await expect(
      applyTableMutationLedger(ledger, {
        updateRow: async () => {
          throw new Error('Update rejected')
        },
        deleteRow,
      }),
    ).rejects.toThrow('Update rejected')
    expect(deleteRow).not.toHaveBeenCalled()
  })
})
