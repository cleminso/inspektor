import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  InspectorSessionProvider,
  useInspectorSessionContext,
} from '@app/providers/inspectorSessionProvider'
import { useRegisterRuntimeScopeExitBlocker } from '@app/providers/runtimeScopeExitGuard'

const navigate = vi.fn()
const setConnectionContext = vi.fn()
interface BlockerLocation {
  fullPath: string
  params: Record<string, string>
}
interface BlockerOptions {
  enableBeforeUnload: boolean
  shouldBlockFn: (options: { current: BlockerLocation; next: BlockerLocation }) => boolean
}
let blockerOptions: BlockerOptions | null = null
let routerMatches: Array<{
  isFetching: false | 'beforeLoad' | 'loader'
  params: Record<string, string>
  routeId: string
  status: 'pending' | 'success' | 'error' | 'notFound'
}> = []
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
    (_connectionId: string, _schemas: readonly { hash: string }[], schemaHash?: string | null) =>
      schemaHash ?? 'schema-1',
  ),
  saveConnection: vi.fn(),
  setConnectionContext,
}

vi.mock('@tanstack/react-router', () => ({
  useBlocker: (options: BlockerOptions) => {
    blockerOptions = options
  },
  useNavigate: () => navigate,
  useParams: () => ({ connectionId: 'connection-1' }),
  useRouterState: ({ select }: { select: (state: { matches: typeof routerMatches }) => unknown }) =>
    select({ matches: routerMatches }),
}))

vi.mock('@app/session/useInspectorSession', () => ({
  useInspectorSession: () => session,
}))

vi.mock('@app/routing/inspectorNavigation', () => ({
  resolveTablesNavigationTarget: async ({
    branchOverride,
    connectionId,
    schemaHashOverride,
  }: {
    branchOverride?: string
    connectionId: string
    schemaHashOverride?: string | null
  }) => ({
    branch: branchOverride ?? 'main',
    connectionId,
    schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
    schemaHash: schemaHashOverride ?? 'schema-1',
  }),
}))

afterEach(() => {
  cleanup()
  navigate.mockReset()
  blockerOptions = null
  routerMatches = []
  setConnectionContext.mockReset()
})

function SessionActions({ blocked }: { blocked: boolean }): React.ReactElement {
  useRegisterRuntimeScopeExitBlocker(blocked)
  const inspectorSession = useInspectorSessionContext()
  const [openResult, setOpenResult] = useState('none')

  return (
    <>
      <output aria-label="Runtime scope blocked">
        {String(inspectorSession.runtimeScopeExitBlocked)}
      </output>
      <output aria-label="Connection open result">{openResult}</output>
      <output aria-label="Pending connection">
        {inspectorSession.pendingConnectionId ?? 'none'}
      </output>
      <button
        type="button"
        onClick={() => {
          setOpenResult(inspectorSession.openConnection('connection-2'))
        }}
      >
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
    expect(screen.getByRole('status', { name: 'Connection open result' }).textContent).toBe(
      'blocked',
    )
  })

  it('blocks route exits while allowing navigation inside the active table workspace', async () => {
    render(
      <InspectorSessionProvider>
        <SessionActions blocked />
      </InspectorSessionProvider>,
    )
    await screen.findByText('true', { selector: '[aria-label="Runtime scope blocked"]' })

    const current = {
      fullPath: '/conn/$connectionId/tables/$tableName',
      params: { connectionId: 'connection-1', tableName: 'accounts' },
    }

    expect(blockerOptions?.enableBeforeUnload).toBe(false)
    expect(
      blockerOptions?.shouldBlockFn({
        current,
        next: {
          fullPath: '/conn/$connectionId/tables/$tableName',
          params: { connectionId: 'connection-1', tableName: 'profiles' },
        },
      }),
    ).toBe(false)
    expect(
      blockerOptions?.shouldBlockFn({
        current,
        next: {
          fullPath: '/conn/$connectionId/tables',
          params: { connectionId: 'connection-2' },
        },
      }),
    ).toBe(true)
    expect(
      blockerOptions?.shouldBlockFn({
        current,
        next: { fullPath: '/conn/$connectionId/queries', params: { connectionId: 'connection-1' } },
      }),
    ).toBe(true)
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

  it('accepts connection intent without resolving or persisting route data', async () => {
    render(
      <InspectorSessionProvider>
        <SessionActions blocked={false} />
      </InspectorSessionProvider>,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))
    })

    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId: 'connection-2' },
    })
    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Connection open result' }).textContent).toBe(
      'accepted',
    )
  })

  it('forwards repeated accepted connection intent', () => {
    render(
      <InspectorSessionProvider>
        <SessionActions blocked={false} />
      </InspectorSessionProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))

    expect(navigate).toHaveBeenCalledTimes(2)
  })

  it('derives the pending connection from the router match', () => {
    routerMatches = [
      {
        isFetching: 'loader',
        params: { connectionId: 'connection-2' },
        routeId: '/conn/$connectionId',
        status: 'pending',
      },
    ]

    render(
      <InspectorSessionProvider>
        <SessionActions blocked={false} />
      </InspectorSessionProvider>,
    )

    expect(screen.getByRole('status', { name: 'Pending connection' }).textContent).toBe(
      'connection-2',
    )
  })
})
