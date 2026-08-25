import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  TableNavigationHistoryProvider,
  createTableNavigationHistory,
  reduceTableNavigationHistory,
  useTableNavigationControls,
} from '@tables/workspace/navigationHistory'

const router = vi.hoisted(() => ({
  latestLocation: { href: '/conn/1/tables/accounts' },
  history: {
    go: vi.fn(),
    location: { href: '/conn/1/tables/accounts' },
    push: vi.fn(),
    subscribe: vi.fn((_subscriber: unknown) => () => {}),
  },
}))

vi.mock('@tanstack/react-router', () => ({ useRouter: () => router }))

afterEach(() => {
  cleanup()
  router.history.go.mockReset()
  router.history.push.mockReset()
  router.history.subscribe.mockClear()
  router.history.location.href = '/conn/1/tables/accounts'
  router.latestLocation.href = '/conn/1/tables/accounts'
})

function NavigationControls(): React.ReactElement {
  const { canGoBack, canGoForward, goBack, goForward } = useTableNavigationControls()
  return createElement(
    'div',
    null,
    createElement('button', { disabled: canGoBack === false, onClick: goBack }, 'Back'),
    createElement('button', { disabled: canGoForward === false, onClick: goForward }, 'Forward'),
  )
}

type TestHistoryEvent = {
  action: { type: 'PUSH' } | { type: 'GO'; index: number }
  location: { href: string; state: { __TSR_index: number } }
}

function getHistorySubscriber(): (event: TestHistoryEvent) => void {
  return router.history.subscribe.mock.calls[0]?.[0] as (event: TestHistoryEvent) => void
}

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
    history = reduceTableNavigationHistory(history, {
      type: 'reconcile',
      direction: 'back',
      href: '/conn/1/tables/accounts',
    })
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

  it('moves through browser history instead of pushing replay entries', () => {
    render(createElement(TableNavigationHistoryProvider, null, createElement(NavigationControls)))
    const subscriber = getHistorySubscriber()
    act(() => {
      router.latestLocation.href = '/conn/1/tables/profiles'
      router.history.location.href = '/conn/1/tables/profiles'
      subscriber({
        action: { type: 'PUSH' },
        location: { href: '/conn/1/tables/profiles', state: { __TSR_index: 1 } },
      })
    })

    const backButton = screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement
    expect(backButton.disabled).toBe(false)
    fireEvent.click(backButton)

    expect(router.history.go).toHaveBeenCalledWith(-1)
    expect(router.history.push).not.toHaveBeenCalled()

    act(() => {
      router.latestLocation.href = '/conn/1/tables/accounts'
      router.history.location.href = '/conn/1/tables/accounts'
      subscriber({
        action: { type: 'GO', index: -1 },
        location: { href: '/conn/1/tables/accounts', state: { __TSR_index: 0 } },
      })
    })
    const forwardButton = screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement
    expect(forwardButton.disabled).toBe(false)
    fireEvent.click(forwardButton)
    expect(router.history.go).toHaveBeenLastCalledWith(1)
  })

  it('reconciles a route replacement that occurs before history subscription', () => {
    router.history.location.href = '/conn/1/tables/profiles'
    render(createElement(TableNavigationHistoryProvider, null, createElement(NavigationControls)))
    const subscriber = getHistorySubscriber()
    act(() => {
      router.latestLocation.href = '/conn/1/tables/organizations'
      router.history.location.href = '/conn/1/tables/organizations'
      subscriber({
        action: { type: 'PUSH' },
        location: { href: '/conn/1/tables/organizations', state: { __TSR_index: 1 } },
      })
      router.latestLocation.href = '/conn/1/tables/profiles'
      router.history.location.href = '/conn/1/tables/profiles'
      subscriber({
        action: { type: 'GO', index: -1 },
        location: { href: '/conn/1/tables/profiles', state: { __TSR_index: 0 } },
      })
    })

    expect((screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })
})
