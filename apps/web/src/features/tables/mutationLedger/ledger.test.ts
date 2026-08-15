import { describe, expect, it } from 'vitest'
import type { ColumnDescriptor } from 'jazz-tools'

import {
  createTableMutationState,
  reduceTableMutationState,
  selectTableMutationLedger,
} from '@tables/mutationLedger/ledger'
import {
  createUpdateRowDraft,
  setMutationFieldText,
} from '@tables/rowEditor/mutation/draft'

const columns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: false },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
] satisfies ColumnDescriptor[]

function createDraft(values: Record<string, unknown>, updates: Record<string, string>) {
  let draft = createUpdateRowDraft(values)
  for (const [name, text] of Object.entries(updates)) {
    const column = columns.find((candidate) => candidate.name === name)
    if (column !== undefined) {
      draft = setMutationFieldText(draft, column, text)
    }
  }
  return draft
}

describe('table mutation state', () => {
  it('keeps raw drafts for several rows and derives valid sparse updates', () => {
    let state = createTableMutationState()
    state = reduceTableMutationState(state, {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace' }),
      schemaColumns: columns,
    })
    state = reduceTableMutationState(state, {
      type: 'setDraft',
      rowId: 'row-2',
      draft: createDraft({ id: 'row-2', name: 'Lin', age: 42 }, { age: '43' }),
      schemaColumns: columns,
    })

    expect(selectTableMutationLedger(state, columns)).toMatchObject({
      entries: [
        { kind: 'update', rowId: 'row-1', fields: { name: 'Grace' } },
        { kind: 'update', rowId: 'row-2', fields: { age: 43 } },
      ],
      hasInvalidDraft: false,
    })
  })

  it('preserves invalid raw input while excluding it from applicable fields', () => {
    const state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft(
        { id: 'row-1', name: 'Ada', age: 37 },
        { name: 'Grace', age: 'invalid' },
      ),
      schemaColumns: columns,
    })

    expect(state.draftsByRowId['row-1']?.fieldInputs.age?.text).toBe('invalid')
    expect(selectTableMutationLedger(state, columns)).toMatchObject({
      entries: [{ kind: 'update', rowId: 'row-1', fields: { name: 'Grace' } }],
      hasInvalidDraft: true,
    })
  })

  it('removes a clean draft and lets deletion supersede an update', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace' }),
      schemaColumns: columns,
    })
    state = reduceTableMutationState(state, { type: 'deleteRows', rowIds: ['row-1'] })

    expect(state.draftsByRowId['row-1']).toBeUndefined()
    expect(selectTableMutationLedger(state, columns).entries).toEqual([
      { entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' },
    ])

    state = reduceTableMutationState(state, { type: 'restoreRows', rowIds: ['row-1'] })
    expect(selectTableMutationLedger(state, columns).entries).toEqual([])
  })

  it('removes one update or discards the complete staged state', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace' }),
      schemaColumns: columns,
    })
    state = reduceTableMutationState(state, { type: 'deleteRows', rowIds: ['row-2'] })
    state = reduceTableMutationState(state, { type: 'removeEntry', entryId: 'update:row-1' })

    expect(state.draftsByRowId['row-1']).toBeUndefined()
    expect(state.deletedRowIds).toEqual(['row-2'])

    state = reduceTableMutationState(state, { type: 'discardAll' })
    expect(state).toEqual(createTableMutationState())
  })
})
