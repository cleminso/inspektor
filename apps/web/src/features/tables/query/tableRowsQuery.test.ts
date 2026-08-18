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
    columns: [
      {
        name: 'name',
        column_type: { type: 'Text' },
        nullable: false,
      },
      {
        name: 'nickname',
        column_type: { type: 'Text' },
        nullable: true,
      },
    ],
  },
} satisfies WasmSchema

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

  it('ignores filters that cannot target the selected runtime table', () => {
    const query = buildTableRowsQuery({
      filters: [
        { id: 'missing', column: 'missing', operator: 'eq', value: 'Ada' },
        { id: 'invalid', column: 'name', operator: 'gte', value: 'Ada' },
        { id: 'invalid-in', column: 'name', operator: 'in', value: 'Ada' },
        { id: 'invalid-null', column: 'nickname', operator: 'isNull', value: 'true' },
        { id: 'row-id', column: 'id', operator: 'eq', value: 'user-1' },
        { id: 'valid', column: 'name', operator: 'contains', value: 'Ada' },
      ],
      page: 1,
      pageSize: 100,
      schema,
      sortColumn: 'id',
      sortDirection: 'asc',
      tableName: 'users',
    })

    expect(JSON.parse(query._build()).conditions).toEqual([
      { column: 'id', op: 'eq', value: 'user-1' },
      { column: 'name', op: 'contains', value: 'Ada' },
    ])
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
