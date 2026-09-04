// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const routerState = vi.hoisted(() => ({
  location: { pathname: '/conn/connection-1/tables' },
  resolvedLocation: { pathname: '/conn/new' },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Outlet: () => <div>Route content</div>,
  useRouterState: ({ select }: { select: (state: typeof routerState) => unknown }) =>
    select(routerState),
}))

vi.mock('@onboarding/connectionsLayout', () => ({
  ConnectionsLayout: ({
    children,
    connectionTriggerLabel,
    pageTitle,
  }: {
    children: React.ReactNode
    connectionTriggerLabel?: string
    pageTitle: string
  }) => (
    <>
      <header>{connectionTriggerLabel ?? 'Current connection'}</header>
      <main aria-label={pageTitle}>{children}</main>
    </>
  ),
}))

vi.mock('@onboarding/view', () => ({
  ConnectionsView: () => <div>Connections</div>,
}))

const { ConnRoute } = await import('./-connRoute')

afterEach(() => {
  cleanup()
  routerState.location.pathname = '/conn/connection-1/tables'
  routerState.resolvedLocation.pathname = '/conn/new'
})

describe('ConnRoute', () => {
  it('keeps the current onboarding layout while workspace navigation is pending', () => {
    render(<ConnRoute />)

    expect(screen.getByRole('main', { name: 'Add connection' })).toBeTruthy()
    expect(screen.getByText('Route content')).toBeTruthy()
  })

  it('uses a generic header without connection context when adding a connection', () => {
    routerState.resolvedLocation.pathname = '/conn/new'

    render(<ConnRoute />)

    expect(screen.getByRole('banner').textContent).toBe('Open connection')
  })

  it('keeps the current connection context when editing a connection', () => {
    routerState.resolvedLocation.pathname = '/conn/edit/connection-1'

    render(<ConnRoute />)

    expect(screen.getByRole('banner').textContent).toBe('Current connection')
  })
})
