import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Tooltip } from '@inspektor/ds'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'

import { InspectorFooter } from './view'

const leftDock = vi.hoisted(() => ({
  isOpen: true,
  toggle: vi.fn(),
}))

vi.mock('@inspektor/ds', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inspektor/ds')>()),
  useShellLayout: () => ({
    leftDock,
    rightDock: { isOpen: false, toggle: vi.fn() },
  }),
}))

afterEach(() => {
  cleanup()
  leftDock.isOpen = true
  leftDock.toggle.mockReset()
})

async function renderFooter(onOpenCommands = () => undefined) {
  const rootRoute = createRootRoute({ component: Outlet })
  const connectionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'conn/$connectionId',
    component: Outlet,
  })
  const tablesRoute = createRoute({
    getParentRoute: () => connectionRoute,
    path: 'tables',
    component: () => <InspectorFooter onOpenCommands={onOpenCommands} />,
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/conn/connection-1/tables'] }),
    routeTree: rootRoute.addChildren([connectionRoute.addChildren([tablesRoute])]),
  })

  await router.load()
  render(
    <AppHotkeysProvider>
      <Tooltip.Provider delay={0}>
        <RouterProvider router={router} />
      </Tooltip.Provider>
    </AppHotkeysProvider>,
  )
  return router
}

describe('InspectorFooter', () => {
  it('offers tables without a live queries entry', async () => {
    const router = await renderFooter()
    const tablesLink = screen.getByRole('link', { name: 'Close tables' })

    expect(tablesLink.getAttribute('aria-current')).toBe('page')
    expect(screen.queryByRole('link', { name: /live queries/i })).toBeNull()
    expect(router.state.location.pathname).toBe('/conn/connection-1/tables')
  })

  it('closes the table dock without navigating away', async () => {
    const router = await renderFooter()
    fireEvent.click(screen.getByRole('link', { name: 'Close tables' }))

    expect(leftDock.toggle).toHaveBeenCalledOnce()
    expect(router.state.location.pathname).toBe('/conn/connection-1/tables')
  })

  it('toggles the left dock with the shared shortcut', async () => {
    await renderFooter()

    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true })

    expect(leftDock.toggle).toHaveBeenCalledOnce()
  })

  it('does not handle the removed live queries shortcut', async () => {
    const router = await renderFooter()

    fireEvent.keyDown(document.body, { key: 'q', altKey: true })

    expect(router.state.location.pathname).toBe('/conn/connection-1/tables')
    expect(leftDock.toggle).not.toHaveBeenCalled()
  })

  it('opens the table dock with its shortcut', async () => {
    leftDock.isOpen = false
    const router = await renderFooter()

    fireEvent.keyDown(document.body, { key: 't', altKey: true })

    expect(leftDock.toggle).toHaveBeenCalledOnce()
    expect(router.state.location.pathname).toBe('/conn/connection-1/tables')
  })

  it('opens the command palette from the command action', async () => {
    const onOpenCommands = vi.fn()
    await renderFooter(onOpenCommands)

    fireEvent.click(screen.getByRole('button', { name: 'Open commands' }))

    expect(onOpenCommands).toHaveBeenCalledOnce()
  })
})
