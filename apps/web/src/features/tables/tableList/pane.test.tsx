import { Tooltip } from '@inspektor/ds'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableListPane } from './pane'

let restoreDocumentFonts: (() => void) | null = null

function mockDocumentFonts() {
  const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')
  const listeners = new Set<EventListener>()
  const fontSet = {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'loadingdone') {
        listeners.add(listener)
      }
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'loadingdone') {
        listeners.delete(listener)
      }
    }),
  }
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: fontSet,
  })
  restoreDocumentFonts = () => {
    if (originalDescriptor === undefined) {
      Reflect.deleteProperty(document, 'fonts')
    } else {
      Object.defineProperty(document, 'fonts', originalDescriptor)
    }
  }
  return {
    dispatchLoadingDone: () => {
      const event = new Event('loadingdone')
      for (const listener of listeners) {
        listener(event)
      }
    },
    fontSet,
  }
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params: _params,
    search,
    to: _to,
    ...props
  }: React.ComponentProps<'a'> & {
    params?: unknown
    search?: unknown
    to?: string
  }) => (
    <a {...props} data-search={JSON.stringify(search)}>
      {children}
    </a>
  ),
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({ currentConnectionId: 'connection' }),
}))

function mockTableNameOverflow(initialClientWidth: number, initialScrollWidth: number) {
  let clientWidth = initialClientWidth
  let scrollWidth = initialScrollWidth
  const observers: ResizeObserverMock[] = []
  class ResizeObserverMock {
    readonly callback: ResizeObserverCallback
    readonly elements = new Set<Element>()

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
      observers.push(this)
    }
    disconnect = vi.fn(() => this.elements.clear())
    observe = vi.fn((element: Element) => this.elements.add(element))
    unobserve = vi.fn((element: Element) => this.elements.delete(element))
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.slot === 'table-name' ? clientWidth : 0
    },
  )
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.slot === 'table-name' ? scrollWidth : 0
    },
  )
  return {
    getTableNameObservers: () =>
      observers.filter((observer) =>
        Array.from(observer.elements).some(
          (element) => element instanceof HTMLElement && element.dataset.slot === 'table-name',
        ),
      ),
    setDimensions: (nextClientWidth: number, nextScrollWidth: number) => {
      clientWidth = nextClientWidth
      scrollWidth = nextScrollWidth
    },
    resize: (element: Element, nextClientWidth: number, nextScrollWidth: number) => {
      clientWidth = nextClientWidth
      scrollWidth = nextScrollWidth
      act(() => {
        for (const observer of observers) {
          if (observer.elements.has(element)) {
            observer.callback([{ target: element } as ResizeObserverEntry], {} as ResizeObserver)
          }
        }
      })
    },
  }
}

