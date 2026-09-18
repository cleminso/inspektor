import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useLayoutEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ShellLayout,
  useShellLayout,
  type ShellLayoutDockSide,
  type ShellLayoutStorage,
} from './shellLayout'

const panels = vi.hoisted(() => ({
  leftDock: {
    collapse: vi.fn(),
    expand: vi.fn(),
    resize: vi.fn(),
  },
  rightDock: {
    collapse: vi.fn(),
    expand: vi.fn(),
    resize: vi.fn(),
  },
  options: new Map<
    string,
    {
      collapsible?: boolean
      defaultSize?: number | string
      maxSize?: number | string
      minSize?: number | string
    }
  >(),
  onResize: new Map<string, (size: { asPercentage: number; inPixels: number }) => void>(),
}))
const group = vi.hoisted(() => ({
  defaultLayout: undefined as Record<string, number> | undefined,
  onLayoutChanged: undefined as ((layout: Record<string, number>) => void) | undefined,
}))

vi.mock('react-resizable-panels', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-resizable-panels')>()),
  Group: ({
    children,
    defaultLayout,
    onLayoutChanged,
  }: {
    children: React.ReactNode
    defaultLayout?: Record<string, number>
    onLayoutChanged?: (layout: Record<string, number>) => void
  }) => {
    group.defaultLayout = defaultLayout
    group.onLayoutChanged = onLayoutChanged
    return <div data-group>{children}</div>
  },
  Panel: ({
    children,
    collapsible,
    defaultSize,
    id,
    maxSize,
    minSize,
    onResize,
    panelRef,
  }: {
    children?: React.ReactNode
    collapsible?: boolean
    defaultSize?: number | string
    id: 'leftDock' | 'rightDock' | 'view'
    maxSize?: number | string
    minSize?: number | string
    onResize?: (size: { asPercentage: number; inPixels: number }) => void
    panelRef?: React.RefObject<(typeof panels)['leftDock'] | null>
  }) => {
    panels.options.set(id, { collapsible, defaultSize, maxSize, minSize })
    if (id !== 'view') {
      panels.onResize.set(id, onResize ?? vi.fn())
      if (panelRef !== undefined) {
        panelRef.current = panels[id]
      }
    }
    useLayoutEffect(() => {
      if (id !== 'view') {
        const percentage = group.defaultLayout?.[id] ?? 20
        onResize?.({ asPercentage: percentage, inPixels: percentage === 0 ? 0 : 200 })
      }
    }, [id, onResize])
    return <div data-panel={id}>{children}</div>
  },
  Separator: () => <div role="separator" />,
}))

beforeEach(() => {
  panels.leftDock.collapse.mockReset()
  panels.leftDock.resize.mockReset()
  panels.rightDock.collapse.mockReset()
  panels.rightDock.resize.mockReset()
  panels.options.clear()
  panels.onResize.clear()
  group.defaultLayout = undefined
  group.onLayoutChanged = undefined
})

afterEach(cleanup)

function createStorage(expandedSizes: Partial<Record<ShellLayoutDockSide, number>> = {}): {
  storage: ShellLayoutStorage
  values: Map<string, string>
} {
  const values = new Map<string, string>()
  return {
    storage: {
      getExpandedDockSize: (side) => expandedSizes[side] ?? null,
      getItem: (key) => values.get(key) ?? null,
      setExpandedDockSize: (side, size) => {
        expandedSizes[side] = size
      },
      setItem: (key, value) => values.set(key, value),
    },
    values,
  }
}

function DockToggle({ side }: { side: ShellLayoutDockSide }): React.ReactElement {
  const dock = useShellLayout()[`${side}Dock`]
  return (
    <button type="button" aria-pressed={dock.isOpen} onClick={dock.toggle}>
      Toggle {side} dock
    </button>
  )
}

