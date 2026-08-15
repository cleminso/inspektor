import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { afterEach, describe, expect, it } from 'vitest'

import {
  TableMutationLedgerProvider,
  useTableMutationEditorController,
  useTableMutationLedger,
} from '@tables/mutationLedger/provider'
import { getMutationFieldInput } from '@tables/rowEditor/mutation/draft'

afterEach(cleanup)

const columns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: false },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
] satisfies ColumnDescriptor[]

function EditorHarness() {
  const controller = useTableMutationEditorController({
    initialRowValues: { id: 'row-1', name: 'Ada', age: 37 },
    rowId: 'row-1',
    schemaColumns: columns,
  })
  const mutations = useTableMutationLedger()

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
      <button type="button" onClick={() => controller.actions.setFieldText('name', 'Grace')}>
        Change name
      </button>
      <button type="button" onClick={() => controller.actions.setFieldText('age', 'invalid')}>
        Invalidate age
      </button>
      <button type="button" onClick={() => mutations.removeEntry('update:row-1')}>
        Remove update
      </button>
    </div>
  )
}

describe('TableMutationLedgerProvider', () => {
  it('keeps one raw row draft across editor-surface remounts', () => {
    const { rerender } = render(
      <TableMutationLedgerProvider schemaColumns={columns}>
        <EditorHarness key="pane" />
      </TableMutationLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))

    rerender(
      <TableMutationLedgerProvider schemaColumns={columns}>
        <EditorHarness key="inline" />
      </TableMutationLedgerProvider>,
    )

    expect(screen.getByLabelText('Draft name').textContent).toBe('Grace')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
  })

  it('preserves invalid raw input and blocks Apply', () => {
    render(
      <TableMutationLedgerProvider schemaColumns={columns}>
        <EditorHarness />
      </TableMutationLedgerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Invalidate age' }))

    expect(screen.getByLabelText('Draft age').textContent).toBe('invalid')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('name')
    expect(screen.getByLabelText('Needs attention').textContent).toBe('true')
  })

  it('removing an update resets its provider-owned draft', () => {
    render(
      <TableMutationLedgerProvider schemaColumns={columns}>
        <EditorHarness />
      </TableMutationLedgerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove update' }))

    expect(screen.getByLabelText('Draft name').textContent).toBe('Ada')
    expect(screen.getByLabelText('Pending fields').textContent).toBe('')
  })
})
