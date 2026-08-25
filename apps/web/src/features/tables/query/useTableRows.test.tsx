import { renderHook, waitFor } from '@testing-library/react'
import type { DynamicTableRow } from 'jazz-tools'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableRows } from '@tables/query/useTableRows'

const { useJazzQueryStateMock } = vi.hoisted(() => ({
  useJazzQueryStateMock: vi.fn(),
}))

let queryRows: DynamicTableRow[] | undefined
let queryError: unknown
let currentSchemaHash = 'schema-1'
let filters: unknown[] = []
let page = 1
let pageSize: 100 | 500 | 1000 = 100
let sortColumn = 'id'
let sortDirection: 'asc' | 'desc' = 'asc'
let runtimeClient: { manager: Record<string, never> } | null
let runtimeSchema: Record<string, unknown> | null
const setPage = vi.fn()
const setPageSize = vi.fn()

vi.mock('@tables/schema/tableSchema', () => ({ getTableColumns: () => [] }))

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
    where() {
      return this
    }
  },
}))

vi.mock('@tables/query/useJazzQueryState', () => ({
  useJazzQueryState: useJazzQueryStateMock,
}))

function useTestTableRows(options: Omit<Parameters<typeof useTableRows>[0], 'search'>) {
  return useTableRows({
    ...options,
    search: {
      filters: filters as never,
      page,
      pageSize,
      setPage,
      setPageSize,
      sortColumn,
      sortDirection,
    },
  })
}

