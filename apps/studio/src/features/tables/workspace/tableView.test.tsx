import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { forwardRef, useState, type ReactElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
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
  isPageNavigationPending: false,
  isRefreshing: false,
  mutationExecutor: {
    deleteRow: vi.fn(),
    insertRow: vi.fn(),
    updateRow: vi.fn(),
  },
  page: 1,
  pageSize: 100,
  recentlyAppliedCells: {} as Readonly<Record<string, ReadonlySet<string>>>,
  recentlyInsertedRowIds: new Set<string>() as ReadonlySet<string>,
  renderRowCheckbox: true,
  reorderableColumnIds: [] as string[],
  rowEditor: {
    activeRowId: null as string | null,
    canNavigateNext: false,
    canNavigatePrevious: false,
    editedRowIds: [] as string[],
    goToNextRow: vi.fn(),
    goToPreviousRow: vi.fn(),
    navigationLabel: null as string | null,
    openInsert: vi.fn(),
  },
  rowValues: null as Record<string, unknown> | null,
  rowEditorQueryError: null as string | null,
  rowEditorQueryLoading: false,
  rows: [{ id: 'row-1' }, { id: 'row-2' }] as Array<Record<string, unknown>>,
  scrollResetKey: JSON.stringify({ filters: [] }),
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setPageSize: vi.fn(),
  table: {} as {
    getFocusedCell?: () => { column: { id: string }; row: { id: string } } | undefined
    getRowModel?: () => {
      rows: Array<{
        getVisibleCells?: () => Array<{
          column: { id: string }
          getCanSelect: () => boolean
          getIsSelected: () => boolean
        }>
        id: string
        original: Record<string, unknown>
      }>
    }
    selectCellRange?: (range: {
      anchorColumnId: string
      anchorRowId: string
      focusColumnId: string
      focusRowId: string
    }) => void
  },
  tableColumns: [] as Array<{
    accessorKey: string
    column: null | {
      column_type: { type: string }
      name: string
      nullable: boolean
    }
    id: string
    isReadOnly?: true
    isSortable: boolean
    label: string
  }>,
}))
const stageDeletions = vi.hoisted(() => vi.fn())
const stageInsert = vi.hoisted(() => vi.fn())
const mutationLedgerRebaseRows = vi.hoisted(() => vi.fn())
const mutationLedgerUndoDeletions = vi.hoisted(() => vi.fn())
const mutationLedgerUndoReviewOperation = vi.hoisted(() => vi.fn())
const revertField = vi.hoisted(() => vi.fn())
const revertRowUpdate = vi.hoisted(() => vi.fn())
const mutationEditorController = vi.hoisted(() => ({ actions: {}, state: { draft: {} } }))
const stagedFieldsByRowId = vi.hoisted(() => ({
  current: {} as Readonly<Record<string, ReadonlySet<string>>>,
}))
const stagedValuesByRowId = vi.hoisted(() => ({
  current: {} as Readonly<Record<string, Readonly<Record<string, unknown>>>>,
}))
const invalidDraftSources = vi.hoisted(() => ({
  hasInvalidInsertionDraft: false,
  invalidUpdateRowIds: new Set<string>(),
}))
const mutationExecution = vi.hoisted(() => ({
  current: { error: null as string | null, status: 'idle' as 'applying' | 'failed' | 'idle' },
}))
const gridContextMenuProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const dataGridRootProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const dataGridContentProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const gridCellContextMenu = vi.hoisted(() => vi.fn())
const gridRowContextMenu = vi.hoisted(() => vi.fn())
const useTableViewStateOptions = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}))
const mutationLedgerProviderProps = vi.hoisted(() => ({
  current: null as { schemaColumns: readonly unknown[]; scopeKey: string } | null,
}))
const mutationEditorOptions = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}))
const editRowFormProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const fieldEditorProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const toastError = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const reportConnectionContentReady = vi.hoisted(() => vi.fn())
const schemaColumns = vi.hoisted(
  (): Array<{
    name: string
    column_type: { type: 'Json' | 'Text' }
    nullable: boolean
  }> => [{ name: 'name', column_type: { type: 'Text' }, nullable: false }],
)
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
  useTableViewState: (options: Record<string, unknown>) => {
    useTableViewStateOptions.current = options
    return tableViewState
  },
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeSchema: () => null,
}))

