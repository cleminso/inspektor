import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectionList } from './connectionList'

const openConnection = vi.fn<() => 'accepted' | 'blocked'>()

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections: [
      {
        id: 'connection-1',
        name: 'Example',
        serverUrl: 'https://example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
      },
    ],
    openConnection,
  }),
}))

afterEach(() => {
  cleanup()
  openConnection.mockReset()
  vi.restoreAllMocks()
})

describe('ConnectionList', () => {
  it('stacks each connection name above its app ID', () => {
    render(<ConnectionList />)

    const content = screen
      .getByRole('button', { name: /Example/ })
      .querySelector('[data-slot="button-content"]')

    expect(content?.children).toHaveLength(2)
    expect(content?.children[0]?.textContent).toBe('Example')
    expect(content?.children[1]?.textContent).toBe('app-1')
  })

  it('identifies each connection by app ID without repeating its server', () => {
    render(<ConnectionList />)

    const connection = screen.getByRole('button', { name: /Example/ })
    expect(connection.textContent).toContain('app-1')
    expect(connection.textContent).not.toContain('example.com')
  })

  it('sends saved connection intent to the route', () => {
    render(<ConnectionList />)

    fireEvent.click(screen.getByRole('button', { name: /Example/ }))

    expect(openConnection).toHaveBeenCalledWith('connection-1')
  })

  it('keeps connection content unchanged after connection intent is accepted', () => {
    render(<ConnectionList />)

    const connection = screen.getByRole('button', { name: /Example/ })
    fireEvent.click(connection)

    expect(connection.getAttribute('aria-disabled')).not.toBe('true')
    expect(connection.getAttribute('aria-busy')).toBeNull()
    expect(connection.textContent).toBe('Exampleapp-1')
  })
})
