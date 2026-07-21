import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tooltip } from '../tooltip/tooltip'
import { TabView } from './tabView'

afterEach(cleanup)

describe('TabView', () => {
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

    expect(screen.getByRole('tab', { name: 'Active accounts' }).getAttribute('data-active')).toBe('')
    expect(screen.getByText('Active account rows')).toBeTruthy()
    expect(screen.queryByText('All account rows')).toBeNull()
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

    fireEvent.click(screen.getByRole('button', { name: 'Close Active accounts' }))

    expect(closedValue).toBe('active')
    expect(screen.getByRole('tab', { name: 'All accounts' }).getAttribute('data-active')).toBe('')
    expect(screen.getByRole('tab', { name: 'Active accounts' }).getAttribute('data-active')).toBeNull()
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
