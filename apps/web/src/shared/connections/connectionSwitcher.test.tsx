import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toasts } from '@inspector/ds'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StoredConnection } from '@app/connections/connections'

import { ConnectionSwitcher } from './connectionSwitcher'

const openConnection = vi.fn<() => Promise<void>>()
let connections: StoredConnection[] = []
let currentConnectionId: string | null = null

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections,
    currentConnectionId,
    openConnection,
  }),
}))

function createConnection(id: string, name: string): StoredConnection {
  return {
    id,
    name,
    serverUrl: 'https://self-hosted.example.com',
    appId: `${id}-app`,
    adminSecret: `${id}-secret`,
    env: 'dev',
  }
}

function openSwitcher(): void {
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Switch connection' }), {
    key: 'ArrowDown',
  })
}

afterEach(() => {
  cleanup()
  connections = []
  currentConnectionId = null
  openConnection.mockReset()
  vi.restoreAllMocks()
})

describe('ConnectionSwitcher', () => {
  it('shows only the add action when there are no saved connections', () => {
    render(<ConnectionSwitcher />)
    openSwitcher()

    expect(screen.queryByRole('combobox', { name: 'Search connections' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Add new connection' }).getAttribute('href')).toBe(
      '/conn/new',
    )
  })

  it('shows one connection and the footer without search', () => {
    connections = [createConnection('one', 'First')]

    render(<ConnectionSwitcher />)
    openSwitcher()

    expect(screen.queryByRole('combobox', { name: 'Search connections' })).toBeNull()
    const connectionOption = screen.getByRole('option', { name: /First/ })
    expect(connectionOption.textContent).toContain('one-app')
    expect(connectionOption.textContent).not.toContain('self-hosted.example.com')
    expect(connectionOption.querySelector('.lucide-arrow-right')).toBeNull()
    fireEvent.mouseEnter(connectionOption)
    expect(connectionOption.querySelector('.lucide-arrow-right')).toBeTruthy()
    fireEvent.mouseLeave(connectionOption)
    expect(connectionOption.querySelector('.lucide-arrow-right')).toBeNull()
    expect(connectionOption.querySelector('.lucide-check')).toBeNull()
    expect(screen.getByRole('link', { name: 'Add new connection' })).toBeTruthy()
  })

  it('does not show the directional arrow when the active connection is hovered', () => {
    connections = [createConnection('one', 'First'), createConnection('two', 'Second')]
    currentConnectionId = 'one'

    render(<ConnectionSwitcher />)
    openSwitcher()
    const activeOption = screen.getByRole('option', { name: /First/ })
    fireEvent.mouseEnter(activeOption)

    expect(activeOption.querySelector('.lucide-arrow-right')).toBeNull()
  })

  it('shows search for multiple connections and identifies an empty filtered result', () => {
    connections = [createConnection('one', 'First'), createConnection('two', 'Second')]

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.input(screen.getByRole('combobox', { name: 'Search connections' }), {
      target: { value: 'missing' },
      inputType: 'insertText',
    })

    expect(screen.getByText('No matching connections.')).toBeTruthy()
  })

  it('keeps the popup closed and shows a normalized toast when opening fails', async () => {
    connections = [createConnection('one', 'First')]
    openConnection.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const toastError = vi.spyOn(toasts, 'error')

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(screen.getByRole('option', { name: /First/ }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Couldn't validate this connection", {
        description: 'Check the server URL, app ID, and admin secret.',
      }),
    )
    expect(openConnection).toHaveBeenCalledWith('one')
    expect(screen.queryByRole('option', { name: /First/ })).toBeNull()
  })

  it('closes the popup immediately when a saved connection is selected', () => {
    connections = [createConnection('one', 'First')]
    openConnection.mockReturnValueOnce(new Promise(() => undefined))

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(screen.getByRole('option', { name: /First/ }))

    expect(screen.queryByRole('option', { name: /First/ })).toBeNull()
    expect(openConnection).toHaveBeenCalledWith('one')
  })

  it('does not render pending feedback for an unresolved connection open', () => {
    connections = [createConnection('one', 'First'), createConnection('two', 'Second')]
    openConnection.mockReturnValueOnce(new Promise(() => undefined))

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(screen.getByRole('option', { name: /First/ }))
    openSwitcher()

    expect(screen.getByRole('option', { name: /First/ }).getAttribute('aria-disabled')).not.toBe(
      'true',
    )
    expect(screen.getByRole('option', { name: /Second/ }).getAttribute('aria-disabled')).not.toBe(
      'true',
    )
    expect(
      screen
        .getAllByRole('status')
        .some((status) => status.textContent?.includes('Opening connection')),
    ).toBe(false)
  })
})
