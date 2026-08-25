import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  RuntimeScopeExitGuardProvider,
  useRuntimeScopeExitGuard,
} from '@app/providers/runtimeScopeExitGuard'
import {
  TableMutationLedgerProvider,
  TableMutationLedgerWorkspaceProvider,
  useTableMutationApplicationCommands,
  useTableMutationEditorController,
  useTableMutationLedger,
  useTableMutationWorkspace,
} from '@tables/mutationLedger/provider'
import { getMutationFieldInput } from '@tables/rowEditor/mutation/draft'

afterEach(cleanup)

const columns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: false },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
] satisfies ColumnDescriptor[]

function TestLedgerProvider({ children }: { children: React.ReactNode }): React.ReactElement {
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

function EditorHarness() {
  const [workspaceDiscarded, setWorkspaceDiscarded] = useState<boolean | null>(null)
  const controller = useTableMutationEditorController({
    initialRowValues: { id: 'row-1', name: 'Ada', age: 37 },
    rowId: 'row-1',
    schemaColumns: columns,
  })
  const mutations = useTableMutationLedger()
  const application = useTableMutationApplicationCommands()
  const workspace = useTableMutationWorkspace()

  return (
    <div>
      <output aria-label="Draft name">
        {getMutationFieldInput(controller.state.draft, columns[0]).text}
      </output>
      <output aria-label="Draft age">
        {getMutationFieldInput(controller.state.draft, columns[1]).text}
      </output>
      <output aria-label="Pending fields">
        {mutations.ledger.entries[0]?.kind === 'update'
          ? Object.keys(mutations.ledger.entries[0].fields).sort().join(',')
          : ''}
      </output>
      <output aria-label="Needs attention">{String(mutations.hasInvalidEditor)}</output>
      <output aria-label="Execution status">{mutations.execution.status}</output>
      <output aria-label="Review operations">{mutations.review.operations.length}</output>
      <output aria-label="Workspace discarded">{String(workspaceDiscarded)}</output>
      <button type="button" onClick={() => controller.actions.setFieldText('name', 'Grace')}>
        Change name
      </button>
      <button type="button" onClick={() => controller.actions.setFieldText('age', 'invalid')}>
        Invalidate age
      </button>
      <button type="button" onClick={() => mutations.revertRowUpdate('row-1')}>
        Revert row
      </button>
      <button type="button" onClick={() => mutations.stageDeletions(['row-1', 'row-2'])}>
        Delete rows
      </button>
      <button type="button" onClick={() => mutations.undoReviewOperation('delete-operation:0')}>
        Undo deletion operation
      </button>
      <button
        type="button"
        onClick={() => application.setExecution({ error: 'Rejected', status: 'failed' })}
      >
        Fail apply
      </button>
      <button type="button" onClick={mutations.discardAll}>
        Discard all
      </button>
      <button
        type="button"
        onClick={() => {
          application.setExecution({ error: null, status: 'applying' })
          setWorkspaceDiscarded(workspace.discardPendingChanges('test:accounts'))
        }}
      >
        Start apply and discard workspace
      </button>
    </div>
  )
}

function WorkspaceHarness({
  onWorkspaceCommandRender,
}: {
  onWorkspaceCommandRender?: () => void
} = {}): React.ReactElement {
  const [scopeKey, setScopeKey] = useState('connection:branch:schema:accounts')

  return (
    <RuntimeScopeExitGuardProvider>
      <TableMutationLedgerWorkspaceProvider>
        {onWorkspaceCommandRender === undefined ? null : (
          <WorkspaceCommandConsumer onRender={onWorkspaceCommandRender} />
        )}
        <button type="button" onClick={() => setScopeKey('connection:branch:schema:accounts')}>
          Open accounts
        </button>
        <button type="button" onClick={() => setScopeKey('connection:branch:schema:profiles')}>
          Open profiles
        </button>
        <TableMutationLedgerProvider key={scopeKey} schemaColumns={columns} scopeKey={scopeKey}>
          <EditorHarness />
        </TableMutationLedgerProvider>
      </TableMutationLedgerWorkspaceProvider>
      <RuntimeScopeStatus />
    </RuntimeScopeExitGuardProvider>
  )
}

function WorkspaceCommandConsumer({ onRender }: { onRender: () => void }): null {
  useTableMutationWorkspace()
  onRender()
  return null
}

function RuntimeScopeStatus(): React.ReactElement {
  const guard = useRuntimeScopeExitGuard()
  return <output aria-label="Runtime scope blocked">{String(guard.isBlocked())}</output>
}

describe('TableMutationLedgerProvider', () => {
  it('keeps one raw row draft across editor-surface remounts', () => {
    const { rerender } = render(
      <TestLedgerProvider>
        <EditorHarness key="pane" />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))

    rerender(
      <TestLedgerProvider>
        <EditorHarness key="inline" />
      </TestLedgerProvider>,
    )

    expect(screen.getByLabelText('Draft name').textContent).toBe('Grace')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
  })

  it('preserves invalid raw input and blocks Apply', () => {
    render(
      <TestLedgerProvider>
        <EditorHarness />
      </TestLedgerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Invalidate age' }))

    expect(screen.getByLabelText('Draft age').textContent).toBe('invalid')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
    expect(screen.getByLabelText('Needs attention').textContent).toBe('true')
  })

  it('exposes review operation undo commands', () => {
    render(
      <TestLedgerProvider>
        <EditorHarness />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete rows' }))
    expect(screen.getByLabelText('Review operations').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Fail apply' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo deletion operation' }))
    expect(screen.getByLabelText('Review operations').textContent).toBe('0')
    expect(screen.getByLabelText('Execution status').textContent).toBe('idle')
  })

  it('reverts a complete row update and resets failed Apply state', () => {
    render(
      <TestLedgerProvider>
        <EditorHarness />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fail apply' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revert row' }))

    expect(screen.getByLabelText('Draft name').textContent).toBe('Ada')
    expect(screen.getByLabelText('Review operations').textContent).toBe('0')
    expect(screen.getByLabelText('Execution status').textContent).toBe('idle')
  })

  it('keeps workspace state while Apply owns it', () => {
    render(
      <TestLedgerProvider>
        <EditorHarness />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start apply and discard workspace' }))

    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
    expect(screen.getByLabelText('Execution status').textContent).toBe('applying')
    expect(screen.getByLabelText('Workspace discarded').textContent).toBe('false')
  })

  it('restores each table ledger after its table view unmounts', () => {
    render(<WorkspaceHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))

    fireEvent.click(screen.getByRole('button', { name: 'Open profiles' }))
    expect(screen.getByLabelText('Draft name').textContent).toBe('Ada')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Open accounts' }))
    expect(screen.getByLabelText('Draft name').textContent).toBe('Grace')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
  })

  it('does not rerender workspace command consumers when a draft changes', () => {
    const onWorkspaceCommandRender = vi.fn()
    render(<WorkspaceHarness onWorkspaceCommandRender={onWorkspaceCommandRender} />)
    const renderCount = onWorkspaceCommandRender.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))

    expect(onWorkspaceCommandRender).toHaveBeenCalledTimes(renderCount)
  })

  it('blocks runtime-scope exit and warns before unload until every staged ledger is resolved', async () => {
    render(<WorkspaceHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    await screen.findByText('true', { selector: '[aria-label="Runtime scope blocked"]' })

    const blockedUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(blockedUnload)
    expect(blockedUnload.defaultPrevented).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Discard all' }))
    await screen.findByText('false', { selector: '[aria-label="Runtime scope blocked"]' })
    const allowedUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(allowedUnload)
    expect(allowedUnload.defaultPrevented).toBe(false)
  })
})
