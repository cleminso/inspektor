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
  latestLocation: { href: '/conn/1/tables/accounts', state: { __TSR_index: 0 } },
  history: {
    go: vi.fn(),
    location: { href: '/conn/1/tables/accounts', state: { __TSR_index: 0 } },
    push: vi.fn(),
    subscribe: vi.fn((_subscriber: unknown) => () => {}),
  },
}))
const prepareTableNavigation = vi.hoisted(() =>
  vi.fn(async (_options: unknown, commit: () => Promise<void> | void) => {
    await commit()
    return 'committed'
  }),
)

vi.mock('@tanstack/react-router', () => ({ useRouter: () => router }))

vi.mock('@tables/routing/tableNavigationPreparation', () => ({
  useTableNavigationPreparation: () => ({ prepare: prepareTableNavigation }),
}))

afterEach(() => {
  cleanup()
  router.history.go.mockReset()
  router.history.push.mockReset()
  router.history.subscribe.mockClear()
  prepareTableNavigation.mockClear()
  router.history.location.href = '/conn/1/tables/accounts'
  router.history.location.state = { __TSR_index: 0 }
  router.latestLocation.href = '/conn/1/tables/accounts'
  router.latestLocation.state = { __TSR_index: 0 }
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
  it('mirrors duplicate browser history entries', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 1,
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 2,
      href: '/conn/1/tables/profiles',
    })

    expect(history).toEqual({
      entries: [
        { browserIndex: 0, href: '/conn/1/tables/accounts' },
        { browserIndex: 1, href: '/conn/1/tables/profiles' },
        { browserIndex: 2, href: '/conn/1/tables/profiles' },
      ],
      index: 2,
    })
  })

  it('removes the forward branch after new navigation', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 1,
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'reconcile',
      browserIndex: 0,
      href: '/conn/1/tables/accounts',
      offset: -1,
    })
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 1,
      href: '/conn/1/tables/organizations',
    })

    expect(history).toEqual({
      entries: [
        { browserIndex: 0, href: '/conn/1/tables/accounts' },
        { browserIndex: 1, href: '/conn/1/tables/organizations' },
      ],
      index: 1,
    })
  })

  it('updates the active entry when route navigation replaces history', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'replace',
      browserIndex: 0,
      href: '/conn/1/tables/accounts?page=2',
    })

    expect(history).toEqual({
      entries: [{ browserIndex: 0, href: '/conn/1/tables/accounts?page=2' }],
      index: 0,
    })
  })

  it('preserves state identity when route replacement matches the active entry', () => {
    const history = createTableNavigationHistory('/conn/1/tables/accounts')

    expect(
      reduceTableNavigationHistory(history, {
        type: 'replace',
        browserIndex: 0,
        href: '/conn/1/tables/accounts',
      }),
    ).toBe(history)
  })

  it('replaces a stale adjacent entry after native history navigation', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 1,
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'reconcile',
      browserIndex: 0,
      href: '/conn/1/tables/organizations',
      offset: -1,
    })

    expect(history).toEqual({
      entries: [
        { browserIndex: 0, href: '/conn/1/tables/organizations' },
        { browserIndex: 1, href: '/conn/1/tables/profiles' },
      ],
      index: 0,
    })
  })

  it('reconciles multi-entry jumps at their logical destination', () => {
    let history = createTableNavigationHistory('/conn/1/tables/accounts')
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 1,
      href: '/conn/1/tables/profiles',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'push',
      browserIndex: 2,
      href: '/conn/1/tables/organizations',
    })
    history = reduceTableNavigationHistory(history, {
      type: 'reconcile',
      browserIndex: 0,
      href: '/conn/1/tables/settings',
      offset: -2,
    })

    expect(history).toEqual({
      entries: [
        { browserIndex: 0, href: '/conn/1/tables/settings' },
        { browserIndex: 1, href: '/conn/1/tables/profiles' },
        { browserIndex: 2, href: '/conn/1/tables/organizations' },
      ],
      index: 0,
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
    fireEvent.click(backButton)

    expect(prepareTableNavigation).toHaveBeenCalledWith(
      {
        policy: 'replace',
        search: {
          filters: [],
          page: 1,
          pageSize: 100,
          sortColumn: 'id',
          sortDirection: 'asc',
        },
        tableName: 'accounts',
      },
      expect.any(Function),
    )
    expect(router.history.go).toHaveBeenCalledWith(-1)
    expect(router.history.go).toHaveBeenCalledOnce()
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

  it('preserves the forward branch when native back reaches an unknown URL', () => {
    render(createElement(TableNavigationHistoryProvider, null, createElement(NavigationControls)))
    const subscriber = getHistorySubscriber()
    act(() => {
      subscriber({
        action: { type: 'PUSH' },
        location: { href: '/conn/1/tables/profiles', state: { __TSR_index: 1 } },
      })
      subscriber({
        action: { type: 'GO', index: -1 },
        location: { href: '/conn/1/tables/organizations', state: { __TSR_index: 0 } },
      })
    })

    const forwardButton = screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement
    expect(forwardButton.disabled).toBe(false)
    fireEvent.click(forwardButton)
    expect(router.history.go).toHaveBeenCalledWith(1)
  })

  it('preserves browser distance after a missed multi-entry jump', () => {
    router.latestLocation.state = { __TSR_index: 3 }
    router.history.location.state = { __TSR_index: 3 }
    render(createElement(TableNavigationHistoryProvider, null, createElement(NavigationControls)))
    const subscriber = getHistorySubscriber()
    act(() => {
      subscriber({
        action: { type: 'PUSH' },
        location: { href: '/conn/1/tables/profiles', state: { __TSR_index: 4 } },
      })
      subscriber({
        action: { type: 'GO', index: -3 },
        location: { href: '/conn/1/tables/organizations', state: { __TSR_index: 1 } },
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Forward' }))

    expect(router.history.go).toHaveBeenLastCalledWith(2)
  })

  it('ignores blocked traversal that retains the active history index', () => {
    render(createElement(TableNavigationHistoryProvider, null, createElement(NavigationControls)))
    const subscriber = getHistorySubscriber()
    act(() => {
      subscriber({
        action: { type: 'PUSH' },
        location: { href: '/conn/1/tables/profiles', state: { __TSR_index: 1 } },
      })
      subscriber({
        action: { type: 'GO', index: -1 },
        location: { href: '/conn/1/tables/profiles', state: { __TSR_index: 1 } },
      })
    })

    expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
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

  it.each(['/conn/1/tables/profiles', '/conn/1/tables/accounts'])(
    'retains a push to %s that occurs before history subscription',
    (href) => {
      router.history.location = {
        href,
        state: { __TSR_index: 1 },
      }
      render(createElement(TableNavigationHistoryProvider, null, createElement(NavigationControls)))

      expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(
        false,
      )
    },
  )
})
