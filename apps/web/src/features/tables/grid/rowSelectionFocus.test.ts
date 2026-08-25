import { expect, it } from 'vitest'

import { getNearestSelectedRowId } from '@tables/grid/rowSelectionFocus'

it('chooses the nearest remaining row after the focused row is removed', () => {
  expect(
    getNearestSelectedRowId(
      ['row-1', 'row-2', 'row-3', 'row-4'],
      ['row-1', 'row-2', 'row-4'],
      'row-3',
    ),
  ).toBe('row-2')
})
