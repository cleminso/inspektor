import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableView } from '@tables/workspace/tableView'

const tableViewState = vi.hoisted(() => ({
  activeColumnId: null,
  activeFieldEditorTarget: null as { columnId: string; rowId: string } | null,
  canInspectSchema: true,
  canMutateRows: true,
  canOpenRowEditor: true,
  cellFocusRequest: null,
  detailPaneMode: 'closed',
  error: null as string | null,
  filters: [{ column: 'name', operator: 'equals', value: 'Ada' }],
  handleCellActivate: vi.fn(),
  handleCellEditRequest: vi.fn(),
  handleColumnActivate: vi.fn(),
  handleEscape: vi.fn(),
  handleFieldEditorCancel: vi.fn(),
  handleFieldEditorComplete: vi.fn(),
  handleMutationApplySuccess: vi.fn(),
  handleRowsStagedForDeletion: vi.fn(),
  handleRowEditorCancel: vi.fn(),
  handleRowEditorOpenChange: vi.fn(),
  hasCellSelection: false,
  hasNextPage: false,
  hasPreviousPage: false,
  isInitialLoading: false,
  isRefreshing: false,
  loadedRowCount: 2,
  mutationExecutor: {
    deleteRow: vi.fn(),
    insertRow: vi.fn(),
    updateRow: vi.fn(),
  },
  page: 1,
  pageSize: 100,
  reorderableColumnIds: [] as string[],
  rowEditor: {
    activeColumnNumber: 0,
    activePageRowNumber: 0,
    activeRowId: null as string | null,
    activeRowIndex: 0,
    editedRowIds: [] as string[],
    goToNextRow: vi.fn(),
    goToPreviousRow: vi.fn(),
    openInsert: vi.fn(),
  },
  rowValues: null as Record<string, unknown> | null,
  schemaColumns: [] as Array<{
    column_type: { type: 'Text' }
    name: string
    nullable: boolean
  }>,
  selectedRowIds: [] as string[],
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setPageSize: vi.fn(),
  table: {} as {
    getRowModel?: () => { rows: Array<{ id: string; original: Record<string, unknown> }> }
  },
  tableColumns: [] as Array<{ column?: unknown; id: string }>,
  tableKey: 'connection-1:main:schema-1:accounts',
}))
const mutationLedgerDispatch = vi.hoisted(() => vi.fn())
const mutationLedgerUndoDeletions = vi.hoisted(() => vi.fn())
const mutationLedgerRevertField = vi.hoisted(() => vi.fn())
const mutationLedgerRevertRowUpdate = vi.hoisted(() => vi.fn())
const stagedFieldsByRowId = vi.hoisted(() => ({
  current: {} as Readonly<Record<string, ReadonlySet<string>>>,
}))
const stagedValuesByRowId = vi.hoisted(() => ({
  current: {} as Readonly<Record<string, Readonly<Record<string, unknown>>>>,
}))
const gridContextMenuProps = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }))
const gridCellContextMenu = vi.hoisted(() => vi.fn())
const gridRowContextMenu = vi.hoisted(() => vi.fn())
const useTableViewStateOptions = vi.hoisted(() => ({
  current: null as null | {
    onUndoRowDeletions?: (rowIds: readonly string[]) => void
    stagedValuesByRowId?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
  },
}))
const mutationLedgerEntries = vi.hoisted(
  () => [] as Array<{ entryId: `delete:${string}`; kind: 'delete'; rowId: string }>,
)

vi.mock('@tables/workspace/useTableViewState', () => ({
  useTableViewState: (options: {
    onUndoRowDeletions?: (rowIds: readonly string[]) => void
    stagedValuesByRowId?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
  }) => {
    useTableViewStateOptions.current = options
    return tableViewState
  },
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
  useRuntimeSchema: () => null,
}))

vi.mock('@tables/schema/tableSchema', () => ({
  getTableColumns: () => [],
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({ openSchemaView: vi.fn() }),
}))

vi.mock('@tables/mutationLedger/provider', () => ({
  TableMutationLedgerProvider: ({ children }: { children: ReactNode }) => children,
  useTableMutationLedger: () => ({
    dispatch: mutationLedgerDispatch,
    ledger: { entries: mutationLedgerEntries, hasInvalidDraft: false },
    undoDeletions: mutationLedgerUndoDeletions,
    revertField: mutationLedgerRevertField,
    revertRowUpdate: mutationLedgerRevertRowUpdate,
    stagedFieldsByRowId: stagedFieldsByRowId.current,
    stagedValuesByRowId: stagedValuesByRowId.current,
  }),
  useTableMutationEditorController: () => ({
    actions: {},
    meta: {},
    state: { draft: { sourceValues: {} } },
  }),
}))

