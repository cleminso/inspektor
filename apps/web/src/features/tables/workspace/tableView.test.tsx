import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { forwardRef, type ReactElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { TableView } from '@tables/workspace/tableView'

const tableViewState = vi.hoisted(() => ({
  activeColumnId: null,
  activeFieldEditorTarget: null as { columnId: string; rowId: string } | null,
  activeFieldEditorRowValues: null as Record<string, unknown> | null,
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
  handleMutationUpdatesApplied: vi.fn(),
  handleRowsStagedForDeletion: vi.fn(),
  closeRowEditor: vi.fn(),
  hasCellSelection: false,
  hasNextPage: false,
  isInitialLoading: false,
  isRefreshing: false,
  mutationExecutor: {
    deleteRow: vi.fn(),
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
  rows: [{ id: 'row-1' }, { id: 'row-2' }] as Array<Record<string, unknown>>,
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
}))
const stageDeletions = vi.hoisted(() => vi.fn())
const mutationLedgerUndoDeletions = vi.hoisted(() => vi.fn())
const mutationLedgerRevertField = vi.hoisted(() => vi.fn())
const mutationLedgerRevertRowUpdate = vi.hoisted(() => vi.fn())
const mutationLedgerRebaseRows = vi.hoisted(() => vi.fn())
const mutationEditorController = vi.hoisted(() => ({ actions: {}, state: { draft: {} } }))
const mutationEditorOptions = vi.hoisted(() => ({
  current: null as null | { initialRowValues: Record<string, unknown>; rowId: string },
}))
const editRowFormProps = vi.hoisted(() => ({
  current: null as null | { draftController: unknown; rowValues: Record<string, unknown> },
}))
const stagedFieldsByRowId = vi.hoisted(() => ({
  current: {} as Readonly<Record<string, ReadonlySet<string>>>,
}))
const stagedValuesByRowId = vi.hoisted(() => ({
  current: {} as Readonly<Record<string, Readonly<Record<string, unknown>>>>,
}))
const mutationExecution = vi.hoisted(() => ({
  current: { error: null as string | null, status: 'idle' as 'applying' | 'failed' | 'idle' },
}))
const gridContextMenuProps = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }))
const gridCellContextMenu = vi.hoisted(() => vi.fn())
const gridRowContextMenu = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const useTableViewStateOptions = vi.hoisted(() => ({
  current: null as null | {
    onUndoRowDeletions?: (rowIds: readonly string[]) => void
    schemaColumns?: readonly unknown[]
    stagedValuesByRowId?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
    tableKey?: string
  },
}))
const mutationLedgerProviderProps = vi.hoisted(() => ({
  current: null as null | { schemaColumns: readonly unknown[]; scopeKey: string },
}))
const fieldEditorProps = vi.hoisted(() => ({
  current: null as null | { rowId: string; rowValues: Record<string, unknown> },
}))
const schemaColumns = vi.hoisted(() => [
  { name: 'name', column_type: { type: 'Text' as const }, nullable: false },
])
const nameTableColumn = {
  accessorKey: 'name',
  id: 'name',
  isSortable: true,
  label: 'Name',
  column: schemaColumns[0]!,
}
const mutationLedgerEntries = vi.hoisted(
  () => [] as Array<{ entryId: `delete:${string}`; kind: 'delete'; rowId: string }>,
)

vi.mock('@tables/workspace/useTableViewState', () => ({
  useTableViewState: (options: {
    onUndoRowDeletions?: (rowIds: readonly string[]) => void
    schemaColumns?: readonly unknown[]
    stagedValuesByRowId?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
    tableKey?: string
  }) => {
    useTableViewStateOptions.current = options
    return tableViewState
  },
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeSchema: () => null,
}))

vi.mock('@tables/schema/tableSchema', () => ({
  getTableColumns: () => schemaColumns,
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({ openSchemaView: vi.fn(), scope: 'connection-1:main:schema-1' }),
}))

