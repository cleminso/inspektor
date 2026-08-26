import { renderHook } from '@testing-library/react'
import type { DynamicTableRow, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableRowById } from '@tables/query/useTableRowById'
import { INSPECTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'

const { manager, queryError, queryRows, useJazzQueryStateMock } = vi.hoisted(() => ({
  manager: {},
  queryError: { value: null as unknown },
  queryRows: { value: undefined as DynamicTableRow[] | undefined },
  useJazzQueryStateMock: vi.fn((_manager: unknown, _query: unknown, _options: unknown) =>
    queryError.value === null
      ? {
          status: queryRows.value === undefined ? 'pending' : 'fulfilled',
          data: queryRows.value,
          error: null,
        }
      : { status: 'rejected', data: undefined, error: queryError.value },
  ),
}))

let runtimeClient: Pick<JazzClient, 'manager'> | null
const runtimeSchema = {} as WasmSchema

vi.mock('@tables/query/useJazzQueryState', () => ({
  useJazzQueryState: useJazzQueryStateMock,
}))

beforeEach(() => {
  queryRows.value = undefined
  queryError.value = null
  runtimeClient = { manager: manager as JazzClient['manager'] }
  useJazzQueryStateMock.mockClear()
})

describe('useTableRowById', () => {
  function renderRow(rowId: string | null) {
    return renderHook(() =>
      useTableRowById({
        client: runtimeClient,
        rowId,
        tableName: 'users',
        wasmSchema: runtimeSchema,
      }),
    )
  }

  it('loads one row by id outside the visible table query', () => {
    queryRows.value = [{ id: 'row-1', name: 'Ada' } as DynamicTableRow]

    const { result } = renderRow('row-1')
    const query = useJazzQueryStateMock.mock.lastCall?.[1] as { _build: () => string }

    expect(result.current).toEqual({ status: 'fulfilled', row: { id: 'row-1', name: 'Ada' } })
    expect(JSON.parse(query._build())).toMatchObject({
      conditions: [{ column: 'id', op: 'eq', value: 'row-1' }],
      limit: 1,
    })
    expect(useJazzQueryStateMock).toHaveBeenCalledWith(
      manager,
      expect.anything(),
      INSPECTOR_QUERY_OPTIONS,
    )
  })

  it('rejects a result whose identity does not match the requested row', () => {
    queryRows.value = [{ id: 'row-previous', name: 'Previous' } as DynamicTableRow]

    const { result } = renderRow('row-1')

    expect(result.current).toEqual({ status: 'fulfilled', row: null })
  })

  it('disables the row query without an active row id', () => {
    queryRows.value = [{ id: 'row-1' } as DynamicTableRow]

    const { result } = renderRow(null)

    expect(result.current).toEqual({ status: 'idle', row: null })
    expect(useJazzQueryStateMock).toHaveBeenCalledWith(manager, undefined, INSPECTOR_QUERY_OPTIONS)
  })

  it('stays idle without a runtime client provider', () => {
    runtimeClient = null

    const { result } = renderRow('row-1')

    expect(result.current).toEqual({ status: 'pending', row: null })
    expect(useJazzQueryStateMock).toHaveBeenCalledWith(
      null,
      expect.anything(),
      INSPECTOR_QUERY_OPTIONS,
    )
  })

  it('preserves a rejected fallback query as an explicit error state', () => {
    queryError.value = new Error('Unable to load row')

    const { result } = renderRow('row-1')

    expect(result.current).toEqual({ status: 'rejected', error: 'Unable to load row', row: null })
  })
})
