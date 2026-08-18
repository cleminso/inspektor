import type { JazzClient } from 'jazz-tools/react'
import type { DynamicTableRow, QueryBuilder, QueryOptions, WasmSchema } from 'jazz-tools'
import { describe, expect, it, vi } from 'vitest'

import { startTableRowsPrefetch } from '@tables/query/tableRowsPrefetch'
import { TABLE_ROWS_QUERY_OPTIONS } from '@tables/query/tableRowsQuery'

const schema = {
  users: {
    columns: [
      {
        name: 'name',
        column_type: { type: 'Text' },
        nullable: false,
      },
    ],
  },
} satisfies WasmSchema

describe('startTableRowsPrefetch', () => {
  it('owns the exact orchestrator entry consumed by the destination grid', () => {
    const release = vi.fn()
    const subscribe = vi.fn(() => release)
    const getCacheEntry = vi.fn(() => ({ subscribe }))
    const makeQueryKey = vi.fn(
      (_query: QueryBuilder<DynamicTableRow>, _options?: QueryOptions) => 'users-query',
    )
    const client = {
      manager: {
        getCacheEntry,
        makeQueryKey,
      },
    } as unknown as Pick<JazzClient, 'manager'>

    const stopPrefetch = startTableRowsPrefetch({ client, schema, tableName: 'users' })

    const query = makeQueryKey.mock.calls[0]?.[0]
    expect(JSON.parse(query?._build() ?? 'null')).toMatchObject({
      table: 'users',
      orderBy: [['id', 'asc']],
      limit: 101,
      offset: 0,
    })
    expect(makeQueryKey).toHaveBeenCalledWith(query, TABLE_ROWS_QUERY_OPTIONS)
    expect(getCacheEntry).toHaveBeenCalledWith('users-query')
    expect(subscribe).toHaveBeenCalledOnce()

    stopPrefetch()

    expect(release).toHaveBeenCalledOnce()
  })

  it('acquires the exact filtered and sorted initial query stored by a table tab', () => {
    const subscribe = vi.fn(() => vi.fn())
    const makeQueryKey = vi.fn(
      (_query: QueryBuilder<DynamicTableRow>, _options?: QueryOptions) => 'filtered-users-query',
    )
    const client = {
      manager: {
        getCacheEntry: vi.fn(() => ({ subscribe })),
        makeQueryKey,
      },
    } as unknown as Pick<JazzClient, 'manager'>

    startTableRowsPrefetch({
      client,
      filters: [
        {
          id: 'filter-1',
          column: 'name',
          operator: 'contains',
          value: 'Ada',
        },
      ],
      page: 2,
      pageSize: 500,
      schema,
      sortColumn: 'name',
      sortDirection: 'desc',
      tableName: 'users',
    })

    const query = makeQueryKey.mock.calls[0]?.[0]
    expect(JSON.parse(query?._build() ?? 'null')).toMatchObject({
      conditions: [{ column: 'name', op: 'contains', value: 'Ada' }],
      orderBy: [
        ['name', 'desc'],
        ['id', 'asc'],
      ],
      limit: 501,
      offset: 500,
    })
  })
})