vi.mock('@tables/mutationLedger/provider', () => ({
  TableMutationLedgerProvider: ({
    children,
    schemaColumns,
    scopeKey,
  }: {
    children: ReactNode
    schemaColumns: readonly unknown[]
    scopeKey: string
  }) => {
    mutationLedgerProviderProps.current = { schemaColumns, scopeKey }
    return children
  },
  useTableMutationLedger: () => ({
    execution: mutationExecution.current,
    rebaseRows: mutationLedgerRebaseRows,
    stageDeletions,
    ledger: { entries: mutationLedgerEntries, hasInvalidDraft: false },
    undoDeletions: mutationLedgerUndoDeletions,
    revertField: mutationLedgerRevertField,
    revertRowUpdate: mutationLedgerRevertRowUpdate,
    stagedFieldsByRowId: stagedFieldsByRowId.current,
    stagedValuesByRowId: stagedValuesByRowId.current,
  }),
  useTableMutationEditorController: (options: {
    initialRowValues: Record<string, unknown>
    rowId: string
  }) => {
    mutationEditorOptions.current = options
    return mutationEditorController
  },
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
    onAppliedUpdates,
    onApplySuccess,
  }: {
    onAppliedUpdates?: (appliedUpdateFields: Readonly<Record<string, ReadonlySet<string>>>) => void
    onApplySuccess?: () => void
  }) => (
    <button
      type="button"
      onClick={() => {
        onAppliedUpdates?.({ 'row-1': new Set(['name']) })
        onApplySuccess?.()
      }}
    >
      Complete Apply
    </button>
  ),
}))

