import { renderHook, waitFor } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { RowChangeKind, type SubscriptionDelta } from 'jazz-tools/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableRows } from '@tables/query/useTableRows'
import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import type { DynamicTableRow } from '@tables/tableTypes'

const { useJazzQueryStateMock } = vi.hoisted(() => ({
  useJazzQueryStateMock: vi.fn(),
}))

let queryRows: DynamicTableRow[] | undefined
let queryError: unknown
let scopeKey = 'schema-1'
let filters: unknown[] = []
let page = 1
let pageSize: 100 | 500 | 1000 = 100
let sortColumn = 'id'
let sortDirection: 'asc' | 'desc' = 'asc'
let schemaColumns: ColumnDescriptor[] = []
let runtimeClient: JazzClient | null

function createRuntimeClient(): JazzClient {
  return {} as JazzClient
}
let runtimeSchema: Record<string, unknown> | null
const setPage = vi.fn()

vi.mock('@tables/query/genericQueryBuilder', () => ({
  GenericQueryBuilder: class GenericQueryBuilder {
    limitValue: number | undefined
    offsetValue: number | undefined

    limit(value: number) {
      this.limitValue = value
      return this
    }
    offset(value: number) {
      this.offsetValue = value
      return this
    }
    orderBy() {
      return this
    }
    select() {
      return this
    }
    where() {
      return this
    }
  },
}))

vi.mock('@tables/query/useJazzQueryState', () => ({
  useJazzQueryState: useJazzQueryStateMock,
}))

function useTestTableRows(
  options: Omit<
    Parameters<typeof useTableRows>[0],
    'onPageOutOfRange' | 'schemaColumns' | 'search'
  >,
) {
  return useTableRows({
    ...options,
    onPageOutOfRange: async () => setPage(1),
    schemaColumns,
    search: {
      filters: filters as never,
      page,
      pageSize,
      sortColumn,
      sortDirection,
    },
  })
}

