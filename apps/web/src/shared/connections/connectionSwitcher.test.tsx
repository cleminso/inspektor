import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toasts } from '@inspector/ds'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StoredConnection } from '@app/connections/connections'

import { ConnectionSwitcher } from './connectionSwitcher'

const { deleteConnection, navigate, openConnection } = vi.hoisted(() => ({
  deleteConnection: vi.fn(),
  navigate: vi.fn(),
  openConnection: vi.fn<() => Promise<void>>(),
}))
let connections: StoredConnection[] = []
let currentConnectionId: string | null = null
let runtimeScopeExitBlocked = false

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    to,
    ...props
  }: {
    children: React.ReactNode
    params?: { connectionId: string }
    to: string
  }) => (
    <a
      href={params === undefined ? to : to.replace('$connectionId', params.connectionId)}
      {...props}
    >
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}))

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections,
    currentConnectionId,
    deleteConnection,
    openConnection,
    runtimeScopeExitBlocked,
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

function getConnectionOption(name: string): HTMLElement {
  return screen.getByRole('option', { name: new RegExp(name) })
}

afterEach(() => {
  cleanup()
  connections = []
  currentConnectionId = null
  runtimeScopeExitBlocked = false
  openConnection.mockReset()
  deleteConnection.mockReset()
  navigate.mockReset()
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
    currentConnectionId = 'one'

    render(<ConnectionSwitcher />)
    openSwitcher()

    expect(screen.queryByRole('combobox', { name: 'Search connections' })).toBeNull()
    const connectionOption = getConnectionOption('First')
    expect(connectionOption.textContent).toContain('one-app')
    expect(connectionOption.textContent).not.toContain('self-hosted.example.com')
    expect(screen.getByRole('link', { name: 'Edit connection' }).getAttribute('href')).toBe(
      '/conn/edit/one',
    )
    expect(screen.getByRole('button', { name: 'Remove connection' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Add new connection' })).toBeTruthy()
    expect(document.querySelectorAll('[data-slot="combobox-popup-footer"]')).toHaveLength(2)
  })

  it('removes the active saved connection only after confirmation', () => {
    connections = [createConnection('one', 'First')]
    currentConnectionId = 'one'

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(screen.getByRole('button', { name: 'Remove connection' }))

    expect(deleteConnection).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Remove connection' }))

    expect(deleteConnection).toHaveBeenCalledWith('one')
    expect(navigate).toHaveBeenCalledWith({ to: '/conn' })
  })

  it('keeps the active connection when removal is cancelled', () => {
    connections = [createConnection('one', 'First')]
    currentConnectionId = 'one'

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(screen.getByRole('button', { name: 'Remove connection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep connection' }))

    expect(deleteConnection).not.toHaveBeenCalled()
  })

  it('hides search for five connections', () => {
    connections = Array.from({ length: 5 }, (_, index) =>
      createConnection(`connection-${index}`, `Connection ${index}`),
    )

    render(<ConnectionSwitcher />)
    openSwitcher()

    expect(screen.queryByRole('combobox', { name: 'Search connections' })).toBeNull()
  })

  it('shows search above five connections and filters by name and app ID', () => {
    connections = Array.from({ length: 6 }, (_, index) =>
      createConnection(`connection-${index}`, `Connection ${index}`),
    )

    render(<ConnectionSwitcher />)
    openSwitcher()
    const search = screen.getByRole('combobox', { name: 'Search connections' })
    const viewport = document.querySelector('[data-slot="context-switcher-viewport"]')

    expect(viewport?.getAttribute('data-max-height')).toBe('fiveItems')
    fireEvent.change(search, {
      target: { value: 'Connection 2' },
    })

    expect(getConnectionOption('Connection 2')).toBeTruthy()
    expect(screen.queryByRole('option', { name: /Connection 1/ })).toBeNull()

    fireEvent.change(search, {
      target: { value: 'connection-4-app' },
    })

    expect(getConnectionOption('Connection 4')).toBeTruthy()
    expect(screen.queryByRole('option', { name: /Connection 2/ })).toBeNull()

    fireEvent.change(search, {
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
    fireEvent.click(getConnectionOption('First'))

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
    fireEvent.click(getConnectionOption('First'))

    expect(screen.queryByRole('option', { name: /First/ })).toBeNull()
    expect(openConnection).toHaveBeenCalledWith('one')
  })

  it('does not render pending feedback for an unresolved connection open', () => {
    connections = [createConnection('one', 'First'), createConnection('two', 'Second')]
    openConnection.mockReturnValueOnce(new Promise(() => undefined))

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(getConnectionOption('First'))
    openSwitcher()

    expect(getConnectionOption('First').getAttribute('aria-disabled')).not.toBe('true')
    expect(getConnectionOption('Second').getAttribute('aria-disabled')).not.toBe('true')
    expect(
      screen
        .queryAllByRole('status')
        .some((status) => status.textContent?.includes('Opening connection')),
    ).toBe(false)
  })

  it('blocks connection-management navigation while pending table state exists', () => {
    connections = [createConnection('one', 'First')]
    currentConnectionId = 'one'
    runtimeScopeExitBlocked = true

    render(<ConnectionSwitcher />)
    openSwitcher()
    fireEvent.click(screen.getByRole('link', { name: 'Edit connection' }))
    fireEvent.click(screen.getByRole('link', { name: 'Add new connection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove connection' }))

    expect(navigate).not.toHaveBeenCalled()
    expect(deleteConnection).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})
