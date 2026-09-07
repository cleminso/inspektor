import { act, renderHook } from '@testing-library/react'
import type { ColumnOrderState, OnChangeFn, SortingState } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'

import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { useTableGrid } from '@tables/grid/useTableGrid'

const doNothing = () => undefined
const defaultOptions = {
  cellSelection: [],
  columnOrder: ['name', 'role'],
  columnVisibility: { name: true, role: true },
  columns: [
    { accessorKey: 'name', column: null, id: 'name', isSortable: true, label: 'Name' },
    { accessorKey: 'role', column: null, id: 'role', isSortable: true, label: 'Role' },
  ],
  disabledRowIds: new Set<string>(),
  onCellSelectionChange: doNothing,
  onColumnMenuOpen: doNothing,
  onColumnMove: doNothing,
  onColumnOrderChange: doNothing,
  onColumnVisibilityChange: doNothing,
  onSelectedRowIdsChange: doNothing,
  onSortChange: doNothing,
  rows: [],
  selectedRowIds: [],
  sortColumn: 'id',
  sortDirection: 'asc',
  stagedValuesByRowId: {},
} satisfies Parameters<typeof useTableGrid>[0]

function renderGrid(options: Partial<Parameters<typeof useTableGrid>[0]> = {}) {
  return renderHook(() => useTableGrid({ ...defaultOptions, ...options }))
}

describe('useTableGrid', () => {
  it('keeps column definitions stable when staged values change', () => {
    const { result, rerender } = renderHook(
      ({ stagedValuesByRowId }) => useTableGrid({ ...defaultOptions, stagedValuesByRowId }),
      { initialProps: { stagedValuesByRowId: {} } },
    )
    const columns = result.current.options.columns

    rerender({ stagedValuesByRowId: { 'row-1': { name: 'Grace' } } })

    expect(result.current.options.columns).toBe(columns)
  })

  it.each([
    { sorting: [{ id: 'name', desc: false }], expected: ['name', 'asc'] },
    { sorting: [{ id: 'role', desc: true }], expected: ['role', 'desc'] },
    { sorting: [], expected: ['id', 'asc'] },
  ] satisfies { sorting: SortingState; expected: [string, 'asc' | 'desc'] }[])(
    'converts table sorting $sorting to the persisted sort $expected',
    ({ sorting, expected }) => {
      const onSortChange = vi.fn()
      const { result } = renderGrid({ onSortChange })

      act(() => result.current.setSorting(sorting))

      expect(onSortChange).toHaveBeenCalledWith(...expected)
    },
  )

  it('strips the internal selection column from persisted order updates', () => {
    let persistedOrder = ['name', 'role']
    const onColumnOrderChange: OnChangeFn<ColumnOrderState> = (updater) => {
      persistedOrder = typeof updater === 'function' ? updater(persistedOrder) : updater
    }
    const { result } = renderGrid({ onColumnOrderChange })

    act(() => {
      result.current.setColumnOrder(['role', tableGridSelectionColumnId, 'name'])
    })

    expect(persistedOrder).toEqual(['role', 'name'])
  })
})
