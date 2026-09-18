// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { cleanup, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const routerState = vi.hoisted(() => ({
  location: { pathname: '/conn/connection-1/tables' },
  resolvedLocation: { pathname: '/conn/new' },
}))
const outletLifecycle = vi.hoisted(() => ({ cleanups: 0, mounts: 0 }))

// Keep the former location-aware dependencies available so this test fails if ConnRoute regains its
// conditional onboarding wrapper. The resolved-location transition previously remounted this outlet.
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Outlet: () => {
    useEffect(() => {
      outletLifecycle.mounts += 1
      return () => {
        outletLifecycle.cleanups += 1
      }
    }, [])
    return <div>Route content</div>
  },
  useRouterState: ({ select }: { select: (state: typeof routerState) => unknown }) =>
    select(routerState),
}))

vi.mock('@onboarding/connectionsLayout', () => ({
  ConnectionsLayout: ({ children }: { children: React.ReactNode }) => (
    <section aria-label="Onboarding layout">{children}</section>
  ),
}))

const { ConnRoute } = await import('./-connRoute')

afterEach(() => {
  cleanup()
  routerState.location.pathname = '/conn/connection-1/tables'
  routerState.resolvedLocation.pathname = '/conn/new'
  outletLifecycle.cleanups = 0
  outletLifecycle.mounts = 0
})

describe('ConnRoute', () => {
  it('keeps the route outlet mounted when onboarding navigation resolves to the workspace', () => {
    const { rerender } = render(<ConnRoute />)

    expect(screen.getByText('Route content')).toBeTruthy()
    expect(outletLifecycle).toEqual({ cleanups: 0, mounts: 1 })

    routerState.resolvedLocation.pathname = '/conn/connection-1/tables'
    rerender(<ConnRoute />)

    expect(outletLifecycle).toEqual({ cleanups: 0, mounts: 1 })
  })
})
