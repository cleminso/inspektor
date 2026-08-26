import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { useState, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RuntimeScopeExitGuardProvider } from '@app/providers/runtimeScopeExitGuard'
import { InspectorDockCenterProvider } from '@app/shell/dock/centerSlot'
import { InspectorDock } from '@app/shell/dock/view'
import FieldEditorMutationWidget from '@tables/floatingWidget/fieldEditorMutationWidget'
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

afterEach(() => {
  cleanup()
})

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
const settingsColumn = {
  name: 'settings',
  column_type: { type: 'Json' },
  nullable: true,
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
        <TableMutationLedgerProvider schemaColumns={schemaColumns} scopeKey="test:accounts">
          {children}
        </TableMutationLedgerProvider>
      </TableMutationLedgerWorkspaceProvider>
    </RuntimeScopeExitGuardProvider>
  )
}

function FieldEditorHarness({
  column,
  initialSettings = { enabled: true },
  onClose,
  onComplete,
}: {
  column: ColumnDescriptor
  initialSettings?: unknown
  onClose: () => void
  onComplete: (direction: 'enter' | 'tabBackward' | 'tabForward') => void
}) {
  const mutations = useTableMutationLedger()
  const rowValues = { id: 'row-1', name: 'Ada', count: 1, settings: initialSettings }
  return (
    <>
      <FieldEditorMutationWidget
        column={column}
        onClose={onClose}
        onComplete={onComplete}
        rowId="row-1"
        rowValues={rowValues}
      />
      <output aria-label="Pending fields">
        {mutations.ledger.entries[0]?.kind === 'update'
          ? Object.keys(mutations.ledger.entries[0].fields).join(',')
          : ''}
      </output>
      <output aria-label="Pending name">
        {mutations.ledger.entries[0]?.kind === 'update'
          ? String(mutations.ledger.entries[0].fields.name ?? '')
          : ''}
      </output>
    </>
  )
}

