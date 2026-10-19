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
  ConnectionFormView: ({
    cancelLabel,
    edit,
    onClose,
    submitLabel,
    submittingLabel,
  }: {
    cancelLabel?: string
    edit: unknown
    onClose: () => void
    submitLabel?: string
    submittingLabel?: string | null
  }) => (
    <>
      <output aria-label="Edit options">{JSON.stringify(edit)}</output>
      <output aria-label="Form presentation">
        {JSON.stringify({ cancelLabel, submitLabel, submittingLabel })}
      </output>
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

  it('explains rejected credentials and starts with an empty admin secret', () => {
    render(
      <EditConnectionView
        connectionId="connection-1"
        recovery={{
          reason: 'authorization',
          returnTo: '/conn/connection-1/live-queries?schema=schema-1',
        }}
      />,
    )

    expect(
      screen.getByText(/server is reachable, but it rejected the saved admin secret/u),
    ).toBeTruthy()
    expect(screen.getByText(/may issue a new secret after restarting/u)).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Edit options' }).textContent).toBe(
      JSON.stringify({
        branch: 'release',
        connection,
        adminSecret: '',
        initialError: {
          title: 'The server rejected this connection',
          description: 'This admin secret was rejected.',
          field: 'adminSecret',
        },
        returnTo: '/conn/connection-1/live-queries?schema=schema-1',
      }),
    )
    expect(screen.getByRole('status', { name: 'Form presentation' }).textContent).toBe(
      JSON.stringify({
        cancelLabel: 'Back to connections',
        submitLabel: 'Reconnect',
        submittingLabel: null,
      }),
    )
  })

  it.each([
    ['network', "Inspektor couldn't reach the saved server on the last attempt."],
    ['server', 'The saved server could not load this Jazz app.'],
    ['unknown', "Inspektor couldn't restore this saved connection."],
  ] as const)('presents %s recovery once above the form', (reason, summary) => {
    render(<EditConnectionView connectionId="connection-1" recovery={{ reason }} />)

    const edit = JSON.parse(
      screen.getByRole('status', { name: 'Edit options' }).textContent ?? '{}',
    ) as { initialError?: { description: string; field?: string } }
    expect(edit.initialError).toBeUndefined()
    const recoveryStatus = screen.getByText(summary).closest('[role="status"]')
    const formMarker = screen.getByRole('status', { name: 'Edit options' })
    expect(recoveryStatus).not.toBeNull()
    expect(
      (recoveryStatus?.compareDocumentPosition(formMarker) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
  })

  it('keeps field-specific recovery feedback in the form', () => {
    render(<EditConnectionView connectionId="connection-1" recovery={{ reason: 'not-found' }} />)

    const edit = JSON.parse(
      screen.getByRole('status', { name: 'Edit options' }).textContent ?? '{}',
    ) as { initialError?: { description: string; field?: string } }
    expect(edit.initialError).toEqual({
      title: expect.any(String),
      description: 'This Jazz app could not be found on the server.',
      field: 'appId',
    })
  })
})