afterEach(() => {
  cleanup()
  restoreDocumentFonts?.()
  restoreDocumentFonts = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('TableListPane', () => {
  const defaultActionProps = {
    pinnedTableNames: new Set<string>(),
    onOpenTables: vi.fn(),
    onPinTables: vi.fn(),
    onPersistTable: vi.fn(),
    onReplaceSelection: vi.fn(),
    onUnpinTables: vi.fn(),
  }

  it('keeps every large schema-list item available while deferring offscreen rendering', () => {
    const tables = Array.from({ length: 51 }, (_, index) => `table_${index + 1}`)
    const { container } = render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={tables}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const items = container.querySelectorAll('[data-slot="action-list-item"]')

    expect(items).toHaveLength(51)
    expect(items[0]?.getAttribute('data-rendering')).toBe('deferred')
    expect(screen.getByRole('button', { name: 'table_1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'table_51' })).toBeTruthy()
  })

  it('keeps the table-list space blank instead of presenting false rows', () => {
    const { container } = render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        isSchemaReady={false}
        selectedTableName={null}
        tables={[]}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByText('TABLES')).toBeTruthy()
    expect(screen.queryByRole('status', { name: 'Loading tables' })).toBeNull()
    expect(container.querySelectorAll('[data-slot="table-list-loading-row"]')).toHaveLength(0)
    expect(screen.queryByText('No tables')).toBeNull()
    expect(screen.queryByText('No published tables found in this schema.')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('keeps table names as links when bulk selection is inactive', () => {
    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'accounts' }).tagName).toBe('A')
  })

  it('keeps the complete table name in flow and exposes it in a tooltip when it overflows', async () => {
    const tableName = 'better_auth_verification'
    mockTableNameOverflow(130, 220)
    const { container } = render(
      <Tooltip.Provider delay={0}>
        <TableListPane
          checkedTableNames={new Set()}
          {...defaultActionProps}
          selectedTableName={null}
          tables={[tableName]}
          onClearSelection={vi.fn()}
          onTableCheckedChange={vi.fn()}
        />
      </Tooltip.Provider>,
    )

    const tableLink = screen.getByRole('button', { name: tableName })
    const tableNameText = container.querySelector('[data-slot="table-name"]')

    expect(tableNameText?.textContent).toBe(tableName)

    fireEvent.mouseEnter(tableLink)

    expect(await screen.findAllByText(tableName)).toHaveLength(2)
  })

  it('does not expose a tooltip when the complete table name fits', async () => {
    const tableName = 'accounts'
    mockTableNameOverflow(100, 100)
    render(
      <Tooltip.Provider delay={0}>
        <TableListPane
          checkedTableNames={new Set()}
          {...defaultActionProps}
          selectedTableName={null}
          tables={[tableName]}
          onClearSelection={vi.fn()}
          onTableCheckedChange={vi.fn()}
        />
      </Tooltip.Provider>,
    )

    fireEvent.focus(screen.getByRole('button', { name: tableName }))
    await Promise.resolve()

    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull()
  })

  it('enables the complete-name tooltip when a fitting label becomes truncated', async () => {
    const tableName = 'better_auth_verification'
    const overflow = mockTableNameOverflow(220, 220)
    const { container } = render(
      <Tooltip.Provider delay={0}>
        <TableListPane
          checkedTableNames={new Set()}
          {...defaultActionProps}
          selectedTableName={null}
          tables={[tableName]}
          onClearSelection={vi.fn()}
          onTableCheckedChange={vi.fn()}
        />
      </Tooltip.Provider>,
    )
    const tableLink = screen.getByRole('button', { name: tableName })
    const tableNameText = container.querySelector('[data-slot="table-name"]')
    if (tableNameText === null) {
      throw new Error('Expected a table-name text element')
    }

    overflow.resize(tableNameText, 130, 220)
    fireEvent.mouseEnter(tableLink)

    expect(await screen.findAllByText(tableName)).toHaveLength(2)
  })

  it('remeasures table-name overflow after fonts load and removes the listener on unmount', async () => {
    const fonts = mockDocumentFonts()
    const overflow = mockTableNameOverflow(220, 220)
    const tableName = 'better_auth_verification'
    const { unmount } = render(
      <Tooltip.Provider delay={0}>
        <TableListPane
          checkedTableNames={new Set()}
          {...defaultActionProps}
          selectedTableName={null}
          tables={[tableName]}
          onClearSelection={vi.fn()}
          onTableCheckedChange={vi.fn()}
        />
      </Tooltip.Provider>,
    )
    const listener = fonts.fontSet.addEventListener.mock.calls.find(
      ([type]) => type === 'loadingdone',
    )?.[1]
    if (listener === undefined) {
      throw new Error('Expected a font loading listener')
    }

    overflow.setDimensions(130, 220)
    act(() => fonts.dispatchLoadingDone())
    fireEvent.mouseEnter(screen.getByRole('button', { name: tableName }))

    expect(await screen.findAllByText(tableName)).toHaveLength(2)

    unmount()
    expect(fonts.fontSet.removeEventListener).toHaveBeenCalledWith('loadingdone', listener)
  })

  it('releases shared table-name resize observation after the final label unmounts', () => {
    const overflow = mockTableNameOverflow(100, 100)
    const { unmount } = render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'profiles']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const observer = overflow.getTableNameObservers()[0]
    expect(observer?.observe).toHaveBeenCalledTimes(2)

    unmount()
    expect(observer?.unobserve).toHaveBeenCalledTimes(2)
    expect(observer?.disconnect).toHaveBeenCalledOnce()

    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['sessions']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )
    const remountedObserver = overflow.getTableNameObservers()[0]
    expect(remountedObserver).toBeDefined()
    expect(remountedObserver).not.toBe(observer)
  })

  it("opens an existing table with that tab's stored filter state", () => {
    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tableSearchByName={new Map([['accounts', { filters: 'active-filter', page: 2 }]])}
        tables={['accounts']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'accounts' }).getAttribute('data-search')).toBe(
      JSON.stringify({ filters: 'active-filter', page: 2 }),
    )
  })

  it('clears checked tables when clicking outside the table list', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.pointerDown(document.body)

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('preserves checked tables when clicking another table name', () => {
    const onClearSelection = vi.fn()
    const onTableCheckedChange = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={onTableCheckedChange}
      />,
    )

    const usersTrigger = screen.getByRole('button', { name: 'users' })
    fireEvent.pointerDown(usersTrigger)
    fireEvent.click(usersTrigger)

    expect(onClearSelection).not.toHaveBeenCalled()
    expect(onTableCheckedChange).toHaveBeenCalledWith('users', true, {
      extendRange: false,
      orderedTableNames: ['accounts', 'users'],
      section: 'tables',
    })
  })

  it('clears a non-empty selection with Escape from the list', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select accounts' }), {
      key: 'Escape',
    })

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('ignores Escape when no tables are checked', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select accounts' }), {
      key: 'Escape',
    })

    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('moves pinned tables into a separate section', () => {
    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        pinnedTableNames={new Set(['users'])}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /PINNED/ }).textContent).toContain('1')
    expect(screen.getByRole('button', { name: /TABLES/ }).textContent).toContain('2')
    expect(screen.getAllByText('users')).toHaveLength(1)
  })

  it('keeps the pinned and tables sections expanded together', () => {
    const { container } = render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        pinnedTableNames={new Set(['users'])}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const pinnedTrigger = screen.getByRole('button', { name: /PINNED/ })
    const tablesTrigger = screen.getByRole('button', { name: /TABLES/ })

    fireEvent.click(pinnedTrigger)
    fireEvent.click(pinnedTrigger)

    expect(pinnedTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(tablesTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-layout="fill"]')).toBeTruthy()
  })

  it('replaces selection when right-clicking an unselected table', () => {
    const onReplaceSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onReplaceSelection={onReplaceSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('users'), { clientX: 40, clientY: 60 })

    expect(onReplaceSelection).toHaveBeenCalledWith('users', 'tables')
  })

  it('opens selected table actions when right-clicking its checkbox', () => {
    const onReplaceSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onReplaceSelection={onReplaceSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('checkbox', { name: 'Select accounts' }), {
      clientX: 40,
      clientY: 60,
    })

    expect(onReplaceSelection).not.toHaveBeenCalled()
    expect(screen.getByRole('menuitem', { name: 'Open 1 table' })).toBeTruthy()
  })

  it('clears selection only after the visible actions menu closes', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open accounts actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Deselect all' }))

    expect(screen.queryByRole('menuitem', { name: 'Deselect all' })).toBeNull()
    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('clears the temporary selection when its actions trigger closes the menu', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const actionsTrigger = screen.getByRole('button', { name: 'Open accounts actions' })
    fireEvent.click(actionsTrigger)
    fireEvent.click(actionsTrigger)

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('keeps an established selection when its actions trigger closes the menu', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const actionsTrigger = screen.getByRole('button', { name: 'Open accounts actions' })
    fireEvent.click(actionsTrigger)
    fireEvent.click(actionsTrigger)

    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('transfers a temporary action selection to the context menu', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const actionsTrigger = screen.getByRole('button', { name: 'Open accounts actions' })
    fireEvent.click(actionsTrigger)
    fireEvent.contextMenu(screen.getByText('users'), { clientX: 40, clientY: 60 })

    expect(actionsTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getAllByRole('menu')).toHaveLength(1)
    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('clears checked tables when the context menu is dismissed', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('accounts'), { clientX: 40, clientY: 60 })
    fireEvent.pointerDown(document.body)

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('opens all selected tables from the context menu in visible list order', () => {
    const onOpenTables = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts', 'users'])}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onOpenTables={onOpenTables}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('accounts'), { clientX: 40, clientY: 60 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open 2 tables' }))

    expect(onOpenTables).toHaveBeenCalledWith(['accounts', 'users'])
  })
})