beforeEach(() => {
  queryRows = undefined
  queryError = null
  scopeKey = 'schema-1'
  filters = []
  page = 1
  pageSize = 100
  setPage.mockReset()
  sortColumn = 'id'
  sortDirection = 'asc'
  schemaColumns = []
  runtimeClient = createRuntimeClient()
  runtimeSchema = {
    accounts: { columns: [] },
    users: {
      columns: [
        {
          name: 'name',
          column_type: { type: 'Text' },
          nullable: false,
        },
      ],
    },
  }
  useJazzQueryStateMock.mockReset()
  useJazzQueryStateMock.mockImplementation(() =>
    queryError === null
      ? queryRows === undefined
        ? { status: 'pending', data: undefined, error: null }
        : { status: 'fulfilled', data: queryRows, error: null }
      : { status: 'rejected', data: undefined, error: queryError },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTableRows', () => {
  it('projects schema and provenance columns into table columns', () => {
    schemaColumns = [{ name: 'name', column_type: { type: 'Text' }, nullable: false }]

    const { result } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.columns.map((column) => column.id)).toEqual([
      'id',
      'name',
      '$createdAt',
      '$createdBy',
      '$updatedAt',
      '$updatedBy',
    ])
    expect(result.current.columns.slice(-4)).toEqual([
      expect.objectContaining({
        id: '$createdAt',
        column: expect.objectContaining({ column_type: { type: 'Timestamp' } }),
        isReadOnly: true,
        isSortable: true,
      }),
      expect.objectContaining({
        id: '$createdBy',
        column: expect.objectContaining({ column_type: expect.objectContaining({ type: 'Row' }) }),
        isHiddenByDefault: true,
        isReadOnly: true,
        isSortable: false,
      }),
      expect.objectContaining({
        id: '$updatedAt',
        column: expect.objectContaining({ column_type: { type: 'Timestamp' } }),
        isReadOnly: true,
        isSortable: true,
      }),
      expect.objectContaining({
        id: '$updatedBy',
        column: expect.objectContaining({ column_type: expect.objectContaining({ type: 'Row' }) }),
        isHiddenByDefault: true,
        isReadOnly: true,
        isSortable: false,
      }),
    ])
    expect(useJazzQueryStateMock.mock.lastCall?.[2]).toBe(INSPEKTOR_QUERY_OPTIONS)
  })

  it('keeps row loading active until the runtime can execute the query', () => {
    runtimeClient = null
    runtimeSchema = null

    const { result } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.rows).toEqual([])
  })

  it('keeps resolved rows visible while a new sort subscription resolves', () => {
    queryRows = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
    ]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.rows.map((row) => row.id)).toEqual(['row-1', 'row-2'])

    sortColumn = 'name'
    sortDirection = 'desc'
    queryRows = undefined
    rerender()

    expect(result.current.rows.map((row) => row.id)).toEqual(['row-1', 'row-2'])
    expect(result.current.isRefreshing).toBe(true)
    expect(result.current.isInitialLoading).toBe(false)
  })

  it('drops resolved rows when Jazz resets the active query', () => {
    queryRows = [{ id: 'row-1', name: 'Ada' } as DynamicTableRow]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    queryRows = undefined
    rerender()

    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('does not preserve resolved rows when the Jazz client is replaced', () => {
    queryRows = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
    ]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    runtimeClient = createRuntimeClient()
    queryRows = undefined
    rerender()

    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
  })

  it.each([
    {
      name: 'schema',
      replaceScope: () => {
        scopeKey = 'schema-2'
      },
    },
    {
      name: 'filters',
      replaceScope: () => {
        filters = [{ id: 'name', column: 'name', operator: 'eq', value: 'Grace' }]
      },
    },
  ])('does not preserve resolved rows when the $name scope changes', ({ replaceScope }) => {
    queryRows = [{ id: 'row-1', name: 'Ada' } as DynamicTableRow]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey,
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    replaceScope()
    queryRows = undefined
    rerender()

    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('does not preserve resolved rows when the table scope changes', () => {
    let tableName = 'users'
    queryRows = [{ id: 'row-1', name: 'Ada' } as DynamicTableRow]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey,
        tableName,
        wasmSchema: runtimeSchema as never,
      }),
    )

    tableName = 'accounts'
    queryRows = undefined
    rerender()

    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('does not preserve rows from a render that never commits', () => {
    const neverResolves = new Promise<never>(() => undefined)
    let suspend = false
    queryRows = undefined
    const { result, rerender } = renderHook(() => {
      const tableRows = useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      })
      if (suspend === true) throw neverResolves
      return tableRows
    })

    queryRows = [{ id: 'uncommitted-row' } as DynamicTableRow]
    suspend = true
    rerender()

    queryRows = undefined
    suspend = false
    sortColumn = 'name'
    rerender()

    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
  })

  it('exposes a failed fresh query without leaving the grid in its loading state', () => {
    queryError = new Error('Unable to load rows')

    const { result } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.error).toBe('Unable to load rows')
    expect(result.current.isInitialLoading).toBe(false)
    expect(result.current.rows).toEqual([])
  })

  it('does not preserve resolved rows when a sort refresh fails', () => {
    queryRows = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
    ]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    sortColumn = 'name'
    sortDirection = 'desc'
    queryRows = undefined
    queryError = new Error('Unable to sort rows')
    rerender()

    expect(result.current.error).toBe('Unable to sort rows')
    expect(result.current.rows).toEqual([])
    expect(result.current.isRefreshing).toBe(false)
  })

  it('caps a page at its selected size and exposes next-page availability', () => {
    pageSize = 100
    queryRows = Array.from({ length: 101 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]

    const { result } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.rows).toHaveLength(100)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('preserves the fulfilled page projection across unrelated renders', () => {
    queryRows = [{ id: 'row-1' } as DynamicTableRow]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const rows = result.current.rows

    rerender()

    expect(result.current.rows).toBe(rows)
  })

  it('reports added and updated rows from live query deltas', () => {
    const now = new Date('2026-09-11T12:00:00.000Z')
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())
    const onRowsAdded = vi.fn()
    const onRowsUpdated = vi.fn()
    const previousRow = { id: 'row-1', name: 'Ada' } as DynamicTableRow
    queryRows = [previousRow]
    renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        onRowsAdded,
        onRowsUpdated,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const onDelta = useJazzQueryStateMock.mock.lastCall?.[3] as (
      delta: SubscriptionDelta<DynamicTableRow>,
    ) => void
    const addedRow = {
      id: 'row-3',
      name: 'Lin',
      $createdAt: new Date(now.getTime() + 1),
    } as DynamicTableRow
    const updatedRow = { id: 'row-1', name: 'Ada Lovelace' } as DynamicTableRow

    onDelta({
      all: [updatedRow, addedRow],
      delta: [
        { id: addedRow.id, index: 0, item: addedRow, kind: RowChangeKind.Added },
        {
          id: 'row-1',
          index: 1,
          item: updatedRow,
          kind: RowChangeKind.Updated,
        },
        { id: 'row-2', index: 2, kind: RowChangeKind.Removed },
      ],
    })

    expect(onRowsAdded).toHaveBeenCalledOnce()
    expect(onRowsAdded).toHaveBeenCalledWith(['row-3'])
    expect(onRowsUpdated).toHaveBeenCalledOnce()
    expect(onRowsUpdated).toHaveBeenCalledWith([{ current: updatedRow, previous: previousRow }])
  })

  it('does not report existing rows added by initial remote hydration', () => {
    const now = new Date('2026-09-11T12:00:00.000Z')
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())
    const onRowsAdded = vi.fn()
    renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        onRowsAdded,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const onDelta = useJazzQueryStateMock.mock.lastCall?.[3] as (
      delta: SubscriptionDelta<DynamicTableRow>,
    ) => void
    const existingRow = {
      id: 'row-1',
      name: 'Ada',
      $createdAt: new Date(now.getTime() - 1),
    } as DynamicTableRow

    onDelta({
      all: [existingRow],
      delta: [{ id: existingRow.id, index: 0, item: existingRow, kind: RowChangeKind.Added }],
    })

    expect(onRowsAdded).not.toHaveBeenCalled()
  })

  it('reports each post-open insert once and fails closed without valid provenance', () => {
    const now = new Date('2026-09-11T12:00:00.000Z')
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())
    const onRowsAdded = vi.fn()
    renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        onRowsAdded,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const onDelta = useJazzQueryStateMock.mock.lastCall?.[3] as (
      delta: SubscriptionDelta<DynamicTableRow>,
    ) => void
    const insertedRow = {
      id: 'inserted',
      $createdAt: new Date(now.getTime() + 1),
    } as DynamicTableRow
    const equalBoundaryRow = {
      id: 'equal-boundary',
      $createdAt: new Date(now),
    } as DynamicTableRow
    const invalidDateRow = {
      id: 'invalid-date',
      $createdAt: new Date(Number.NaN),
    } as DynamicTableRow
    const missingDateRow = { id: 'missing-date' } as DynamicTableRow
    const changes = [insertedRow, equalBoundaryRow, invalidDateRow, missingDateRow].map(
      (row, index) => ({ id: row.id, index, item: row, kind: RowChangeKind.Added }) as const,
    )

    onDelta({ all: [insertedRow, equalBoundaryRow, invalidDateRow, missingDateRow], delta: changes })
    onDelta({ all: [insertedRow], delta: [changes[0]!] })

    expect(onRowsAdded).toHaveBeenCalledOnce()
    expect(onRowsAdded).toHaveBeenCalledWith(['inserted'])
  })

  it('establishes a fresh insert boundary when the table view remounts', () => {
    let now = new Date('2026-09-11T12:00:00.000Z').getTime()
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const firstView = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    firstView.unmount()

    const createdBeforeReopen = new Date(now + 1)
    now += 2
    const onRowsAdded = vi.fn()
    renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        onRowsAdded,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const onDelta = useJazzQueryStateMock.mock.lastCall?.[3] as (
      delta: SubscriptionDelta<DynamicTableRow>,
    ) => void
    const existingRow = {
      id: 'row-1',
      $createdAt: createdBeforeReopen,
    } as DynamicTableRow

    onDelta({
      all: [existingRow],
      delta: [{ id: existingRow.id, index: 0, item: existingRow, kind: RowChangeKind.Added }],
    })

    expect(onRowsAdded).not.toHaveBeenCalled()
  })

  it('subscribes with the requested page query when pagination changes', () => {
    pageSize = 500
    queryRows = Array.from({ length: 501 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]

    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    page = 2
    pageSize = 100
    queryRows = undefined
    rerender()

    const requestedQuery = useJazzQueryStateMock.mock.lastCall?.[1] as {
      limitValue: number
      offsetValue: number
    }
    expect(requestedQuery.limitValue).toBe(101)
    expect(requestedQuery.offsetValue).toBe(100)
    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
  })

  it('returns to the first page whenever the same out-of-range page is revisited', async () => {
    page = 2
    queryRows = []
    const { rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        scopeKey: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    await waitFor(() => {
      expect(setPage).toHaveBeenCalledOnce()
    })

    page = 1
    queryRows = undefined
    rerender()
    setPage.mockClear()

    page = 2
    queryRows = []
    rerender()

    await waitFor(() => {
      expect(setPage).toHaveBeenCalledOnce()
    })
  })
})
