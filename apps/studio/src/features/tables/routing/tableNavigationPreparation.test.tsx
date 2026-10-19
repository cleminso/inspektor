import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSchemaCatalogueLoadError } from '@app/connections/connectionValidation'
import {
  TableNavigationPreparationProvider,
  useTableNavigationPreparation,
} from '@tables/routing/tableNavigationPreparation'

interface ControlledPreparation {
  promise: Promise<unknown[]>
  reject: (error: unknown) => void
  release: ReturnType<typeof vi.fn>
  resolve: () => void
}

const { checkConnection, navigate, prefetchJazzQueryMock, runtime } = vi.hoisted(() => ({
  checkConnection: vi.fn(),
  navigate: vi.fn(),
  prefetchJazzQueryMock: vi.fn(),
  runtime: {
    activeConnection: {
      id: 'connection-1',
      serverUrl: 'https://sync.example.com',
      appId: 'app-1',
      adminSecret: 'secret',
    },
    client: {} as object | null,
    schema: { accounts: { columns: [] }, profiles: { columns: [] } } as object | null,
  },
}))
const providerState = { identity: '/conn/connection-1/tables/accounts?page=1' }

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({ activeConnection: runtime.activeConnection }),
  useRuntimeClient: () => runtime.client,
  useRuntimeSchema: () => runtime.schema,
}))

vi.mock('@tables/query/prefetchJazzQuery', () => ({
  prefetchJazzQuery: prefetchJazzQueryMock,
}))

vi.mock('@app/routing/inspectorNavigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/routing/inspectorNavigation')>()),
  fetchConnectionSchemaCatalogueWithRetry: checkConnection,
}))

function createPreparation(): ControlledPreparation {
  let resolvePromise: (rows: unknown[]) => void = () => undefined
  let rejectPromise: (error: unknown) => void = () => undefined
  const promise = new Promise<unknown[]>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return {
    promise,
    reject: rejectPromise,
    release: vi.fn(),
    resolve: () => resolvePromise([]),
  }
}

function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <TableNavigationPreparationProvider identity={providerState.identity} scope="workspace">
      {children}
    </TableNavigationPreparationProvider>
  )
}

const pageOne = {
  filters: [],
  page: 1,
  pageSize: 100 as const,
  sortColumn: 'id',
  sortDirection: 'asc' as const,
}

beforeEach(() => {
  runtime.client = {}
  runtime.activeConnection = {
    id: 'connection-1',
    serverUrl: 'https://sync.example.com',
    appId: 'app-1',
    adminSecret: 'secret',
  }
  runtime.schema = { accounts: { columns: [] }, profiles: { columns: [] } }
  providerState.identity = '/conn/connection-1/tables/accounts?page=1'
  checkConnection.mockReset()
  navigate.mockReset()
  prefetchJazzQueryMock.mockReset()
})

afterEach(cleanup)

