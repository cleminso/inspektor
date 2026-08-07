import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTableMutations } from './useTableMutation'

const { insert, tableProxy, wait } = vi.hoisted(() => ({
  insert: vi.fn(),
  tableProxy: { name: 'users' },
  wait: vi.fn().mockResolvedValue(undefined),
}))
const runtimeClient = { db: { insert } }
const runtimeSchema = { tables: {} }

insert.mockReturnValue({ wait })

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

    await act(() => result.current.insertRow({ name: 'Ada', omitted: undefined }))

    expect(insert).toHaveBeenCalledWith(tableProxy, { name: 'Ada' })
    expect(wait).toHaveBeenCalledWith({ tier: 'edge' })
  })
})
