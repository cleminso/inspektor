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
  onLayoutChanged: null as ((layout: Record<string, number>) => void) | null,
}))

vi.mock('@inspector/ds', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => <div />,
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
    return <div data-panel-id={id}>{children}</div>
  },
  ResizablePanelGroup: ({
    children,
    onLayoutChanged,
  }: {
    children: React.ReactNode
    onLayoutChanged?: (layout: Record<string, number>) => void
  }) => {
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
})

afterEach(cleanup)

function DockToggle(): React.ReactElement {
  const { toggle } = useSidePanelLayout()
  return (
    <button type="button" onClick={toggle}>
      Toggle left dock
    </button>
  )
}

function renderLayout(): ReturnType<typeof render> {
  return render(
    <SidePanelLayoutProvider>
      <DockToggle />
      <SidePanelLayout>
        <SidePanelLayout.Panel>Panel</SidePanelLayout.Panel>
        <SidePanelLayout.Content>Content</SidePanelLayout.Content>
      </SidePanelLayout>
    </SidePanelLayoutProvider>,
  )
}

describe('SidePanelLayout persisted expanded size', () => {
  it('reopens a restored collapsed dock at its last expanded size', () => {
    const view = renderLayout()
    panel.onResize?.({ asPercentage: 35, inPixels: 350 })
    fireEvent.click(screen.getByRole('button', { name: 'Toggle left dock' }))
    view.unmount()

    renderLayout()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle left dock' }))

    expect(
      window.localStorage.getItem('inspector:tables-side-panel:navigation-expanded-size'),
    ).toBe('35')
    expect(panel.resize).toHaveBeenCalledWith('35%')
    expect(panel.expand).not.toHaveBeenCalled()
  })
})
