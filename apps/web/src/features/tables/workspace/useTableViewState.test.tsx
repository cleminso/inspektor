import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useReducer } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ColumnDescriptor } from 'jazz-tools'

import { DataGrid } from '@inspector/ds'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import { useTableViewState as useTableViewStateImpl } from '@tables/workspace/useTableViewState'

const insertRow = vi.fn()
const setPage = vi.fn()
const { focusRowEditorField, useTableRowByIdMock } = vi.hoisted(() => ({
  focusRowEditorField: vi.fn(),
  useTableRowByIdMock: vi.fn(),
}))
const columnOrderState = {
  columnOrder: ['id', 'name'],
  columnVisibility: { id: true, name: true },
  setColumnOrder: vi.fn(),
  setColumnVisibility: vi.fn(),
}
const searchState = {
  filters: [] as TableFilterClause[],
  page: 1,
  pageSize: 100 as const,
  setFilters: vi.fn(),
  setPage,
  setPageSize: vi.fn(),
  setSorting: vi.fn(),
  sortColumn: 'id',
  sortDirection: 'asc' as const,
}
let tableRowsOptions: unknown
let queryHasNextPage = false
let queryIsInitialLoading = false
let queryRows = [
  { id: 'row-1', name: 'Ada' },
  { id: 'row-2', name: 'Grace' },
]
const tableColumns = [
  {
    accessorKey: 'id',
    column: null,
    id: 'id',
    isSortable: true,
    label: 'id',
  },
  {
    accessorKey: 'name',
    column: {
      name: 'name',
      column_type: { type: 'Text' },
      nullable: false,
    } as ColumnDescriptor,
    id: 'name',
    isSortable: true,
    label: 'Name',
  },
]
const runtimeState = vi.hoisted(() => ({
  client: null as object | null,
  schema: null as Record<string, unknown> | null,
}))
const schemaColumns = [tableColumns[1]!.column!]

function useTableViewState(
  options: Omit<Parameters<typeof useTableViewStateImpl>[0], 'schemaColumns' | 'tableKey'> & {
    tableKey?: string
  },
) {
  const { tableKey = 'test:accounts', ...rest } = options
  return useTableViewStateImpl({
    ...rest,
    schemaColumns,
    tableKey,
  })
}

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeClient: () => runtimeState.client,
  useRuntimeSchema: () => runtimeState.schema,
}))

vi.mock('@tables/grid/useColumnOrder', () => ({
  moveColumnInOrder: vi.fn(),
}))

vi.mock('@tables/grid/useTablePreferences', () => ({
  useTablePreferences: () => columnOrderState,
}))

vi.mock('@tables/routing/useTableSearchParams', () => ({
  useTableExplorerSearchParams: () => searchState,
}))

vi.mock('@tables/rowEditor/mutation/useTableMutation', () => ({
  useTableMutations: () => ({
    deleteRow: vi.fn(),
    insertRow,
    updateRow: vi.fn(),
  }),
}))

vi.mock('@tables/rowEditor/fieldFocus', async (importOriginal) => {
  const original = await importOriginal<typeof import('@tables/rowEditor/fieldFocus')>()
  focusRowEditorField.mockImplementation(original.focusRowEditorField)
  return { focusRowEditorField }
})

vi.mock('@tables/query/useTableRows', () => ({
  useTableRows: (options: unknown) => {
    tableRowsOptions = options
    return {
      columns: tableColumns,
      hasNextPage: queryHasNextPage,
      isInitialLoading: queryIsInitialLoading,
      isRefreshing: false,
      rows: queryRows,
    }
  },
}))

vi.mock('@tables/query/useTableRowById', () => ({
  useTableRowById: useTableRowByIdMock,
}))

