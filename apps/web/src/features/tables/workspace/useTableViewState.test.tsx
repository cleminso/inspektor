import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useReducer } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ColumnDescriptor } from 'jazz-tools'

import { DataGrid } from '@inspector/ds'
import { createInsertRowValues, useTableViewState } from '@tables/workspace/useTableViewState'

const setRowEditor = vi.fn()
const deleteRow = vi.fn()
const insertRow = vi.fn()
const updateRow = vi.fn()
const setPage = vi.fn()
const setPageSize = vi.fn()
const resetPage = vi.fn()
const { focusRowEditorField } = vi.hoisted(() => ({ focusRowEditorField: vi.fn() }))
const columnOrderState = {
  columnOrder: ['id', 'name'],
  setColumnOrder: vi.fn((updater: string[] | ((current: string[]) => string[])) => {
    columnOrderState.columnOrder =
      typeof updater === 'function' ? updater(columnOrderState.columnOrder) : updater
  }),
}
const searchState = {
  editorMode: null as 'edit' | 'insert' | null,
  filters: [],
  page: 1,
  pageSize: 100 as const,
  rowId: null as string | null,
  setFilters: vi.fn(),
  setPage,
  setPageSize,
  setRowEditor,
  setSorting: vi.fn(),
  sortColumn: 'id',
  sortDirection: 'asc' as const,
}
let activeRows: Array<Record<string, unknown>> = []
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

vi.mock('jazz-tools/react', () => ({
  useAll: () => activeRows,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
  useRuntimeClient: () => runtimeState.client,
  useRuntimeSchema: () => runtimeState.schema,
}))

vi.mock('@tables/grid/useColumnVisibility', () => ({
  useColumnVisibility: () => ({
    columnVisibility: { id: true },
    setColumnVisibility: vi.fn(),
  }),
}))

vi.mock('@tables/grid/useColumnOrder', () => ({
  moveColumnInOrder: (
    columnOrder: string[],
    columnId: string,
    direction: 'end' | 'left' | 'right' | 'start',
  ) => {
    const currentIndex = columnOrder.indexOf(columnId)
    const nextIndex =
      direction === 'start'
        ? 0
        : direction === 'end'
          ? columnOrder.length - 1
          : direction === 'left'
            ? Math.max(currentIndex - 1, 0)
            : Math.min(currentIndex + 1, columnOrder.length - 1)
    const nextColumnOrder = [...columnOrder]
    const [column] = nextColumnOrder.splice(currentIndex, 1)
    if (column !== undefined) {
      nextColumnOrder.splice(nextIndex, 0, column)
    }
    return nextColumnOrder
  },
  useColumnOrder: () => columnOrderState,
}))

vi.mock('@tables/routing/useTableSearchParams', () => ({
  useTableExplorerSearchParams: () => searchState,
}))

vi.mock('@tables/rowEditor/mutation/useTableMutation', () => ({
  useTableMutations: () => ({
    deleteRow,
    insertRow,
    updateRow,
  }),
}))

vi.mock('@tables/rowEditor/fieldFocus', async (importOriginal) => {
  const original = await importOriginal<typeof import('@tables/rowEditor/fieldFocus')>()
  focusRowEditorField.mockImplementation(original.focusRowEditorField)
  return { focusRowEditorField }
})

vi.mock('@tables/query/useTableRows', () => ({
  useTableRows: () => ({
    columns: tableColumns,
    hasNextPage: false,
    hasPreviousPage: false,
    isInitialLoading: false,
    isRefreshing: false,
    loadedRowCount: 1,
    page: searchState.page,
    pageSize: searchState.pageSize,
    resetPage,
    setPage,
    setPageSize,
    rows: [
      { id: 'row-1', name: 'Ada' },
      { id: 'row-2', name: 'Grace' },
    ],
  }),
}))

beforeEach(() => {
  setRowEditor.mockClear()
  deleteRow.mockReset()
  insertRow.mockReset()
  updateRow.mockReset()
  resetPage.mockReset()
  focusRowEditorField.mockClear()
  setPage.mockReset()
  setPageSize.mockReset()
  setRowEditor.mockImplementation((mode: 'edit' | 'insert' | null, rowId: string | null) => {
    searchState.editorMode = mode
    searchState.rowId = rowId
  })
  searchState.editorMode = null
  searchState.rowId = null
  searchState.page = 1
  searchState.sortColumn = 'id'
  columnOrderState.columnOrder = ['id', 'name']
  activeRows = []
  tableColumns[1]!.column = {
    name: 'name',
    column_type: { type: 'Text' },
    nullable: false,
  }
  runtimeState.client = null
  runtimeState.schema = null
})

afterEach(cleanup)

