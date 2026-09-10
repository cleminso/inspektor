import { Tooltip } from '@inspektor/ds'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/components/themeProvider'
import { routeTree } from '@/routeTree.gen'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AppShell', () => {
  it('connects the narrow navigation toggle to its controlled region and restores focus', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/components/button'] }),
    })

    render(
      <ThemeProvider>
        <Tooltip.Provider>
          <RouterProvider router={router} />
        </Tooltip.Provider>
      </ThemeProvider>,
    )

    const showNavigation = await screen.findByRole('button', { name: 'Show navigation' })
    expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe(
      '#main-content',
    )
    expect(screen.getByRole('main').getAttribute('tabindex')).toBe('-1')
    expect(showNavigation.getAttribute('aria-controls')).toBe('primary-navigation')
    expect(showNavigation.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(showNavigation)

    const hideNavigation = screen.getByRole('button', { name: 'Hide navigation' })
    expect(hideNavigation.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByRole('navigation', { name: 'Design system pages' })).toHaveLength(1)

    fireEvent.click(screen.getByRole('link', { name: 'Accordion' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show navigation' })).toBe(document.activeElement)
    })
  })

  it('renders component navigation in the wide ShellLayout left dock', async () => {
    vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
      matches: query === '(min-width: 768px)',
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }))
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/components/button'] }),
    })

    const { container } = render(
      <ThemeProvider>
        <Tooltip.Provider>
          <RouterProvider router={router} />
        </Tooltip.Provider>
      </ThemeProvider>,
    )

    expect(await screen.findByRole('button', { name: 'Hide components tree' })).toBeTruthy()

    const leftDock = container.querySelector('[data-slot="shell-layout-left-dock"]')
    if (!(leftDock instanceof HTMLElement)) {
      throw new TypeError('Expected the wide ShellLayout left dock')
    }

    expect(within(leftDock).getByRole('link', { name: 'Accordion' })).toBeTruthy()
    expect(leftDock.querySelector('[data-slot="side-panel"]')).not.toBeNull()
    expect(leftDock.querySelector('[data-slot="side-panel-body"]')).toBeNull()
    expect(
      leftDock.querySelector('[data-slot="side-panel"] > [data-slot="tree-scroll-area"]'),
    ).not.toBeNull()
    expect(container.querySelector('[data-slot="shell-layout-right-dock"]')).toBeNull()
    expect(container.querySelector('#primary-navigation')).toBeNull()
    expect(screen.getAllByRole('navigation', { name: 'Design system pages' })).toHaveLength(1)
  })

  it('closes narrow navigation when the layout becomes wide', async () => {
    let matches = false
    const listeners = new Set<EventListener>()
    vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.add(listener)
        }
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.delete(listener)
        }
      },
      dispatchEvent: () => false,
    }))
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/components/button'] }),
    })

    render(
      <ThemeProvider>
        <Tooltip.Provider>
          <RouterProvider router={router} />
        </Tooltip.Provider>
      </ThemeProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Show navigation' }))
    expect(screen.getByRole('button', { name: 'Hide navigation' })).toBeTruthy()
    screen.getByRole('link', { name: 'Accordion' }).focus()

    act(() => {
      matches = true
      for (const listener of listeners) {
        listener(new Event('change'))
      }
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show navigation' })).toBeTruthy()
      expect(screen.getByRole('main')).toBe(document.activeElement)
    })
  })
})
