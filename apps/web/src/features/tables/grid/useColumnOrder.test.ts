import { describe, expect, it } from 'vitest'

import { moveColumnInOrder, normalizeColumnOrder } from '@tables/grid/useColumnOrder'

describe('normalizeColumnOrder', () => {
  it('keeps known stored columns once and appends newly discovered columns', () => {
    expect(
      normalizeColumnOrder(['role', 'missing', 'name', 'role'], ['name', 'role', 'createdAt']),
    ).toEqual(['role', 'name', 'createdAt'])
  })
})

describe('moveColumnInOrder', () => {
  it('moves one column relatively or to an order boundary', () => {
    const order = ['id', 'name', 'role']

    expect(moveColumnInOrder(order, 'name', 'left')).toEqual(['name', 'id', 'role'])
    expect(moveColumnInOrder(order, 'name', 'right')).toEqual(['id', 'role', 'name'])
    expect(moveColumnInOrder(order, 'name', 'start')).toEqual(['name', 'id', 'role'])
    expect(moveColumnInOrder(order, 'name', 'end')).toEqual(['id', 'role', 'name'])
  })

  it('moves relative to visible columns without disturbing hidden column positions', () => {
    const order = ['id', 'hidden', 'name', 'role']
    const visibleOrder = ['id', 'name', 'role']

    expect(moveColumnInOrder(order, 'id', 'right', visibleOrder)).toEqual([
      'hidden',
      'name',
      'id',
      'role',
    ])
    expect(moveColumnInOrder(order, 'role', 'start', visibleOrder)).toEqual([
      'role',
      'id',
      'hidden',
      'name',
    ])
  })
})
