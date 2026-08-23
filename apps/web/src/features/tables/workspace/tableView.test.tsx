import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { forwardRef, type ReactElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
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
  filters: [{ id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' }],
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
  recentlyAppliedCells: {} as Readonly<Record<string, ReadonlySet<string>>>,
  recentlyInsertedRowIds: new Set<string>() as ReadonlySet<string>,
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
    getFocusedCell?: () => { column: { id: string }; row: { id: string } } | undefined
    getRowModel?: () => { rows: Array<{ id: string; original: Record<string, unknown> }> }
  },
  tableColumns: [] as Array<{
    accessorKey: string
    column: null | {
      column_type: { type: string }
      name: string
      nullable: boolean
    }
    id: string
    isSortable: boolean
    label: string
  }>,
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
const toastError = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
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
  TableMutationWidget: ({
    onApplySuccess,
  }: {
    onApplySuccess?: (appliedUpdateFields: Readonly<Record<string, ReadonlySet<string>>>) => void
  }) => (
    <button type="button" onClick={() => onApplySuccess?.({ 'row-1': new Set(['name']) })}>
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

vi.mock('@tables/filters/dataGridFilterBuilder', () => ({
  DataGridFilterBuilder: () => <input aria-label="Filter input" />,
}))

vi.mock('@tables/grid/toolbar', () => ({
  TablePagination: () => null,
  Toolbar: ({
    actions,
    children,
    pagination,
  }: {
    actions: ReactNode
    children: ReactNode
    pagination: ReactNode
  }) => (
    <div>
      {children}
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
  interface ContainerProps {
    'aria-live'?: 'polite'
    'data-hotkey-scope'?: string
    children?: ReactNode
    render?: ReactElement
    role?: string
  }

  const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
    { 'aria-live': ariaLive, 'data-hotkey-scope': hotkeyScope, children, render, role },
    ref,
  ) {
    return (
      <div ref={ref} aria-live={ariaLive} data-hotkey-scope={hotkeyScope} role={role}>
        {render}
        {children}
      </div>
    )
  })
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

  const Button = ({
    'aria-label': ariaLabel,
    children,
    disabled,
    onClick,
    type = 'button',
  }: {
    'aria-label'?: string
    children?: ReactNode
    disabled?: boolean
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
  }) => (
    <button aria-label={ariaLabel} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  )

  const KeyboardInput = ({ hotkey }: { hotkey: string }) => (
    <span data-testid="keyboard-input">{hotkey}</span>
  )

  const CommandItem = ({
    children,
    disabled,
    onClick,
    value,
  }: {
    children?: ReactNode
    disabled?: boolean
    onClick?: () => void
    value?: { label: string }
  }) => (
    <div
      role="option"
      aria-disabled={disabled === true ? 'true' : undefined}
      aria-label={value?.label}
      aria-selected="false"
      tabIndex={-1}
      onClick={onClick}
      onKeyDown={onClick === undefined ? undefined : () => onClick()}
    >
      {children}
    </div>
  )

  const Command = {
    Close: () => null,
    Dialog: ({ children, open }: { children: ReactNode; open?: boolean }) =>
      open === true ? <div role="dialog">{children}</div> : null,
    Empty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Footer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Input: (props: Record<string, unknown>) => <input {...props} />,
    InputRow: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Item: CommandItem,
    ItemText: ({ label }: { label: string }) => <span>{label}</span>,
    Key: ({ children }: { children: ReactNode }) => <kbd>{children}</kbd>,
    List: ({ children }: { children: ReactNode }) => <div role="listbox">{children}</div>,
    Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Shortcut: ({ children }: { children: ReactNode }) => <span>{children}</span>,
    Title: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  }

  return {
    Box: Container,
    Button: Object.assign(Button, { Glyph: Container }),
    Command,
    DataGrid: {
      Content: DataGridContent,
      Root: DataGridRoot,
      Table: DataGridTable,
      Viewport: Container,
    },
    KeyboardInput,
    ResizableHandle: Container,
    ResizablePanel: Container,
    ResizablePanelGroup: Container,
    Text: Container,
    Tooltip: {
      Content: Container,
      Root: Container,
      Trigger: Container,
    },
    toasts: { error: toastError, success: toastSuccess },
  }
})

const initialClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

afterEach(() => {
  cleanup()
  tableViewState.error = null
  tableViewState.canOpenRowEditor = true
  tableViewState.filters = [{ id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' }]
  tableViewState.isInitialLoading = false
  tableViewState.isRefreshing = false
  tableViewState.hasNextPage = false
  tableViewState.hasPreviousPage = false
  tableViewState.loadedRowCount = 2
  tableViewState.page = 1
  tableViewState.activeFieldEditorTarget = null
  tableViewState.detailPaneMode = 'closed'
  tableViewState.rowEditor.activeRowId = null
  tableViewState.rowEditor.editedRowIds = []
  tableViewState.rowValues = null
  tableViewState.selectedRowIds = []
  tableViewState.table = {}
  tableViewState.tableColumns = []
  mutationLedgerEntries.length = 0
  tableViewState.recentlyAppliedCells = {}
  tableViewState.recentlyInsertedRowIds = new Set()
  stagedFieldsByRowId.current = {}
  stagedValuesByRowId.current = {}
  gridContextMenuProps.current = null
  useTableViewStateOptions.current = null
  tableViewState.setPage.mockReset()
  tableViewState.setFilters.mockReset()
  tableViewState.handleCellEditRequest.mockReset()
  tableViewState.handleRowEditorOpenChange.mockReset()
  tableViewState.rowEditor.openInsert.mockReset()
  toastError.mockReset()
  toastSuccess.mockReset()
  if (initialClipboardDescriptor === undefined) {
    Reflect.deleteProperty(navigator, 'clipboard')
  } else {
    Object.defineProperty(navigator, 'clipboard', initialClipboardDescriptor)
  }
})

function renderTableView(): ReturnType<typeof render> & { rerenderTableView: () => void } {
  const result = render(
    <AppHotkeysProvider>
      <TableView tableName="accounts" />
    </AppHotkeysProvider>,
  )
  return {
    ...result,
    rerenderTableView: () => {
      result.rerender(
        <AppHotkeysProvider>
          <TableView tableName="accounts" />
        </AppHotkeysProvider>,
      )
    },
  }
}

describe('TableView cell actions', () => {
  function configureNameCell(value: unknown) {
    tableViewState.tableColumns = [
      {
        accessorKey: 'name',
        column: { name: 'name', column_type: { type: 'Text' }, nullable: false },
        id: 'name',
        isSortable: true,
        label: 'Name',
      },
    ]
    tableViewState.table = {
      getFocusedCell: () => ({ column: { id: 'name' }, row: { id: 'row-1' } }),
      getRowModel: () => ({ rows: [{ id: 'row-1', original: { id: 'row-1', name: value } }] }),
    }
  }

  it('edits and filters by the displayed staged value through the shared context actions', () => {
    configureNameCell('Grace')
    stagedValuesByRowId.current = { 'row-1': { name: 'Katherine' } }
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      getCellActions: (target: { columnId: string; rowId: string }) => {
        canEdit: boolean
        canFilterBy: boolean
      }
      onEditCell: (target: { columnId: string; rowId: string }) => void
      onFilterByCell: (target: { columnId: string; rowId: string }) => void
    }
    const target = { columnId: 'name', rowId: 'row-1' }

    expect(menuProps.getCellActions(target)).toMatchObject({ canEdit: true, canFilterBy: true })
    menuProps.onEditCell(target)
    menuProps.onFilterByCell(target)

    expect(tableViewState.handleCellEditRequest).toHaveBeenCalledWith(target)
    expect(tableViewState.setFilters).toHaveBeenCalledWith([
      tableViewState.filters[0],
      expect.objectContaining({ column: 'name', operator: 'eq', value: 'Katherine' }),
    ])
  })

  it('copies the focused cell with Mod+C and renders a success toast', async () => {
    configureNameCell('Grace')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderTableView()

    const defaultAllowed = fireEvent.keyDown(screen.getByRole('button', { name: 'Edit row 1' }), {
      key: 'c',
      ctrlKey: true,
    })

    expect(defaultAllowed).toBe(false)
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('Grace')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cell value copied', {
      duration: 'brief',
      id: '["cell-copy","connection-1:main:schema-1:accounts","row-1","name"]',
    })
  })

  it('renders an error toast when the clipboard write fails', async () => {
    configureNameCell('Grace')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
    })
    renderTableView()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit row 1' }), {
      key: 'c',
      ctrlKey: true,
    })

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Couldn't copy value")
    })
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('copies a binary context target in the selected format and renders a success toast', async () => {
    const value = new Uint8Array([0, 1, 254, 255])
    tableViewState.tableColumns = [
      {
        accessorKey: 'payload',
        column: { name: 'payload', column_type: { type: 'Bytea' }, nullable: false },
        id: 'payload',
        isSortable: false,
        label: 'Payload',
      },
    ]
    tableViewState.table = {
      getRowModel: () => ({ rows: [{ id: 'row-1', original: { id: 'row-1', payload: value } }] }),
    }
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      getCellActions: (target: { columnId: string; rowId: string }) => { copyAs: string[] }
      onCopyCell: (target: { columnId: string; rowId: string }, format: 'hex' | 'base64') => void
    }
    const target = { columnId: 'payload', rowId: 'row-1' }

    expect(menuProps.getCellActions(target).copyAs).toEqual(['hex', 'base64'])
    menuProps.onCopyCell(target, 'base64')

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('AAH+/w==')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cell value copied as Base64', {
      duration: 'brief',
      id: '["cell-copy","connection-1:main:schema-1:accounts","row-1","payload"]',
    })
  })

  it('deduplicates repeated copies of one cell without merging different cells', async () => {
    configureNameCell('Grace')
    tableViewState.table = {
      getFocusedCell: () => ({ column: { id: 'name' }, row: { id: 'row-1' } }),
      getRowModel: () => ({
        rows: [
          { id: 'row-1', original: { id: 'row-1', name: 'Grace' } },
          { id: 'row-2', original: { id: 'row-2', name: 'Ada' } },
        ],
      }),
    }
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      onCopyCell: (target: { columnId: string; rowId: string }) => void
    }

    menuProps.onCopyCell({ columnId: 'name', rowId: 'row-1' })
    menuProps.onCopyCell({ columnId: 'name', rowId: 'row-1' })
    menuProps.onCopyCell({ columnId: 'name', rowId: 'row-2' })

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledTimes(3)
    })
    expect(toastSuccess.mock.calls.map(([, options]) => options.id)).toEqual([
      '["cell-copy","connection-1:main:schema-1:accounts","row-1","name"]',
      '["cell-copy","connection-1:main:schema-1:accounts","row-1","name"]',
      '["cell-copy","connection-1:main:schema-1:accounts","row-2","name"]',
    ])
  })
})