beforeEach(() => {
  insertRow.mockReset()
  focusRowEditorField.mockClear()
  setPage.mockReset()
  searchState.setFilters.mockReset()
  useTableRowByIdMock.mockReset()
  useTableRowByIdMock.mockReturnValue({ status: 'idle', row: null })
  searchState.filters = []
  searchState.page = 1
  searchState.sortColumn = 'id'
  tableRowsOptions = undefined
  queryHasNextPage = false
  queryIsInitialLoading = false
  queryRows = [
    { id: 'row-1', name: 'Ada' },
    { id: 'row-2', name: 'Grace' },
  ]
  columnOrderState.columnOrder = ['id', 'name']
  tableColumns[1]!.column = {
    name: 'name',
    column_type: { type: 'Text' },
    nullable: false,
  }
  runtimeState.client = null
  runtimeState.schema = null
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function TableViewInteractionHarness(): React.ReactElement {
  const state = useTableViewState({ tableName: 'accounts' })
  const [, forceRender] = useReducer((value: number) => value + 1, 0)

  return (
    <>
      <output aria-label="Pane mode">{state.detailPaneMode}</output>
      <output aria-label="Selected row count">
        {state.table.getSelectedRowModel().rows.length}
      </output>
      <output aria-label="Active row">{state.rowEditor.activeRowId ?? ''}</output>
      <output aria-label="Inline editor target">
        {state.activeFieldEditorTarget === null
          ? ''
          : `${state.activeFieldEditorTarget.rowId}:${state.activeFieldEditorTarget.columnId}`}
      </output>
      <button
        type="button"
        onClick={() => {
          state.handleEscape()
          forceRender()
        }}
      >
        Dismiss pane
      </button>
      <DataGrid.Root
        table={state.table}
        reorderableColumnIds={state.reorderableColumnIds}
        activeColumnId={state.activeColumnId}
        activeRowId={state.rowEditor.activeRowId}
        onCellActivate={state.handleCellActivate}
        onCellEditRequest={state.handleCellEditRequest}
        onColumnActivate={state.handleColumnActivate}
      >
        <DataGrid.Viewport>
          <DataGrid.Table aria-label="Accounts">
            <DataGrid.Content />
          </DataGrid.Table>
        </DataGrid.Viewport>
      </DataGrid.Root>
    </>
  )
}

describe('useTableViewState', () => {
  it('moves a single checked row through the loaded grid rows', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    expect(result.current.rowEditor.canNavigatePrevious).toBe(false)
    expect(result.current.rowEditor.canNavigateNext).toBe(true)
    expect(result.current.rowEditor.navigationLabel).toBe('1 / 2')

    act(() => result.current.rowEditor.goToNextRow())
    expect(result.current.table.getSelectedRowIds()).toEqual(['row-2'])
    expect(result.current.rowEditor.activeRowId).toBe('row-2')
    expect(result.current.rowEditor.canNavigatePrevious).toBe(true)
    expect(result.current.rowEditor.canNavigateNext).toBe(false)
    expect(result.current.rowEditor.navigationLabel).toBe('2 / 2')

    act(() => result.current.rowEditor.goToPreviousRow())
    expect(result.current.table.getSelectedRowIds()).toEqual(['row-1'])
    expect(result.current.rowEditor.activeRowId).toBe('row-1')
  })

  it('keeps multiple checked rows selected while navigating between them', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })

    expect(result.current.rowEditor.navigationLabel).toBe('2 / 2 selected')

    act(() => result.current.rowEditor.goToPreviousRow())
    expect(result.current.table.getSelectedRowIds()).toEqual(['row-1', 'row-2'])
    expect(result.current.rowEditor.activeRowId).toBe('row-1')
    expect(result.current.rowEditor.navigationLabel).toBe('1 / 2 selected')
  })

  it('continues single-row navigation on the adjacent page', () => {
    queryHasNextPage = true
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })
    act(() => result.current.rowEditor.goToNextRow())

    expect(setPage).toHaveBeenCalledWith(2)

    searchState.page = 2
    queryRows = []
    queryIsInitialLoading = true
    rerender()

    expect(result.current.detailPaneMode).toBe('rows')
    expect(result.current.rowEditor.activeRowId).toBe('row-2')

    queryRows = [
      { id: 'row-3', name: 'Katherine' },
      { id: 'row-4', name: 'Margaret' },
    ]
    queryHasNextPage = false
    queryIsInitialLoading = false
    rerender()

    expect(result.current.table.getSelectedRowIds()).toEqual(['row-3'])
    expect(result.current.rowEditor.activeRowId).toBe('row-3')

    act(() => result.current.rowEditor.goToPreviousRow())

    expect(setPage).toHaveBeenLastCalledWith(1)

    searchState.page = 1
    queryRows = [
      { id: 'row-1', name: 'Ada' },
      { id: 'row-2', name: 'Grace' },
    ]
    queryHasNextPage = true
    rerender()

    expect(result.current.table.getSelectedRowIds()).toEqual(['row-2'])
    expect(result.current.rowEditor.activeRowId).toBe('row-2')
  })

  it('cancels pending page navigation when the row pane closes', () => {
    queryHasNextPage = true
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })
    act(() => result.current.rowEditor.goToNextRow())
    act(() => result.current.closeRowEditor())

    searchState.page = 2
    queryRows = [{ id: 'row-3', name: 'Katherine' }]
    queryHasNextPage = false
    rerender()

    expect(result.current.detailPaneMode).toBe('closed')
    expect(result.current.table.getSelectedRowIds()).toEqual([])
  })

  it('closes the row pane when a navigation destination has no available rows', () => {
    queryHasNextPage = true
    const disabledRowIds = new Set(['row-3'])
    const { result, rerender } = renderHook(() =>
      useTableViewState({ disabledRowIds, tableName: 'accounts' }),
    )
    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })
    act(() => result.current.rowEditor.goToNextRow())

    searchState.page = 2
    queryRows = [{ id: 'row-3', name: 'Katherine' }]
    queryHasNextPage = false
    rerender()

    expect(result.current.detailPaneMode).toBe('closed')
    expect(result.current.table.getSelectedRowIds()).toEqual([])
  })

  it('clears row selection and closes the edit pane after staged changes apply', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    expect(result.current.table.getSelectedRowIds()).toEqual(['row-1'])

    act(() => {
      result.current.handleMutationApplySuccess()
    })

    expect(result.current.table.getSelectedRowIds()).toEqual([])
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('preserves an unrelated insert pane after staged changes apply', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => result.current.rowEditor.openInsert())

    act(() => result.current.handleMutationApplySuccess())

    expect(result.current.detailPaneMode).toBe('insert')
  })

  it('replaces applied-cell feedback and clears it after expiry', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.handleMutationUpdatesApplied({ 'row-1': new Set(['name']) })
    })
    expect(result.current.recentlyAppliedCells).toEqual({
      'row-1': new Set(['name']),
    })

    act(() => {
      result.current.handleMutationUpdatesApplied({ 'row-2': new Set(['name']) })
    })

    expect(result.current.recentlyAppliedCells).toEqual({
      'row-2': new Set(['name']),
    })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    expect(result.current.recentlyAppliedCells).toEqual({})
  })

  it('unchecks staged deletion rows and closes the edit pane', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleRowsStagedForDeletion(['row-2'])
    })
    rerender()

    expect(result.current.table.getSelectedRowIds()).toEqual(['row-1'])
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('prevents staged deletion rows from being selected again', () => {
    const disabledRowIds = new Set(['row-2'])
    const { result, rerender } = renderHook(() =>
      useTableViewState({ disabledRowIds, tableName: 'accounts' }),
    )

    expect(result.current.table.getRow('row-2').getCanSelect()).toBe(false)

    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })
    rerender()

    expect(result.current.table.getSelectedRowIds()).toEqual([])
  })

  it('keeps staged deletion rows visible until Apply finishes', () => {
    const disabledRowIds = new Set(['row-1'])
    const { result, rerender } = renderHook(
      ({ retainDisabledRows }) =>
        useTableViewState({ disabledRowIds, retainDisabledRows, tableName: 'accounts' }),
      { initialProps: { retainDisabledRows: false } },
    )

    rerender({ retainDisabledRows: true })
    queryRows = [{ id: 'row-2', name: 'Grace' }]
    rerender({ retainDisabledRows: true })

    expect(result.current.rows.map((row) => row.id)).toEqual(['row-1', 'row-2'])

    rerender({ retainDisabledRows: false })

    expect(result.current.rows.map((row) => row.id)).toEqual(['row-2'])
  })

  it('retains the active field source row while query rows reset', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    expect(result.current.activeFieldEditorRowValues).toEqual({ id: 'row-1', name: 'Ada' })

    queryRows = []
    rerender()

    expect(result.current.activeFieldEditorTarget).toEqual({ rowId: 'row-1', columnId: 'name' })
    expect(result.current.activeFieldEditorRowValues).toEqual({ id: 'row-1', name: 'Ada' })
  })

  it('routes relation fields to the complete-row pane', () => {
    vi.useFakeTimers()
    tableColumns[1]!.column = {
      name: 'name',
      column_type: { type: 'Uuid' },
      nullable: false,
      references: 'accounts',
    }
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.closeRowEditor()
    })
    rerender()
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })

    expect(result.current.activeFieldEditorTarget).toBeNull()
    expect(result.current.rowEditor.activeRowId).toBe('row-1')
    expect(result.current.detailPaneMode).toBe('rows')
    act(() => vi.advanceTimersToNextFrame())
    expect(focusRowEditorField).toHaveBeenCalledWith('name')
  })

  it('routes structured fields to the field editor', () => {
    tableColumns[1]!.column = {
      name: 'name',
      column_type: { type: 'Json' },
      nullable: false,
    }
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })

    expect(result.current.activeFieldEditorTarget).toEqual({ rowId: 'row-1', columnId: 'name' })
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('moves focus to the resolved target after completing a field edit', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    act(() => {
      result.current.handleFieldEditorComplete('enter')
    })
    expect(result.current.cellFocusRequest?.target).toEqual({
      rowId: 'row-2',
      columnId: 'name',
    })
    expect(result.current.activeFieldEditorTarget).toBeNull()
  })

  it('cancels field editing and requests focus on the originating cell', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    act(() => {
      result.current.handleFieldEditorCancel()
    })

    expect(result.current.activeFieldEditorTarget).toBeNull()
    expect(result.current.cellFocusRequest?.target).toEqual({
      rowId: 'row-1',
      columnId: 'name',
    })
  })

  it('keeps schema and insert UI available while mutations wait for the runtime client', () => {
    runtimeState.schema = { accounts: { columns: [] } }

    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    expect(result.current.canInspectSchema).toBe(true)
    expect(result.current.canOpenRowEditor).toBe(true)
    expect(result.current.canMutateRows).toBe(false)
  })

  it('persists an inserted row and closes the insert pane', async () => {
    insertRow.mockResolvedValue('row-3')
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.rowEditor.openInsert()
    })

    await act(async () => {
      await result.current.handleInsertSave({ name: 'Ada' }, { keepOpen: false })
    })

    expect(insertRow).toHaveBeenCalledWith({ name: 'Ada' })
    expect(setPage).toHaveBeenCalledWith(1)
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('persists an inserted row and keeps the insert pane open when Insert more is enabled', async () => {
    insertRow.mockResolvedValue('row-3')
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.rowEditor.openInsert()
    })

    await act(async () => {
      await result.current.handleInsertSave({ name: 'Ada' }, { keepOpen: true })
    })

    expect(insertRow).toHaveBeenCalledWith({ name: 'Ada' })
    expect(setPage).not.toHaveBeenCalled()
    expect(result.current.detailPaneMode).toBe('insert')
  })

  it('keeps each inserted row highlighted for its own expiry while Insert more repeats', async () => {
    vi.useFakeTimers()
    insertRow.mockResolvedValueOnce('row-3').mockResolvedValueOnce('row-4')
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.rowEditor.openInsert()
    })

    await act(async () => {
      await result.current.handleInsertSave({ name: 'Ada' }, { keepOpen: true })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    await act(async () => {
      await result.current.handleInsertSave({ name: 'Grace' }, { keepOpen: true })
    })

    expect(result.current.recentlyInsertedRowIds).toEqual(new Set(['row-3', 'row-4']))

    await act(async () => {
      await vi.advanceTimersToNextTimerAsync()
    })

    expect(result.current.recentlyInsertedRowIds).toEqual(new Set(['row-4']))

    await act(async () => {
      await vi.advanceTimersToNextTimerAsync()
    })

    expect(result.current.recentlyInsertedRowIds).toEqual(new Set())
  })

  it('highlights rows added by the active live query', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const onRowsAdded = (tableRowsOptions as { onRowsAdded: (rowIds: string[]) => void })
      .onRowsAdded

    act(() => onRowsAdded(['row-3', 'row-4']))

    expect(result.current.recentlyInsertedRowIds).toEqual(new Set(['row-3', 'row-4']))
  })

  it('highlights cells changed by the active live query', () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const onRowsUpdated = (
      tableRowsOptions as {
        onRowsUpdated: (
          updates: Array<{
            current: { id: string; name: string }
            previous: { id: string; name: string }
          }>,
        ) => void
      }
    ).onRowsUpdated

    act(() =>
      onRowsUpdated([
        {
          current: { id: 'row-1', name: 'Ada Lovelace' },
          previous: { id: 'row-1', name: 'Ada' },
        },
      ]),
    )

    expect(result.current.recentlyAppliedCells).toEqual({ 'row-1': new Set(['name']) })
  })

  it('opens inline editing without row selection and ignores requests while the row pane is open', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    expect(result.current.activeFieldEditorTarget).toEqual({ rowId: 'row-1', columnId: 'name' })

    act(() => {
      result.current.handleFieldEditorCancel()
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    expect(result.current.activeFieldEditorTarget).toBeNull()
  })

  it('does not open a row query when the active row is visible', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()

    expect(result.current.rowValues).toMatchObject({ id: 'row-1', name: 'Ada' })
    expect(useTableRowByIdMock).toHaveBeenCalledWith(expect.objectContaining({ rowId: null }))
  })

  it('queries an active row that leaves the visible page', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    useTableRowByIdMock.mockReturnValue({
      status: 'fulfilled',
      row: { id: 'row-1', name: 'Ada' },
    })
    queryRows = []
    rerender()

    expect(result.current.rowValues).toEqual({ id: 'row-1', name: 'Ada' })
    expect(useTableRowByIdMock).toHaveBeenCalledWith(expect.objectContaining({ rowId: 'row-1' }))
  })

  it('closes the row pane when the fallback query confirms the active row is gone', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => result.current.table.getRow('row-1').toggleSelected(true))
    rerender()

    queryRows = []
    useTableRowByIdMock.mockReturnValue({ status: 'fulfilled', row: null })
    rerender()

    expect(result.current.detailPaneMode).toBe('closed')
    expect(result.current.table.getSelectedRowIds()).toEqual([])
  })

  it('keeps the active row available while its visible query resets', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()

    queryIsInitialLoading = true
    queryRows = []
    rerender()

    expect(result.current.detailPaneMode).toBe('rows')
    expect(result.current.rowValues).toMatchObject({ id: 'row-1', name: 'Ada' })
  })

  it('opens inline editing without checking the row when a focused cell is double-clicked', () => {
    render(<TableViewInteractionHarness />)
    const cell = screen.getByRole('cell', { name: 'Ada' })

    fireEvent.mouseDown(cell)
    fireEvent.mouseUp(document)
    fireEvent.click(cell)

    expect(cell.hasAttribute('data-active')).toBe(true)
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
    expect(screen.getByRole('status', { name: 'Inline editor target' }).textContent).toBe('')

    fireEvent.doubleClick(cell)

    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
    expect(screen.getByRole('status', { name: 'Inline editor target' }).textContent).toBe(
      'row-1:name',
    )
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('0')
  })

  it('moves focus from a selected cell to a clicked column header', () => {
    render(<TableViewInteractionHarness />)
    const cell = screen.getByRole('cell', { name: 'Ada' })
    const header = screen.getByRole('columnheader', { name: /Name/ })

    fireEvent.mouseDown(cell)
    fireEvent.mouseUp(document)
    fireEvent.click(cell)
    fireEvent.click(header)

    expect(cell.hasAttribute('data-active')).toBe(false)
    expect(header.hasAttribute('data-active')).toBe(true)
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
  })

  it('opens the complete-row pane when a row is checked', () => {
    render(<TableViewInteractionHarness />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))

    expect(
      screen.getByRole('checkbox', { name: 'Select row row-1' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('rows')
    expect(screen.getByRole('status', { name: 'Active row' }).textContent).toBe('row-1')
  })

  it('focuses the target row after Shift-selecting a range', () => {
    render(<TableViewInteractionHarness />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-2' }), {
      shiftKey: true,
    })

    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('2')
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('rows')
    expect(screen.getByRole('status', { name: 'Active row' }).textContent).toBe('row-2')
  })

  it('opens and closes row selection from the header checkbox', () => {
    render(<TableViewInteractionHarness />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select all loaded rows' })

    fireEvent.click(checkbox)

    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('2')
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('rows')

    fireEvent.click(checkbox)

    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('0')
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
  })

  it('clears checked rows when opening the insert form from the row editor', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()

    act(() => {
      result.current.rowEditor.openInsert()
    })
    rerender()

    expect(result.current.detailPaneMode).toBe('insert')
    expect(result.current.table.getRow('row-1').getIsSelected()).toBe(false)
    expect(result.current.rowEditor.editedRowIds).toEqual([])
  })

  it('focuses the nearest checked row when the active checkbox is unchecked', () => {
    render(<TableViewInteractionHarness />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-2' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))

    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('1')
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('rows')
    expect(screen.getByRole('status', { name: 'Active row' }).textContent).toBe('row-2')
  })

  it('clears all checked rows when the row pane is closed', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.table.getRow('row-2').toggleSelected(true)
    })
    rerender()

    act(() => {
      result.current.closeRowEditor()
    })

    expect(result.current.detailPaneMode).toBe('closed')
    expect(result.current.table.getSelectedRowIds()).toEqual([])
  })

  it('closes the row pane, clears its checked row, and allows reselection on Escape', () => {
    render(<TableViewInteractionHarness />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select row row-1' })

    fireEvent.click(checkbox)
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss pane' }))
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('0')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))

    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('1')
  })

  it('closes the row pane and clears all checked rows on Escape', () => {
    render(<TableViewInteractionHarness />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss pane' }))

    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('0')
    expect(
      screen.getByRole('checkbox', { name: 'Select row row-1' }).getAttribute('aria-checked'),
    ).toBe('false')
    expect(
      screen.getByRole('checkbox', { name: 'Select row row-2' }).getAttribute('aria-checked'),
    ).toBe('false')
  })

  it('clears cell and column focus on Escape without a pane', () => {
    render(<TableViewInteractionHarness />)
    const cell = screen.getByRole('cell', { name: 'Ada' })
    const header = screen.getByRole('columnheader', { name: /Name/ })
    const dismiss = screen.getByRole('button', { name: 'Dismiss pane' })

    fireEvent.mouseDown(cell)
    fireEvent.mouseUp(document)
    expect(cell.hasAttribute('data-cell-selected')).toBe(true)

    fireEvent.click(dismiss)
    expect(cell.hasAttribute('data-cell-selected')).toBe(false)

    fireEvent.click(header)
    expect(header.hasAttribute('data-active')).toBe(true)

    fireEvent.click(dismiss)
    expect(header.hasAttribute('data-active')).toBe(false)
  })

  it('focuses the matching row-editor field when its cell is selected', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    const field = document.createElement('div')
    const input = document.createElement('input')
    field.id = 'row-editor-field-name'
    field.append(input)
    document.body.append(field)

    act(() => {
      result.current.table.setFocusedCell('row-1', 'name')
      result.current.handleCellActivate({ columnId: 'name', rowId: 'row-1' })
    })
    act(() => vi.advanceTimersToNextFrame())

    expect(document.activeElement).toBe(input)
    field.remove()
  })

  it('opens the row pane without clearing cell focus', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.setFocusedCell('row-2', 'name')
      result.current.handleCellActivate({ columnId: 'name', rowId: 'row-2' })
    })
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()

    expect(result.current.detailPaneMode).toBe('rows')
    expect(result.current.table.getFocusedCell()?.row.id).toBe('row-2')
    expect(result.current.table.getFocusedCell()?.column.id).toBe('name')
    expect(result.current.rowEditor.activeRowId).toBe('row-1')
  })

  it('clears selections when committed filters change', async () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const initialScrollResetKey = result.current.scrollResetKey

    act(() => {
      result.current.table.setFocusedCell('row-1', 'name')
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    expect(result.current.activeFieldEditorTarget).toEqual({ rowId: 'row-1', columnId: 'name' })
    await act(async () => {
      await result.current.setFilters([
        { id: 'filter-1', column: 'id', operator: 'eq', value: 'row-2' },
      ])
    })
    expect(result.current.hasCellSelection).toBe(true)

    searchState.filters = [{ id: 'filter-1', column: 'id', operator: 'eq', value: 'row-2' }]
    rerender()

    expect(result.current.hasCellSelection).toBe(false)
    expect(result.current.detailPaneMode).toBe('closed')
    expect(result.current.activeFieldEditorTarget).toBeNull()
    expect(result.current.scrollResetKey).not.toBe(initialScrollResetKey)
  })

  it('clears column selection only after filters commit', async () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const nextFilters: TableFilterClause[] = [
      { id: 'filter-1', column: 'id', operator: 'eq', value: 'row-2' },
    ]

    act(() => {
      result.current.handleColumnActivate('name')
    })
    rerender()
    await act(async () => {
      await result.current.setFilters(nextFilters)
    })

    expect(result.current.activeColumnId).toBe('name')

    searchState.filters = nextFilters
    rerender()

    expect(result.current.activeColumnId).toBeNull()
  })

  it('clears selections when URL-backed query state changes externally', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    expect(result.current.detailPaneMode).toBe('rows')

    searchState.sortColumn = 'name'
    rerender()

    expect(result.current.table.getSelectedRowIds()).toEqual([])
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('routes out-of-range page correction through route-owned pagination', async () => {
    renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const onPageOutOfRange = (tableRowsOptions as { onPageOutOfRange: () => Promise<void> })
      .onPageOutOfRange

    await onPageOutOfRange()

    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('clears selections when the table key changes', () => {
    const { result, rerender } = renderHook(
      ({ tableKey }) => useTableViewState({ tableKey, tableName: 'accounts' }),
      { initialProps: { tableKey: 'test:accounts' } },
    )

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender({ tableKey: 'test:accounts' })
    expect(result.current.detailPaneMode).toBe('rows')

    rerender({ tableKey: 'test:profiles' })

    expect(result.current.table.getSelectedRowIds()).toEqual([])
    expect(result.current.detailPaneMode).toBe('closed')
  })
})
