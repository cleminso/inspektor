// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useTablePreferences } from '@tables/grid/useTablePreferences'

beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size
      },
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    } satisfies Storage,
  })
})

describe('useTablePreferences', () => {
  it('restores column order and hidden columns from one versioned record', () => {
    window.localStorage.setItem(
      'inspektor-table-preferences:connection%3Aaccounts',
      JSON.stringify({ version: 1, order: ['role', 'id'], hidden: ['role'] }),
    )

    const { result } = renderHook(() =>
      useTablePreferences({
        columnIds: ['id', 'name', 'role'],
        tableKey: 'connection:accounts',
      }),
    )

    expect(result.current.columnOrder).toEqual(['role', 'id', 'name'])
    expect(result.current.columnVisibility).toEqual({ id: true, name: true, role: false })
  })

  it('retains stored schema-column preferences while verified columns load', () => {
    window.localStorage.setItem(
      'inspektor-table-preferences:connection%3Aaccounts',
      JSON.stringify({ version: 1, order: ['role', 'id', 'name'], hidden: ['role'] }),
    )
    const { result, rerender } = renderHook(
      ({ columnIds }: { columnIds: string[] }) =>
        useTablePreferences({ columnIds, tableKey: 'connection:accounts' }),
      { initialProps: { columnIds: ['id'] } },
    )

    expect(result.current.columnOrder).toEqual(['id'])
    rerender({ columnIds: ['id', 'name', 'role'] })

    expect(result.current.columnOrder).toEqual(['role', 'id', 'name'])
    expect(result.current.columnVisibility).toEqual({ id: true, name: true, role: false })
  })

  it('persists order and hidden column changes without separate legacy keys', () => {
    const { result } = renderHook(() =>
      useTablePreferences({
        columnIds: ['id', 'name', 'role'],
        tableKey: 'connection:accounts',
      }),
    )

    act(() => {
      result.current.setColumnOrder(['role', 'id', 'name'])
      result.current.setColumnVisibility({ id: true, name: false, role: true })
    })

    expect(
      JSON.parse(
        window.localStorage.getItem('inspektor-table-preferences:connection%3Aaccounts') ?? 'null',
      ),
    ).toEqual({ version: 1, order: ['role', 'id', 'name'], hidden: ['name'] })
    expect(window.localStorage.getItem('inspector:column-order:connection:accounts')).toBeNull()
    expect(
      window.localStorage.getItem('inspector:column-visibility:connection:accounts'),
    ).toBeNull()
  })

  it('composes functional order updates before React renders', () => {
    const { result } = renderHook(() =>
      useTablePreferences({
        columnIds: ['id', 'name', 'role'],
        tableKey: 'connection:accounts',
      }),
    )

    act(() => {
      result.current.setColumnOrder((current) => [current[1]!, current[0]!, current[2]!])
      result.current.setColumnOrder((current) => [current[0]!, current[2]!, current[1]!])
    })

    expect(result.current.columnOrder).toEqual(['name', 'role', 'id'])
  })

  it('restores schema order without changing hidden columns', () => {
    const { result } = renderHook(() =>
      useTablePreferences({
        columnIds: ['id', 'name', 'role'],
        tableKey: 'connection:accounts',
      }),
    )

    act(() => {
      result.current.setColumnVisibility({ id: true, name: false, role: true })
      result.current.setColumnOrder(['role', 'id', 'name'])
      result.current.setColumnOrder([])
    })

    expect(result.current.columnOrder).toEqual(['id', 'name', 'role'])
    expect(result.current.columnVisibility).toEqual({ id: true, name: false, role: true })
    expect(
      JSON.parse(
        window.localStorage.getItem('inspektor-table-preferences:connection%3Aaccounts') ?? 'null',
      ),
    ).toEqual({ version: 1, order: ['id', 'name', 'role'], hidden: ['name'] })
  })

  it('discards unsupported preference versions', () => {
    window.localStorage.setItem(
      'inspektor-table-preferences:connection%3Aaccounts',
      JSON.stringify({ version: 2, order: ['name', 'id'], hidden: ['name'] }),
    )

    const { result } = renderHook(() =>
      useTablePreferences({ columnIds: ['id', 'name'], tableKey: 'connection:accounts' }),
    )

    expect(result.current.columnOrder).toEqual(['id', 'name'])
    expect(result.current.columnVisibility).toEqual({ id: true, name: true })
  })

  it('falls back to schema preferences when storage cannot be read', () => {
    Object.defineProperty(window.localStorage, 'getItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      },
    })

    const { result } = renderHook(() =>
      useTablePreferences({
        columnIds: ['id', 'name'],
        tableKey: 'connection:accounts',
      }),
    )

    expect(result.current.columnOrder).toEqual(['id', 'name'])
    expect(result.current.columnVisibility).toEqual({ id: true, name: true })
  })

  it('keeps in-memory preferences usable when persistence fails', () => {
    Object.defineProperty(window.localStorage, 'setItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      },
    })
    const { result } = renderHook(() =>
      useTablePreferences({
        columnIds: ['id', 'name'],
        tableKey: 'connection:accounts',
      }),
    )

    act(() => {
      result.current.setColumnVisibility({ id: true, name: false })
    })

    expect(result.current.columnVisibility).toEqual({ id: true, name: false })
  })
})
