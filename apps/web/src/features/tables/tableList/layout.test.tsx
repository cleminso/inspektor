import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SidePanelLayout, SidePanelLayoutProvider, useSidePanelLayout } from './layout'

const panel = vi.hoisted(() => ({
  collapse: vi.fn(),
  expand: vi.fn(),
  onResize: null as ((size: { asPercentage: number; inPixels: number }) => void) | null,
  resize: vi.fn(),
}))
const group = vi.hoisted(() => ({
  defaultLayout: undefined as Record<string, number> | undefined,
  onLayoutChanged: null as ((layout: Record<string, number>) => void) | null,
}))

vi.mock('@inspector/ds', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => <div role="separator" />,
  ResizablePanel: ({
    children,
    id,
    onResize,
  }: {
    children: React.ReactNode
    id: string
    onResize?: (size: { asPercentage: number; inPixels: number }) => void
  }) => {
    if (id === 'navigation') {
      panel.onResize = onResize ?? null
    }
    return (
      <div data-panel id={id}>
        {children}
      </div>
    )
  },
  ResizablePanelGroup: ({
    children,
    defaultLayout,
    onLayoutChanged,
  }: {
    children: React.ReactNode
    defaultLayout?: Record<string, number>
    onLayoutChanged?: (layout: Record<string, number>) => void
  }) => {
    group.defaultLayout = defaultLayout
    group.onLayoutChanged = onLayoutChanged ?? null
    return <div>{children}</div>
  },
  useResizableDefaultLayout: ({ id, storage }: { id: string; storage: Storage }) => {
    const storageKey = `react-resizable-panels:${id}`
    const value = storage.getItem(storageKey)
    return {
      defaultLayout: value === null ? undefined : JSON.parse(value),
      onLayoutChanged: (layout: Record<string, number>) => {
        storage.setItem(storageKey, JSON.stringify(layout))
      },
    }
  },
  useResizablePanelRef: () => ({ current: panel }),
}))

beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
  panel.collapse.mockReset()
  panel.collapse.mockImplementation(() => {
    group.onLayoutChanged?.({ content: 100, navigation: 0 })
  })
  panel.expand.mockReset()
  panel.onResize = null
  panel.resize.mockReset()
  group.onLayoutChanged = null
  group.defaultLayout = undefined
})

afterEach(() => {
  cleanup()
})

function renderLayout(sibling?: React.ReactNode): ReturnType<typeof render> {
  return render(
    <SidePanelLayoutProvider>
      {sibling}
      <SidePanelLayout>
        <SidePanelLayout.Panel>Panel</SidePanelLayout.Panel>
        <SidePanelLayout.Content>Content</SidePanelLayout.Content>
      </SidePanelLayout>
    </SidePanelLayoutProvider>,
  )
}

describe('SidePanelLayout', () => {
  it('falls back to the open layout when storage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('Unavailable')
      },
    })

    renderLayout()

    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('falls back to the open layout when persisted storage is malformed', () => {
    window.localStorage.setItem('react-resizable-panels:tables-side-panel', 'not-json')

    renderLayout()

    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it.each([
    ['a missing panel', JSON.stringify({ navigation: 0 })],
    ['zero total size', JSON.stringify({ content: 0, navigation: 0 })],
    ['a negative size', JSON.stringify({ content: 110, navigation: -10 })],
    ['a non-finite size', '{"content":1e309,"navigation":1}'],
    ['an overflowing total size', '{"content":1e308,"navigation":1e308}'],
  ])('falls back to the open layout for %s', (_case, value) => {
    window.localStorage.setItem('react-resizable-panels:tables-side-panel', value)

    renderLayout()

    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('restores the persisted table-list dock layout across remounts', () => {
    const storageKey = 'react-resizable-panels:tables-side-panel'
    window.localStorage.setItem(storageKey, JSON.stringify({ content: 100, navigation: 0 }))
    const view = renderLayout()

    expect(group.defaultLayout).toEqual({ content: 100, navigation: 0 })
    expect(screen.getByText('Panel').closest('[data-panel]')?.id).toBe('navigation')
    expect(screen.queryByRole('separator')).toBeNull()

    view.unmount()
    renderLayout()

    expect(screen.queryByRole('separator')).toBeNull()
    expect(window.localStorage.getItem(storageKey)).toBe(
      JSON.stringify({ content: 100, navigation: 0 }),
    )
  })

  it('reopens a restored collapsed dock at its last expanded size', () => {
    const view = renderLayout(<DockToggle />)
    panel.onResize?.({ asPercentage: 35, inPixels: 350 })
    fireEvent.click(screen.getByRole('button', { name: 'Toggle left dock' }))
    view.unmount()

    renderLayout(<DockToggle />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle left dock' }))

    expect(
      window.localStorage.getItem('inspector:tables-side-panel:navigation-expanded-size'),
    ).toBe('35')
    expect(panel.resize).toHaveBeenCalledWith('35%')
    expect(panel.expand).not.toHaveBeenCalled()
  })

  it('starts open and toggles from a control outside the resizable layout', () => {
    renderLayout(<DockToggle />)

    const toggle = screen.getByRole('button', { name: 'Toggle left dock' })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('separator')).toBeTruthy()

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('separator')).toBeNull()

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('separator')).toBeTruthy()
  })
})

function DockToggle(): React.ReactElement {
  const { isOpen, toggle } = useSidePanelLayout()

  return (
    <button type="button" aria-pressed={isOpen} onClick={toggle}>
      Toggle left dock
    </button>
  )
}
