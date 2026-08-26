import { describe, expect, it } from 'vitest'

import {
  canonicalizeTableRouteSearch,
  resolveTableRowsSearch,
} from '@tables/routing/tableRowsSearch'

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

  it('rejects pages whose offset cannot be represented by the Jazz runtime', () => {
    const largestPage = Math.floor(0xffff_ffff / 100) + 1
    const unsupportedPage = largestPage + 1

    expect(resolveTableRowsSearch({ page: largestPage, pageSize: 100 }).page).toBe(largestPage)
    expect(resolveTableRowsSearch({ page: unsupportedPage, pageSize: 100 }).page).toBe(1)
    expect(canonicalizeTableRouteSearch({ page: String(unsupportedPage) }).page).toBeUndefined()
    expect(canonicalizeTableRouteSearch({ page: '2' }).page).toBe(2)
  })

  it('keeps only canonical declared route search', () => {
    expect(
      canonicalizeTableRouteSearch({
        custom: 'drop',
        dir: 'sideways',
        filters: '{invalid',
        mode: 'edit',
        page: 1,
        pageSize: 100,
        rowId: ' ',
        sort: 'id',
        tab: 'legacy',
        view: 'unknown',
      }),
    ).toEqual({
      dir: undefined,
      empty: undefined,
      filters: undefined,
      page: undefined,
      pageSize: undefined,
      sort: undefined,
      view: undefined,
    })
  })
})