beforeEach(() => {
  queryRows = undefined
  queryError = null
  currentSchemaHash = 'schema-1'
  filters = []
  page = 1
  pageSize = 100
  setPage.mockReset()
  setPageSize.mockReset()
  sortColumn = 'id'
  sortDirection = 'asc'
  runtimeClient = { manager: {} }
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

describe('useTableRows', () => {
  it('keeps row loading active until the runtime can execute the query', () => {
    runtimeClient = null
    runtimeSchema = null

    const { result } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.rows).toEqual([])
  })

  it('keeps the capped row array stable across unrelated renders', () => {
    queryRows = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
      { id: 'row-3', name: 'Linus' } as DynamicTableRow,
    ]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const initialRows = result.current.rows

    rerender()

    expect(result.current.rows).toBe(initialRows)
  })

  it('keeps resolved rows visible while a new sort subscription resolves', () => {
    queryRows = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
    ]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
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
    expect(result.current.page).toBe(1)
  })

  it('does not preserve resolved rows when the Jazz manager is replaced', () => {
    queryRows = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
    ]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    runtimeClient = { manager: {} }
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
        currentSchemaHash = 'schema-2'
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
        currentSchemaHash,
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
        currentSchemaHash,
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
        currentSchemaHash: 'schema-1',
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
        currentSchemaHash: 'schema-1',
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
        currentSchemaHash: 'schema-1',
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
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    expect(result.current.rows).toHaveLength(100)
    expect(result.current.hasNextPage).toBe(true)
    expect(result.current.hasPreviousPage).toBe(false)
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(100)
  })

  it('reuses a fulfilled broad query for covered smaller pages', () => {
    pageSize = 500
    queryRows = Array.from({ length: 501 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const broadQuery = useJazzQueryStateMock.mock.lastCall?.[1]

    pageSize = 100
    page = 2
    rerender()

    expect(result.current.rows[0]?.id).toBe('row-101')
    expect(result.current.rows.at(-1)?.id).toBe('row-200')
    expect(result.current.isInitialLoading).toBe(false)
    expect(useJazzQueryStateMock.mock.lastCall?.[1]).toBe(broadQuery)

    page = 5
    rerender()

    expect(result.current.rows[0]?.id).toBe('row-401')
    expect(result.current.rows.at(-1)?.id).toBe('row-500')
    expect(result.current.hasNextPage).toBe(true)
    expect(useJazzQueryStateMock.mock.lastCall?.[1]).toBe(broadQuery)
  })

  it('starts a bounded query for the first page outside a loaded window', () => {
    pageSize = 500
    queryRows = Array.from({ length: 501 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const broadQuery = useJazzQueryStateMock.mock.lastCall?.[1]

    pageSize = 100
    page = 6
    queryRows = undefined
    rerender()

    const uncoveredQuery = useJazzQueryStateMock.mock.lastCall?.[1] as {
      limitValue: number
      offsetValue: number
    }
    expect(uncoveredQuery).not.toBe(broadQuery)
    expect(uncoveredQuery.limitValue).toBe(101)
    expect(uncoveredQuery.offsetValue).toBe(500)
    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
  })

  it('reuses a loaded final window when a larger page cannot contain more rows', () => {
    pageSize = 100
    queryRows = Array.from({ length: 75 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const finalQuery = useJazzQueryStateMock.mock.lastCall?.[1]

    pageSize = 500
    rerender()

    expect(result.current.rows).toHaveLength(75)
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.isInitialLoading).toBe(false)
    expect(useJazzQueryStateMock.mock.lastCall?.[1]).toBe(finalQuery)
  })

  it('stops reusing a final window when a live update fills its pagination probe', () => {
    pageSize = 100
    queryRows = Array.from({ length: 75 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const initialQuery = useJazzQueryStateMock.mock.lastCall?.[1]
    const expandedRows = Array.from({ length: 101 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    useJazzQueryStateMock.mockImplementation((_manager, currentQuery) =>
      currentQuery === initialQuery
        ? { status: 'fulfilled', data: expandedRows, error: null }
        : { status: 'pending', data: undefined, error: null },
    )

    pageSize = 500
    rerender()

    expect(useJazzQueryStateMock.mock.lastCall?.[1]).not.toBe(initialQuery)
    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
  })

  it('does not reset a newly uncovered page while its bounded query starts', () => {
    pageSize = 100
    queryRows = Array.from({ length: 75 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const initialQuery = useJazzQueryStateMock.mock.lastCall?.[1]
    const expandedRows = Array.from({ length: 101 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    useJazzQueryStateMock.mockImplementation((_manager, currentQuery) =>
      currentQuery === initialQuery
        ? { status: 'fulfilled', data: expandedRows, error: null }
        : { status: 'pending', data: undefined, error: null },
    )

    page = 2
    rerender()

    expect(useJazzQueryStateMock.mock.lastCall?.[1]).not.toBe(initialQuery)
    expect(result.current.rows).toEqual([])
    expect(result.current.isInitialLoading).toBe(true)
    expect(setPage).not.toHaveBeenCalled()
  })

  it('does not reuse a loaded window when a larger page needs rows beyond it', () => {
    pageSize = 100
    queryRows = Array.from({ length: 101 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[]
    const { result, rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    const initialQuery = useJazzQueryStateMock.mock.lastCall?.[1]

    pageSize = 500
    queryRows = undefined
    rerender()

    const largerQuery = useJazzQueryStateMock.mock.lastCall?.[1] as {
      limitValue: number
      offsetValue: number
    }
    expect(largerQuery).not.toBe(initialQuery)
    expect(largerQuery.limitValue).toBe(501)
    expect(largerQuery.offsetValue).toBe(0)
    expect(result.current.isInitialLoading).toBe(true)
  })

  it('navigates between pages and resets the page when page size changes', async () => {
    page = 2
    queryRows = [{ id: 'row-101' } as DynamicTableRow]
    const { result } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    await result.current.goToPreviousPage()
    await result.current.setPageSize(500)

    expect(setPage).toHaveBeenCalledWith(1)
    expect(setPageSize).toHaveBeenCalledWith(500)
    expect(result.current.hasPreviousPage).toBe(true)
    expect(result.current.hasNextPage).toBe(false)
  })

  it('returns an empty out-of-range page to the first page', async () => {
    page = 2
    queryRows = []

    renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )

    await waitFor(() => {
      expect(setPage).toHaveBeenCalledWith(1)
    })
  })

  it('returns to the first page whenever the same out-of-range page is revisited', async () => {
    page = 2
    queryRows = []
    const { rerender } = renderHook(() =>
      useTestTableRows({
        client: runtimeClient as never,
        currentSchemaHash: 'schema-1',
        tableName: 'users',
        wasmSchema: runtimeSchema as never,
      }),
    )
    await waitFor(() => {
      expect(setPage).toHaveBeenCalledWith(1)
    })

    page = 1
    queryRows = undefined
    rerender()
    setPage.mockClear()

    page = 2
    queryRows = []
    rerender()

    await waitFor(() => {
      expect(setPage).toHaveBeenCalledWith(1)
    })
  })
})
