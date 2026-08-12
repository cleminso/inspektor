import { describe, expect, it } from 'vitest'

import {
  createTableNavigationHistory,
  reduceTableNavigationHistory,
} from '@tables/workspace/navigationHistory'

describe('table navigation history', () => {
  it('records route navigation without recording duplicate active URLs', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      href: '/conn/1/tables/profiles',
    })

    expect(history).toEqual({
      entries: ['/conn/1/tables/accounts', '/conn/1/tables/profiles'],
      index: 1,
    })
  })

  it('removes the forward branch after new navigation', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, { type: 'move', index: 0 })
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      href: '/conn/1/tables/organizations',
    })

    expect(history).toEqual({
      entries: ['/conn/1/tables/accounts', '/conn/1/tables/organizations'],
      index: 1,
    })
  })

  it('updates the active entry when route navigation replaces history', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'replace',
      href: '/conn/1/tables/accounts?page=2',
    })

    expect(history).toEqual({ entries: ['/conn/1/tables/accounts?page=2'], index: 0 })
  })

  it('moves to an existing route after native history navigation', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'reconcile',
      direction: 'back',
      href: '/conn/1/tables/accounts',
    })

    expect(history.index).toBe(0)
    expect(history.entries).toEqual([
      '/conn/1/tables/accounts',
      '/conn/1/tables/profiles',
    ])
  })

  it('appends an unknown route after native history navigation', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'reconcile',
      direction: 'back',
      href: '/conn/1/tables/organizations',
    })

    expect(history).toEqual({
      entries: [
        '/conn/1/tables/accounts',
        '/conn/1/tables/profiles',
        '/conn/1/tables/organizations',
      ],
      index: 2,
    })
  })
})
