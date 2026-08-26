import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { useEffect, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  RuntimeScopeExitGuardProvider,
  useRuntimeScopeExitGuard,
} from '@app/providers/runtimeScopeExitGuard'
import {
  TableMutationLedgerProvider,
  TableMutationLedgerWorkspaceProvider,
  useTableMutationEditorController,
  useTableMutationLedger,
  useTableMutationWorkspace,
} from '@tables/mutationLedger/provider'
import { EditRowForm } from '@tables/rowEditor/editForm'
import { getMutationFieldInput } from '@tables/rowEditor/mutation/draft'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
}))

afterEach(cleanup)

const columns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: false },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
] satisfies ColumnDescriptor[]
const initialRowValues = { id: 'row-1', name: 'Ada', age: 37 }

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

function EditorHarness({ rowValues = initialRowValues }: { rowValues?: typeof initialRowValues }) {
  const [workspaceDiscarded, setWorkspaceDiscarded] = useState<boolean | null>(null)
  const controller = useTableMutationEditorController({
    initialRowValues: rowValues,
    rowId: 'row-1',
  })
  const mutations = useTableMutationLedger()
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
      <output aria-label="Execution status">{mutations.execution.status}</output>
      <output aria-label="Review operations">{mutations.reviewOperations.length}</output>
      <output aria-label="Workspace discarded">{String(workspaceDiscarded)}</output>
      <button type="button" onClick={() => controller.actions.setFieldText('name', 'Grace')}>
        Change name
      </button>
      <button type="button" onClick={() => mutations.revertRowUpdate('row-1')}>
        Revert row
      </button>
      <button
        type="button"
        onClick={() => mutations.setExecution({ error: 'Rejected', status: 'failed' })}
      >
        Fail apply
      </button>
      <button type="button" onClick={mutations.discardAll}>
        Discard all
      </button>
      <button
        type="button"
        onClick={() => {
          mutations.setExecution({ error: null, status: 'applying' })
          setWorkspaceDiscarded(workspace.discardPendingChanges('test:accounts'))
        }}
      >
        Start apply and discard workspace
      </button>
    </div>
  )
}

function WorkspaceHarness({
  Editor,
  onWorkspaceCommandRender,
}: {
  Editor?: () => React.ReactElement
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
          {Editor === undefined ? <EditorHarness /> : <Editor />}
        </TableMutationLedgerProvider>
      </TableMutationLedgerWorkspaceProvider>
      <RuntimeScopeStatus />
    </RuntimeScopeExitGuardProvider>
  )
}

function EditRowFormHarness(): React.ReactElement {
  const controller = useTableMutationEditorController({
    initialRowValues,
    rowId: 'row-1',
  })
  const mutations = useTableMutationLedger()

  return (
    <>
      <EditRowForm
        draftController={controller}
        rowValues={initialRowValues}
        schemaColumns={columns}
      />
      <output aria-label="Pending fields">
        {mutations.ledger.entries[0]?.kind === 'update'
          ? Object.keys(mutations.ledger.entries[0].fields).join(',')
          : ''}
      </output>
    </>
  )
}

function RebaseHarness({ rows }: { rows: Array<typeof initialRowValues> }): React.ReactElement {
  const mutations = useTableMutationLedger()
  const { rebaseRows } = mutations
  useEffect(() => rebaseRows(rows), [rebaseRows, rows])
  return <output aria-label="Pending fields">{mutations.ledger.entries.length}</output>
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

  it('preserves staged fields while rebasing live values after the editor unmounts', async () => {
    const { rerender } = render(
      <TestLedgerProvider>
        <EditorHarness />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))

    rerender(
      <TestLedgerProvider>
        <RebaseHarness rows={[{ ...initialRowValues, age: 38 }]} />
      </TestLedgerProvider>,
    )

    await waitFor(() => expect(screen.getByLabelText('Pending fields').textContent).toBe('1'))

    rerender(
      <TestLedgerProvider>
        <EditorHarness rowValues={{ ...initialRowValues, age: 38 }} />
      </TestLedgerProvider>,
    )

    expect(screen.getByLabelText('Draft name').textContent).toBe('Grace')
    expect(screen.getByLabelText('Draft age').textContent).toBe('38')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')

    rerender(
      <TestLedgerProvider>
        <RebaseHarness rows={[{ ...initialRowValues, name: 'Grace', age: 38 }]} />
      </TestLedgerProvider>,
    )

    await waitFor(() => expect(screen.getByLabelText('Pending fields').textContent).toBe('0'))
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

  it('retries live-row rebasing after Apply releases the ledger', async () => {
    const { rerender } = render(
      <TestLedgerProvider>
        <EditorHarness />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start apply and discard workspace' }))

    rerender(
      <TestLedgerProvider>
        <EditorHarness rowValues={{ ...initialRowValues, name: 'Grace' }} />
      </TestLedgerProvider>,
    )
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')

    fireEvent.click(screen.getByRole('button', { name: 'Fail apply' }))
    await waitFor(() => expect(screen.getByLabelText('Pending fields').textContent).toBe(''))
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

  it('keeps an EditRowForm field update in the workspace ledger across table-provider remounts', () => {
    render(<WorkspaceHarness Editor={EditRowFormHarness} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Grace' },
    })

    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')

    fireEvent.click(screen.getByRole('button', { name: 'Open profiles' }))
    expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Ada')

    fireEvent.click(screen.getByRole('button', { name: 'Open accounts' }))
    expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Grace')
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
