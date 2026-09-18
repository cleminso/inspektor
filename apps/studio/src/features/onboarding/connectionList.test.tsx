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
})