function TableViewInteractionHarness(): React.ReactElement {
  const state = useTableViewState({ tableName: 'accounts' })
  const [, forceRender] = useReducer((value: number) => value + 1, 0)

  return (
    <>
      <output aria-label="Pane mode">{state.detailPaneMode}</output>
      <output aria-label="Selected row count">
        {state.table.getSelectedRowModel().rows.length}
      </output>
      <output aria-label="Inline editor target">
        {state.activeFieldEditorTarget === null
          ? ""
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
  it('clears row selection and closes the edit pane after staged changes apply', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    expect(result.current.selectedRowIds).toEqual(['row-1'])
    setRowEditor.mockClear()

    act(() => {
      result.current.handleMutationApplySuccess()
    })

    expect(result.current.selectedRowIds).toEqual([])
    expect(setRowEditor).toHaveBeenCalledWith(null, null)
  })

  it('opens scalar editing only from an explicit cell edit request', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.handleCellActivate({ rowId: 'row-1', columnId: 'name' })
    })
    expect(result.current.activeFieldEditorTarget).toBeNull()

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })
    rerender()
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    expect(result.current.activeFieldEditorTarget).toEqual({ rowId: 'row-1', columnId: 'name' })
  })

  it('opens structured fields in the Floating editor', () => {
    tableColumns[1]!.column = {
      name: 'name',
      column_type: { type: 'Json' },
      nullable: false,
    }
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })
    rerender()
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })

    expect(result.current.activeFieldEditorTarget).toEqual({ rowId: 'row-1', columnId: 'name' })
  })

  it.each([
    {
      column: {
        name: 'name',
        column_type: { type: 'Uuid' },
        nullable: false,
        references: 'accounts',
      } satisfies ColumnDescriptor,
      label: 'relation',
    },
    {
      column: {
        name: 'name',
        column_type: { type: 'Bytea' },
        nullable: false,
      } satisfies ColumnDescriptor,
      label: 'binary',
    },
  ])('routes $label fields to the complete-row pane', async ({ column }) => {
    tableColumns[1]!.column = column
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })
    rerender()
    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })

    expect(result.current.activeFieldEditorTarget).toBeNull()
    expect(setRowEditor).toHaveBeenCalledWith('edit', 'row-1')
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(focusRowEditorField).toHaveBeenCalledWith('name')
  })

  it('moves completed scalar edits with spreadsheet Enter and Tab navigation', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })
    rerender()
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

    act(() => {
      result.current.handleCellEditRequest({ rowId: 'row-1', columnId: 'name' })
    })
    act(() => {
      result.current.handleFieldEditorComplete('tabForward')
    })
    expect(result.current.cellFocusRequest?.target).toEqual({
      rowId: 'row-2',
      columnId: 'id',
    })
  })

  it('cancels scalar editing and requests focus on the originating cell', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()
    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })
    rerender()
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
    searchState.editorMode = 'insert'
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    await act(async () => {
      await result.current.handleInsertSave({ name: 'Ada' }, { keepOpen: false })
    })

    expect(insertRow).toHaveBeenCalledWith({ name: 'Ada' })
    expect(resetPage).toHaveBeenCalledOnce()
    expect(setRowEditor).toHaveBeenLastCalledWith(null, null)
  })

  it('persists an inserted row and keeps the insert pane open when Insert more is enabled', async () => {
    searchState.editorMode = 'insert'
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    await act(async () => {
      await result.current.handleInsertSave({ name: 'Ada' }, { keepOpen: true })
    })

    expect(insertRow).toHaveBeenCalledWith({ name: 'Ada' })
    expect(resetPage).not.toHaveBeenCalled()
    expect(setRowEditor).not.toHaveBeenCalled()
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

  it('keeps column definitions stable when only the rendered order changes', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const initialColumnDefinitions = result.current.table.options.columns

    act(() => {
      columnOrderState.setColumnOrder(['name', 'id'])
    })
    rerender()

    expect(result.current.table.options.columns).toBe(initialColumnDefinitions)
  })

  it('leaves a default-backed binary insert field undefined so Jazz can apply its default', () => {
    expect(
      createInsertRowValues([
        {
          name: 'payload',
          column_type: { type: 'Bytea' },
          nullable: false,
          default: { type: 'Bytea', value: new Uint8Array([1, 2]) },
        },
      ]),
    ).toEqual({ payload: undefined })
  })

  it('does not invent a value for a required read-only binary insert field', () => {
    expect(
      createInsertRowValues([
        {
          name: 'payload',
          column_type: { type: 'Bytea' },
          nullable: false,
        },
      ]),
    ).toEqual({ payload: undefined })
  })

  it('ignores an active-row query result whose identity does not match the requested row', () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-3'
    activeRows = [{ id: 'row-previous', name: 'Previous' }]

    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    expect(result.current.rowValues).toBeNull()
  })

  it('opens inline editing without checking the row when a focused cell is double-clicked', () => {
    render(<TableViewInteractionHarness />)
    const cell = screen.getByRole('cell', { name: 'Ada' })

    fireEvent.mouseDown(cell)
    fireEvent.mouseUp(document)
    fireEvent.click(cell)

    expect(cell.hasAttribute('data-active')).toBe(true)
    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')

    fireEvent.doubleClick(cell)

    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
    expect(screen.getByRole('status', { name: 'Inline editor target' }).textContent).toBe(
      'row-1:name',
    )
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('0')
  })

  it('stores cell selection in the active table view', () => {
    render(<TableViewInteractionHarness />)

    fireEvent.mouseDown(screen.getByRole('cell', { name: 'Ada' }))

    expect(screen.getByRole('cell', { name: 'Ada' }).hasAttribute('data-cell-selected')).toBe(true)
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
    expect(setRowEditor).toHaveBeenCalledWith('edit', 'row-1')
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

  it('allows an individual row to be unchecked after its pane is closed', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })
    rerender()
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(false)
    })

    expect(result.current.table.getRow('row-1').getIsSelected()).toBe(false)
    expect(result.current.rowEditor.editedRowIds).toEqual([])
  })

  it('cancels the focused row by unchecking it and focusing the nearest checked row', () => {
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
      result.current.handleRowEditorCancel()
    })
    rerender()

    expect(result.current.table.getRow('row-2').getIsSelected()).toBe(false)
    expect(result.current.table.getRow('row-1').getIsSelected()).toBe(true)
    expect(setRowEditor).toHaveBeenLastCalledWith('edit', 'row-1')
  })

  it('closes the row pane when cancelling its only checked row', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    act(() => {
      result.current.table.getRow('row-1').toggleSelected(true)
    })
    rerender()

    act(() => {
      result.current.handleRowEditorCancel()
    })
    rerender()

    expect(result.current.table.getRow('row-1').getIsSelected()).toBe(false)
    expect(setRowEditor).toHaveBeenLastCalledWith(null, null)
  })

  it('dismisses the row pane without a single-draft transition decision', () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-1'
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    setRowEditor.mockClear()

    act(() => {
      result.current.handleRowEditorOpenChange(false)
    })

    expect(setRowEditor).toHaveBeenCalledWith(null, null)
  })

  it('allows a row to be checked again after Escape clears its selection', () => {
    render(<TableViewInteractionHarness />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select row row-1' })

    fireEvent.click(checkbox)
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss pane' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))

    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('1')
  })

  it('closes the row pane and clears its checked row on Escape', () => {
    render(<TableViewInteractionHarness />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss pane' }))

    expect(screen.getByRole('status', { name: 'Pane mode' }).textContent).toBe('closed')
    expect(screen.getByRole('status', { name: 'Selected row count' }).textContent).toBe('0')
  })

  it('restores the checked row represented by URL-backed edit state', () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-2'

    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    expect(result.current.table.getRow('row-2').getIsSelected()).toBe(true)
    expect(result.current.detailPaneMode).toBe('rows')
  })

  it('keeps checkbox selection aligned with URL-backed row changes', () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-1'
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    searchState.rowId = 'row-2'
    rerender()

    expect(result.current.table.getRow('row-1').getIsSelected()).toBe(false)
    expect(result.current.table.getRow('row-2').getIsSelected()).toBe(true)
    expect(result.current.rowEditor.editedRowIds).toEqual(['row-2'])
  })

  it('focuses the matching row-editor field when its cell is selected', async () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-1'
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))
    const field = document.createElement('div')
    const input = document.createElement('input')
    field.id = 'row-editor-field-name'
    field.append(input)
    document.body.append(field)

    act(() => {
      result.current.table.setFocusedCell('row-1', 'name')
      result.current.handleCellActivate({ columnId: 'name', rowId: 'row-1' })
    })
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(document.activeElement).toBe(input)
    field.remove()
  })

  it('reports the active page row and selected data-column positions', () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-2'
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    expect(result.current.rowEditor.activePageRowNumber).toBe(2)
    expect(result.current.rowEditor.activeColumnNumber).toBe(0)

    act(() => {
      result.current.table.selectCellRange({
        anchorRowId: 'row-2',
        anchorColumnId: 'name',
        focusRowId: 'row-2',
        focusColumnId: 'name',
      })
    })

    expect(result.current.rowEditor.activeColumnNumber).toBe(2)
  })

  it('does not report row zero when the edited row is outside the loaded page', () => {
    searchState.editorMode = 'edit'
    searchState.rowId = 'row-outside-page'

    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    expect(result.current.rowEditor.activePageRowNumber).toBeNull()
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

  it('clears selections when filters change', async () => {
    const { result } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.setFocusedCell('row-1', 'name')
    })
    await act(async () => {
      await result.current.setFilters([])
    })

    expect(result.current.hasCellSelection).toBe(false)
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('clears selections when URL-backed query state changes externally', () => {
    const { result, rerender } = renderHook(() => useTableViewState({ tableName: 'accounts' }))

    act(() => {
      result.current.table.setFocusedCell('row-1', 'name')
    })
    searchState.sortColumn = 'name'
    rerender()

    expect(result.current.hasCellSelection).toBe(false)
    expect(result.current.detailPaneMode).toBe('closed')
  })

  it('clears selections when the table identity changes', () => {
    const { result, rerender } = renderHook(({ tableName }) => useTableViewState({ tableName }), {
      initialProps: { tableName: 'accounts' },
    })

    act(() => {
      result.current.table.setFocusedCell('row-1', 'name')
    })
    rerender({ tableName: 'profiles' })

    expect(result.current.hasCellSelection).toBe(false)
    expect(result.current.detailPaneMode).toBe('closed')
  })
})
