import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { useState, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tooltip } from '../tooltip/tooltip'
import { ContextMenu } from '../contextMenu/contextMenu'
import { WorkspaceTabs } from './workspaceTabs'
import { workspaceTabsStyles } from './workspaceTabs.styles'
import { workspaceTabsColors } from './workspaceTabsColors.stylex'
import { workspaceTabsVars } from './workspaceTabsVars.stylex'
import {
  accentElementColors,
  borderColors,
  dangerElementColors,
  elementColors,
  focusColors,
  ghostElementColors,
  selectionColors,
  surfaceColors,
  textColors,
} from '../../tokens/semantics.stylex'

describe('WorkspaceTabs color contract', () => {
  it('defines tab states without adding tab roles to global colors', () => {
    expect(workspaceTabsColors).toMatchObject({
      background: expect.any(String),
      hoverBackground: expect.any(String),
      selectedBackground: expect.any(String),
      disabledBackground: expect.any(String),
      text: expect.any(String),
      hoverText: expect.any(String),
      selectedText: expect.any(String),
      disabledText: expect.any(String),
      closeBackdrop: expect.any(String),
      closeIcon: expect.any(String),
      closeIconHover: expect.any(String),
      focusRing: expect.any(String),
    })
    expect(workspaceTabsVars.closeIconColor).toEqual(expect.any(String))
    expect(workspaceTabsVars.tabTextColor).toEqual(expect.any(String))

    const globalKeys = [
      ...Object.keys(surfaceColors),
      ...Object.keys(elementColors),
      ...Object.keys(ghostElementColors),
      ...Object.keys(accentElementColors),
      ...Object.keys(dangerElementColors),
      ...Object.keys(selectionColors),
      ...Object.keys(borderColors),
      ...Object.keys(textColors),
      ...Object.keys(focusColors),
    ]
    expect(globalKeys.some((key) => /tab/i.test(key))).toBe(false)
  })
})

let onDragEnd: ((event: unknown) => void) | undefined
const sortableRefs = new Map<string | number, ReturnType<typeof vi.fn>>()

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({
    children,
    onDragEnd: handleDragEnd,
  }: {
    children: ReactNode
    onDragEnd?: (event: unknown) => void
  }) => {
    onDragEnd = handleDragEnd
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
  Accessibility: class Accessibility {},
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
  sortableRefs.clear()
})

function WorkspaceTabsSelectionHarness() {
  const [value, setValue] = useState('all')

  return (
    <WorkspaceTabs.Root
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) {
          setValue(String(nextValue))
        }
      }}
    >
      <WorkspaceTabs.List
        aria-label="Table views"
        values={['all', 'active']}
        onReorder={() => undefined}
      >
        <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
        <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
      </WorkspaceTabs.List>
      <WorkspaceTabs.Panel value="all" keepMounted>All account rows</WorkspaceTabs.Panel>
      <WorkspaceTabs.Panel value="active" keepMounted>Active account rows</WorkspaceTabs.Panel>
    </WorkspaceTabs.Root>
  )
}

