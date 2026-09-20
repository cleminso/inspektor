import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

class ResizeObserverStub implements ResizeObserver {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

const mediaQueries = new Map<string, TestMediaQueryList>()
let viewportWidth = 1024

class TestMediaQueryList extends EventTarget implements MediaQueryList {
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null = null

  constructor(readonly media: string) {
    super()
  }

  get matches(): boolean {
    const minWidth = /\(min-width:\s*(\d+)px\)/.exec(this.media)?.[1]
    return minWidth === undefined || viewportWidth >= Number.parseInt(minWidth, 10)
  }

  addListener(
    callback: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null,
  ): void {
    if (callback !== null) {
      this.addEventListener('change', callback as EventListener)
    }
  }

  removeListener(
    callback: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null,
  ): void {
    if (callback !== null) {
      this.removeEventListener('change', callback as EventListener)
    }
  }
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string): MediaQueryList => {
    const existing = mediaQueries.get(query)
    if (existing !== undefined) {
      return existing
    }

    const mediaQuery = new TestMediaQueryList(query)
    mediaQueries.set(query, mediaQuery)
    return mediaQuery
  },
  writable: true,
})

globalThis.ResizeObserver ??= ResizeObserverStub

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
  writable: true,
})

export function setViewportWidth(width: number): void {
  const previousMatches = new Map(
    Array.from(mediaQueries, ([query, mediaQuery]) => [query, mediaQuery.matches]),
  )
  viewportWidth = width

  for (const [query, mediaQuery] of mediaQueries) {
    if (previousMatches.get(query) !== mediaQuery.matches) {
      mediaQuery.dispatchEvent(new Event('change'))
    }
  }
}

afterEach(() => {
  cleanup()
  setViewportWidth(1024)
})