vi.mock('@app/runtime/connectionContentBoundary', () => ({
  useConnectionContentReady: reportConnectionContentReady,
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
    hasInvalidInsertionDraft: invalidDraftSources.hasInvalidInsertionDraft,
    invalidUpdateRowIds: invalidDraftSources.invalidUpdateRowIds,
    rebaseRows: mutationLedgerRebaseRows,
    stageDeletions,
    stageInsert,
    ledger: { entries: mutationLedgerEntries, hasInvalidDraft: false },
    undoDeletions: mutationLedgerUndoDeletions,
    revertField,
    revertRowUpdate,
    stagedFieldsByRowId: stagedFieldsByRowId.current,
    stagedValuesByRowId: stagedValuesByRowId.current,
    undoReviewOperation: mutationLedgerUndoReviewOperation,
  }),
  useTableMutationEditorController: (options: Record<string, unknown>) => {
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
      onCellContextMenu: () => void
      onRowContextMenu: () => void
    }) => ReactNode
  }) => {
    gridContextMenuProps.current = props
    return children({
      composeViewport: (viewport) => viewport,
      onCellContextMenu: gridCellContextMenu,
      onRowContextMenu: gridRowContextMenu,
    })
  },
}))

vi.mock('@tables/floatingWidget/floatingWidget', () => ({
  TableMutationWidget: ({
    invalidDraftFeedback,
    onAppliedUpdates,
    onApplySuccess,
  }: {
    invalidDraftFeedback?: 'field' | 'global'
    onAppliedUpdates?: (fields: Readonly<Record<string, ReadonlySet<string>>>) => void
    onApplySuccess?: () => void
  }) => (
    <button
      type="button"
      data-invalid-draft-feedback={invalidDraftFeedback}
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
    onComplete: (key: string) => void
    rowId: string
    rowValues: Record<string, unknown>
  }) => {
    fieldEditorProps.current = { column, rowId, rowValues }
    return (
      <div role="dialog" aria-label="Edit name">
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
  DataGridExport: () => null,
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
  EditRowForm: (props: Record<string, unknown>) => {
    editRowFormProps.current = props
    return (
      <>
        <label>
          Edit row fields
          <input aria-label="Edit row fields" />
        </label>
        <button
          type="button"
          onClick={() => (props.onRepresentationChange as (representation: 'json') => void)('json')}
        >
          Show row JSON
        </button>
      </>
    )
  },
}))

vi.mock('@tables/rowEditor/insertForm', () => ({
  InsertRowForm: function InsertRowForm({ saveDisabled }: { saveDisabled?: boolean }) {
    const [draft, setDraft] = useState('')
    return (
      <label>
        Insert row fields
        <input
          aria-label="Insert row fields"
          disabled={saveDisabled}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
    )
  },
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

vi.mock('@inspektor/ds', () => {
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
    rowRendering,
  }: {
    emptyContent: ReactNode
    rowRendering?: 'all' | 'virtual'
  }) => {
    dataGridContentProps.current = { rowRendering }
    return <div>{tableViewState.rows.length === 0 ? emptyContent : null}</div>
  }
  const DataGridRootPropsCapture = ({
    columnDragPreview,
    reorderableColumnIds,
  }: {
    columnDragPreview?: (columnId: string) => ReactNode
    reorderableColumnIds?: readonly string[]
  }) => {
    dataGridRootProps.current = { columnDragPreview, reorderableColumnIds }
    return null
  }
  const DataGridRoot = ({
    children,
    columnDragPreview,
    getCellStatus,
    getRowStatus,
    onCellContextMenu,
    onCellEditRequest,
    onRowContextMenu,
    reorderableColumnIds,
  }: {
    children: ReactNode
    columnDragPreview?: (columnId: string) => ReactNode
    getCellStatus?: (cell: { column: { id: string }; row: { id: string } }) => string
    getRowStatus?: (row: { id: string }) => string
    onCellContextMenu?: (target: { columnId: string; rowId: string }, event: unknown) => void
    onCellEditRequest?: (target: { columnId: string; rowId: string }) => void
    onRowContextMenu?: (rowId: string, event: unknown) => void
    reorderableColumnIds?: readonly string[]
  }) => (
    <div>
      <DataGridRootPropsCapture
        columnDragPreview={columnDragPreview}
        reorderableColumnIds={reorderableColumnIds}
      />
      {tableViewState.renderRowCheckbox === true ? (
        <input type="checkbox" aria-label="Select row row-1" />
      ) : null}
      <div data-testid="row-1-status">{getRowStatus?.({ id: 'row-1' })}</div>
      <div data-testid="row-1-name-status">
        {getCellStatus?.({ column: { id: 'name' }, row: { id: 'row-1' } })}
      </div>
      <div data-testid="row-1-email-status">
        {getCellStatus?.({ column: { id: 'email' }, row: { id: 'row-1' } })}
      </div>
      <div data-testid="row-1-selection-status">
        {getCellStatus?.({
          column: { id: '\uE000inspector-row-selection' },
          row: { id: 'row-1' },
        })}
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

  const Button = forwardRef<
    HTMLButtonElement,
    {
      'aria-label'?: string
      children?: ReactNode
      disabled?: boolean
      onClick?: () => void
      type?: 'button' | 'submit' | 'reset'
    }
  >(function Button(
    { 'aria-label': ariaLabel, children, disabled, onClick, type = 'button' },
    ref,
  ) {
    return (
      <button ref={ref} aria-label={ariaLabel} disabled={disabled} onClick={onClick} type={type}>
        {children}
      </button>
    )
  })

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
    Group: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    GroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
    KeyboardInput: () => null,
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
  tableViewState.renderRowCheckbox = true
  tableViewState.reorderableColumnIds = []
  stagedFieldsByRowId.current = {}
  stagedValuesByRowId.current = {}
  invalidDraftSources.hasInvalidInsertionDraft = false
  invalidDraftSources.invalidUpdateRowIds = new Set()
  mutationExecution.current = { error: null, status: 'idle' }
  gridContextMenuProps.current = null
  dataGridRootProps.current = null
  dataGridContentProps.current = null
  useTableViewStateOptions.current = null
  mutationLedgerProviderProps.current = null
  mutationEditorOptions.current = null
  editRowFormProps.current = null
  fieldEditorProps.current = null
  gridCellContextMenu.mockReset()
  gridRowContextMenu.mockReset()
  tableViewState.handleEscape.mockReset()
  tableViewState.handleFieldEditorCancel.mockReset()
  tableViewState.handleFieldEditorComplete.mockReset()
  tableViewState.handleMutationApplySuccess.mockReset()
  tableViewState.handleMutationUpdatesApplied.mockReset()
  mutationLedgerRebaseRows.mockReset()
  mutationLedgerUndoDeletions.mockReset()
  mutationLedgerUndoReviewOperation.mockReset()
  stageDeletions.mockReset()
  stageInsert.mockReset()
  tableViewState.handleRowsStagedForDeletion.mockReset()
  tableViewState.setPage.mockReset()
  tableViewState.setFilters.mockReset()
  tableViewState.handleCellEditRequest.mockReset()
  tableViewState.closeRowEditor.mockReset()
  tableViewState.rowEditor.openInsert.mockReset()
  toastError.mockReset()
  toastSuccess.mockReset()
  reportConnectionContentReady.mockReset()
  schemaColumns.splice(1)
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

describe('TableView cell actions', () => {
  it('keeps provenance cells read-only', () => {
    tableViewState.tableColumns = [
      {
        accessorKey: '$createdAt',
        id: '$createdAt',
        isSortable: true,
        label: '$createdAt',
        column: {
          column_type: { type: 'Timestamp' },
          name: '$createdAt',
          nullable: false,
        },
        isReadOnly: true,
      },
    ]
    tableViewState.table = {
      getRowModel: () => ({
        rows: [
          {
            id: 'row-1',
            original: { id: 'row-1', $createdAt: new Date() },
          },
        ],
      }),
    }
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      getCellActions: (target: { columnId: string; rowId: string }) => { canEdit: boolean }
    }

    expect(menuProps.getCellActions({ columnId: '$createdAt', rowId: 'row-1' }).canEdit).toBe(false)
  })

  it('connects shared context actions to the table owner', async () => {
    configureNameCell('Grace')
    schemaColumns.push({ name: 'status', column_type: { type: 'Text' }, nullable: false })
    mutationLedgerEntries.push({ entryId: 'delete:row-2', kind: 'delete', rowId: 'row-2' })
    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    stagedValuesByRowId.current = { 'row-1': { name: 'Katherine' } }
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      canMutateRow: (rowId: string) => boolean
      canSelectRow: (rowId: string) => boolean
      getCellActions: (target: { columnId: string; rowId: string }) => unknown
      onCopyCell: (target: { columnId: string; rowId: string }) => void
      onEditCell: (target: { columnId: string; rowId: string }) => void
      onFilterByCell: (
        target: { columnId: string; rowId: string },
        match: 'include' | 'exclude',
      ) => void
      onDeleteRow: (rowId: string) => void
      onDuplicateRow: (rowId: string) => void
      onSelectRow: (rowId: string) => void
      onTouchCellContextMenuOpen: (target: { columnId: string; rowId: string }) => void
      revertField: typeof revertField
      revertRowUpdate: typeof revertRowUpdate
      stagedDeletionRowIds: ReadonlySet<string>
      stagedFieldsByRowId: Readonly<Record<string, ReadonlySet<string>>>
    }
    const target = { columnId: 'name', rowId: 'row-1' }
    const selectCellRange = vi.fn()
    const toggleSelected = vi.fn()
    let rowSelected = false
    tableViewState.table = {
      ...tableViewState.table,
      getRowModel: () => ({
        rows: [
          {
            id: 'row-1',
            original: {
              id: 'row-1',
              name: 'Grace',
              status: 'active',
              $createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            getCanSelect: () => true,
            getIsSelected: () => rowSelected,
            toggleSelected,
            getVisibleCells: () => [
              {
                column: { id: 'name' },
                getCanSelect: () => true,
                getIsSelected: () => false,
              },
            ],
          },
        ],
      }),
      selectCellRange,
    }

    menuProps.onCopyCell(target)
    menuProps.onEditCell(target)
    menuProps.onFilterByCell(target, 'include')
    menuProps.onFilterByCell(target, 'exclude')
    menuProps.onDuplicateRow('row-1')
    menuProps.onDeleteRow('row-1')
    menuProps.onSelectRow('row-1')
    menuProps.onTouchCellContextMenuOpen(target)

    expect(menuProps.getCellActions(target)).toEqual({
      canCopy: true,
      canEdit: true,
      canExclude: true,
      canFilterBy: true,
      copyAs: [],
    })
    expect(menuProps.canSelectRow('row-1')).toBe(true)
    rowSelected = true
    expect(menuProps.canSelectRow('row-1')).toBe(false)
    rowSelected = false
    expect(menuProps.canMutateRow('row-1')).toBe(true)
    expect(menuProps.canMutateRow('row-2')).toBe(false)
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('Katherine'))
    expect(tableViewState.handleCellEditRequest).toHaveBeenCalledWith(target)
    expect(tableViewState.setFilters).toHaveBeenCalledWith([
      tableViewState.filters[0],
      expect.objectContaining({ column: 'name', operator: 'eq', value: 'Katherine' }),
    ])
    expect(tableViewState.setFilters).toHaveBeenCalledWith([
      tableViewState.filters[0],
      expect.objectContaining({ column: 'name', operator: 'ne', value: 'Katherine' }),
    ])
    expect(toggleSelected).toHaveBeenCalledWith(true)
    expect(stageInsert).toHaveBeenCalledWith('row-1', {
      name: 'Katherine',
      status: 'active',
    })
    expect(stageDeletions).toHaveBeenCalledWith(['row-1'])
    expect(tableViewState.handleRowsStagedForDeletion).toHaveBeenCalledWith(['row-1'])
    expect(selectCellRange).toHaveBeenCalledWith({
      anchorColumnId: 'name',
      anchorRowId: 'row-1',
      focusColumnId: 'name',
      focusRowId: 'row-1',
    })
    expect(menuProps.revertField).toBe(revertField)
    expect(menuProps.revertRowUpdate).toBe(revertRowUpdate)
    expect(menuProps.stagedDeletionRowIds).toEqual(new Set(['row-2']))
    expect(menuProps.stagedFieldsByRowId).toBe(stagedFieldsByRowId.current)
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

  it('copies an explicit staged null instead of the source value', async () => {
    configureNameCell('Grace')
    stagedValuesByRowId.current = { 'row-1': { name: null } }
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      onCopyCell: (target: { columnId: string; rowId: string }) => void
    }

    menuProps.onCopyCell({ columnId: 'name', rowId: 'row-1' })

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('NULL'))
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

  it('forwards the selected binary copy format', async () => {
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
      getRowModel: () => ({
        rows: [
          { id: 'row-1', original: { id: 'row-1', payload: new Uint8Array([0, 1, 254, 255]) } },
        ],
      }),
    }
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderTableView()
    const menuProps = gridContextMenuProps.current as {
      onCopyCell: (target: { columnId: string; rowId: string }, format: 'base64' | 'hex') => void
    }

    menuProps.onCopyCell({ columnId: 'payload', rowId: 'row-1' }, 'base64')

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('AAH+/w=='))
  })
})

describe('TableView composition boundary', () => {
  it('virtualizes larger bounded pages', () => {
    renderTableView()

    expect(dataGridContentProps.current?.rowRendering).toBe('virtual')
  })

  it('keeps connection content hidden until the first rows query settles', () => {
    tableViewState.isInitialLoading = true
    const { rerenderTableView } = renderTableView()

    expect(reportConnectionContentReady).toHaveBeenLastCalledWith(false)

    tableViewState.isInitialLoading = false
    rerenderTableView()

    expect(reportConnectionContentReady).toHaveBeenLastCalledWith(true)
  })

  it('configures column reordering only after the first rows query settles', () => {
    tableViewState.isInitialLoading = true
    tableViewState.reorderableColumnIds = ['id', 'name']
    const { rerenderTableView } = renderTableView()

    expect(dataGridRootProps.current).toEqual({
      columnDragPreview: undefined,
      reorderableColumnIds: undefined,
    })

    tableViewState.isInitialLoading = false
    rerenderTableView()

    expect(dataGridRootProps.current?.reorderableColumnIds).toEqual(['id', 'name'])
    expect(dataGridRootProps.current?.columnDragPreview).toBeTypeOf('function')
  })

  it('tracks the active row checkbox when it mounts after the pane opens', async () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }
    tableViewState.renderRowCheckbox = false
    const { rerenderTableView } = renderTableView()

    tableViewState.renderRowCheckbox = true
    rerenderTableView()
    const checkbox = await screen.findByRole('checkbox', { name: 'Select row row-1' })
    tableViewState.closeRowEditor.mockImplementation(() => {
      tableViewState.detailPaneMode = 'closed'
      tableViewState.rowEditor.activeRowId = null
      rerenderTableView()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close row editor' }))

    expect(screen.queryByRole('textbox', { name: 'Edit row fields' })).toBeNull()
    expect(document.activeElement).toBe(checkbox)
  })

  it('uses field feedback only while Details owns the active row invalid draft', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }
    invalidDraftSources.invalidUpdateRowIds = new Set(['row-1'])
    renderTableView()
    const mutationWidget = screen.getByRole('button', { name: 'Complete Apply' })

    expect(mutationWidget.getAttribute('data-invalid-draft-feedback')).toBe('field')

    fireEvent.click(screen.getByRole('button', { name: 'Show row JSON' }))

    expect(mutationWidget.getAttribute('data-invalid-draft-feedback')).toBe('global')
  })

  it('keeps global feedback for an invalid draft owned by another row', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }
    invalidDraftSources.invalidUpdateRowIds = new Set(['row-2'])
    renderTableView()

    expect(
      screen
        .getByRole('button', { name: 'Complete Apply' })
        .getAttribute('data-invalid-draft-feedback'),
    ).toBe('global')
  })

  it('keeps global feedback while the active row Details form is unavailable', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowValues = null
    invalidDraftSources.invalidUpdateRowIds = new Set(['row-1'])
    const { rerenderTableView } = renderTableView()
    const mutationWidget = screen.getByRole('button', { name: 'Complete Apply' })

    expect(mutationWidget.getAttribute('data-invalid-draft-feedback')).toBe('global')

    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }
    mutationExecution.current = { error: null, status: 'applying' }
    rerenderTableView()

    expect(mutationWidget.getAttribute('data-invalid-draft-feedback')).toBe('global')
  })

  it('leaves composing and previously handled Escape events to the active pane control', () => {
    tableViewState.detailPaneMode = 'insert'
    renderTableView()
    const field = screen.getByRole('textbox', { name: 'Insert row fields' })

    fireEvent.keyDown(field, { isComposing: true, key: 'Escape' })
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })
    event.preventDefault()
    field.dispatchEvent(event)

    expect(tableViewState.handleEscape).not.toHaveBeenCalled()
  })

  it('connects owner state and actions through the composed table surface', async () => {
    tableViewState.activeFieldEditorTarget = { rowId: 'row-1', columnId: 'name' }
    tableViewState.activeFieldEditorRowValues = { id: 'row-1', name: 'Ada' }
    tableViewState.tableColumns = [nameTableColumn]
    const { rerenderTableView } = renderTableView()

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Open cell context' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open row context' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Close field' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete field' }))
    tableViewState.activeFieldEditorTarget = null
    tableViewState.activeFieldEditorRowValues = null
    rerenderTableView()
    fireEvent.click(screen.getByRole('button', { name: 'Complete Apply' }))

    expect(tableViewState.handleEscape).toHaveBeenCalledOnce()
    expect(gridCellContextMenu).toHaveBeenCalledWith(
      { columnId: 'name', rowId: 'row-1' },
      expect.anything(),
    )
    expect(gridRowContextMenu).toHaveBeenCalledWith('row-1', expect.anything())
    expect(tableViewState.handleFieldEditorCancel).toHaveBeenCalledOnce()
    expect(tableViewState.handleFieldEditorComplete).toHaveBeenCalledWith('enter')
    expect(tableViewState.handleMutationUpdatesApplied).toHaveBeenCalledWith({
      'row-1': new Set(['name']),
    })
    expect(tableViewState.handleMutationApplySuccess).toHaveBeenCalledOnce()
    expect(useTableViewStateOptions.current).toMatchObject({
      schemaColumns,
      tableKey: 'connection-1:main:schema-1:accounts',
    })
    expect(mutationLedgerProviderProps.current).toEqual({
      schemaColumns,
      scopeKey: 'connection-1:main:schema-1:accounts',
    })
    expect(fieldEditorProps.current).toMatchObject({
      column: schemaColumns[0],
      rowId: 'row-1',
      rowValues: { id: 'row-1', name: 'Ada' },
    })
    const undoRowDeletions = useTableViewStateOptions.current?.onUndoRowDeletions as
      | ((rowIds: readonly string[]) => void)
      | undefined
    undoRowDeletions?.(['row-1'])
    expect(mutationLedgerUndoDeletions).toHaveBeenCalledWith(['row-1'])
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
  it('keeps the row representation while navigating selected rows', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowValues = { id: 'row-1', name: 'Ada' }
    const { rerenderTableView } = renderTableView()

    const onRepresentationChange = editRowFormProps.current?.onRepresentationChange as
      | ((value: 'provenance') => void)
      | undefined
    act(() => onRepresentationChange?.('provenance'))
    tableViewState.rowEditor.activeRowId = 'row-2'
    tableViewState.rowValues = { id: 'row-2', name: 'Grace' }
    rerenderTableView()

    expect(editRowFormProps.current?.representation).toBe('provenance')
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
    expect(editRowFormProps.current).toMatchObject({
      draftController: mutationEditorController,
      rowValues: { id: 'row-1', name: 'Ada' },
    })
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

  it('keeps staged deletion authoritative over the recently inserted highlight', () => {
    tableViewState.recentlyInsertedRowIds = new Set(['row-1'])
    mutationLedgerEntries.push({ entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' })

    renderTableView()

    expect(screen.getByTestId('row-1-status').textContent).toBe('stagedDeletion')
  })

  it('marks recently inserted rows while their ephemeral highlight is active', () => {
    tableViewState.recentlyInsertedRowIds = new Set(['row-1'])

    renderTableView()

    expect(screen.getByTestId('row-1-status').textContent).toBe('recentlyInserted')
  })

  it('keeps a staged update authoritative over the recently applied highlight', () => {
    tableViewState.recentlyAppliedCells = {
      'row-1': new Set(['name', 'email', '\uE000inspector-row-selection']),
    }
    const { rerenderTableView } = renderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('recentlyApplied')

    stagedFieldsByRowId.current = { 'row-1': new Set(['name']) }
    stagedValuesByRowId.current = { 'row-1': { name: 'Grace' } }
    rerenderTableView()

    expect(screen.getByTestId('row-1-name-status').textContent).toBe('stagedUpdate')
    expect(screen.getByTestId('row-1-email-status').textContent).toBe('recentlyApplied')
    expect(screen.getByTestId('row-1-selection-status').textContent).toBe('default')
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

  it('blocks inline editing while Apply is running', () => {
    mutationExecution.current = { error: null, status: 'applying' }
    tableViewState.detailPaneMode = 'rows'
    configureNameCell('Ada')

    renderTableView()
    fireEvent.click(screen.getByRole('button', { name: 'Edit row 1' }))

    expect(tableViewState.handleCellEditRequest).not.toHaveBeenCalled()
    expect(screen.getByText('Applying changes')).toBeTruthy()
    expect(screen.queryByText('Edit row fields')).toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Delete checked rows' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('keeps an insert draft mounted while unrelated staged changes apply', () => {
    tableViewState.detailPaneMode = 'insert'
    const { rerenderTableView } = renderTableView()
    fireEvent.change(screen.getByRole('textbox', { name: 'Insert row fields' }), {
      target: { value: 'Unsubmitted value' },
    })

    mutationExecution.current = { error: null, status: 'applying' }
    rerenderTableView()

    const draft = screen.getByRole('textbox', { name: 'Insert row fields' }) as HTMLInputElement
    expect(draft.value).toBe('Unsubmitted value')
    expect(draft.disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Insert row' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(screen.queryByText('Applying changes')).toBeNull()
  })

  it('renders fallback-row loading and failure states in the open row pane', () => {
    tableViewState.detailPaneMode = 'rows'
    tableViewState.rowEditor.activeRowId = 'row-1'
    tableViewState.rowEditorQueryLoading = true
    const { rerenderTableView } = renderTableView()

    expect(screen.getByText('Loading row')).toBeTruthy()

    tableViewState.rowEditorQueryLoading = false
    tableViewState.rowEditorQueryError = 'Unable to load row'
    rerenderTableView()

    expect(screen.getByRole('alert').textContent).toBe('Unable to load row')
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

    const clearButton = screen.getByRole('button', { name: 'Clear filters' })
    fireEvent.click(clearButton)

    expect(tableViewState.setFilters).toHaveBeenCalledWith([])
  })

  it('offers row insertion from an unfiltered empty table', () => {
    tableViewState.filters = []
    tableViewState.rows = []

    renderTableView()

    expect(screen.getAllByText('This table is empty')).toHaveLength(2)
    expect(screen.getByRole('status').textContent).toBe('This table is empty')
    const insertRow = screen.getByRole('button', { name: 'Insert row' })

    fireEvent.click(insertRow)
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

    fireEvent.keyDown(document, { altKey: true, code: 'KeyI', key: 'Dead' })

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

  it('registers an Insert row command in the command palette', () => {
    renderTableView()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(screen.getByText('Actions')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Insert row' })).toBeTruthy()
  })
})
