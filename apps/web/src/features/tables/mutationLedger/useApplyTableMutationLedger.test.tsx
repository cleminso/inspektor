import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RuntimeScopeExitGuardProvider } from '@app/providers/runtimeScopeExitGuard'
import {
  TableMutationLedgerProvider,
  TableMutationLedgerWorkspaceProvider,
  useTableMutationEditorController,
  useTableMutationLedger,
} from '@tables/mutationLedger/provider'
import { useApplyTableMutationLedger } from '@tables/mutationLedger/useApplyTableMutationLedger'
import type { TableFieldsByRowId } from '@tables/tableTypes'

afterEach(cleanup)

const columns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: false },
  { name: 'email', column_type: { type: 'Text' }, nullable: false },
] satisfies ColumnDescriptor[]

function TestLedgerProvider({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <TableMutationLedgerWorkspaceProvider>
        <TableMutationLedgerProvider schemaColumns={columns} scopeKey="test:accounts">
          {children}
        </TableMutationLedgerProvider>
      </TableMutationLedgerWorkspaceProvider>
    </RuntimeScopeExitGuardProvider>
  )
}

function Harness({
  deleteRow = vi.fn(),
  updateRow,
  onAppliedUpdates,
  onSuccess,
}: {
  deleteRow?: () => Promise<void>
  updateRow: () => Promise<void>
  onAppliedUpdates?: (appliedUpdateFields: TableFieldsByRowId) => void
  onSuccess?: () => void
}) {
  const mutations = useTableMutationLedger()
  const controller = useTableMutationEditorController({
    initialRowValues: { email: 'ada@example.com', id: 'row-1', name: 'Ada' },
    rowId: 'row-1',
    schemaColumns: columns,
  })
  const apply = useApplyTableMutationLedger({
    executor: { deleteRow, updateRow },
    onAppliedUpdates,
    onSuccess,
  })
  return (
    <div>
      <output aria-label="Execution status">{mutations.execution.status}</output>
      <output aria-label="Pending count">{mutations.ledger.entries.length}</output>
      <output aria-label="Pending fields">
        {mutations.ledger.entries[0]?.kind === 'update'
          ? Object.keys(mutations.ledger.entries[0].fields).sort().join(',')
          : ''}
      </output>
      <button type="button" onClick={() => controller.actions.setFieldText('name', 'Grace')}>
        Change
      </button>
      <button
        type="button"
        onClick={() => controller.actions.setFieldText('email', 'grace@example.com')}
      >
        Change email
      </button>
      <button type="button" onClick={() => mutations.stageDeletions(['row-2'])}>
        Delete row
      </button>
      <button type="button" onClick={() => void apply()}>
        Apply
      </button>
      <button type="button" onClick={mutations.discardAll}>
        Discard
      </button>
    </div>
  )
}

describe('useApplyTableMutationLedger', () => {
  it('prevents duplicate Apply and clears state after complete success', async () => {
    const onSuccess = vi.fn()
    let resolveUpdate: (() => void) | undefined
    const updateRow = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        }),
    )
    render(
      <TestLedgerProvider>
        <Harness updateRow={updateRow} onSuccess={onSuccess} />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(updateRow).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Execution status').textContent).toBe('applying')

    await act(async () => resolveUpdate?.())
    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('blocks edits while Apply is running', async () => {
    let resolveUpdate: (() => void) | undefined
    const updateRow = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        }),
    )
    render(
      <TestLedgerProvider>
        <Harness updateRow={updateRow} />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
    expect(screen.getByLabelText('Pending count').textContent).toBe('1')
    expect(screen.getByLabelText('Execution status').textContent).toBe('applying')

    await act(async () => resolveUpdate?.())
    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
  })

  it('retains the complete staged state after failure', async () => {
    const onSuccess = vi.fn()
    render(
      <TestLedgerProvider>
        <Harness
          updateRow={vi.fn().mockRejectedValue(new Error('Update rejected'))}
          onSuccess={onSuccess}
        />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Execution status').textContent).toBe('failed'),
    )
    expect(screen.getByLabelText('Pending count').textContent).toBe('1')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('retries only entries that were not applied before a failure', async () => {
    const onAppliedUpdates = vi.fn()
    const updateRow = vi.fn().mockResolvedValue(undefined)
    const deleteRow = vi
      .fn()
      .mockRejectedValueOnce(new Error('Delete rejected'))
      .mockResolvedValue(undefined)
    render(
      <TestLedgerProvider>
        <Harness deleteRow={deleteRow} updateRow={updateRow} onAppliedUpdates={onAppliedUpdates} />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Execution status').textContent).toBe('failed'),
    )
    expect(screen.getByLabelText('Pending count').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
    expect(updateRow).toHaveBeenCalledOnce()
    expect(deleteRow).toHaveBeenCalledTimes(2)
    expect(onAppliedUpdates).toHaveBeenCalledWith({ 'row-1': new Set(['name']) })
  })

  it('reports every applied update field and excludes deletions', async () => {
    const onAppliedUpdates = vi.fn()
    render(
      <TestLedgerProvider>
        <Harness
          updateRow={vi.fn().mockResolvedValue(undefined)}
          onAppliedUpdates={onAppliedUpdates}
        />
      </TestLedgerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(onAppliedUpdates).toHaveBeenCalledOnce())
    expect(onAppliedUpdates).toHaveBeenCalledWith({ 'row-1': new Set(['name', 'email']) })
  })
})
