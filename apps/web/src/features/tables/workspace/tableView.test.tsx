import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableView } from '@tables/workspace/tableView'

const tableViewState = vi.hoisted(() => ({
  activeColumnId: null,
  canInspectSchema: true,
  canMutateRows: true,
  canOpenRowEditor: true,
  detailPaneMode: 'closed',
  draftTransition: {
    discardAndContinue: vi.fn(),
    isPending: false,
    isSaving: false,
    keepEditing: vi.fn(),
  },
  error: null as string | null,
  filters: [{ column: 'name', operator: 'equals', value: 'Ada' }],
  handleCellActivate: vi.fn(),
  handleColumnActivate: vi.fn(),
  handleDelete: undefined,
  handleEditSave: vi.fn(),
  handleEscape: vi.fn(),
  handleInsertSave: vi.fn(),
  handleRowDraftDirtyChange: vi.fn(),
  handleRowEditorCancel: vi.fn(),
  handleRowEditorOpenChange: vi.fn(),
  hasCellSelection: false,
  hasNextPage: false,
  hasPreviousPage: false,
  isInitialLoading: false,
  isRefreshing: false,
  loadedRowCount: 2,
  page: 1,
  pageSize: 100,
  reorderableColumnIds: [] as string[],
  rowEditor: {
    activeColumnNumber: 0,
    activePageRowNumber: 0,
    activeRowId: null,
    activeRowIndex: 0,
    editedRowIds: [] as string[],
    goToNextRow: vi.fn(),
    goToPreviousRow: vi.fn(),
    openInsert: vi.fn(),
  },
  rowValues: null,
  schemaColumns: [],
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setPageSize: vi.fn(),
  table: {},
  tableColumns: [] as Array<{ id: string }>,
}))

vi.mock('@tables/workspace/useTableViewState', () => ({
  useTableViewState: () => tableViewState,
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({ openSchemaView: vi.fn() }),
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
  EditRowForm: () => null,
  InsertRowForm: () => null,
  preloadRowEditorForms: vi.fn(),
}))

vi.mock('@tables/rowEditor/sidePane', () => ({
  RowEditorSidePanel: ({ children }: { children: ReactNode }) => children,
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
    <div
      aria-live={ariaLive}
      role={role}
    >
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
    <div
      aria-busy={ariaBusy === true ? true : undefined}
      aria-label={ariaLabel}
      role="table"
    >
      <div
        aria-atomic="true"
        aria-live="polite"
        role="status"
      >
        {statusContent}
      </div>
      {children}
    </div>
  )
  const DataGridContent = ({ emptyContent, loading }: { emptyContent: ReactNode; loading: boolean }) => (
    <div data-loading={String(loading)}>{tableViewState.loadedRowCount === 0 ? emptyContent : null}</div>
  )

  return {
    Box: Container,
    Button: Object.assign(Container, { Glyph: Container }),
    DataGrid: {
      Content: DataGridContent,
      Root: Container,
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
})

describe('TableView query status', () => {
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