describe('TableView pagination hotkeys', () => {
  it('changes page only while focus is within the grid scope', () => {
    tableViewState.hasNextPage = true
    tableViewState.hasPreviousPage = true
    tableViewState.page = 2

    renderTableView()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit row 1' }), {
      key: 'ArrowRight',
      ctrlKey: true,
    })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit row 1' }), {
      key: 'ArrowLeft',
      ctrlKey: true,
    })
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Filter input' }), {
      key: 'ArrowRight',
      ctrlKey: true,
    })

    expect(tableViewState.setPage.mock.calls).toEqual([[3], [1]])
  })

  it('does not paginate through unavailable or loading pages', () => {
    tableViewState.hasNextPage = false
    tableViewState.hasPreviousPage = false
    tableViewState.isInitialLoading = true
    tableViewState.page = 2

    renderTableView()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit row 1' }), {
      key: 'ArrowRight',
      ctrlKey: true,
    })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit row 1' }), {
      key: 'ArrowLeft',
      ctrlKey: true,
    })

    expect(tableViewState.setPage).not.toHaveBeenCalled()
  })
})

describe('TableView query status', () => {
  it('stages checked-row deletion from the stable row editor surface', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowEditor.editedRowIds = ['row-1', 'row-2']
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }

    renderTableView()

    fireEvent.click(screen.getByRole('button', { name: 'Delete checked rows' }))

    expect(mutationLedgerDispatch).toHaveBeenCalledWith({
      type: 'deleteRows',
      rowIds: ['row-1', 'row-2'],
    })
    expect(tableViewState.handleRowsStagedForDeletion).toHaveBeenCalledWith(['row-1', 'row-2'])
  })

  it('blocks inline editing and marks rows while their deletion is staged', () => {
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })

    renderTableView()

    expect(screen.getByTestId('row-1-status').textContent).toBe('stagedDeletion')
    fireEvent.click(screen.getByRole('button', { name: 'Edit row 1' }))
    expect(tableViewState.handleCellEditRequest).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Edit row 2' }))
    expect(tableViewState.handleCellEditRequest).toHaveBeenCalledWith({
      columnId: 'name',
      rowId: 'row-2',
    })
  })

  it('marks recently inserted rows while their ephemeral highlight is active', () => {
    tableViewState.recentlyInsertedRowIds = new Set(['row-1'])

    renderTableView()

    expect(screen.getByTestId('row-1-status').textContent).toBe('recentlyInserted')
  })

  it('keeps staged deletion authoritative over the recently inserted highlight', () => {
    tableViewState.recentlyInsertedRowIds = new Set(['row-1'])
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })

    renderTableView()

    expect(screen.getByTestId('row-1-status').textContent).toBe('stagedDeletion')
  })

  it('projects only applicable staged data fields into grid cell status', () => {
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    stagedValuesByRowId.current = { 'row-1': { name: 'Grace' } }

    renderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('stagedUpdate')
    expect(screen.getByTestId('row-1-email-status').textContent).toBe('default')
    expect(screen.getByTestId('row-1-selection-status').textContent).toBe('default')
  })

  it('marks recently applied cells while their ephemeral highlight is active', () => {
    tableViewState.recentlyAppliedCells = { 'row-1': new Set(['name']) }

    renderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('recentlyApplied')
    expect(screen.getByTestId('row-1-email-status').textContent).toBe('default')
    expect(screen.getByTestId('row-1-selection-status').textContent).toBe('default')
  })

  it('keeps a staged update authoritative over the recently applied highlight', () => {
    tableViewState.recentlyAppliedCells = { 'row-1': new Set(['name', 'email']) }
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    stagedValuesByRowId.current = { 'row-1': { name: 'Grace' } }

    renderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('stagedUpdate')
    expect(screen.getByTestId('row-1-email-status').textContent).toBe('recentlyApplied')
  })

  it('uses the editing treatment after a staged cell opens its inline editor', () => {
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.table = { getRowModel: () => ({ rows: [] }) }

    renderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('default')
  })

  it('gives staged deletion precedence over staged field status', () => {
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }

    renderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('default')
  })

  it('wires one viewport context bridge to semantic Data Grid callbacks and ledger recovery', () => {
    renderTableView()

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

    renderTableView()
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
        accessorKey: 'name',
        id: 'name',
        isSortable: true,
        label: 'Name',
        column: { name: 'name', column_type: { type: 'Text' }, nullable: false },
      },
    ]
    tableViewState.schemaColumns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ]

    renderTableView()

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
        accessorKey: 'name',
        id: 'name',
        isSortable: true,
        label: 'Name',
        column: { name: 'name', column_type: { type: 'Text' }, nullable: false },
      },
    ]
    tableViewState.schemaColumns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ]

    renderTableView()

    expect(screen.queryByRole('dialog', { name: 'Edit name' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Complete Apply' }))
    expect(tableViewState.handleMutationApplySuccess).toHaveBeenCalledWith({
      'row-1': new Set(['name']),
    })
  })

  it('announces refresh completion and filtered emptiness', async () => {
    const { rerenderTableView } = renderTableView()
    const status = screen.getByRole('status')

    tableViewState.isRefreshing = true
    rerenderTableView()

    expect(screen.getByRole('table', { name: 'accounts rows' }).getAttribute('aria-busy')).toBe(
      'true',
    )
    expect(screen.getByText('Refreshing rows')).toBe(status)
    expect(document.querySelector('[data-loading="false"]')).not.toBeNull()

    tableViewState.isRefreshing = false
    tableViewState.loadedRowCount = 0
    rerenderTableView()

    await waitFor(() => {
      expect(status.textContent).toBe('Rows refreshed. No rows match these filters')
    })
    expect(screen.getByText('No rows match these filters')).not.toBe(status)
    expect(screen.getByRole('table', { name: 'accounts rows' }).hasAttribute('aria-busy')).toBe(
      false,
    )
  })

  it('clears filters from the filtered-empty state', () => {
    tableViewState.loadedRowCount = 0

    renderTableView()

    const clearButton = screen.getByRole('button', { name: 'Clear' })
    fireEvent.click(clearButton)

    expect(tableViewState.setFilters).toHaveBeenCalledWith([])
  })

  it('offers row insertion from an unfiltered empty table', () => {
    tableViewState.filters = []
    tableViewState.loadedRowCount = 0

    renderTableView()

    expect(screen.getAllByText('This table is empty')).toHaveLength(2)
    expect(screen.getByRole('status').textContent).toBe('This table is empty')
    const table = screen.getByRole('table', { name: 'accounts rows' })
    const contextualInsert = within(table).getByRole('button', { name: 'Insert row' })
    const toolbarInsert = screen
      .getAllByRole('button', { name: 'Insert row' })
      .find((button) => button !== contextualInsert)
    if (toolbarInsert === undefined) {
      throw new Error('Expected the toolbar insert action')
    }

    fireEvent.click(contextualInsert)
    expect(tableViewState.rowEditor.openInsert).toHaveBeenCalledOnce()

    tableViewState.rowEditor.openInsert.mockClear()
    fireEvent.click(toolbarInsert)
    expect(tableViewState.rowEditor.openInsert).toHaveBeenCalledOnce()
  })

  it('does not present a later empty page as an empty table', () => {
    tableViewState.filters = []
    tableViewState.loadedRowCount = 0
    tableViewState.page = 2

    renderTableView()

    expect(screen.queryByText('This table is empty')).toBeNull()
    expect(
      within(screen.getByRole('table', { name: 'accounts rows' })).queryByRole('button', {
        name: 'Insert row',
      }),
    ).toBeNull()
  })

  it('presents query failures as alerts with corrective reload guidance', () => {
    tableViewState.error = 'Network request failed'
    tableViewState.filters = []
    tableViewState.loadedRowCount = 0

    renderTableView()

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain("Couldn't load rows")
    expect(alert.textContent).toContain('Network request failed')
    expect(alert.textContent).toContain('Check the connection, then reload the page to try again.')
  })
})