vi.mock('@tables/grid/tableGridContextMenu', () => ({
  TableGridContextMenu: ({
    children,
    ...props
  }: {
    children: (props: {
      composeViewport: (viewport: ReactNode) => ReactNode
      onCellContextMenu: typeof gridCellContextMenu
      onRowContextMenu: typeof gridRowContextMenu
    }) => ReactNode
  }) => {
    gridContextMenuProps.current = props
    return children({
      composeViewport: (viewport) => (
        <div data-testid="shared-grid-context-trigger">{viewport}</div>
      ),
      onCellContextMenu: gridCellContextMenu,
      onRowContextMenu: gridRowContextMenu,
    })
  },
}))

vi.mock('@tables/floatingWidget/floatingWidget', () => ({
  TableMutationWidget: ({ onApplySuccess }: { onApplySuccess?: () => void }) => (
    <button type="button" onClick={onApplySuccess}>
      Complete Apply
    </button>
  ),
}))

vi.mock('@tables/floatingWidget/fieldEditorMutationWidgetModules', () => ({
  FieldEditorMutationWidget: ({
    column,
    onClose,
    onComplete,
  }: {
    column: { name: string }
    onClose: () => void
    onComplete: (direction: string) => void
  }) => (
    <div role="dialog" aria-label={`Edit ${column.name}`}>
      <button type="button" onClick={onClose}>
        Close field
      </button>
      <button type="button" onClick={() => onComplete('enter')}>
        Complete field
      </button>
    </div>
  ),
}))

vi.mock('@tables/grid/buildColumns', () => ({
  ColumnDragPreview: () => null,
}))

vi.mock('@tables/grid/columnVisibility', () => ({
  DataGridColumnVisibility: () => null,
}))

vi.mock('@tables/grid/toolbar', () => ({
  TablePagination: () => null,
  Toolbar: ({ actions, pagination }: { actions: ReactNode; pagination: ReactNode }) => (
    <div>
      {actions}
      {pagination}
    </div>
  ),
}))

vi.mock('@tables/rowEditor/rowEditorModules', () => ({
  EditRowForm: () => <div>Edit row fields</div>,
  InsertRowForm: () => null,
  preloadRowEditorForms: vi.fn(),
}))

vi.mock('@tables/rowEditor/sidePane', () => ({
  RowEditorSidePanel: ({
    children,
    editedRowIds,
    onConfirmDelete,
  }: {
    children: ReactNode
    editedRowIds: string[]
    onConfirmDelete?: (rowIds: readonly string[]) => void
  }) => (
    <>
      {children}
      {onConfirmDelete === undefined ? null : (
        <button type="button" onClick={() => onConfirmDelete(editedRowIds)}>
          Delete checked rows
        </button>
      )}
    </>
  ),
}))

