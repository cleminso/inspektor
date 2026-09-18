import { describe, expect, it } from 'vitest'
import type { ColumnDescriptor } from 'jazz-tools'

import {
  buildRowMutationSubmission,
  createUpdateRowDraft,
  setMutationFieldMode,
  setMutationFieldText,
} from '@tables/rowEditor/mutation/draft'

function column(
  name: string,
  columnType: ColumnDescriptor['column_type'],
  nullable = false,
): ColumnDescriptor {
  return { name, column_type: columnType, nullable }
}

describe('row mutation submission boundary', () => {
  it.each(['"hello"', '{"enabled":true}', '42', 'true'])(
    'keeps JSON input %s for the Jazz mutation boundary',
    (input) => {
      const jsonColumn = column('payload', { type: 'Json' })
      const draft = setMutationFieldText(
        createUpdateRowDraft({ payload: { previous: true } }),
        jsonColumn,
        input,
      )
      const submission = buildRowMutationSubmission(draft, [jsonColumn])

      expect(submission.errors).toEqual({})
      expect(submission.values.payload).toBe(input)
    },
  )

  it('keeps nested JSON source values for the Jazz mutation boundary', () => {
    const jsonArrayColumn = column('items', { type: 'Array', element: { type: 'Json' } })
    const draft = setMutationFieldText(
      createUpdateRowDraft({ items: [] }),
      jsonArrayColumn,
      '["hello",{"enabled":true},42,true]',
    )
    const submission = buildRowMutationSubmission(draft, [jsonArrayColumn])

    expect(submission.errors).toEqual({})
    expect(submission.values.items).toEqual(['"hello"', '{"enabled":true}', '42', 'true'])
  })

  it('excludes provenance values from row mutation submissions', () => {
    const nameColumn = column('name', { type: 'Text' })
    const draft = setMutationFieldText(
      createUpdateRowDraft({
        id: 'row-1',
        name: 'Ada',
        $createdAt: new Date('2026-04-05T06:07:08.009Z'),
        $createdBy: {
          account: 'account-1',
          identity: { issuer: 'https://issuer.example', subject: 'creator-1' },
        },
        $updatedAt: new Date('2026-04-06T07:08:09.010Z'),
        $updatedBy: {
          account: 'account-2',
          identity: { issuer: 'https://issuer.example', subject: 'editor-2' },
        },
      }),
      nameColumn,
      'Grace',
    )

    expect(buildRowMutationSubmission(draft, [nameColumn])).toEqual({
      errors: {},
      values: { name: 'Grace' },
    })
  })

  it('keeps SQL NULL separate from JSON input', () => {
    const jsonColumn = column('payload', { type: 'Json' }, true)
    const draft = setMutationFieldMode(
      createUpdateRowDraft({ payload: { previous: true } }),
      jsonColumn,
      'null',
    )
    const submission = buildRowMutationSubmission(draft, [jsonColumn])

    expect(submission.values.payload).toBeNull()
  })

  it('preserves a safe BigInt as a submitted number', () => {
    const bigIntColumn = column('sequence', { type: 'BigInt' })
    const draft = setMutationFieldText(
      createUpdateRowDraft({ sequence: 1 }),
      bigIntColumn,
      String(Number.MAX_SAFE_INTEGER),
    )
    const submission = buildRowMutationSubmission(draft, [bigIntColumn])

    expect(submission.values.sequence).toBe(Number.MAX_SAFE_INTEGER)
  })
})