describe('WorkspaceTabs', () => {
  it('reveals the active item at the nearest scroll edge', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    const { rerender } = render(
      <WorkspaceTabs.Root value="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )
    scrollIntoView.mockClear()

    rerender(
      <WorkspaceTabs.Root value="active">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
  })

  it('forwards navigation-intent events from the tab without including its close action', () => {
    const onBlur = vi.fn()
    const onFocus = vi.fn()
    const onPointerDown = vi.fn()
    const onPointerEnter = vi.fn()
    const onPointerLeave = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab
            value="all"
            closeLabel="Close All accounts"
            onBlur={onBlur}
            onClose={() => undefined}
            onFocus={onFocus}
            onPointerDown={onPointerDown}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          >
            All accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const tab = screen.getByRole('tab', { name: 'All accounts' })
    fireEvent.pointerEnter(tab)
    fireEvent.focus(tab)
    fireEvent.pointerDown(tab)
    fireEvent.pointerLeave(tab)
    fireEvent.blur(tab)

    expect(onPointerEnter).toHaveBeenCalledOnce()
    expect(onFocus).toHaveBeenCalledOnce()
    expect(onPointerDown).toHaveBeenCalledOnce()
    expect(onPointerLeave).toHaveBeenCalledOnce()
    expect(onBlur).toHaveBeenCalledOnce()

    const closeButton = screen.getByRole('button', { name: 'Close All accounts' })
    fireEvent.pointerEnter(closeButton)
    fireEvent.focus(closeButton)

    expect(onPointerEnter).toHaveBeenCalledOnce()
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('forwards double click from the tab without including its close action', () => {
    const onDoubleClick = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab
            value="all"
            closeLabel="Close All accounts"
            onClose={() => undefined}
            onDoubleClick={onDoubleClick}
          >
            All accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    fireEvent.doubleClick(screen.getByRole('tab', { name: 'All accounts' }))
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Close All accounts' }))

    expect(onDoubleClick).toHaveBeenCalledOnce()
  })

  it('composes consumer actions with built-in reorder actions in one context menu', async () => {
    const onKeepOpen = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="active">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab
            value="active"
            contextMenuItems={<ContextMenu.Item onClick={onKeepOpen}>Keep open</ContextMenu.Item>}
            contextMenuLabel="Active accounts actions"
            reorderLabel="Reorder Active accounts"
          >
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    fireEvent.contextMenu(activeTab, { clientX: 40, clientY: 20 })

    expect(await screen.findByRole('menu', { name: 'Active accounts actions' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Move left' })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Keep open' }))
    expect(onKeepOpen).toHaveBeenCalledOnce()
  })

  it('marks replaceable tab title presentation without changing its accessible name', () => {
    render(
      <WorkspaceTabs.Root defaultValue="active">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="active" retention="replaceable">
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const tab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(tab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-retention')).toBe(
      'replaceable',
    )
    expect(tab.querySelector('[data-slot="workspace-tabs-title"]')?.className).toContain(
      stylex.props(workspaceTabsStyles.titleReplaceable).className,
    )
  })

  it('keeps fixed edge controls outside the scrollable list', () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.Bar>
          <WorkspaceTabs.LeadingArea aria-label="View navigation">
            <button type="button">Back</button>
          </WorkspaceTabs.LeadingArea>
          <WorkspaceTabs.List aria-label="Table views">
            <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          </WorkspaceTabs.List>
          <WorkspaceTabs.TrailingArea aria-label="View actions">
            <button type="button">Add view</button>
          </WorkspaceTabs.TrailingArea>
        </WorkspaceTabs.Bar>
      </WorkspaceTabs.Root>,
    )

    const list = screen.getByRole('tablist')
    const leadingArea = screen.getByRole('group', { name: 'View navigation' })
    const trailingArea = screen.getByRole('group', { name: 'View actions' })

    expect(list.parentElement?.getAttribute('data-slot')).toBe('workspace-tabs-bar')
    expect(leadingArea.parentElement).toBe(list.parentElement)
    expect(trailingArea.parentElement).toBe(list.parentElement)
    expect(list.contains(leadingArea)).toBe(false)
    expect(list.contains(trailingArea)).toBe(false)
  })

  it('rejects duplicate reorder values', () => {
    expect(() =>
      render(
        <WorkspaceTabs.Root defaultValue="all">
          <WorkspaceTabs.List values={['all', 'all']} onReorder={() => undefined}>
            <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          </WorkspaceTabs.List>
        </WorkspaceTabs.Root>,
      ),
    ).toThrow('WorkspaceTabs.List values must be unique')
  })

  it('preserves the focused tab when reorder behavior loads', async () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const tab = screen.getByRole('tab', { name: 'Active accounts' })
    tab.focus()

    await waitFor(() => {
      expect(onDragEnd).toBeTypeOf('function')
    })

    const reorderedTab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(document.activeElement).toBe(reorderedTab)
  })

  it('registers each sortable through its owning tab item ref', async () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    await waitFor(() => {
      const activeItem = screen
        .getByRole('tab', { name: 'Active accounts' })
        .closest('[data-slot="workspace-tabs-item"]')
      expect(sortableRefs.get('active')).toHaveBeenCalledWith(activeItem)
    })
  })

  it('preserves the active view during a drag and activates the dragged view after a successful drop', async () => {
    render(<WorkspaceTabsSelectionHarness />)

    await waitFor(() => {
      expect(onDragEnd).toBeTypeOf('function')
      expect(
        screen
          .getByRole('tab', { name: 'All accounts' })
          .closest('[data-slot="workspace-tabs-item"]')
          ?.getAttribute('data-active'),
      ).toBe('')
    })

    const allTab = screen.getByRole('tab', { name: 'All accounts' })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    fireEvent.pointerDown(activeTab, {
      bubbles: true,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    })
    expect(fireEvent.mouseDown(activeTab, { button: 0 })).toBe(false)

    expect(allTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBe('')
    expect(activeTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBeNull()
    expect(screen.getByText('All account rows').hasAttribute('hidden')).toBe(false)
    expect(screen.getByText('Active account rows').hasAttribute('hidden')).toBe(true)

    act(() => {
      onDragEnd?.({
        canceled: false,
        operation: {
          source: {
            element: activeTab.closest('[data-slot="workspace-tabs-item"]'),
            id: 'active',
            index: 1,
            initialIndex: 1,
            sortable: true,
          },
        },
      })
    })

    expect(activeTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Active account rows').hasAttribute('hidden')).toBe(false)
  })

  it('preserves the active view when a drag is canceled', async () => {
    render(<WorkspaceTabsSelectionHarness />)

    await waitFor(() => {
      expect(onDragEnd).toBeTypeOf('function')
    })

    const allTab = screen.getByRole('tab', { name: 'All accounts' })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    fireEvent.pointerDown(activeTab, {
      bubbles: true,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    })
    expect(fireEvent.mouseDown(activeTab, { button: 0 })).toBe(false)

    expect(allTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBe('')
    expect(activeTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBeNull()
    expect(screen.getByText('All account rows').hasAttribute('hidden')).toBe(false)
    expect(screen.getByText('Active account rows').hasAttribute('hidden')).toBe(true)

    act(() => {
      onDragEnd?.({
        canceled: true,
        operation: {
          source: {
            element: activeTab.closest('[data-slot="workspace-tabs-item"]'),
            id: 'active',
            index: 1,
            initialIndex: 1,
            sortable: true,
          },
        },
      })
    })

    expect(allTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBe('')
    expect(activeTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBeNull()
    expect(screen.getByText('All account rows').hasAttribute('hidden')).toBe(false)
    expect(screen.getByText('Active account rows').hasAttribute('hidden')).toBe(true)
  })

  it('activates an inactive view immediately when it is clicked without dragging', async () => {
    render(<WorkspaceTabsSelectionHarness />)

    await waitFor(() => expect(onDragEnd).toBeTypeOf('function'))

    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    fireEvent.pointerDown(activeTab, { button: 0, pointerId: 1, pointerType: 'mouse' })
    expect(fireEvent.mouseDown(activeTab, { button: 0 })).toBe(false)
    fireEvent.pointerUp(activeTab, { button: 0, pointerId: 1, pointerType: 'mouse' })
    fireEvent.click(activeTab)

    expect(activeTab.getAttribute('data-active')).toBe('')
  })

  it('reports the reordered values after a sortable drag ends', async () => {
    const handleReorder = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active', 'archived']}
          onReorder={handleReorder}
        >
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="archived">Archived accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
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

  it('reorders a tab from its right-click context menu', async () => {
    const handleReorder = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="active">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active', 'archived']}
          onReorder={handleReorder}
        >
          <WorkspaceTabs.Tab value="all" reorderLabel="Reorder All accounts">
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active" reorderLabel="Reorder Active accounts">
            Active accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="archived" reorderLabel="Reorder Archived accounts">
            Archived accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'Active accounts' }).closest('[data-reorder-ready]'),
      ).toBeTruthy()
    })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    fireEvent.contextMenu(activeTab, { clientX: 40, clientY: 20 })

    const moveLeft = await screen.findByRole('menuitem', { name: 'Move left' })
    expect(screen.getByRole('menu', { name: 'Reorder Active accounts' })).toBeTruthy()
    expect(
      screen.getByRole('menuitem', { name: 'Move right' }).hasAttribute('aria-disabled'),
    ).toBe(false)
    fireEvent.click(moveLeft)

    expect(handleReorder).toHaveBeenCalledWith(['active', 'all', 'archived'])
  })

  it.each([
    { key: 'F10', shiftKey: true },
    { key: 'ContextMenu', shiftKey: false },
  ])('opens reorder actions from the focused tab with $key', async ({ key, shiftKey }) => {
    render(
      <WorkspaceTabs.Root defaultValue="active">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <WorkspaceTabs.Tab value="all" reorderLabel="Reorder All accounts">
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active" reorderLabel="Reorder Active accounts">
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'Active accounts' }).closest('[data-reorder-ready]'),
      ).toBeTruthy()
    })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    const onContextMenu = vi.fn()
    activeTab.addEventListener('contextmenu', onContextMenu)
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key, shiftKey })

    await waitFor(() => {
      expect(onContextMenu).toHaveBeenCalledOnce()
    })
  })

  it('supports keyboard reordering before pointer drag behavior loads', () => {
    const handleReorder = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="active">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={handleReorder}
        >
          <WorkspaceTabs.Tab value="all" reorderLabel="Reorder All accounts">
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active" reorderLabel="Reorder Active accounts">
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Active accounts' }), {
      key: 'ArrowLeft',
      shiftKey: true,
    })

    expect(handleReorder).toHaveBeenCalledWith(['active', 'all'])
  })

  it('does not reorder a disabled tab through alternate actions', async () => {
    const handleReorder = vi.fn()

    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'archived']}
          onReorder={handleReorder}
        >
          <WorkspaceTabs.Tab value="all" reorderLabel="Reorder All accounts">
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab
            disabled
            value="archived"
            reorderLabel="Reorder Archived accounts"
          >
            Archived accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const archivedTab = screen.getByRole('tab', { name: 'Archived accounts' })
    fireEvent.keyDown(archivedTab, { key: 'ArrowLeft', shiftKey: true })
    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'All accounts' }).closest('[data-reorder-ready]'),
      ).toBeTruthy()
    })
    fireEvent.contextMenu(archivedTab)

    expect(handleReorder).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu', { name: 'Reorder Archived accounts' })).toBeNull()
  })

  it('disables reorder actions at the list boundaries', async () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <WorkspaceTabs.Tab value="all" reorderLabel="Reorder All accounts">
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active" reorderLabel="Reorder Active accounts">
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'All accounts' }).closest('[data-reorder-ready]'),
      ).toBeTruthy()
    })
    const firstTab = screen.getByRole('tab', { name: 'All accounts' })
    fireEvent.contextMenu(firstTab, { clientX: 40, clientY: 20 })

    expect(
      (await screen.findByRole('menuitem', { name: 'Move left' })).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      screen.getByRole('menuitem', { name: 'Move right' }).hasAttribute('aria-disabled'),
    ).toBe(false)
  })

  it('switches the active view and its associated panel', () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
        <WorkspaceTabs.Panel value="all">All account rows</WorkspaceTabs.Panel>
        <WorkspaceTabs.Panel value="active">Active account rows</WorkspaceTabs.Panel>
      </WorkspaceTabs.Root>,
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
      <WorkspaceTabs.Root
        defaultValue="all"
        onValueChange={(_value, eventDetails) => {
          eventDetails.cancel()
        }}
      >
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Active accounts' }))

    const allTab = screen.getByRole('tab', { name: 'All accounts' })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(allTab.getAttribute('data-active')).toBe('')
    expect(allTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBe('')
    expect(activeTab.getAttribute('data-active')).toBeNull()
    expect(activeTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBeNull()
  })

  it('keeps automatic fallback changes aligned when cancellation is requested', () => {
    const onValueChange = vi.fn((_value, eventDetails) => {
      eventDetails.cancel()
    })
    const { rerender } = render(
      <WorkspaceTabs.Root defaultValue="all" onValueChange={onValueChange}>
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    rerender(
      <WorkspaceTabs.Root defaultValue="all" onValueChange={onValueChange}>
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all" disabled>
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active">Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    expect(activeTab.getAttribute('data-active')).toBe('')
    expect(activeTab.closest('[data-slot="workspace-tabs-item"]')?.getAttribute('data-active')).toBe('')
  })

  it('closes a view without selecting it', () => {
    let closedValue: string | number | undefined

    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab
            value="active"
            closeLabel="Close Active accounts"
            onClose={(value) => {
              closedValue = value
            }}
          >
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const closeButton = screen.getByRole('button', { name: 'Close Active accounts' })

    fireEvent.click(closeButton)

    expect(closedValue).toBe('active')
    expect(screen.getByRole('tab', { name: 'All accounts' }).getAttribute('data-active')).toBe('')
    expect(
      screen.getByRole('tab', { name: 'Active accounts' }).getAttribute('data-active'),
    ).toBeNull()
  })

  it('keeps every enabled tab and close action in sequential focus order without activating on focus', () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all" onClose={() => undefined}>All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active" onClose={() => undefined}>Active accounts</WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
        <WorkspaceTabs.Panel value="all">All account rows</WorkspaceTabs.Panel>
        <WorkspaceTabs.Panel value="active">Active account rows</WorkspaceTabs.Panel>
      </WorkspaceTabs.Root>,
    )

    const allTab = screen.getByRole('tab', { name: 'All accounts' })
    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    const closeButtons = screen.getAllByRole('button', { name: 'Close tab' })

    expect(allTab.tabIndex).toBe(0)
    expect(activeTab.tabIndex).toBe(0)
    expect(closeButtons.map((button) => button.tabIndex)).toEqual([0, 0])

    activeTab.focus()

    expect(activeTab.getAttribute('aria-selected')).toBe('false')
    expect(screen.getByText('All account rows')).toBeTruthy()
    expect(screen.queryByText('Active account rows')).toBeNull()

    fireEvent.keyDown(allTab, { key: 'ArrowRight' })

    expect(document.activeElement).toBe(activeTab)
    expect(activeTab.getAttribute('aria-selected')).toBe('false')
  })

  it('opens reorder actions with Enter on a focused tab', async () => {
    render(
      <WorkspaceTabs.Root defaultValue="active">
        <WorkspaceTabs.List
          aria-label="Table views"
          values={['all', 'active']}
          onReorder={() => undefined}
        >
          <WorkspaceTabs.Tab value="all" reorderLabel="Reorder All accounts">
            All accounts
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab value="active" reorderLabel="Reorder Active accounts">
            Active accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const activeTab = screen.getByRole('tab', { name: 'Active accounts' })
    vi.spyOn(activeTab, 'getBoundingClientRect').mockReturnValue({
      bottom: 76,
      height: 26,
      left: 100,
      right: 180,
      top: 50,
      width: 80,
      x: 100,
      y: 50,
      toJSON: () => undefined,
    })
    const onContextMenu = vi.fn()
    activeTab.addEventListener('contextmenu', onContextMenu)
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'Enter' })

    expect(await screen.findByRole('menu', { name: 'Reorder Active accounts' })).toBeTruthy()
    expect(onContextMenu).toHaveBeenCalledOnce()
    expect(onContextMenu.mock.calls[0]?.[0]).toMatchObject({
      clientX: 100,
      clientY: 76,
    })
  })

  it('describes the close action with a tooltip', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <WorkspaceTabs.Root defaultValue="accounts">
          <WorkspaceTabs.List aria-label="Table views">
            <WorkspaceTabs.Tab
              value="accounts"
              closeHotkey="W"
              closeLabel="Close Accounts"
              onClose={() => undefined}
            >
              Accounts
            </WorkspaceTabs.Tab>
          </WorkspaceTabs.List>
        </WorkspaceTabs.Root>
      </Tooltip.Provider>,
    )

    const closeButton = screen.getByRole('button', { name: 'Close Accounts' })
    fireEvent.mouseEnter(closeButton)
    fireEvent.mouseMove(closeButton)

    expect(await screen.findByText('Close view')).toBeTruthy()
    expect(screen.getByLabelText('W')).toBeTruthy()
  })

  it('closes the focused view with the Delete key', () => {
    let closeCount = 0

    render(
      <WorkspaceTabs.Root defaultValue="filtered">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab
            value="filtered"
            onClose={() => {
              closeCount += 1
            }}
          >
            Filtered accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Filtered accounts' }), {
      key: 'Delete',
    })

    expect(closeCount).toBe(1)
  })

  it('does not activate or close a disabled view', () => {
    let closeCount = 0

    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all">All accounts</WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab
            disabled
            value="archived"
            onClose={() => {
              closeCount += 1
            }}
          >
            Archived accounts
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const archivedTab = screen.getByRole('tab', { name: 'Archived accounts' })
    fireEvent.click(archivedTab)
    fireEvent.keyDown(archivedTab, { key: 'Delete' })

    expect(archivedTab.getAttribute('data-disabled')).toBe('')
    expect(archivedTab.getAttribute('data-active')).toBeNull()
    expect(closeCount).toBe(0)
  })

  it('overlays the trailing close action without replacing the leading prefix or title', () => {
    render(
      <WorkspaceTabs.Root defaultValue="all">
        <WorkspaceTabs.List aria-label="Table views">
          <WorkspaceTabs.Tab value="all" prefix={<span>Table</span>}>
            All
          </WorkspaceTabs.Tab>
          <WorkspaceTabs.Tab
            value="active"
            prefix={<span>Table</span>}
            closeLabel="Close Active accounts"
            onClose={() => undefined}
          >
            Active accounts sorted by creation date
          </WorkspaceTabs.Tab>
        </WorkspaceTabs.List>
      </WorkspaceTabs.Root>,
    )

    const closableTab = screen.getByRole('tab', {
      name: 'Active accounts sorted by creation date',
    })
    const closableItem = closableTab.closest('[data-slot="workspace-tabs-item"]')

    expect(closableItem?.hasAttribute('data-closable')).toBe(false)
    expect(closableTab.querySelector('[data-slot="workspace-tabs-title"]')?.textContent).toBe(
      'Active accounts sorted by creation date',
    )
    expect(closableItem?.querySelector('[aria-hidden="true"] span')?.textContent).toBe('Table')
    const closeContainer = closableItem?.lastElementChild
    expect(closeContainer?.getAttribute('data-slot')).toBe('workspace-tabs-close')
    expect(closeContainer?.querySelector('[data-slot="button"]')?.getAttribute('data-variant')).toBe(
      'ghost',
    )
    expect(closeContainer === undefined || closeContainer === null || closableTab.contains(closeContainer)).toBe(
      false,
    )
    expect(closableTab.className).toContain(
      stylex.props(workspaceTabsStyles.tabClosable).className,
    )
    expect(closableItem?.className).toContain(
      stylex.props(workspaceTabsStyles.itemClosable).className,
    )
  })

})