vi.mock('@inspector/ds', () => {
  const Container = ({
    'aria-live': ariaLive,
    children,
    role,
  }: {
    'aria-live'?: 'polite'
    children?: ReactNode
    role?: string
  }) => (
    <div aria-live={ariaLive} role={role}>
      {children}
    </div>
  )
  const DataGridTable = ({
    'aria-busy': ariaBusy,
    'aria-label': ariaLabel,
    children,
    statusContent,
  }: {
    'aria-busy'?: boolean
    'aria-label': string
    children: ReactNode
    statusContent?: ReactNode
  }) => (
    <div aria-busy={ariaBusy === true ? true : undefined} aria-label={ariaLabel} role="table">
      <div aria-atomic="true" aria-live="polite" role="status">
        {statusContent}
      </div>
      {children}
    </div>
  )
  const DataGridContent = ({
    emptyContent,
    loading,
  }: {
    emptyContent: ReactNode
    loading: boolean
  }) => (
    <div data-loading={String(loading)}>
      {tableViewState.loadedRowCount === 0 ? emptyContent : null}
    </div>
  )
  const DataGridRoot = ({
    children,
    getCellStatus,
    getRowStatus,
    onCellContextMenu,
    onCellEditRequest,
    onRowContextMenu,
  }: {
    children: ReactNode
    getCellStatus?: (cell: { column: { id: string }; row: { id: string } }) => string
    getRowStatus?: (row: { id: string }) => string
    onCellContextMenu?: (target: { columnId: string; rowId: string }, event: unknown) => void
    onCellEditRequest?: (target: { columnId: string; rowId: string }) => void
    onRowContextMenu?: (rowId: string, event: unknown) => void
  }) => (
    <div>
      <div data-testid="row-1-status">{getRowStatus?.({ id: 'row-1' })}</div>
      <div data-testid="row-1-name-status">
        {getCellStatus?.({ column: { id: 'name' }, row: { id: 'row-1' } })}
      </div>
      <div data-testid="row-1-email-status">
        {getCellStatus?.({ column: { id: 'email' }, row: { id: 'row-1' } })}
      </div>
      <div data-testid="row-1-selection-status">
        {getCellStatus?.({ column: { id: '\uE000inspector-row-selection' }, row: { id: 'row-1' } })}
      </div>
      <button
        type="button"
        onClick={(event) => onCellContextMenu?.({ columnId: 'name', rowId: 'row-1' }, event)}
      >
        Open cell context
      </button>
      <button type="button" onClick={(event) => onRowContextMenu?.('row-1', event)}>
        Open row context
      </button>
      <button
        type="button"
        onClick={() => onCellEditRequest?.({ columnId: 'name', rowId: 'row-1' })}
      >
        Edit row 1
      </button>
      <button
        type="button"
        onClick={() => onCellEditRequest?.({ columnId: 'name', rowId: 'row-2' })}
      >
        Edit row 2
      </button>
      {children}
    </div>
  )

  return {
    Box: Container,
    Button: Object.assign(Container, { Glyph: Container }),
    DataGrid: {
      Content: DataGridContent,
      Root: DataGridRoot,
      Table: DataGridTable,
      Viewport: Container,
    },
    ResizableHandle: Container,
    ResizablePanel: Container,
    ResizablePanelGroup: Container,
    Text: Container,
    Tooltip: {
      Content: Container,
      Root: Container,
      Trigger: Container,
    },
  }
})

afterEach(() => {
  cleanup()
  tableViewState.error = null
  tableViewState.filters = [{ column: 'name', operator: 'equals', value: 'Ada' }]
  tableViewState.isInitialLoading = false
  tableViewState.isRefreshing = false
  tableViewState.loadedRowCount = 2
  tableViewState.activeFieldEditorTarget = null
  tableViewState.detailPaneMode = 'closed'
  tableViewState.rowEditor.activeRowId = null
  tableViewState.rowEditor.editedRowIds = []
  tableViewState.rowValues = null
  tableViewState.selectedRowIds = []
  tableViewState.table = {}
  tableViewState.tableColumns = []
  mutationLedgerEntries.length = 0
  stagedFieldsByRowId.current = {}
  stagedValuesByRowId.current = {}
  gridContextMenuProps.current = null
  useTableViewStateOptions.current = null
})

