import { expect, it } from 'vitest'

import { getNearestSelectedRowId } from '@tables/grid/rowSelectionFocus'

it.each([
  [
    'prefers the previous selected row',
    ['row-1', 'row-2', 'row-3', 'row-4'],
    ['row-1', 'row-2', 'row-4'],
    'row-3',
    'row-2',
  ],
  [
    'returns the first selection for an unknown removed row',
    ['row-1', 'row-2'],
    ['row-2'],
    'unknown',
    'row-2',
  ],
  ['returns null for an empty selection', ['row-1'], [], 'unknown', null],
  [
    'falls forward when no previous row is selected',
    ['row-1', 'row-2', 'row-3'],
    ['row-3'],
    'row-2',
    'row-3',
  ],
  ['returns null when no remaining row is selected', ['row-1', 'row-2'], ['row-2'], 'row-2', null],
] satisfies [string, string[], string[], string, string | null][])(
  '%s',
  (_name, rowIds, selectedRowIds, removedRowId, expected) => {
    expect(getNearestSelectedRowId(rowIds, selectedRowIds, removedRowId)).toBe(expected)
  },
)
