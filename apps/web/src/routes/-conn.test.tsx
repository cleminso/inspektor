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
    pageTitle,
  }: {
    children: React.ReactNode
    pageTitle: string
  }) => <main aria-label={pageTitle}>{children}</main>,
}))

vi.mock('@onboarding/view', () => ({
  ConnectionsView: () => <div>Connections</div>,
}))

const { ConnRoute } = await import('./-connRoute')

afterEach(cleanup)

describe('ConnRoute', () => {
  it('keeps the current onboarding layout while workspace navigation is pending', () => {
    render(<ConnRoute />)

    expect(screen.getByRole('main', { name: 'Add connection' })).toBeTruthy()
    expect(screen.getByText('Route content')).toBeTruthy()
  })
})
