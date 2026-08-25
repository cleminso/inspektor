import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTableMutations } from './useTableMutation'

const { deleteRow, deleteWait, insert, tableProxy, update, updateWait, wait } = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  deleteWait: vi.fn().mockResolvedValue(undefined),
  insert: vi.fn(),
  tableProxy: { name: 'users' },
  update: vi.fn(),
  updateWait: vi.fn().mockResolvedValue(undefined),
  wait: vi.fn().mockResolvedValue({ id: 'row-1' }),
}))
const runtimeClient = { db: { delete: deleteRow, insert, update } }
const runtimeSchema = { tables: {} }

insert.mockReturnValue({ wait })
update.mockReturnValue({ wait: updateWait })
deleteRow.mockReturnValue({ wait: deleteWait })

vi.mock('@tables/rowEditor/mutation/tableProxy', () => ({
  createTableProxy: () => tableProxy,
}))

describe('useTableMutations', () => {
  it('uses the runtime client directly without a Jazz React provider', async () => {
    const { result } = renderHook(() =>
      useTableMutations({
        client: runtimeClient as never,
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    let insertedRowId: string | undefined
    await act(async () => {
      insertedRowId = await result.current.insertRow({ name: 'Ada', omitted: undefined })
    })

    expect(insert).toHaveBeenCalledWith(tableProxy, { name: 'Ada' })
    expect(wait).toHaveBeenCalledWith({ tier: 'edge' })
    expect(insertedRowId).toBe('row-1')
  })

  it('waits for edge acknowledgement when updating and deleting', async () => {
    const { result } = renderHook(() =>
      useTableMutations({
        client: runtimeClient as never,
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    await act(async () => {
      await result.current.updateRow('row-1', { name: 'Grace', omitted: undefined })
      await result.current.deleteRow('row-2')
    })

    expect(update).toHaveBeenCalledWith(tableProxy, 'row-1', { name: 'Grace' })
    expect(updateWait).toHaveBeenCalledWith({ tier: 'edge' })
    expect(deleteRow).toHaveBeenCalledWith(tableProxy, 'row-2')
    expect(deleteWait).toHaveBeenCalledWith({ tier: 'edge' })
  })
})
