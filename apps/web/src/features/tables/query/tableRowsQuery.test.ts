import type { WasmSchema } from 'jazz-tools'
import { describe, expect, it } from 'vitest'

import {
  buildInitialTableRowsQuery,
  buildTableRowsQuery,
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZE_OPTIONS,
  TABLE_ROWS_QUERY_OPTIONS,
} from '@tables/query/tableRowsQuery'

const schema = {
  users: {
    columns: [],
  },
} as unknown as WasmSchema

describe('tableRowsQuery', () => {
  it('builds the exact base query shared by table intent and the destination grid', () => {
    const query = buildInitialTableRowsQuery({ schema, tableName: 'users' })

    expect(JSON.parse(query._build())).toEqual({
      table: 'users',
      conditions: [],
      includes: {},
      orderBy: [['id', 'asc']],
      limit: 101,
      offset: 0,
      hops: [],
    })
    expect(TABLE_ROWS_QUERY_OPTIONS).toEqual({
      propagation: 'full',
      visibility: 'hidden_from_live_query_list',
    })
    expect(DEFAULT_TABLE_PAGE_SIZE).toBe(100)
    expect(TABLE_PAGE_SIZE_OPTIONS).toEqual([100, 500, 1000])
  })

  it('includes destination filters, sorting, page offset, and the sentinel row in query identity', () => {
    const query = buildTableRowsQuery({
      filters: [
        {
          id: 'filter-1',
          column: 'name',
          operator: 'contains',
          value: 'Ada',
        },
      ],
      page: 3,
      pageSize: 500,
      schema,
      sortColumn: 'name',
      sortDirection: 'desc',
      tableName: 'users',
    })

    expect(JSON.parse(query._build())).toMatchObject({
      conditions: [{ column: 'name', op: 'contains', value: 'Ada' }],
      orderBy: [
        ['name', 'desc'],
        ['id', 'asc'],
      ],
      limit: 501,
      offset: 1000,
    })
  })

  it('prefetches the exact stored destination page', () => {
    const query = buildInitialTableRowsQuery({
      page: 2,
      pageSize: 1000,
      schema,
      tableName: 'users',
    })

    expect(JSON.parse(query._build())).toMatchObject({
      limit: 1001,
      offset: 1000,
    })
  })
})