vi.mock('@tables/floatingWidget/fieldEditorMutationWidget', () => ({
  default: ({
    column,
    onClose,
    onComplete,
    rowId,
    rowValues,
  }: {
    column: { name: string }
    onClose: () => void
    onComplete: (direction: string) => void
    rowId: string
    rowValues: Record<string, unknown>
  }) => {
    fieldEditorProps.current = { rowId, rowValues }
    return (
      <div role="dialog" aria-label={`Edit ${column.name}`}>
        <button type="button" onClick={onClose}>
          Close field
        </button>
        <button type="button" onClick={() => onComplete('enter')}>
          Complete field
        </button>
      </div>
    )
  },
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

vi.mock('@tables/rowEditor/editForm', () => ({
  EditRowForm: ({
    draftController,
    rowValues,
  }: {
    draftController: unknown
    rowValues: Record<string, unknown>
  }) => {
    editRowFormProps.current = { draftController, rowValues }
    return <div>Edit row fields</div>
  },
}))

vi.mock('@tables/rowEditor/insertForm', () => ({
  InsertRowForm: () => null,
}))

vi.mock('@tables/rowEditor/sidePane', () => ({
  RowEditorSidePanel: ({
    children,
    editedRowIds,
    mutationDisabled,
    onClose,
    onConfirmDelete,
  }: {
    children: ReactNode
    editedRowIds: string[]
    mutationDisabled?: boolean
    onClose?: () => void
    onConfirmDelete?: (rowIds: readonly string[]) => void
  }) => (
    <>
      {children}
      {onClose === undefined ? null : (
        <button type="button" onClick={onClose}>
          Close row editor
        </button>
      )}
      {onConfirmDelete === undefined ? null : (
        <button
          type="button"
          disabled={mutationDisabled}
          onClick={() => onConfirmDelete(editedRowIds)}
        >
          Delete checked rows
        </button>
      )}
    </>
  ),
}))

vi.mock('@inspector/ds', () => {
  interface ContainerProps {
    'aria-live'?: 'polite'
    children?: ReactNode
    render?: ReactElement
    role?: string
  }

  const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
    { 'aria-live': ariaLive, children, render, role },
    ref,
  ) {
    return (
      <div ref={ref} aria-live={ariaLive} role={role}>
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
      {tableViewState.rows.length === 0 ? emptyContent : null}
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
  tableViewState.activeColumnId = null
  tableViewState.canOpenRowEditor = true
  tableViewState.filters = [{ id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' }]
  tableViewState.isInitialLoading = false
  tableViewState.isRefreshing = false
  tableViewState.hasCellSelection = false
  tableViewState.hasNextPage = false
  tableViewState.rows = [{ id: 'row-1' }, { id: 'row-2' }]
  tableViewState.page = 1
  tableViewState.activeFieldEditorTarget = null
  tableViewState.activeFieldEditorRowValues = null
  tableViewState.detailPaneMode = 'closed'
  tableViewState.rowEditor.activeRowId = null
  tableViewState.rowEditor.editedRowIds = []
  tableViewState.rowValues = null
  tableViewState.table = {}
  tableViewState.tableColumns = []
  mutationLedgerEntries.length = 0
  tableViewState.recentlyAppliedCells = {}
  tableViewState.recentlyInsertedRowIds = new Set()
  stagedFieldsByRowId.current = {}
  stagedValuesByRowId.current = {}
  mutationExecution.current = { error: null, status: 'idle' }
  gridContextMenuProps.current = null
  useTableViewStateOptions.current = null
  mutationLedgerProviderProps.current = null
  fieldEditorProps.current = null
  mutationEditorOptions.current = null
  editRowFormProps.current = null
  mutationLedgerRebaseRows.mockReset()
  tableViewState.setPage.mockReset()
  tableViewState.setFilters.mockReset()
  tableViewState.handleCellEditRequest.mockReset()
  tableViewState.handleEscape.mockReset()
  tableViewState.handleMutationApplySuccess.mockReset()
  tableViewState.handleMutationUpdatesApplied.mockReset()
  tableViewState.closeRowEditor.mockReset()
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

function configureNameCell(value: unknown) {
  tableViewState.tableColumns = [nameTableColumn]
  tableViewState.table = {
    getFocusedCell: () => ({ column: { id: 'name' }, row: { id: 'row-1' } }),
    getRowModel: () => ({ rows: [{ id: 'row-1', original: { id: 'row-1', name: value } }] }),
  }
}

describe('TableView selection dismissal', () => {
  it('routes Escape to the active selection state', () => {
    tableViewState.hasCellSelection = true
    renderTableView()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(tableViewState.handleEscape).toHaveBeenCalledOnce()
  })
})

describe('TableView cell actions', () => {
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
})

describe('TableView pagination hotkeys', () => {
  it('changes page only while focus is within the grid scope', () => {
    tableViewState.hasNextPage = true
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
  it('passes staged-deletion recovery into table state', () => {
    renderTableView()

    useTableViewStateOptions.current?.onUndoRowDeletions?.(['row-1'])

    expect(mutationLedgerUndoDeletions).toHaveBeenCalledWith(['row-1'])
  })

  it('stages checked-row deletion from the stable row editor surface', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowEditor.editedRowIds = ['row-1', 'row-2']
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }

    renderTableView()

    fireEvent.click(screen.getByRole('button', { name: 'Delete checked rows' }))

    expect(stageDeletions).toHaveBeenCalledWith(['row-1', 'row-2'])
    expect(tableViewState.handleRowsStagedForDeletion).toHaveBeenCalledWith(['row-1', 'row-2'])
    expect(mutationEditorOptions.current).toEqual({
      initialRowValues: { id: 'row-1', name: 'Ada' },
      rowId: 'row-1',
    })
    expect(editRowFormProps.current).toEqual({
      draftController: mutationEditorController,
      rowValues: { id: 'row-1', name: 'Ada' },
    })
  })

  it('closes the row editor without cancelling its active selection', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowEditor.editedRowIds = ['row-1', 'row-2']
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }

    renderTableView()
    fireEvent.click(screen.getByRole('button', { name: 'Close row editor' }))

    expect(tableViewState.closeRowEditor).toHaveBeenCalledOnce()
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

  it('wires the active scalar target to the explicit Floating field editor', async () => {
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.activeFieldEditorRowValues = { id: 'row-1', name: 'Ada' }
    tableViewState.tableColumns = [nameTableColumn]

    renderTableView()

    expect(await screen.findByRole('dialog', { name: 'Edit name' })).toBeTruthy()
    expect(fieldEditorProps.current).toEqual({
      rowId: 'row-1',
      rowValues: { id: 'row-1', name: 'Ada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close field' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete field' }))
    expect(tableViewState.handleFieldEditorCancel).toHaveBeenCalledOnce()
    expect(tableViewState.handleFieldEditorComplete).toHaveBeenCalledWith('enter')
  })

  it('blocks inline editing while Apply is running', () => {
    mutationExecution.current = { error: null, status: 'applying' }
    tableViewState.detailPaneMode = 'rows'
    configureNameCell('Ada')

    renderTableView()
    fireEvent.click(screen.getByRole('button', { name: 'Edit row 1' }))

    expect(tableViewState.handleCellEditRequest).not.toHaveBeenCalled()
    expect(
      (
        gridContextMenuProps.current as {
          getCellActions: (target: { columnId: string; rowId: string }) => { canEdit: boolean }
        }
      ).getCellActions({ columnId: 'name', rowId: 'row-1' }).canEdit,
    ).toBe(false)
    expect(screen.getByText('Applying changes')).toBeTruthy()
    expect(screen.queryByText('Edit row fields')).toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Delete checked rows' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('passes one table scope and schema projection through the composition root', () => {
    renderTableView()

    expect(useTableViewStateOptions.current).toMatchObject({
      schemaColumns,
      tableKey: 'connection-1:main:schema-1:accounts',
    })
    expect(mutationLedgerProviderProps.current).toEqual({
      schemaColumns,
      scopeKey: 'connection-1:main:schema-1:accounts',
    })
  })

  it('suppresses inline editing while keeping the staged widget available beside the row pane', () => {
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.activeFieldEditorRowValues = { id: 'row-1', name: 'Ada' }
    tableViewState.detailPaneMode = 'rows'
    tableViewState.tableColumns = [nameTableColumn]

    renderTableView()

    expect(screen.queryByRole('dialog', { name: 'Edit name' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Complete Apply' }))
    expect(tableViewState.handleMutationUpdatesApplied).toHaveBeenCalledWith({
      'row-1': new Set(['name']),
    })
    expect(tableViewState.handleMutationApplySuccess).toHaveBeenCalledOnce()
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
    tableViewState.rows = []
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
    tableViewState.rows = []

    renderTableView()

    const clearButton = screen.getByRole('button', { name: 'Clear' })
    fireEvent.click(clearButton)

    expect(tableViewState.setFilters).toHaveBeenCalledWith([])
  })

  it('offers row insertion from an unfiltered empty table', () => {
    tableViewState.filters = []
    tableViewState.rows = []

    renderTableView()

    expect(screen.getAllByText('This table is empty')).toHaveLength(2)
    expect(screen.getByRole('status').textContent).toBe('This table is empty')
    const table = screen.getByRole('table', { name: 'accounts rows' })
    const contextualInsert = within(table).getByRole('button', { name: 'Insert row' })

    fireEvent.click(contextualInsert)
    expect(tableViewState.rowEditor.openInsert).toHaveBeenCalledOnce()
  })

  it('does not present a later empty page as an empty table', () => {
    tableViewState.filters = []
    tableViewState.rows = []
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
    tableViewState.rows = []

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
    expect(tableViewState.closeRowEditor).not.toHaveBeenCalled()
  })

  it('closes the insert pane with Alt+I when insert is already open', () => {
    tableViewState.detailPaneMode = 'insert'
    renderTableView()

    fireEvent.keyDown(document, { altKey: true, key: 'i' })

    expect(tableViewState.closeRowEditor).toHaveBeenCalledOnce()
    expect(tableViewState.rowEditor.openInsert).not.toHaveBeenCalled()
  })

  it('does not open insert with Alt+I when the editor cannot open', () => {
    tableViewState.canOpenRowEditor = false
    renderTableView()

    fireEvent.keyDown(document, { altKey: true, key: 'i' })

    expect(tableViewState.rowEditor.openInsert).not.toHaveBeenCalled()
    expect(tableViewState.closeRowEditor).not.toHaveBeenCalled()
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
