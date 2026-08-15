import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InspectorDockCenterProvider } from '@app/shell/dock/centerSlot'
import { InspectorDock } from '@app/shell/dock/view'
import { FieldEditorMutationWidget } from '@tables/floatingWidget/fieldEditorMutationWidget'
import { TableMutationWidget } from '@tables/floatingWidget/floatingWidget'
import {
  TableMutationLedgerProvider,
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
      <TableMutationLedgerProvider schemaColumns={[nameColumn, countColumn]}>
        <FieldEditorHarness column={nameColumn} onClose={onClose} onComplete={vi.fn()} />
      </TableMutationLedgerProvider>,
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
      <TableMutationLedgerProvider schemaColumns={[nameColumn, countColumn]}>
        <FieldEditorHarness column={countColumn} onClose={vi.fn()} onComplete={onComplete} />
      </TableMutationLedgerProvider>,
    )
    const input = screen.getByRole('textbox', { name: 'Count' })
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('Value must be an integer.')).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('TableMutationWidget', () => {
  it('stages a selected-row deletion and applies it', async () => {
    const deleteRow = vi.fn().mockResolvedValue(undefined)
    render(
      <InspectorDockCenterProvider>
        <TableMutationLedgerProvider schemaColumns={[]}>
          <TableMutationWidget
            executor={{ deleteRow, updateRow: vi.fn() }}
            selectedRowIds={['row-1']}
          />
          <InspectorDock />
        </TableMutationLedgerProvider>
      </InspectorDockCenterProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete rows' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }))

    await waitFor(() => expect(deleteRow).toHaveBeenCalledWith('row-1'))
  })
})
