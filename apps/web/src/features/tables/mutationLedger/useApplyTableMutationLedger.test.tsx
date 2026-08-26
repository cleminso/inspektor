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
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
] satisfies ColumnDescriptor[]

function createPendingUpdate(): { resolve: () => void; updateRow: () => Promise<void> } {
  let resolve!: () => void
  const promise = new Promise<void>((next) => {
    resolve = next
  })
  return { resolve, updateRow: vi.fn(() => promise) }
}

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
    initialRowValues: { age: 37, email: 'ada@example.com', id: 'row-1', name: 'Ada' },
    rowId: 'row-1',
  })
  const apply = useApplyTableMutationLedger({
    executor: { deleteRow, updateRow },
    mutations,
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
      <button type="button" onClick={() => controller.actions.setFieldText('age', 'invalid')}>
        Invalidate age
      </button>
      <button type="button" onClick={() => mutations.stageDeletions(['row-2', 'row-3'])}>
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

function Observer(): React.ReactElement {
  const mutations = useTableMutationLedger()
  return (
    <>
      <output aria-label="Execution status">{mutations.execution.status}</output>
      <output aria-label="Pending count">{mutations.ledger.entries.length}</output>
    </>
  )
}

describe('useApplyTableMutationLedger', () => {
  it('prevents duplicate Apply and clears state after complete success', async () => {
    const onSuccess = vi.fn()
    const { resolve, updateRow } = createPendingUpdate()
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

    await act(async () => resolve())
    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('does not Apply while a draft contains invalid input', () => {
    const updateRow = vi.fn().mockResolvedValue(undefined)
    render(
      <TestLedgerProvider>
        <Harness updateRow={updateRow} />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Invalidate age' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(updateRow).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Execution status').textContent).toBe('idle')
  })

  it('finishes Apply without invoking presentation callbacks after the consumer unmounts', async () => {
    const onAppliedUpdates = vi.fn()
    const onSuccess = vi.fn()
    const { resolve, updateRow } = createPendingUpdate()
    const view = render(
      <TestLedgerProvider>
        <Harness updateRow={updateRow} onAppliedUpdates={onAppliedUpdates} onSuccess={onSuccess} />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    view.rerender(
      <TestLedgerProvider>
        <Observer />
      </TestLedgerProvider>,
    )
    await act(async () => resolve())

    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
    expect(screen.getByLabelText('Execution status').textContent).toBe('idle')
    expect(onAppliedUpdates).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('blocks edits while Apply is running', async () => {
    const { resolve, updateRow } = createPendingUpdate()
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

    await act(async () => resolve())
    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
  })

  it('retries only entries that were not applied before a failure', async () => {
    const onAppliedUpdates = vi.fn()
    const onSuccess = vi.fn()
    const updateRow = vi.fn().mockResolvedValue(undefined)
    const deleteRow = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Delete rejected'))
      .mockResolvedValue(undefined)
    render(
      <TestLedgerProvider>
        <Harness
          deleteRow={deleteRow}
          updateRow={updateRow}
          onAppliedUpdates={onAppliedUpdates}
          onSuccess={onSuccess}
        />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Execution status').textContent).toBe('failed'),
    )
    expect(screen.getByLabelText('Pending count').textContent).toBe('1')
    expect(onSuccess).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(screen.getByLabelText('Pending count').textContent).toBe('0'))
    expect(updateRow).toHaveBeenCalledOnce()
    expect(deleteRow).toHaveBeenNthCalledWith(1, 'row-2')
    expect(deleteRow).toHaveBeenNthCalledWith(2, 'row-3')
    expect(deleteRow).toHaveBeenNthCalledWith(3, 'row-3')
    expect(onAppliedUpdates).toHaveBeenCalledWith({ 'row-1': new Set(['name', 'email']) })
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})
