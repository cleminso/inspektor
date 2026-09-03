import { useState, type PropsWithChildren } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InspectorSessionProvider,
  useInspectorSessionContext,
} from '@app/providers/inspectorSessionProvider'
import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'
import { useRegisterRuntimeScopeExitBlocker } from '@app/providers/runtimeScopeExitGuard'
import type { ResolvedTablesNavigationTarget } from '@app/routing/inspectorNavigation'

const navigate = vi.fn()
const setConnectionContext = vi.fn()
const saveConnectionWithContext = vi.fn()
const resolveTablesNavigationTarget = vi.hoisted(() => vi.fn())
const prepareJazzWasm = vi.hoisted(() => vi.fn())
const connectionPreferences = {
  lastBranch: 'main',
  lastSchemaHash: 'schema-1',
}
const createTarget = (
  branch: string,
  schemaHash = 'schema-1',
  connectionId = 'connection-1',
): ResolvedTablesNavigationTarget => ({
  branch,
  connectionId,
  schemaCatalogue: [{ hash: schemaHash, publishedAt: 1 }],
  schemaHash,
})

function deferNavigationTarget(): (target: ResolvedTablesNavigationTarget) => void {
  let resolve!: (target: ResolvedTablesNavigationTarget) => void
  resolveTablesNavigationTarget.mockImplementationOnce(
    () => new Promise((next) => (resolve = next)),
  )
  return (target) => resolve(target)
}
interface BlockerLocation {
  fullPath: string
  params: Record<string, string>
}
interface BlockerOptions {
  enableBeforeUnload: boolean
  shouldBlockFn: (options: { current: BlockerLocation; next: BlockerLocation }) => boolean
}
let blockerOptions: BlockerOptions | null = null
let routeConnectionId = 'connection-1'
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
  getConnectionPreferences: vi.fn(() => connectionPreferences),
  getRememberedBranches: vi.fn(() => ['main', 'feature']),
  prefill: null,
  resolveBranch: vi.fn((_connectionId: string, branch?: string | null) => branch ?? 'main'),
  resolveSchemaHash: vi.fn(
    (_schemas: readonly { hash: string }[], schemaHash?: string | null) => schemaHash ?? 'schema-1',
  ),
  saveConnectionWithContext,
  setConnectionContext,
}

vi.mock('@tanstack/react-router', () => ({
  useBlocker: (options: BlockerOptions) => {
    blockerOptions = options
  },
  useNavigate: () => navigate,
  useParams: () => ({ connectionId: routeConnectionId }),
  useRouterState: ({ select }: { select: (state: { matches: typeof routerMatches }) => unknown }) =>
    select({ matches: routerMatches }),
}))

vi.mock('@app/session/useInspectorSession', () => ({
  useInspectorSession: () => session,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  InspectorProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@app/routing/inspectorNavigation', () => ({
  resolveTablesNavigationTarget,
}))

vi.mock('@app/runtime/jazzWasmPreparation', () => ({ prepareJazzWasm }))

