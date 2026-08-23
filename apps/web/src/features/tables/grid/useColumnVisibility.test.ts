// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useColumnVisibility } from '@tables/grid/useColumnVisibility'

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

describe('useColumnVisibility', () => {
  it('exposes persisted visibility without a default-visible render', () => {
    window.localStorage.setItem(
      'inspector:column-visibility:connection:accounts',
      JSON.stringify({ name: false }),
    )
    const renderedVisibility: Record<string, boolean>[] = []

    renderHook(() => {
      const result = useColumnVisibility({
        columnIds: ['id', 'name'],
        tableKey: 'connection:accounts',
      })
      renderedVisibility.push(result.columnVisibility)
      return result
    })

    expect(renderedVisibility[0]).toEqual({ id: true, name: false })
  })

  it('persists visibility changes while retaining known columns', () => {
    const { result } = renderHook(() =>
      useColumnVisibility({
        columnIds: ['id', 'name'],
        tableKey: 'connection:accounts',
      }),
    )

    act(() => {
      result.current.setColumnVisibility({ name: false })
    })

    expect(result.current.columnVisibility).toEqual({ id: true, name: false })
    expect(window.localStorage.getItem('inspector:column-visibility:connection:accounts')).toBe(
      JSON.stringify({ id: true, name: false }),
    )
  })

  it('falls back to visible columns when storage cannot be read', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('Storage unavailable')
        },
      },
    })

    const { result } = renderHook(() =>
      useColumnVisibility({
        columnIds: ['id', 'name'],
        tableKey: 'connection:accounts',
      }),
    )

    expect(result.current.columnVisibility).toEqual({ id: true, name: true })
  })

  it('keeps visibility changes when storage cannot be written', () => {
    Object.defineProperty(window.localStorage, 'setItem', {
      configurable: true,
      value: () => {
        throw new Error('Storage unavailable')
      },
    })
    const { result } = renderHook(() =>
      useColumnVisibility({
        columnIds: ['id', 'name'],
        tableKey: 'connection:accounts',
      }),
    )

    act(() => {
      result.current.setColumnVisibility({ name: false })
    })

    expect(result.current.columnVisibility).toEqual({ id: true, name: false })
  })
})
