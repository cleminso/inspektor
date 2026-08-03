import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tooltip } from '../tooltip/tooltip'
import { TabView } from './tabView'

let onDragEnd: ((event: unknown) => void) | undefined
let onDragStart: ((event: unknown) => void) | undefined
const sortableRefs = new Map<string | number, ReturnType<typeof vi.fn>>()

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({
    children,
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
  }: {
    children: ReactNode
    onDragEnd?: (event: unknown) => void
    onDragStart?: (event: unknown) => void
  }) => {
    onDragEnd = handleDragEnd
    onDragStart = handleDragStart
    return children
  },
}))

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: (source: { sortable?: boolean } | null | undefined) => source?.sortable === true,
  useSortable: (input: { id: string | number }) => {
    const ref = vi.fn()
    sortableRefs.set(input.id, ref)
    return {
      isDragSource: false,
      ref,
    }
  },
}))

vi.mock('@dnd-kit/abstract/modifiers', () => ({
  RestrictToHorizontalAxis: class RestrictToHorizontalAxis {},
}))

vi.mock('@dnd-kit/dom', () => ({
  AutoScroller: { configure: () => ({}) },
  Feedback: { configure: () => ({}) },
  PointerActivationConstraints: {
    Distance: class Distance {
      constructor(_options: { value: number }) {}
    },
  },
  PointerSensor: { configure: () => ({}) },
}))

vi.mock('@dnd-kit/dom/modifiers', () => ({
  RestrictToElement: { configure: () => ({}) },
}))

afterEach(() => {
  cleanup()
  onDragEnd = undefined
  onDragStart = undefined
  sortableRefs.clear()
})