beforeEach(() => {
  session.activeConnectionId = 'connection-1'
  routeConnectionId = 'connection-1'
  connectionPreferences.lastBranch = 'main'
  connectionPreferences.lastSchemaHash = 'schema-1'
  resolveTablesNavigationTarget.mockImplementation(
    async ({
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
  )
})

afterEach(() => {
  cleanup()
  navigate.mockReset()
  blockerOptions = null
  routerMatches = []
  setConnectionContext.mockReset()
  saveConnectionWithContext.mockReset()
  prepareJazzWasm.mockReset()
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
      <button type="button" onClick={() => void inspectorSession.switchBranch('release')}>
        Switch release branch
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
      <button
        type="button"
        onClick={() =>
          inspectorSession.saveConnectionWithContext(
            connections['connection-2'],
            'connection-2',
            'feature',
            'schema-2',
          )
        }
      >
        Save and set runtime scope
      </button>
      <button
        type="button"
        onClick={() =>
          inspectorSession.saveConnectionWithContext(
            connections['connection-1'],
            'connection-1',
            'main',
            'schema-1',
          )
        }
      >
        Save active connection
      </button>
    </>
  )
}

function TestSession({
  blocked,
  children,
}: PropsWithChildren<{ blocked: boolean }>): React.ReactElement {
  return (
    <InspectorSessionProvider>
      <SessionActions blocked={blocked} />
      {children}
    </InspectorSessionProvider>
  )
}

describe('InspectorSessionProvider runtime-scope exit policy', () => {
  it('blocks connection, branch, and schema changes while pending table state exists', async () => {
    render(<TestSession blocked />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))
      fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
      fireEvent.click(screen.getByRole('button', { name: 'Switch schema' }))
      fireEvent.click(screen.getByRole('button', { name: 'Set runtime scope' }))
      fireEvent.click(screen.getByRole('button', { name: 'Save and set runtime scope' }))
      fireEvent.click(screen.getByRole('button', { name: 'Save active connection' }))
    })

    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(saveConnectionWithContext).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(prepareJazzWasm).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Runtime scope blocked' }).textContent).toBe('true')
    expect(screen.getByRole('status', { name: 'Connection open result' }).textContent).toBe(
      'blocked',
    )
  })

  it('saves a connection and its context after the runtime-scope guard accepts the change', () => {
    render(<TestSession blocked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Save and set runtime scope' }))

    expect(saveConnectionWithContext).toHaveBeenCalledWith(
      connections['connection-2'],
      'connection-2',
      'feature',
      'schema-2',
    )
    expect(prepareJazzWasm).toHaveBeenCalledOnce()
  })

  it('starts WASM preparation after accepting connection intent and before navigation', () => {
    render(<TestSession blocked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))

    expect(prepareJazzWasm).toHaveBeenCalledOnce()
    expect(prepareJazzWasm.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0]!,
    )
  })

  it('does not prepare WASM while synchronizing a route-owned runtime target', () => {
    render(<TestSession blocked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Set runtime scope' }))

    expect(setConnectionContext).toHaveBeenCalledOnce()
    expect(prepareJazzWasm).not.toHaveBeenCalled()
  })

  it('blocks route exits while allowing navigation inside the active table workspace', async () => {
    render(<TestSession blocked />)
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
        next: {
          fullPath: '/conn/$connectionId/live-queries',
          params: { connectionId: 'connection-1' },
        },
      }),
    ).toBe(true)
  })

  it('allows runtime-scope changes after pending state clears', async () => {
    render(<TestSession blocked={false} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
    })

    expect(setConnectionContext).toHaveBeenCalledWith('connection-1', 'feature', 'schema-1')
    expect(screen.getByRole('status', { name: 'Runtime scope blocked' }).textContent).toBe('false')
  })

  it('does not commit a branch resolution after pending table state appears', async () => {
    const resolveTarget = deferNavigationTarget()
    const view = render(<TestSession blocked={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))

    view.rerender(<TestSession blocked />)
    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Runtime scope blocked' }).textContent).toBe(
        'true',
      ),
    )
    await act(async () => {
      resolveTarget(createTarget('feature'))
    })

    expect(setConnectionContext).not.toHaveBeenCalled()
  })

  it('does not overwrite a schema selected while branch resolution is pending', async () => {
    const resolveTarget = deferNavigationTarget()
    const view = render(<TestSession blocked={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch schema' }))
    connectionPreferences.lastSchemaHash = 'schema-2'
    view.rerender(<TestSession blocked={false} />)
    setConnectionContext.mockClear()

    await act(async () => {
      resolveTarget(createTarget('feature'))
    })

    expect(setConnectionContext).not.toHaveBeenCalled()
  })

  it('commits only the latest overlapping branch request', async () => {
    const resolvers = new Map<string, (target: ResolvedTablesNavigationTarget) => void>()
    resolveTablesNavigationTarget.mockImplementation(
      ({ branchOverride }: { branchOverride: string }) =>
        new Promise((resolve) => resolvers.set(branchOverride, resolve)),
    )
    render(<TestSession blocked={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch release branch' }))

    await act(async () => {
      resolvers.get('feature')?.(createTarget('feature'))
    })
    expect(setConnectionContext).not.toHaveBeenCalled()

    await act(async () => {
      resolvers.get('release')?.(createTarget('release'))
    })
    expect(setConnectionContext).toHaveBeenCalledWith('connection-1', 'release', 'schema-1')
  })

  it('does not overwrite a branch selected while branch resolution is pending', async () => {
    const resolveTarget = deferNavigationTarget()
    const view = render(<TestSession blocked={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
    connectionPreferences.lastBranch = 'release'
    view.rerender(<TestSession blocked={false} />)

    await act(async () => {
      resolveTarget(createTarget('feature'))
    })

    expect(setConnectionContext).not.toHaveBeenCalled()
  })

  it('does not commit branch resolution after the active connection changes', async () => {
    const resolveTarget = deferNavigationTarget()
    const view = render(<TestSession blocked={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch branch' }))
    routeConnectionId = 'connection-2'
    view.rerender(<TestSession blocked={false} />)

    await act(async () => {
      resolveTarget(createTarget('feature'))
    })

    expect(setConnectionContext).not.toHaveBeenCalled()
  })

  it('retries route runtime synchronization after pending state clears', async () => {
    const target = createTarget('main', 'schema-2')
    const view = render(<TestSession blocked />)
    view.rerender(
      <TestSession blocked>
        <InspectorRuntimeBoundary target={target}>Runtime content</InspectorRuntimeBoundary>
      </TestSession>,
    )
    expect(setConnectionContext).not.toHaveBeenCalled()

    view.rerender(
      <TestSession blocked={false}>
        <InspectorRuntimeBoundary target={target}>Runtime content</InspectorRuntimeBoundary>
      </TestSession>,
    )

    await waitFor(() =>
      expect(setConnectionContext).toHaveBeenCalledWith('connection-1', 'main', 'schema-2'),
    )
  })

  it('accepts connection intent without resolving or persisting route data', async () => {
    render(<TestSession blocked={false} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch connection' }))
    })

    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId: 'connection-2' },
      search: expect.any(Function),
    })
    const updateSearch = navigate.mock.calls[0]![0].search as (
      previous: Record<string, unknown>,
    ) => Record<string, unknown>
    expect(updateSearch({ filters: 'active', schema: 'schema-1' })).toEqual({
      filters: 'active',
      schema: undefined,
    })
    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Connection open result' }).textContent).toBe(
      'accepted',
    )
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

    render(<TestSession blocked={false} />)

    expect(screen.getByRole('status', { name: 'Pending connection' }).textContent).toBe(
      'connection-2',
    )
  })
})
