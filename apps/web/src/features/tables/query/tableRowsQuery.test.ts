import type { WasmSchema } from 'jazz-tools'
import { describe, expect, it } from 'vitest'

import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { buildTableRowsQuery } from '@tables/query/tableRowsQuery'

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
    const query = buildTableRowsQuery({
      filters: [],
      page: 1,
      pageSize: 100,
      schema,
      sortColumn: 'id',
      sortDirection: 'asc',
      tableName: 'users',
    })

    expect(JSON.parse(query._build())).toEqual({
      table: 'users',
      conditions: [],
      includes: {},
      orderBy: [['id', 'asc']],
      limit: 101,
      offset: 0,
      hops: [],
    })
    expect(INSPEKTOR_QUERY_OPTIONS).toEqual({
      propagation: 'full',
      visibility: 'hidden_from_live_query_list',
    })
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

  it('falls back to row identity for missing sort columns', () => {
    const query = buildTableRowsQuery({
      filters: [],
      page: 1,
      pageSize: 100,
      schema,
      sortColumn: 'missing',
      sortDirection: 'desc',
      tableName: 'users',
    })

    expect(JSON.parse(query._build()).orderBy).toEqual([['id', 'asc']])
  })
})
