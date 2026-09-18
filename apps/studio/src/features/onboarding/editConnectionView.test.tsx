import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EditConnectionView } from './editConnectionView'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
const connection = {
  id: 'connection-1',
  name: 'Production',
  serverUrl: 'https://sync.example.com',
  appId: 'app-1',
  env: 'prod',
  credentialRetention: 'memory' as const,
}
let connections = [connection]

vi.mock('@tanstack/react-router', () => ({
  Navigate: ({ to }: { to: string }) => <div>Redirect to {to}</div>,
  useNavigate: () => navigate,
}))

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections,
    getConnection: () => ({ ...connection, adminSecret: 'secret' }),
    getConnectionPreferences: () => ({ lastBranch: 'release' }),
  }),
}))

vi.mock('./addConnectionView', () => ({
  ConnectionFormView: ({ edit, onClose }: { edit: unknown; onClose: () => void }) => (
    <>
      <output aria-label="Edit options">{JSON.stringify(edit)}</output>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
    </>
  ),
}))

afterEach(() => {
  cleanup()
  connections = [connection]
  navigate.mockReset()
})

describe('EditConnectionView', () => {
  it('loads the saved connection and returns to connections on cancel', () => {
    render(<EditConnectionView connectionId="connection-1" />)

    expect(screen.getByRole('status', { name: 'Edit options' }).textContent).toBe(
      JSON.stringify({ branch: 'release', connection, adminSecret: 'secret' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/conn' })
  })

  it('redirects when the saved connection is missing', () => {
    connections = []

    render(<EditConnectionView connectionId="missing" />)

    expect(screen.getByText('Redirect to /conn')).toBeTruthy()
  })
})
