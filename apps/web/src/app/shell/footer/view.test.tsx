import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  const queriesRoute = createRoute({
    getParentRoute: () => connectionRoute,
    path: 'live-queries',
    component: () => <InspectorFooter onOpenCommands={onOpenCommands} />,
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/conn/connection-1/tables'] }),
    routeTree: rootRoute.addChildren([connectionRoute.addChildren([tablesRoute, queriesRoute])]),
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
  it('switches the active dock icon without closing the left dock', async () => {
    const router = await renderFooter()
    const tablesLink = screen.getByRole('link', { name: 'Close tables' })
    const queriesLink = screen.getByRole('link', { name: 'Open live queries' })

    expect(tablesLink.getAttribute('aria-current')).toBe('page')

    fireEvent.click(queriesLink)

    await expect.poll(() => router.state.location.pathname).toBe('/conn/connection-1/live-queries')
    expect(screen.getByRole('link', { name: 'Open tables' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Close live queries' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(leftDock.toggle).not.toHaveBeenCalled()
  })

  it.each([
    ['Close tables', /B/u],
    ['Open live queries', /Q/u],
  ])('shows the shortcut for %s', async (label, shortcut) => {
    await renderFooter()

    fireEvent.mouseEnter(screen.getByRole('link', { name: label }))

    const tooltip = await waitFor(() => document.querySelector('[data-slot="tooltip-content"]'))
    expect(tooltip?.textContent).toContain(label)
    expect(
      tooltip?.querySelector('[data-slot="keyboard-input"]')?.getAttribute('aria-label'),
    ).toMatch(shortcut)
  })

  it('toggles the left dock with the shared shortcut', async () => {
    await renderFooter()

    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true })

    expect(leftDock.toggle).toHaveBeenCalledOnce()
  })

  it('switches dock icons with their individual shortcuts', async () => {
    const router = await renderFooter()

    fireEvent.keyDown(document.body, { key: 'q', altKey: true })

    await expect.poll(() => router.state.location.pathname).toBe('/conn/connection-1/live-queries')
    expect(leftDock.toggle).not.toHaveBeenCalled()
  })

  it('opens the command palette from the command action', async () => {
    const onOpenCommands = vi.fn()
    await renderFooter(onOpenCommands)

    fireEvent.click(screen.getByRole('button', { name: 'Open commands' }))

    expect(onOpenCommands).toHaveBeenCalledOnce()
  })
})
