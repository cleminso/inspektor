import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  InspectorSessionProvider,
  useInspectorSessionContext,
} from '@app/providers/inspectorSessionProvider'
import { useRegisterRuntimeScopeExitBlocker } from '@app/providers/runtimeScopeExitGuard'

const navigate = vi.fn()
const setConnectionContext = vi.fn()
const navigationMocks = vi.hoisted(() => {
  const clearPreparedTarget = vi.fn()
  return {
    clearPreparedTarget,
    prepareStoredTablesNavigationTarget: vi.fn(() => clearPreparedTarget),
  }
})
const connections = {
  'connection-1': {
    id: 'connection-1',
    name: 'Connection 1',
    serverUrl: 'https://sync.example.com',
    appId: 'app-1',
    adminSecret: 'secret-1',
    env: 'dev',
  },
  'connection-2': {
    id: 'connection-2',
    name: 'Connection 2',
    serverUrl: 'https://sync.example.com',
    appId: 'app-2',
    adminSecret: 'secret-2',
    env: 'dev',
  },
} as const
const session = {
  activeConnectionId: 'connection-1',
  connections: [],
  deleteConnection: vi.fn(),
  getConnection: vi.fn((connectionId: keyof typeof connections) => connections[connectionId]),
  getConnectionPreferences: vi.fn(() => ({
    lastBranch: 'main',
    lastSchemaHash: 'schema-1',
  })),
  getRememberedBranches: vi.fn(() => ['main', 'feature']),
  prefill: null,
  resolveBranch: vi.fn((_connectionId: string, branch?: string | null) => branch ?? 'main'),
  resolveSchemaHash: vi.fn(
    (_connectionId: string, _hashes: readonly string[], schemaHash?: string | null) =>
      schemaHash ?? 'schema-1',
  ),
  saveConnection: vi.fn(),
  setConnectionContext,
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useParams: () => ({ connectionId: 'connection-1' }),
}))

vi.mock('@app/session/useInspectorSession', () => ({
  useInspectorSession: () => session,
}))

vi.mock('@app/connections/useConnectionOpenCoordinator', () => ({
  useConnectionOpenCoordinator:
    (performOpen: (connectionId: string, knownSchemaHashes?: readonly string[]) => Promise<void>) =>
    async (connectionId: string, knownSchemaHashes?: readonly string[]) => {
      await performOpen(connectionId, knownSchemaHashes)
    },
}))

vi.mock('@app/routing/inspectorNavigation', () => ({
  prepareStoredTablesNavigationTarget: navigationMocks.prepareStoredTablesNavigationTarget,
  resolveTablesNavigationTarget: async ({
    branchOverride,
    connectionId,
    schemaHashOverride,
  }: {
    branchOverride?: string
    connectionId: string
    schemaHashOverride?: string | null
  }) => ({
    availableSchemaHashes: ['schema-1'],
    branch: branchOverride ?? 'main',
    connectionId,
    schemaHash: schemaHashOverride ?? 'schema-1',
  }),
}))

afterEach(() => {
  cleanup()
  navigate.mockReset()
  setConnectionContext.mockReset()
  navigationMocks.clearPreparedTarget.mockReset()
  navigationMocks.prepareStoredTablesNavigationTarget.mockClear()
})

function SessionActions({ blocked }: { blocked: boolean }): React.ReactElement {
  useRegisterRuntimeScopeExitBlocker(blocked)
  const inspectorSession = useInspectorSessionContext()

  return (
    <>
      <output aria-label="Runtime scope blocked">
        {String(inspectorSession.runtimeScopeExitBlocked)}
      </output>
      <button type="button" onClick={() => void inspectorSession.openConnection('connection-2')}>
        Switch connection
      </button>
      <button type="button" onClick={() => void inspectorSession.switchBranch('feature')}>
        Switch branch
      </button>
      <button type="button" onClick={() => void inspectorSession.switchSchema('schema-2')}>
        Switch schema
      </button>
      <button
        type="button"
        onClick={() => inspectorSession.setConnectionContext('connection-2', 'feature', 'schema-2')}
      >
        Set runtime scope
      </button>
    </>
  )
}

describe('InspectorSessionProvider runtime-scope exit policy', () => {
  it('blocks connection, branch, and schema changes while pending table state exists', async () => {
    render(
      <InspectorSessionProvider>
        <SessionActions blocked />
      </InspectorSessionProvider>,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))
      fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
      fireEvent.click(screen.getByRole('button', { name: 'Switch schema' }))
      fireEvent.click(screen.getByRole('button', { name: 'Set runtime scope' }))
    })

    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Runtime scope blocked' }).textContent).toBe('true')
  })

  it('allows runtime-scope changes after pending state clears', async () => {
    render(
      <InspectorSessionProvider>
        <SessionActions blocked={false} />
      </InspectorSessionProvider>,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
    })

    expect(setConnectionContext).toHaveBeenCalledWith('connection-1', 'feature', 'schema-1')
    expect(screen.getByRole('status', { name: 'Runtime scope blocked' }).textContent).toBe('false')
  })

  it('hands the resolved target to the route loader before navigation', async () => {
    render(
      <InspectorSessionProvider>
        <SessionActions blocked={false} />
      </InspectorSessionProvider>,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))
    })

    expect(navigationMocks.prepareStoredTablesNavigationTarget).toHaveBeenCalledWith(
      connections['connection-2'],
      {
        availableSchemaHashes: ['schema-1'],
        branch: 'main',
        connectionId: 'connection-2',
        schemaHash: 'schema-1',
      },
    )
    expect(navigate).toHaveBeenCalledOnce()
    expect(navigationMocks.prepareStoredTablesNavigationTarget).toHaveBeenCalledBefore(navigate)
    expect(navigationMocks.clearPreparedTarget).toHaveBeenCalledOnce()
    expect(navigationMocks.clearPreparedTarget).toHaveBeenCalledAfter(navigate)
  })
})