describe('FieldEditorMutationWidget', () => {
  it('keeps edits local until Save stages the field', () => {
    const onComplete = vi.fn()
    render(
      <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
        <FieldEditorHarness column={nameColumn} onClose={vi.fn()} onComplete={onComplete} />
      </TestLedgerProvider>,
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Grace' },
    })

    expect(screen.getByLabelText('Pending fields').textContent).toBe('')
    expect(screen.getByLabelText('Pending name').textContent).toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
    expect(screen.getByLabelText('Pending name').textContent).toBe('Grace')
    expect(onComplete).toHaveBeenCalledWith('enter')
  })

  it('closes on Escape and discards an uncommitted field edit', () => {
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
    expect(screen.getByLabelText('Pending fields').textContent).toBe('')
  })

  it('preserves a previously staged value when a reopened edit closes', () => {
    function ReopenedEditorHarness(): React.ReactElement {
      const [open, setOpen] = useState(false)
      const controller = useTableMutationEditorController({
        initialRowValues: { id: 'row-1', name: 'Ada', count: 1 },
        rowId: 'row-1',
      })
      const mutations = useTableMutationLedger()

      return (
        <>
          <button
            type="button"
            onClick={() => {
              controller.actions.setFieldText('name', 'Grace')
              setOpen(true)
            }}
          >
            Reopen staged field
          </button>
          {open === true ? (
            <FieldEditorMutationWidget
              column={nameColumn}
              onClose={() => setOpen(false)}
              onComplete={() => setOpen(false)}
              rowId="row-1"
              rowValues={{ id: 'row-1', name: 'Ada', count: 1 }}
            />
          ) : null}
          <output aria-label="Pending name">
            {mutations.ledger.entries[0]?.kind === 'update'
              ? String(mutations.ledger.entries[0].fields.name ?? '')
              : ''}
          </output>
        </>
      )
    }

    render(
      <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
        <ReopenedEditorHarness />
      </TestLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reopen staged field' }))
    const input = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
    expect(input.value).toBe('Grace')

    fireEvent.change(input, { target: { value: 'Katherine' } })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.getByLabelText('Pending name').textContent).toBe('Grace')
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

  it('opens a NULL JSON value with an empty object focused editor', async () => {
    render(
      <TestLedgerProvider schemaColumns={[nameColumn, countColumn, settingsColumn]}>
        <FieldEditorHarness
          column={settingsColumn}
          initialSettings={null}
          onClose={vi.fn()}
          onComplete={vi.fn()}
        />
      </TestLedgerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Value' }))

    await waitFor(() => {
      const editor = screen.getByRole('textbox', { name: 'Settings' })
      expect(editor.textContent).toBe('{}')
      expect(document.activeElement).toBe(editor)
    })
  })
})

describe('TableMutationWidget', () => {
  function ReviewHarness({ operationCount = 1 }: { operationCount?: number }): React.ReactElement {
    const mutations = useTableMutationLedger()
    const controller = useTableMutationEditorController({
      initialRowValues: { id: 'long-row-identity-123456789', name: 'Ada', count: 1 },
      rowId: 'long-row-identity-123456789',
    })
    const stageReview = () => {
      controller.actions.setFieldText('name', 'Grace')
      controller.actions.setFieldText('count', '2')
      mutations.stageDeletions(['row-2', 'row-3'])
      for (let index = 2; index < operationCount; index += 1) {
        mutations.stageDeletions([`row-${index + 2}`])
      }
    }
    return (
      <>
        <button type="button" onClick={stageReview}>
          Stage review
        </button>
        <button type="button" onClick={() => controller.actions.setFieldText('count', 'invalid')}>
          Stage invalid
        </button>
        <TableMutationWidget executor={{ deleteRow: vi.fn(), updateRow: vi.fn() }} />
      </>
    )
  }

  function renderReview(operationCount?: number): void {
    render(
      <InspectorDockCenterProvider>
        <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
          <ReviewHarness operationCount={operationCount} />
          <InspectorDock onOpenCommands={() => undefined} />
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

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Undo: 2 selected rows',
      }),
    )
    expect(screen.queryByText('2 selected rows')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Undo: long-row-identity-123456789' }))
    expect(screen.queryByText('long-row-identity-123456789')).toBeNull()
  })

  it('requires correction when a draft has only invalid input', () => {
    render(
      <InspectorDockCenterProvider>
        <TestLedgerProvider schemaColumns={[nameColumn, countColumn]}>
          <ReviewHarness />
          <InspectorDock onOpenCommands={() => undefined} />
        </TestLedgerProvider>
      </InspectorDockCenterProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Stage invalid' }))

    expect(screen.getByRole('button', { name: 'Needs attention' })).toBeTruthy()
    expect(screen.getByText('Correct invalid input before applying.')).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Review changes' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Apply changes' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('renders large operation reviews in bounded batches', () => {
    renderReview(120)

    const lastInitialRow = screen.getByRole('button', { name: 'Undo: row-52' }).closest('li')
    expect(lastInitialRow?.getAttribute('aria-posinset')).toBe('50')
    expect(lastInitialRow?.getAttribute('aria-setsize')).toBe('119')
    expect(screen.queryByRole('button', { name: 'Undo: row-53' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show more deleted row operations' }))

    expect(screen.getByRole('button', { name: 'Undo: row-53' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Undo: row-102' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Undo: row-103' })).toBeNull()
  })

  it('projects and applies deletions staged outside the widget', async () => {
    const deleteRow = vi.fn().mockResolvedValue(undefined)
    function DeletionHarness(): React.ReactElement {
      const mutations = useTableMutationLedger()
      return (
        <>
          <button type="button" onClick={() => mutations.stageDeletions(['row-1'])}>
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
          <InspectorDock onOpenCommands={() => undefined} />
        </TestLedgerProvider>
      </InspectorDockCenterProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Staged changes' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Stage deletion' }))
    const trigger = screen.getByRole('button', { name: 'Staged changes' })
    expect(trigger.textContent).toContain('1')
    expect(trigger.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector('[data-slot="floating-panel-content"]')).toBeNull()
    fireEvent.click(trigger)
    const reviewButton = screen.getByRole('button', { name: 'Review changes' })
    const panelContent = document.querySelector('[data-slot="floating-panel-content"]')
    expect(panelContent?.getAttribute('data-size')).toBe('compact')
    fireEvent.click(reviewButton)
    expect(panelContent?.getAttribute('data-size')).toBe('expanded')
    expect(screen.getByRole('region', { name: 'Affected rows' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }))

    await waitFor(() => expect(deleteRow).toHaveBeenCalledWith('row-1'))
  })
})
