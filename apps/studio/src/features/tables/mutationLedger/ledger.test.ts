import { describe, expect, it } from 'vitest'
import type { ColumnDescriptor } from 'jazz-tools'

import {
  createTableMutationState,
  reduceTableMutationState,
  selectTableMutationProjection,
} from '@tables/mutationLedger/ledger'
import {
  createInsertRowDraft,
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
    })
    state = reduceTableMutationState(state, {
      type: 'setDraft',
      rowId: 'row-2',
      draft: createDraft({ id: 'row-2', name: 'Lin', age: 42 }, { age: '43' }),
    })

    expect(selectTableMutationProjection(state, columns).ledger).toMatchObject({
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
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace', age: 'invalid' }),
    })

    expect(state.draftsByRowId['row-1']?.fieldInputs.age?.text).toBe('invalid')
    expect(selectTableMutationProjection(state, columns).ledger).toMatchObject({
      entries: [{ kind: 'update', rowId: 'row-1', fields: { name: 'Grace' } }],
      hasInvalidDraft: true,
    })
  })

  it('removes a clean draft and lets deletion supersede an update', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace' }),
    })
    state = reduceTableMutationState(state, { type: 'deleteRows', rowIds: ['row-1'] })
    state = reduceTableMutationState(state, {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Katherine' }),
    })

    expect(state.draftsByRowId['row-1']).toBeUndefined()
    expect(selectTableMutationProjection(state, columns).ledger.entries).toEqual([
      { entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' },
    ])
  })

  it('reverts one update or discards the complete staged state', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace' }),
    })
    state = reduceTableMutationState(state, { type: 'deleteRows', rowIds: ['row-2'] })
    state = reduceTableMutationState(state, { type: 'revertRowUpdate', rowId: 'row-1' })

    expect(state.draftsByRowId['row-1']).toBeUndefined()
    expect(state.deletionOperations).toEqual([
      { operationId: 'delete-operation:0', rowIds: ['row-2'] },
    ])

    state = reduceTableMutationState(state, { type: 'discardAll' })
    expect(state).toEqual(createTableMutationState())
  })

  it('reverts one applicable field while preserving invalid sibling input', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace', age: 'invalid' }),
    })

    state = reduceTableMutationState(state, {
      type: 'revertUpdateField',
      rowId: 'row-1',
      fieldName: 'name',
    })

    expect(state.draftsByRowId['row-1']?.fieldInputs.age?.text).toBe('invalid')
    expect(selectTableMutationProjection(state, columns).ledger).toEqual({
      entries: [],
      hasInvalidDraft: true,
    })
  })

  it('preserves deletion operation identity while deriving deduplicated Apply entries', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'deleteRows',
      rowIds: ['row-2', 'row-1', 'row-2'],
    })
    state = reduceTableMutationState(state, {
      type: 'deleteRows',
      rowIds: ['row-3', 'row-2'],
    })

    expect(selectTableMutationProjection(state, columns).reviewOperations).toEqual([
      {
        kind: 'delete',
        operationId: 'delete-operation:0',
        rowIds: ['row-2', 'row-1'],
      },
      {
        kind: 'delete',
        operationId: 'delete-operation:1',
        rowIds: ['row-3'],
      },
    ])
    expect(selectTableMutationProjection(state, columns).ledger.entries).toEqual([
      { entryId: 'delete:row-2', kind: 'delete', rowId: 'row-2' },
      { entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' },
      { entryId: 'delete:row-3', kind: 'delete', rowId: 'row-3' },
    ])
  })

  it('undoes loaded deletion targets across operations in one state transition', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'deleteRows',
      rowIds: ['row-1', 'row-2'],
    })
    state = reduceTableMutationState(state, {
      type: 'deleteRows',
      rowIds: ['row-3'],
    })

    state = reduceTableMutationState(state, {
      type: 'undoDeletions',
      rowIds: ['row-1', 'row-3'],
    })

    expect(state.deletionOperations).toEqual([
      { operationId: 'delete-operation:0', rowIds: ['row-2'] },
    ])
  })

  it('projects row update review operations and applicable staged field membership', () => {
    const state = reduceTableMutationState(createTableMutationState(), {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace', age: 'invalid' }),
    })

    const projection = selectTableMutationProjection(state, columns)

    expect(projection.reviewOperations).toEqual([
      {
        fieldNames: ['name'],
        kind: 'update',
        operationId: 'update:row-1',
        rowId: 'row-1',
      },
    ])
    expect(projection.stagedFieldsByRowId['row-1']).toEqual(new Set(['name']))
    expect(projection.stagedValuesByRowId).toEqual({
      'row-1': { name: 'Grace' },
    })
  })

  it('stages independent insert snapshots and removes them by operation', () => {
    const sourceValues = { name: 'Grace', age: 37 }
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'insertRow',
      draft: createInsertRowDraft(sourceValues, columns),
      sourceRowId: 'row-1',
    })
    sourceValues.name = 'Changed later'
    state = reduceTableMutationState(state, {
      type: 'insertRow',
      draft: createInsertRowDraft({ name: 'Grace', age: 37 }, columns),
      sourceRowId: 'row-1',
    })

    const projection = selectTableMutationProjection(state, columns)
    expect(projection.ledger.entries).toEqual([
      { entryId: 'insert:0', fields: { age: 37, name: 'Grace' }, kind: 'insert' },
      { entryId: 'insert:1', fields: { age: 37, name: 'Grace' }, kind: 'insert' },
    ])
    expect(projection.reviewOperations).toEqual([
      { kind: 'insert', operationId: 'insert:0', sourceRowId: 'row-1' },
      { kind: 'insert', operationId: 'insert:1', sourceRowId: 'row-1' },
    ])
    state = reduceTableMutationState(state, {
      type: 'undoReviewOperation',
      operationId: 'insert:0',
    })
    expect(selectTableMutationProjection(state, columns).ledger.entries).toEqual([
      { entryId: 'insert:1', fields: { age: 37, name: 'Grace' }, kind: 'insert' },
    ])

    state = reduceTableMutationState(state, {
      type: 'acknowledgeAppliedEntries',
      entryIds: ['insert:1'],
    })
    expect(selectTableMutationProjection(state, columns).ledger.entries).toEqual([])
  })

  it('preserves staged inserts when deletion supersedes a row update', () => {
    let state = reduceTableMutationState(createTableMutationState(), {
      type: 'insertRow',
      draft: createInsertRowDraft({ name: 'Duplicate', age: 37 }, columns),
      sourceRowId: 'row-1',
    })
    state = reduceTableMutationState(state, {
      type: 'setDraft',
      rowId: 'row-1',
      draft: createDraft({ id: 'row-1', name: 'Ada', age: 37 }, { name: 'Grace' }),
    })
    state = reduceTableMutationState(state, { type: 'deleteRows', rowIds: ['row-1'] })

    expect(selectTableMutationProjection(state, columns).ledger.entries).toEqual([
      { entryId: 'insert:0', fields: { age: 37, name: 'Duplicate' }, kind: 'insert' },
      { entryId: 'delete:row-1', kind: 'delete', rowId: 'row-1' },
    ])
  })
})
