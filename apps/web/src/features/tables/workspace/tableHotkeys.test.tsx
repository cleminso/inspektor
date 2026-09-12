import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { TableHotkeys } from '@tables/workspace/tableHotkeys'

const openNewView = vi.hoisted(() => vi.fn())
const closeTab = vi.hoisted(() => vi.fn())
const goBack = vi.hoisted(() => vi.fn())
const goForward = vi.hoisted(() => vi.fn())
const tableHotkeyState = vi.hoisted(() => ({
  activeTabId: 'accounts',
  canGoBack: true,
  canGoForward: true,
  tabs: [{ id: 'accounts', kind: 'table' }] as Array<{ id: string; kind: 'newView' | 'table' }>,
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({
    activeTabId: tableHotkeyState.activeTabId,
    closeTab,
    openNewView,
    tabs: tableHotkeyState.tabs,
  }),
}))

vi.mock('@tables/workspace/navigationHistory', () => ({
  useTableNavigationControls: () => ({
    canGoBack: tableHotkeyState.canGoBack,
    canGoForward: tableHotkeyState.canGoForward,
    goBack,
    goForward,
  }),
}))

vi.mock('@tables/workspace/tableCommands', () => ({
  TableCommands: () => null,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  tableHotkeyState.activeTabId = 'accounts'
  tableHotkeyState.canGoBack = true
  tableHotkeyState.canGoForward = true
  tableHotkeyState.tabs = [{ id: 'accounts', kind: 'table' }]
})

describe('TableHotkeys', () => {
  it('runs workspace commands from their canonical hotkeys', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { altKey: true, code: 'KeyN', key: 'Dead' })
    fireEvent.keyDown(document, { altKey: true, code: 'KeyW', key: '∑' })
    fireEvent.keyDown(document, { altKey: true, key: '[' })
    fireEvent.keyDown(document, { altKey: true, key: ']' })

    expect(openNewView).toHaveBeenCalledTimes(1)
    expect(closeTab).toHaveBeenCalledWith('accounts')
    expect(goBack).toHaveBeenCalledTimes(1)
    expect(goForward).toHaveBeenCalledTimes(1)
  })

  it('does not run workspace hotkeys from text inputs', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
        <input aria-label="Cell editor" />
      </AppHotkeysProvider>,
    )

    const input = screen.getByRole('textbox', { name: 'Cell editor' })
    fireEvent.keyDown(input, { altKey: true, key: 'n' })
    fireEvent.keyDown(input, { altKey: true, key: 'w' })

    expect(openNewView).not.toHaveBeenCalled()
    expect(closeTab).not.toHaveBeenCalled()
  })

  it('prevents handled browser defaults without moving focus', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
        <button type="button">Active grid control</button>
      </AppHotkeysProvider>,
    )

    const button = screen.getByRole('button', { name: 'Active grid control' })
    button.focus()
    const event = new KeyboardEvent('keydown', {
      altKey: true,
      bubbles: true,
      cancelable: true,
      key: '[',
    })
    button.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(button)
    expect(goBack).toHaveBeenCalledTimes(1)
  })

  it('does not prevent ignored input shortcuts', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
        <input aria-label="Cell editor" />
      </AppHotkeysProvider>,
    )

    const input = screen.getByRole('textbox', { name: 'Cell editor' })
    const event = new KeyboardEvent('keydown', {
      altKey: true,
      bubbles: true,
      cancelable: true,
      key: 'n',
    })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(openNewView).not.toHaveBeenCalled()
  })

  it('does not run workspace hotkeys from modal interaction layers', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
        <div role="alertdialog" aria-label="Confirm close">
          <button type="button">Keep editing</button>
        </div>
      </AppHotkeysProvider>,
    )

    const button = screen.getByRole('button', { name: 'Keep editing' })
    fireEvent.keyDown(button, { altKey: true, key: 'n' })
    fireEvent.keyDown(button, { altKey: true, key: 'w' })

    expect(openNewView).not.toHaveBeenCalled()
    expect(closeTab).not.toHaveBeenCalled()
  })

  it('does not run workspace hotkeys from menu interaction layers', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
        <div role="menu" aria-label="View actions">
          <button type="button" role="menuitem">
            Rename view
          </button>
        </div>
      </AppHotkeysProvider>,
    )

    const item = screen.getByRole('menuitem', { name: 'Rename view' })
    fireEvent.keyDown(item, { altKey: true, key: 'n' })
    fireEvent.keyDown(item, { altKey: true, key: 'w' })

    expect(openNewView).not.toHaveBeenCalled()
    expect(closeTab).not.toHaveBeenCalled()
  })

  it('runs one-shot workspace actions once per key press', () => {
    render(
      <AppHotkeysProvider>
        <TableHotkeys />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { altKey: true, key: 'w' })
    fireEvent.keyDown(document, { altKey: true, key: 'w', repeat: true })

    expect(closeTab).toHaveBeenCalledTimes(1)
  })

  it('keeps workspace-only hotkeys out of the command palette', async () => {
    tableHotkeyState.activeTabId = 'new-view'
    tableHotkeyState.canGoBack = false
    tableHotkeyState.canGoForward = false
    tableHotkeyState.tabs = [{ id: 'new-view', kind: 'newView' }]

    render(
      <AppHotkeysProvider>
        <TableHotkeys />
      </AppHotkeysProvider>,
    )
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(
      (await screen.findByRole('option', { name: 'Close current view' })).getAttribute(
        'aria-disabled',
      ),
    ).toBe('true')
    expect(screen.getByText('Actions')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Open new table view' })).toBeTruthy()
    expect(screen.queryByRole('option', { name: 'Hide table navigator' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Go back' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Go forward' })).toBeNull()
  })
})
