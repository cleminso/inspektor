import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

const { prefetchJazzQueryMock, runtime } = vi.hoisted(() => ({
  prefetchJazzQueryMock: vi.fn(),
  runtime: {
    client: {} as object | null,
    schema: { accounts: { columns: [] }, profiles: { columns: [] } } as object | null,
  },
}))
const providerState = { identity: 'accounts:page-1' }

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeClient: () => runtime.client,
  useRuntimeSchema: () => runtime.schema,
}))

vi.mock('@tables/query/prefetchJazzQuery', () => ({
  prefetchJazzQuery: prefetchJazzQueryMock,
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
  runtime.schema = { accounts: { columns: [] }, profiles: { columns: [] } }
  providerState.identity = 'accounts:page-1'
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