describe('TabView', () => {
  it('rejects duplicate reorder values', () => {
    expect(() =>
      render(
        <TabView.Root defaultValue="all">
          <TabView.List values={['all', 'all']} onReorder={() => undefined}>
            <TabView.Item value="all">All accounts</TabView.Item>
          </TabView.List>
        </TabView.Root>,
      ),
    ).toThrow('TabView.List values must be unique')
  })

  it('preserves the focused tab when reorder behavior loads', async () => {
    render(
      <TabView.Root defaultValue="all">
        <TabView.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    const tab = screen.getByRole('tab', { name: 'Active accounts' })
    tab.focus()

    await waitFor(() => {
      expect(onDragStart).toBeTypeOf('function')
    })

    const reorderedTab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(document.activeElement).toBe(reorderedTab)
  })

  it('leaves item focus-visible styling to the parent selector', () => {
    render(
      <TabView.Root defaultValue="all">
        <TabView.List aria-label="Table views">
          <TabView.Item value="all">All accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    const tab = screen.getByRole('tab', { name: 'All accounts' })
    const item = tab.closest('[data-slot="tab-view-item"]')
    vi.spyOn(tab, 'matches').mockReturnValue(true)

    fireEvent.focus(tab)
    expect(item?.getAttribute('data-focus-visible')).toBeNull()
  })

  it('registers each sortable through its owning tab item ref', async () => {
    render(
      <TabView.Root defaultValue="all">
        <TabView.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    await waitFor(() => {
      const activeItem = screen
        .getByRole('tab', { name: 'Active accounts' })
        .closest('[data-slot="tab-view-item"]')
      expect(sortableRefs.get('active')).toHaveBeenCalledWith(activeItem)
    })
  })

  it('activates the dragged view when sorting starts', async () => {
    render(
      <TabView.Root defaultValue="all">
        <TabView.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    await waitFor(() => {
      expect(onDragStart).toBeTypeOf('function')
    })

    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    act(() => {
      onDragStart?.({
        operation: {
          source: {
            element: activeTab.closest('[data-slot="tab-view-item"]'),
          },
        },
      })
    })

    expect(activeTab.getAttribute('data-active')).toBe('')
  })

  it('reports the reordered values after a sortable drag ends', async () => {
    const handleReorder = vi.fn()

    render(
      <TabView.Root defaultValue="all">
        <TabView.List
          aria-label="Table views"
          values={['all', 'active', 'archived']}
          onReorder={handleReorder}
        >
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
          <TabView.Item value="archived">Archived accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    await waitFor(() => {
      expect(onDragEnd).toBeTypeOf('function')
    })

    onDragEnd?.({
      canceled: false,
      operation: {
        source: {
          id: 'active',
          index: 0,
          initialIndex: 1,
          sortable: true,
        },
      },
    })

    expect(handleReorder).toHaveBeenCalledWith(['active', 'all', 'archived'])
  })

  it('switches the active view and its associated panel', () => {
    render(
      <TabView.Root defaultValue="all">
        <TabView.List aria-label="Table views">
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
        <TabView.Panel value="all">All account rows</TabView.Panel>
        <TabView.Panel value="active">Active account rows</TabView.Panel>
      </TabView.Root>,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Active accounts' }))

    expect(screen.getByRole('tab', { name: 'Active accounts' }).getAttribute('data-active')).toBe(
      '',
    )
    expect(screen.getByRole('tabpanel').tabIndex).toBe(-1)
    expect(screen.getByText('Active account rows')).toBeTruthy()
    expect(screen.queryByText('All account rows')).toBeNull()
  })

  it('keeps Base and Inspector active state aligned when a value change is canceled', () => {
    render(
      <TabView.Root
        defaultValue="all"
        onValueChange={(_value, eventDetails) => {
          eventDetails.cancel()
        }}
      >
        <TabView.List aria-label="Table views">
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Active accounts' }))

    const allTab = screen.getByRole('tab', { name: 'All accounts' })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(allTab.getAttribute('data-active')).toBe('')
    expect(allTab.closest('[data-slot="tab-view-item"]')?.getAttribute('data-active')).toBe('')
    expect(activeTab.getAttribute('data-active')).toBeNull()
    expect(activeTab.closest('[data-slot="tab-view-item"]')?.getAttribute('data-active')).toBeNull()
  })

  it('keeps automatic fallback changes aligned when cancellation is requested', () => {
    const onValueChange = vi.fn((_value, eventDetails) => {
      eventDetails.cancel()
    })
    const { rerender } = render(
      <TabView.Root defaultValue="all" onValueChange={onValueChange}>
        <TabView.List aria-label="Table views">
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    rerender(
      <TabView.Root defaultValue="all" onValueChange={onValueChange}>
        <TabView.List aria-label="Table views">
          <TabView.Item value="all" disabled>
            All accounts
          </TabView.Item>
          <TabView.Item value="active">Active accounts</TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(activeTab.getAttribute('data-active')).toBe('')
    expect(activeTab.closest('[data-slot="tab-view-item"]')?.getAttribute('data-active')).toBe('')
  })

  it('closes a view without selecting it', () => {
    let closedValue: string | number | undefined

    render(
      <TabView.Root defaultValue="all">
        <TabView.List aria-label="Table views">
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item
            value="active"
            closeLabel="Close Active accounts"
            onClose={(value) => {
              closedValue = value
            }}
          >
            Active accounts
          </TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    const closeButton = screen.getByRole('button', { name: 'Close Active accounts' })

    expect(closeButton.getAttribute('data-slot')).toBe('button')
    expect(closeButton.getAttribute('data-icon-only')).toBe('')
    expect(closeButton.getAttribute('data-size')).toBe('xs')
    expect(closeButton.getAttribute('data-radius')).toBe('xs')
    expect(closeButton.getAttribute('data-variant')).toBe('ghost')

    fireEvent.click(closeButton)

    expect(closedValue).toBe('active')
    expect(screen.getByRole('tab', { name: 'All accounts' }).getAttribute('data-active')).toBe('')
    expect(
      screen.getByRole('tab', { name: 'Active accounts' }).getAttribute('data-active'),
    ).toBeNull()
  })

  it('closes the focused view with the Delete key', () => {
    let closeCount = 0

    render(
      <TabView.Root defaultValue="filtered">
        <TabView.List aria-label="Table views">
          <TabView.Item
            value="filtered"
            onClose={() => {
              closeCount += 1
            }}
          >
            Filtered accounts
          </TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Filtered accounts' }), {
      key: 'Delete',
    })

    expect(closeCount).toBe(1)
  })

  it('does not activate or close a disabled view', () => {
    let closeCount = 0

    render(
      <TabView.Root defaultValue="all">
        <TabView.List aria-label="Table views">
          <TabView.Item value="all">All accounts</TabView.Item>
          <TabView.Item
            disabled
            value="archived"
            onClose={() => {
              closeCount += 1
            }}
          >
            Archived accounts
          </TabView.Item>
        </TabView.List>
      </TabView.Root>,
    )

    const archivedTab = screen.getByRole('tab', { name: 'Archived accounts' })
    fireEvent.click(archivedTab)
    fireEvent.keyDown(archivedTab, { key: 'Delete' })

    expect(archivedTab.getAttribute('data-disabled')).toBe('')
    expect(archivedTab.getAttribute('data-active')).toBeNull()
    expect(closeCount).toBe(0)
  })

  it('marks only titles whose rendered content overflows', async () => {
    const scrollWidthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollWidth',
    )
    const clientWidthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientWidth',
    )

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return this.textContent?.startsWith('Active') === true ? 240 : 80
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 100
      },
    })

    try {
      render(
        <TabView.Root defaultValue="all">
          <TabView.List aria-label="Table views">
            <TabView.Item value="all" onClose={() => undefined}>
              All accounts
            </TabView.Item>
            <TabView.Item value="active" onClose={() => undefined}>
              Active accounts sorted by creation date
            </TabView.Item>
          </TabView.List>
        </TabView.Root>,
      )

      await waitFor(() => {
        expect(
          screen
            .getByRole('tab', { name: 'Active accounts sorted by creation date' })
            .closest('[data-slot="tab-view-item"]')
            ?.getAttribute('data-title-overflow'),
        ).toBe('true')
      })
      expect(
        screen
          .getByRole('tab', { name: 'All accounts' })
          .closest('[data-slot="tab-view-item"]')
          ?.getAttribute('data-title-overflow'),
      ).toBe('false')
    } finally {
      if (scrollWidthDescriptor === undefined) {
        delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth
      } else {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidthDescriptor)
      }
      if (clientWidthDescriptor === undefined) {
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
      } else {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidthDescriptor)
      }
    }
  })

  it('shows supplied details even when the title does not overflow', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <TabView.Root defaultValue="accounts">
          <TabView.List aria-label="Table views">
            <TabView.Item value="accounts" details="Table view details">
              Accounts
            </TabView.Item>
          </TabView.List>
        </TabView.Root>
      </Tooltip.Provider>,
    )

    fireEvent.mouseEnter(screen.getByRole('tab', { name: 'Accounts' }))

    await waitFor(() => {
      expect(screen.getByText('Table view details')).toBeTruthy()
    })
  })

  it('keeps its resize observer when the prefix element identity changes', () => {
    let observedItemCount = 0
    class ResizeObserverMock {
      observe(target: Element) {
        if (target.getAttribute('data-slot') === 'tab-view-item') {
          observedItemCount += 1
        }
      }
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)

    try {
      const { rerender } = render(
        <TabView.Root defaultValue="accounts">
          <TabView.List aria-label="Table views">
            <TabView.Item value="accounts" prefix={<span>Table</span>}>
              Accounts
            </TabView.Item>
          </TabView.List>
        </TabView.Root>,
      )

      rerender(
        <TabView.Root defaultValue="accounts">
          <TabView.List aria-label="Table views">
            <TabView.Item value="accounts" prefix={<span>Table</span>}>
              Accounts
            </TabView.Item>
          </TabView.List>
        </TabView.Root>,
      )

      expect(observedItemCount).toBe(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
