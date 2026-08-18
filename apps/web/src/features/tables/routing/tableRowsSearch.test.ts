import { describe, expect, it } from 'vitest'

import { resolveTableRowsSearch } from '@tables/routing/tableRowsSearch'

describe('resolveTableRowsSearch', () => {
  it('resolves stored tab filters and descending sorting like the destination route', () => {
    const filters = [
      {
        id: 'filter-1',
        column: 'name',
        operator: 'contains',
        value: 'Ada',
      },
    ]

    expect(
      resolveTableRowsSearch({
        dir: 'desc',
        filters: JSON.stringify(filters),
        page: 3,
        pageSize: 500,
        sort: 'name',
      }),
    ).toEqual({ filters, page: 3, pageSize: 500, sortColumn: 'name', sortDirection: 'desc' })
  })

  it('uses destination defaults for missing or malformed stored search state', () => {
    expect(resolveTableRowsSearch({ dir: 'sideways', filters: '{invalid' })).toEqual({
      filters: [],
      page: 1,
      pageSize: 100,
      sortColumn: 'id',
      sortDirection: 'asc',
    })
  })

  it('discards malformed clauses without removing repeated predicates', () => {
    const filters = [
      { id: 'range', column: 'age', operator: 'gte', value: 18 },
      { id: 'unknown', column: 'age', operator: 'matches', value: 30 },
      { id: 'missing', column: 'age', operator: 'lte' },
      { id: 'range', column: 'age', operator: 'lte', value: 65 },
    ]

    expect(resolveTableRowsSearch({ filters: JSON.stringify(filters) }).filters).toEqual([
      { id: 'range', column: 'age', operator: 'gte', value: 18 },
      { id: 'range', column: 'age', operator: 'lte', value: 65 },
    ])
  })
})