describe('TableNavigationPreparationProvider', () => {
  it('accepts one pagination request while preparation is pending', async () => {
    const preparation = createPreparation()
    prefetchJazzQueryMock.mockReturnValue(preparation)
    const firstCommit = vi.fn()
    const secondCommit = vi.fn()
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    let first: Promise<string> | undefined
    let second: Promise<string> | undefined
    act(() => {
      first = result.current.prepare(
        { policy: 'ignore', search: { ...pageOne, page: 2 }, tableName: 'accounts' },
        firstCommit,
      )
      second = result.current.prepare(
        { policy: 'ignore', search: { ...pageOne, page: 3 }, tableName: 'accounts' },
        secondCommit,
      )
    })

    await expect(second).resolves.toBe('busy')
    expect(prefetchJazzQueryMock).toHaveBeenCalledOnce()
    expect(firstCommit).not.toHaveBeenCalled()

    await act(async () => {
      preparation.resolve()
      await first
    })
    expect(firstCommit).toHaveBeenCalledOnce()
    expect(secondCommit).not.toHaveBeenCalled()
    expect(preparation.release).toHaveBeenCalledOnce()
  })

  it('replaces a pending non-pagination destination', async () => {
    const firstPreparation = createPreparation()
    const secondPreparation = createPreparation()
    prefetchJazzQueryMock
      .mockReturnValueOnce(firstPreparation)
      .mockReturnValueOnce(secondPreparation)
    const firstCommit = vi.fn()
    const secondCommit = vi.fn()
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    let first: Promise<string> | undefined
    let second: Promise<string> | undefined
    act(() => {
      first = result.current.prepare(
        { policy: 'replace', search: pageOne, tableName: 'accounts' },
        firstCommit,
      )
      second = result.current.prepare(
        { policy: 'replace', search: pageOne, tableName: 'profiles' },
        secondCommit,
      )
    })

    await expect(first).resolves.toBe('superseded')
    expect(firstPreparation.release).toHaveBeenCalledOnce()
    secondPreparation.resolve()
    await expect(second).resolves.toBe('committed')
    expect(firstCommit).not.toHaveBeenCalled()
    expect(secondCommit).toHaveBeenCalledOnce()
  })

  it('builds the exact remote destination and propagates query errors', async () => {
    const preparation = createPreparation()
    prefetchJazzQueryMock.mockReturnValue(preparation)
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })
    const error = new Error('query failed')
    checkConnection.mockResolvedValueOnce([])

    let navigation: Promise<string> | undefined
    act(() => {
      navigation = result.current.prepare(
        { policy: 'replace', search: { ...pageOne, page: 2 }, tableName: 'accounts' },
        vi.fn(),
      )
    })
    const call = prefetchJazzQueryMock.mock.lastCall as [object, { _build: () => string }, unknown]
    expect(JSON.parse(call[1]._build())).toMatchObject({
      limit: 101,
      offset: 100,
      orderBy: [['id', 'asc']],
      table: 'accounts',
    })
    expect(call[2]).toEqual({ tier: 'remote' })

    preparation.reject(error)
    await expect(navigation).rejects.toBe(error)
    expect(preparation.release).toHaveBeenCalledOnce()
    expect(checkConnection).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('redirects a lost connection to recovery instead of propagating the table error', async () => {
    const preparation = createPreparation()
    providerState.identity =
      '/conn/connection-1/tables/accounts?page=1&adminSecret=must-not-leak#rows'
    prefetchJazzQueryMock.mockReturnValue(preparation)
    checkConnection.mockRejectedValueOnce(
      createSchemaCatalogueLoadError(new TypeError('Failed to fetch')),
    )
    const commit = vi.fn()
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    const navigation = result.current.prepare(
      { policy: 'replace', search: pageOne, tableName: 'profiles' },
      commit,
    )
    preparation.reject(new Error('query failed'))

    await expect(navigation).resolves.toBe('recovery')
    expect(commit).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/edit/$connectionId',
      params: { connectionId: 'connection-1' },
      search: {
        recovery: 'network',
        returnTo: '/conn/connection-1/tables/accounts?page=1#rows',
      },
      replace: true,
    })
    expect(preparation.release).toHaveBeenCalledOnce()
  })

  it('does not redirect after the failed preparation is superseded during diagnosis', async () => {
    const preparation = createPreparation()
    prefetchJazzQueryMock.mockReturnValue(preparation)
    let finishCheck: () => void = () => undefined
    checkConnection.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishCheck = resolve
      }),
    )
    const { result, rerender } = renderHook(() => useTableNavigationPreparation(), {
      wrapper: Wrapper,
    })

    const navigation = result.current.prepare(
      { policy: 'replace', search: pageOne, tableName: 'profiles' },
      vi.fn(),
    )
    await act(async () => {
      preparation.reject(new Error('query failed'))
      await Promise.resolve()
    })
    expect(checkConnection).toHaveBeenCalledOnce()

    providerState.identity = '/conn/connection-1/tables/accounts?page=2'
    rerender()
    await act(async () => finishCheck())

    await expect(navigation).resolves.toBe('superseded')
    expect(navigate).not.toHaveBeenCalled()
    expect(preparation.release).toHaveBeenCalledOnce()
  })

  it('does not diagnose a router commit failure as a lost connection', async () => {
    const preparation = createPreparation()
    prefetchJazzQueryMock.mockReturnValue(preparation)
    const commitError = new Error('router commit failed')
    const commit = vi.fn().mockRejectedValueOnce(commitError)
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    const navigation = result.current.prepare(
      { policy: 'replace', search: pageOne, tableName: 'profiles' },
      commit,
    )
    preparation.resolve()

    await expect(navigation).rejects.toBe(commitError)
    expect(checkConnection).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('does not commit before runtime query inputs are available', async () => {
    runtime.client = null
    runtime.schema = null
    const commit = vi.fn()
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    await expect(
      result.current.prepare({ policy: 'replace', search: pageOne, tableName: 'accounts' }, commit),
    ).resolves.toBe('unavailable')

    expect(prefetchJazzQueryMock).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('holds preparation ownership until navigation finishes', async () => {
    const preparation = createPreparation()
    prefetchJazzQueryMock.mockReturnValue(preparation)
    let finishCommit: () => void = () => undefined
    const commit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishCommit = resolve
        }),
    )
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    let navigation: Promise<string> | undefined
    act(() => {
      navigation = result.current.prepare(
        { policy: 'replace', search: pageOne, tableName: 'accounts' },
        commit,
      )
    })
    await act(async () => preparation.resolve())

    expect(commit).toHaveBeenCalledOnce()
    expect(preparation.release).not.toHaveBeenCalled()

    await act(async () => {
      finishCommit()
      await navigation
    })
    expect(preparation.release).toHaveBeenCalledOnce()
  })

  it('reports a commit superseded while navigation is finishing', async () => {
    const firstPreparation = createPreparation()
    const secondPreparation = createPreparation()
    prefetchJazzQueryMock
      .mockReturnValueOnce(firstPreparation)
      .mockReturnValueOnce(secondPreparation)
    let finishFirstCommit: () => void = () => undefined
    const firstCommit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishFirstCommit = resolve
        }),
    )
    const { result } = renderHook(() => useTableNavigationPreparation(), { wrapper: Wrapper })

    const first = result.current.prepare(
      { policy: 'replace', search: pageOne, tableName: 'accounts' },
      firstCommit,
    )
    await act(async () => firstPreparation.resolve())
    const second = result.current.prepare(
      { policy: 'replace', search: pageOne, tableName: 'profiles' },
      vi.fn(),
    )
    secondPreparation.resolve()

    await expect(second).resolves.toBe('committed')
    finishFirstCommit()
    await expect(first).resolves.toBe('superseded')
    expect(firstPreparation.release).toHaveBeenCalledOnce()
  })

  it('revokes a pending commit when route identity changes', async () => {
    const preparation = createPreparation()
    prefetchJazzQueryMock.mockReturnValue(preparation)
    const commit = vi.fn()
    const { result, rerender } = renderHook(() => useTableNavigationPreparation(), {
      wrapper: Wrapper,
    })

    let navigation: Promise<string> | undefined
    act(() => {
      navigation = result.current.prepare(
        { policy: 'replace', search: pageOne, tableName: 'accounts' },
        commit,
      )
    })
    providerState.identity = 'accounts:page-2'
    rerender()

    await expect(navigation).resolves.toBe('superseded')
    expect(commit).not.toHaveBeenCalled()
    expect(preparation.release).toHaveBeenCalledOnce()
  })
})
