import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Tooltip } from '@inspector/ds'
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

import { InspectorDock } from './view'

const sidePanel = vi.hoisted(() => ({
  isOpen: true,
  toggle: vi.fn(),
}))

vi.mock('@tables/tableList/layout', () => ({
  useSidePanelLayout: () => sidePanel,
}))

afterEach(() => {
  cleanup()
  sidePanel.isOpen = true
  sidePanel.toggle.mockReset()
})

async function renderDock(onOpenCommands = () => undefined) {
  const rootRoute = createRootRoute({ component: Outlet })
  const connectionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'conn/$connectionId',
    component: Outlet,
  })
  const dockRoute = createRoute({
    getParentRoute: () => connectionRoute,
    path: 'tables',
    component: () => <InspectorDock onOpenCommands={onOpenCommands} />,
  })
  const queriesRoute = createRoute({
    getParentRoute: () => connectionRoute,
    path: 'queries',
    component: () => <InspectorDock onOpenCommands={onOpenCommands} />,
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/conn/connection-1/tables'] }),
    routeTree: rootRoute.addChildren([connectionRoute.addChildren([dockRoute, queriesRoute])]),
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

describe('InspectorDock', () => {
  it('switches the active dock icon without closing the left dock', async () => {
    const router = await renderDock()
    const tablesLink = screen.getByRole('link', { name: 'Close tables' })
    const queriesLink = screen.getByRole('link', { name: 'Open subscriptions' })

    expect(tablesLink.getAttribute('aria-current')).toBe('page')

    fireEvent.click(queriesLink)

    await expect.poll(() => router.state.location.pathname).toBe('/conn/connection-1/queries')
    expect(screen.getByRole('link', { name: 'Open tables' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Close subscriptions' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(sidePanel.toggle).not.toHaveBeenCalled()
  })

  it.each([
    ['Close tables', /B/u],
    ['Open subscriptions', /Q/u],
  ])('shows the shortcut for %s', async (label, shortcut) => {
    await renderDock()

    fireEvent.mouseEnter(screen.getByRole('link', { name: label }))

    const tooltip = await waitFor(() => document.querySelector('[data-slot="tooltip-content"]'))
    expect(tooltip?.textContent).toContain(label)
    expect(
      tooltip?.querySelector('[data-slot="keyboard-input"]')?.getAttribute('aria-label'),
    ).toMatch(shortcut)
  })

  it('toggles the left dock with the shared shortcut', async () => {
    await renderDock()

    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true })

    expect(sidePanel.toggle).toHaveBeenCalledOnce()
  })

  it('switches dock icons with their individual shortcuts', async () => {
    const router = await renderDock()

    fireEvent.keyDown(document.body, { key: 'q', altKey: true })

    await expect.poll(() => router.state.location.pathname).toBe('/conn/connection-1/queries')
    expect(sidePanel.toggle).not.toHaveBeenCalled()
  })

  it('opens the command palette from the command action', async () => {
    const onOpenCommands = vi.fn()
    await renderDock(onOpenCommands)

    fireEvent.click(screen.getByRole('button', { name: 'Open commands' }))

    expect(onOpenCommands).toHaveBeenCalledOnce()
  })
})