describe('TableView insert row hotkey', () => {
  it('opens the insert pane with Alt+I', () => {
    renderTableView()

    fireEvent.keyDown(document, { altKey: true, key: 'i' })

    expect(tableViewState.rowEditor.openInsert).toHaveBeenCalledTimes(1)
    expect(tableViewState.handleRowEditorOpenChange).not.toHaveBeenCalled()
  })

  it('closes the insert pane with Alt+I when insert is already open', () => {
    tableViewState.detailPaneMode = 'insert'
    renderTableView()

    fireEvent.keyDown(document, { altKey: true, key: 'i' })

    expect(tableViewState.handleRowEditorOpenChange).toHaveBeenCalledWith(false)
    expect(tableViewState.rowEditor.openInsert).not.toHaveBeenCalled()
  })

  it('does not open insert with Alt+I when the editor cannot open', () => {
    tableViewState.canOpenRowEditor = false
    renderTableView()

    fireEvent.keyDown(document, { altKey: true, key: 'i' })

    expect(tableViewState.rowEditor.openInsert).not.toHaveBeenCalled()
    expect(tableViewState.handleRowEditorOpenChange).not.toHaveBeenCalled()
  })

  it('does not run the insert hotkey from text inputs', () => {
    renderTableView()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    fireEvent.keyDown(input, { altKey: true, key: 'i' })

    expect(tableViewState.rowEditor.openInsert).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('does not run the insert hotkey from dialog interaction layers', () => {
    renderTableView()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'alertdialog')
    const button = document.createElement('button')
    dialog.appendChild(button)
    document.body.appendChild(dialog)
    button.focus()

    fireEvent.keyDown(button, { altKey: true, key: 'i' })

    expect(tableViewState.rowEditor.openInsert).not.toHaveBeenCalled()
    document.body.removeChild(dialog)
  })

  it('shows the insert row shortcut in the toolbar button tooltip', () => {
    renderTableView()

    expect(screen.getByTestId('keyboard-input').textContent).toBe(appHotkeys.insertRow)
  })

  it('registers an Insert row command in the command palette', () => {
    renderTableView()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(screen.getByRole('option', { name: 'Insert row' })).toBeTruthy()
  })
})
