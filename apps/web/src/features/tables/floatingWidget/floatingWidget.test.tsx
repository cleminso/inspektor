import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RuntimeScopeExitGuardProvider } from '@app/providers/runtimeScopeExitGuard'
import { InspectorDockCenterProvider } from '@app/shell/dock/centerSlot'
import { InspectorDock } from '@app/shell/dock/view'
import { FieldEditorMutationWidget } from '@tables/floatingWidget/fieldEditorMutationWidget'
import { TableMutationWidget } from '@tables/floatingWidget/floatingWidget'
import {
  TableMutationLedgerProvider,
  TableMutationLedgerWorkspaceProvider,
  useTableMutationEditorController,
  useTableMutationLedger,
} from '@tables/mutationLedger/provider'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({ currentConnectionId: 'connection-1' }),
}))

afterEach(cleanup)

const nameColumn = {
  name: 'name',
  column_type: { type: 'Text' },
  nullable: false,
} satisfies ColumnDescriptor
const countColumn = {
  name: 'count',
  column_type: { type: 'Integer' },
  nullable: false,
} satisfies ColumnDescriptor

function TestLedgerProvider({
  children,
  schemaColumns,
}: {
  children: ReactNode
  schemaColumns: readonly ColumnDescriptor[]
}): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <TableMutationLedgerWorkspaceProvider>
        <TableMutationLedgerProvider
          schemaColumns={schemaColumns}
          scopeKey="test:accounts"
        >
          {children}
        </TableMutationLedgerProvider>
      </TableMutationLedgerWorkspaceProvider>
    </RuntimeScopeExitGuardProvider>
  )
}

function FieldEditorHarness({
  column,
  onClose,
  onComplete,
}: {
  column: ColumnDescriptor
  onClose: () => void
  onComplete: (direction: 'enter' | 'tabBackward' | 'tabForward') => void
}) {
  const columns = [nameColumn, countColumn]
  const controller = useTableMutationEditorController({
    initialRowValues: { id: 'row-1', name: 'Ada', count: 1 },
    rowId: 'row-1',
    schemaColumns: columns,
  })
  const mutations = useTableMutationLedger()
  return (
    <>
      <FieldEditorMutationWidget
        column={column}
        controller={controller}
        onClose={onClose}
        onComplete={onComplete}
      />
      <output aria-label="Pending fields">
        {mutations.ledger.entries[0]?.kind === 'update'
          ? Object.keys(mutations.ledger.entries[0].fields).join(',')
          : ''}
      </output>
    </>
  )
}

