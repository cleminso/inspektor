import { describe, expect, it } from 'vitest'

import { updateTableNameSelection } from './selection'

describe('updateTableNameSelection', () => {
  it('updates only the target when there is no range anchor', () => {
    const checkedTableNames = updateTableNameSelection({
      anchorTableName: null,
      checked: true,
      checkedTableNames: new Set(['accounts']),
      orderedTableNames: ['accounts', 'sessions', 'users'],
      targetTableName: 'users',
    })

    expect([...checkedTableNames]).toEqual(['accounts', 'users'])
  })

  it('checks the inclusive range between the anchor and target', () => {
    const checkedTableNames = updateTableNameSelection({
      anchorTableName: 'sessions',
      checked: true,
      checkedTableNames: new Set(['sessions']),
      orderedTableNames: ['accounts', 'sessions', 'tokens', 'users'],
      targetTableName: 'users',
    })

    expect([...checkedTableNames]).toEqual(['sessions', 'tokens', 'users'])
  })

  it('unchecks the inclusive range without changing items outside it', () => {
    const checkedTableNames = updateTableNameSelection({
      anchorTableName: 'sessions',
      checked: false,
      checkedTableNames: new Set(['accounts', 'sessions', 'tokens', 'users']),
      orderedTableNames: ['accounts', 'sessions', 'tokens', 'users'],
      targetTableName: 'users',
    })

    expect([...checkedTableNames]).toEqual(['accounts'])
  })

  it('falls back to the target when the anchor is not visible', () => {
    const checkedTableNames = updateTableNameSelection({
      anchorTableName: 'hidden',
      checked: true,
      checkedTableNames: new Set(['accounts']),
      orderedTableNames: ['accounts', 'sessions', 'users'],
      targetTableName: 'users',
    })

    expect([...checkedTableNames]).toEqual(['accounts', 'users'])
  })
})
