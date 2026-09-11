import type { ColumnDescriptor } from 'jazz-tools'
import { describe, expect, it } from 'vitest'

import { getInlineFieldRoute, resolveSpreadsheetCompletionTarget } from '@tables/grid/inlineEditing'
import type { TableColumnMeta } from '@tables/tableTypes'

function columnMeta(column: ColumnDescriptor | null): TableColumnMeta {
  return {
    accessorKey: column?.name ?? 'id',
    column,
    id: column?.name ?? 'id',
    isSortable: true,
    label: column?.name ?? 'ID',
  }
}

describe('getInlineFieldRoute', () => {
  it('routes scalar and structured columns to the field editor', () => {
    expect(
      getInlineFieldRoute(
        columnMeta({ name: 'count', column_type: { type: 'Integer' }, nullable: false }),
      ),
    ).toBe('fieldEditor')
    expect(
      getInlineFieldRoute(
        columnMeta({ name: 'settings', column_type: { type: 'Json' }, nullable: false }),
      ),
    ).toBe('fieldEditor')
  })

  it('routes relation and binary fields to the complete-row pane', () => {
    expect(
      getInlineFieldRoute(
        columnMeta({
          name: 'accountId',
          column_type: { type: 'Uuid' },
          nullable: false,
          references: 'accounts',
        }),
      ),
    ).toBe('rowPane')
    expect(
      getInlineFieldRoute(
        columnMeta({ name: 'payload', column_type: { type: 'Bytea' }, nullable: false }),
      ),
    ).toBe('rowPane')
    expect(
      getInlineFieldRoute(
        columnMeta({
          name: 'profile',
          column_type: {
            type: 'Row',
            columns: [{ name: 'avatar', column_type: { type: 'Bytea' }, nullable: false }],
          },
          nullable: false,
        }),
      ),
    ).toBe('rowPane')
  })

  it('rejects synthetic columns', () => {
    expect(getInlineFieldRoute(columnMeta(null))).toBe('readOnly')
    expect(
      getInlineFieldRoute({
        ...columnMeta({
          name: '$createdBy',
          column_type: { type: 'Row', columns: [] },
          nullable: false,
        }),
        isReadOnly: true,
      }),
    ).toBe('readOnly')
  })
})

describe('resolveSpreadsheetCompletionTarget', () => {
  const rows = [
    [
      { rowId: 'row-1', columnId: 'name' },
      { rowId: 'row-1', columnId: 'role' },
    ],
    [
      { rowId: 'row-2', columnId: 'name' },
      { rowId: 'row-2', columnId: 'role' },
    ],
  ]

  it('moves Enter down in the same column', () => {
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: 'row-1', columnId: 'role' }, 'enter'),
    ).toEqual({ rowId: 'row-2', columnId: 'role' })
  })

  it('wraps Tab and Shift+Tab across rows', () => {
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: 'row-1', columnId: 'role' }, 'tabForward'),
    ).toEqual({ rowId: 'row-2', columnId: 'name' })
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: 'row-2', columnId: 'name' }, 'tabBackward'),
    ).toEqual({ rowId: 'row-1', columnId: 'role' })
  })

  it('keeps focus at table boundaries', () => {
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: 'row-2', columnId: 'role' }, 'enter'),
    ).toEqual({ rowId: 'row-2', columnId: 'role' })
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: 'row-1', columnId: 'name' }, 'tabBackward'),
    ).toEqual({ rowId: 'row-1', columnId: 'name' })
  })

  it.each([
    ['enter', { rowId: 'row-1', columnId: 'role' }],
    ['tabForward', { rowId: 'row-2', columnId: 'name' }],
    ['tabBackward', { rowId: 'row-1', columnId: 'role' }],
  ] as const)('handles ragged rows for %s completion', (direction, expected) => {
    const raggedRows = [rows[0] ?? [], [{ rowId: 'row-2', columnId: 'name' }]]

    expect(
      resolveSpreadsheetCompletionTarget(
        raggedRows,
        direction === 'tabBackward'
          ? { rowId: 'row-2', columnId: 'name' }
          : { rowId: 'row-1', columnId: 'role' },
        direction,
      ),
    ).toEqual(expected)
  })

  it.each(['enter', 'tabForward', 'tabBackward'] as const)(
    'keeps an unknown origin for %s completion',
    (direction) => {
      const origin = { rowId: 'unknown', columnId: 'name' }

      expect(resolveSpreadsheetCompletionTarget(rows, origin, direction)).toBe(origin)
    },
  )
})