describe('FieldEditorMutationWidget', () => {
  it('closes on Escape without discarding the staged field', () => {
    const onClose = vi.fn()
    render(
      <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
        <FieldEditorHarness column={nameColumn} onClose={onClose} onComplete={vi.fn()} />
      </TestLedgerProvider>,
    )
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'Grace' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
  })

  it('keeps invalid input open instead of completing it', async () => {
    const onComplete = vi.fn()
    render(
      <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
        <FieldEditorHarness column={countColumn} onClose={vi.fn()} onComplete={onComplete} />
      </TestLedgerProvider>,
    )
    const input = screen.getByRole('textbox', { name: 'Count' })
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('Value must be an integer.')).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('TableMutationWidget', () => {
  function ReviewHarness({ operationCount = 1 }: { operationCount?: number }): React.ReactElement {
    const mutations = useTableMutationLedger()
    const controller = useTableMutationEditorController({
      initialRowValues: { id: 'long-row-identity-123456789', name: 'Ada', count: 1 },
      rowId: 'long-row-identity-123456789',
      schemaColumns: [nameColumn, countColumn],
    })
    const stageReview = () => {
      controller.actions.setFieldText('name', 'Grace')
      controller.actions.setFieldText('count', '2')
      mutations.dispatch({ type: 'deleteRows', rowIds: ['row-2', 'row-3'] })
      for (let index = 2; index < operationCount; index += 1) {
        mutations.dispatch({ type: 'deleteRows', rowIds: [`row-${index + 2}`] })
      }
    }
    return (
      <>
        <button type="button" onClick={stageReview}>Stage review</button>
        <TableMutationWidget executor={{ deleteRow: vi.fn(), updateRow: vi.fn() }} />
      </>
    )
  }

  function renderReview(operationCount?: number): void {
    render(
      <InspectorDockCenterProvider>
        <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
          <ReviewHarness operationCount={operationCount} />
          <InspectorDock />
        </TestLedgerProvider>
      </InspectorDockCenterProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Stage review' }))
    fireEvent.click(screen.getByRole('button', { name: 'Review changes' }))
  }

  it('renders plain-language operation review and undoes a complete operation', () => {
    renderReview()

    expect(screen.getByText('long-row-identity-123456789')).toBeTruthy()
    expect(screen.getByText('count, name')).toBeTruthy()
    expect(screen.getByText('2 selected rows')).toBeTruthy()
    expect(screen.queryByText('2 operations')).toBeNull()
    expect(screen.queryByText('3 affected rows')).toBeNull()
    expect(screen.getByRole('button', { name: 'Updated rows, 1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Deleted rows, 1' })).toBeTruthy()
    expect(screen.queryByText(/fields?/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', {
      name: 'Undo: 2 selected rows',
    }))
    expect(screen.queryByText('2 selected rows')).toBeNull()
  })

  it('scrolls each operation list only above ten rows', () => {
    renderReview(12)

    expect(screen.getByRole('region', { name: 'Updated row operations' }).getAttribute('data-scrollable')).toBe('false')
    expect(screen.getByRole('region', { name: 'Deleted row operations' }).getAttribute('data-scrollable')).toBe('true')
    expect(screen.getByRole('button', { name: /Updated rows, 1/ }).closest('[data-scrollable]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Apply changes' }).closest('[data-scrollable]')).toBeNull()
  })

  it('bounds mounted operation rows above one hundred operations', () => {
    renderReview(1_001)

    const deletionList = screen.getByRole('region', { name: 'Deleted row operations' })
    expect(deletionList.getAttribute('data-virtualized')).toBe('true')
    expect(deletionList.querySelectorAll('[data-operation-row]').length).toBeLessThanOrEqual(14)
    expect(screen.getByRole('button', { name: /Deleted rows, 1000/ })).toBeTruthy()
  })

  it('projects and applies deletions staged outside the widget', async () => {
    const deleteRow = vi.fn().mockResolvedValue(undefined)
    function DeletionHarness(): React.ReactElement {
      const mutations = useTableMutationLedger()
      return (
        <>
          <button
            type="button"
            onClick={() => mutations.dispatch({ type: 'deleteRows', rowIds: ['row-1'] })}
          >
            Stage deletion
          </button>
          <TableMutationWidget executor={{ deleteRow, updateRow: vi.fn() }} />
        </>
      )
    }
    render(
      <InspectorDockCenterProvider>
        <TestLedgerProvider schemaColumns={[]}>
          <DeletionHarness />
          <InspectorDock />
        </TestLedgerProvider>
      </InspectorDockCenterProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Staged changes' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Stage deletion' }))
    const trigger = screen.getByRole('button', { name: 'Staged changes' })
    expect(trigger.textContent).toContain('1')
    expect(trigger.getAttribute('aria-pressed')).toBe('true')
    const reviewButton = screen.getByRole('button', { name: 'Review changes' })
    expect(reviewButton.getAttribute('data-layout')).toBe('inline')
    fireEvent.click(reviewButton)
    expect(screen.getByRole('region', { name: 'Affected rows' })).toBeTruthy()
    expect(screen.getByRole('listitem').querySelector('button')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }))

    await waitFor(() => expect(deleteRow).toHaveBeenCalledWith('row-1'))
  })
})