describe('ShellLayout', () => {
  it('renders only the panels and handles composed by the consumer', () => {
    render(
      <ShellLayout.Root>
        <ShellLayout.Header>Header</ShellLayout.Header>
        <ShellLayout.Body>
          <ShellLayout.LeftDock>Left</ShellLayout.LeftDock>
          <ShellLayout.View>View</ShellLayout.View>
        </ShellLayout.Body>
        <ShellLayout.Footer>Footer</ShellLayout.Footer>
      </ShellLayout.Root>,
    )

    expect(screen.getAllByRole('separator')).toHaveLength(1)
    expect(document.querySelector('[data-panel="leftDock"]')?.textContent).toBe('Left')
    expect(document.querySelector('[data-panel="view"]')?.textContent).toBe('View')
    expect(document.querySelector('[data-panel="rightDock"]')).toBeNull()
  })

  it('places resize handles inside both optional dock boundaries', () => {
    render(
      <ShellLayout.Root>
        <ShellLayout.Body>
          <ShellLayout.LeftDock>Left</ShellLayout.LeftDock>
          <ShellLayout.View>View</ShellLayout.View>
          <ShellLayout.RightDock>Right</ShellLayout.RightDock>
        </ShellLayout.Body>
      </ShellLayout.Root>,
    )

    expect(
      [...document.querySelector('[data-group]')!.children].map(
        (element) => element.getAttribute('data-panel') ?? element.getAttribute('role'),
      ),
    ).toEqual(['leftDock', 'separator', 'view', 'separator', 'rightDock'])
    expect(panels.options.get('leftDock')).toEqual({
      collapsible: true,
      defaultSize: 200,
      maxSize: 360,
      minSize: 160,
    })
    expect(panels.options.get('rightDock')).toEqual(panels.options.get('leftDock'))
  })

  it.each(['left', 'right'] as const)(
    'collapses and restores the %s dock at its persisted expanded size',
    (side) => {
      const { storage } = createStorage({ [side]: 35 })
      render(
        <ShellLayout.Root persistence={{ id: 'shell', storage }}>
          <DockToggle side={side} />
          <ShellLayout.Body>
            <ShellLayout.LeftDock>Left</ShellLayout.LeftDock>
            <ShellLayout.View>View</ShellLayout.View>
            <ShellLayout.RightDock>Right</ShellLayout.RightDock>
          </ShellLayout.Body>
        </ShellLayout.Root>,
      )

      const toggle = screen.getByRole('button', { name: `Toggle ${side} dock` })
      act(() => {
        panels.onResize.get(`${side}Dock`)?.({ asPercentage: 35, inPixels: 350 })
      })
      fireEvent.click(toggle)
      expect(panels[`${side}Dock`].collapse).toHaveBeenCalledOnce()
      expect(toggle.getAttribute('aria-pressed')).toBe('false')

      fireEvent.click(toggle)
      expect(panels[`${side}Dock`].resize).toHaveBeenCalledWith('35%')
      expect(toggle.getAttribute('aria-pressed')).toBe('true')
    },
  )

  it('restores a collapsed dock without rendering its handle', () => {
    const { storage, values } = createStorage({ left: 35 })
    values.set(
      'react-resizable-panels:shell:leftDock:view',
      JSON.stringify({ leftDock: 0, view: 100 }),
    )
    render(
      <ShellLayout.Root persistence={{ id: 'shell', storage }}>
        <DockToggle side="left" />
        <ShellLayout.Body>
          <ShellLayout.LeftDock>Left</ShellLayout.LeftDock>
          <ShellLayout.View>View</ShellLayout.View>
        </ShellLayout.Body>
      </ShellLayout.Root>,
    )

    const toggle = screen.getByRole('button', { name: 'Toggle left dock' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('separator')).toBeNull()

    fireEvent.click(toggle)
    expect(panels.leftDock.resize).toHaveBeenCalledWith('35%')
  })

  it('connects persisted layouts to the resizable group', () => {
    const { storage, values } = createStorage()
    const layout = { leftDock: 35, view: 65 }
    values.set('react-resizable-panels:shell:leftDock:view', JSON.stringify(layout))

    render(
      <ShellLayout.Root persistence={{ id: 'shell', storage }}>
        <ShellLayout.Body>
          <ShellLayout.LeftDock>Left</ShellLayout.LeftDock>
          <ShellLayout.View>View</ShellLayout.View>
        </ShellLayout.Body>
      </ShellLayout.Root>,
    )

    expect(group.defaultLayout).toEqual(layout)

    group.onLayoutChanged?.({ leftDock: 40, view: 60 })

    expect(values.get('react-resizable-panels:shell:leftDock:view')).toBe(
      JSON.stringify({ leftDock: 40, view: 60 }),
    )
  })

  it('stores the latest non-collapsed dock size', () => {
    const expandedSizes: Partial<Record<ShellLayoutDockSide, number>> = {}
    const { storage } = createStorage(expandedSizes)
    render(
      <ShellLayout.Root persistence={{ id: 'shell', storage }}>
        <ShellLayout.Body>
          <ShellLayout.LeftDock>Left</ShellLayout.LeftDock>
          <ShellLayout.View>View</ShellLayout.View>
        </ShellLayout.Body>
      </ShellLayout.Root>,
    )

    panels.onResize.get('leftDock')?.({ asPercentage: 32, inPixels: 320 })
    expect(expandedSizes.left).toBeUndefined()

    group.onLayoutChanged?.({ leftDock: 32, view: 68 })

    expect(expandedSizes.left).toBe(32)
  })
})