describe('TableView query status', () => {
  it('stages checked-row deletion from the stable row editor surface', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowEditor.editedRowIds = ['row-1', 'row-2']
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }

    render(<TableView tableName="accounts" />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete checked rows' }))

    expect(mutationLedgerDispatch).toHaveBeenCalledWith({
      type: 'deleteRows',
      rowIds: ['row-1', 'row-2'],
    })
    expect(tableViewState.handleRowsStagedForDeletion).toHaveBeenCalledWith(['row-1', 'row-2'])
  })

  it('blocks inline editing and marks rows while their deletion is staged', () => {
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })

    render(<TableView tableName="accounts" />)

    expect(screen.getByTestId('row-1-status').textContent).toBe('stagedDeletion')
    fireEvent.click(screen.getByRole('button', { name: 'Edit row 1' }))
    expect(tableViewState.handleCellEditRequest).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Edit row 2' }))
    expect(tableViewState.handleCellEditRequest).toHaveBeenCalledWith({
      columnId: 'name',
      rowId: 'row-2',
    })
  })

  it('projects only applicable staged data fields into grid cell status', () => {
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    stagedValuesByRowId.current = { 'row-1': { name: 'Grace' } }

    render(<TableView tableName="accounts" />)

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('stagedUpdate')
    expect(screen.getByTestId('row-1-email-status').textContent).toBe('default')
    expect(screen.getByTestId('row-1-selection-status').textContent).toBe('default')
  })

  it('uses the editing treatment after a staged cell opens its inline editor', () => {
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.table = { getRowModel: () => ({ rows: [] }) }

    render(<TableView tableName="accounts" />)

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('default')
  })

  it('gives staged deletion precedence over staged field status', () => {
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }

    render(<TableView tableName="accounts" />)

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('default')
  })

  it('wires one viewport context bridge to semantic Data Grid callbacks and ledger recovery', () => {
    render(<TableView tableName="accounts" />)

    expect(screen.getAllByTestId('shared-grid-context-trigger')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Open cell context' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open row context' }))

    expect(gridCellContextMenu).toHaveBeenCalledWith(
      { columnId: 'name', rowId: 'row-1' },
      expect.anything(),
    )
    expect(gridRowContextMenu).toHaveBeenCalledWith('row-1', expect.anything())
    expect(gridContextMenuProps.current).toMatchObject({
      revertField: mutationLedgerRevertField,
      revertRowUpdate: mutationLedgerRevertRowUpdate,
      stagedFieldsByRowId: stagedFieldsByRowId.current,
    })
  })

  it('undoes staged deletions through the row selection control', () => {
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })

    render(<TableView tableName="accounts" />)
    useTableViewStateOptions.current?.onUndoRowDeletions?.(['row-1'])

    expect(mutationLedgerUndoDeletions).toHaveBeenCalledWith(['row-1'])
  })

  it('wires the active scalar target to the explicit Floating field editor', () => {
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.table = {
      getRowModel: () => ({ rows: [{ id: 'row-1', original: { id: 'row-1', name: 'Ada' } }] }),
    }
    tableViewState.tableColumns = [
      {
        id: 'name',
        column: { name: 'name', column_type: { type: 'Text' }, nullable: false },
      },
    ]
    tableViewState.schemaColumns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ]

    render(<TableView tableName="accounts" />)

    expect(screen.getByRole('dialog', { name: 'Edit name' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close field' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete field' }))
    expect(tableViewState.handleFieldEditorCancel).toHaveBeenCalledOnce()
    expect(tableViewState.handleFieldEditorComplete).toHaveBeenCalledWith('enter')
  })

  it('suppresses inline editing while keeping the staged widget available beside the row pane', () => {
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.detailPaneMode = 'rows'
    tableViewState.table = {
      getRowModel: () => ({ rows: [{ id: 'row-1', original: { id: 'row-1', name: 'Ada' } }] }),
    }
    tableViewState.tableColumns = [
      {
        id: 'name',
        column: { name: 'name', column_type: { type: 'Text' }, nullable: false },
      },
    ]
    tableViewState.schemaColumns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ]

    render(<TableView tableName="accounts" />)

    expect(screen.queryByRole('dialog', { name: 'Edit name' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Complete Apply' }))
    expect(tableViewState.handleMutationApplySuccess).toHaveBeenCalledOnce()
  })

  it('announces refresh completion and filtered emptiness', async () => {
    const { rerender } = render(<TableView tableName="accounts" />)
    const status = screen.getByRole('status')

    tableViewState.isRefreshing = true
    rerender(<TableView tableName="accounts" />)

    expect(screen.getByRole('table', { name: 'accounts rows' }).getAttribute('aria-busy')).toBe(
      'true',
    )
    expect(screen.getByText('Refreshing rows')).toBe(status)
    expect(document.querySelector('[data-loading="false"]')).not.toBeNull()

    tableViewState.isRefreshing = false
    tableViewState.loadedRowCount = 0
    rerender(<TableView tableName="accounts" />)

    await waitFor(() => {
      expect(status.textContent).toBe('Rows refreshed. No rows match these filters')
    })
    expect(screen.getByText('No rows match these filters')).not.toBe(status)
    expect(screen.getByRole('table', { name: 'accounts rows' }).hasAttribute('aria-busy')).toBe(
      false,
    )
  })

  it('presents query failures as alerts with corrective reload guidance', () => {
    tableViewState.error = 'Network request failed'
    tableViewState.filters = []
    tableViewState.loadedRowCount = 0

    render(<TableView tableName="accounts" />)

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain("Couldn't load rows")
    expect(alert.textContent).toContain('Network request failed')
    expect(alert.textContent).toContain('Check the connection, then reload the page to try again.')
  })
})
