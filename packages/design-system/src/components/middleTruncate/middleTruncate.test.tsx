import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MiddleTruncate } from './middleTruncate'
import { getMiddleTruncatePreview } from './middleTruncateValue'

let restoreDocumentFonts: (() => void) | null = null

function mockDocumentFonts() {
  const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')
  const listeners = new Set<EventListener>()
  const fontSet = {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'loadingdone') {
        listeners.add(listener)
      }
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'loadingdone') {
        listeners.delete(listener)
      }
    }),
  }
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: fontSet,
  })
  restoreDocumentFonts = () => {
    if (originalDescriptor === undefined) {
      Reflect.deleteProperty(document, 'fonts')
    } else {
      Object.defineProperty(document, 'fonts', originalDescriptor)
    }
  }

  return {
    dispatchLoadingDone: () => {
      const event = new Event('loadingdone')
      for (const listener of listeners) {
        listener(event)
      }
    },
    fontSet,
  }
}

afterEach(() => {
  cleanup()
  restoreDocumentFonts?.()
  restoreDocumentFonts = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('getMiddleTruncatePreview', () => {
  it('keeps the complete value when it fits', () => {
    expect(getMiddleTruncatePreview('accounts', 100, (candidate) => candidate.length * 10)).toBe(
      'accounts',
    )
  })

  it('retains only complete measured graphemes around the ellipsis', () => {
    const value = 'ábcdefghij'
    const measure = (candidate: string) =>
      Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(candidate))
        .length * 10

    expect(getMiddleTruncatePreview(value, 80, measure)).toBe('ábc…hij')
  })

  it('hides the visual preview when even the ellipsis does not fit', () => {
    expect(getMiddleTruncatePreview('accounts', 5, (candidate) => candidate.length * 10)).toBe('')
  })
})

describe('MiddleTruncate', () => {
  it('remeasures complete graphemes after font and container width changes', () => {
    const fonts = mockDocumentFonts()
    let availableWidth = 130
    let graphemeWidth = 5
    let resizeCallback: ResizeObserverCallback = () => undefined
    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }
      disconnect = vi.fn()
      observe = vi.fn()
      unobserve = vi.fn()
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const width =
          this.dataset.slot === 'middle-truncate'
            ? availableWidth
            : this.dataset.slot === 'middle-truncate-measurement'
              ? Array.from(
                  new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
                    this.textContent ?? '',
                  ),
                ).length * graphemeWidth
              : 0
        return {
          bottom: 0,
          height: 0,
          left: 0,
          right: width,
          top: 0,
          width,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }
      },
    )

    const { container, unmount } = render(<MiddleTruncate value="better_auth_verification" />)
    const root = container.querySelector('[data-slot="middle-truncate"]')
    const preview = container.querySelector('[data-slot="middle-truncate-preview"]')
    const accessibleValue = container.querySelector(
      '[data-slot="middle-truncate-accessible-value"]',
    )

    expect(preview?.textContent).toBe('better_auth_verification')
    expect(accessibleValue?.textContent).toBe('better_auth_verification')

    graphemeWidth = 10
    act(() => fonts.dispatchLoadingDone())
    expect(preview?.textContent).toBe('better…ation')

    availableWidth = 300
    act(() => {
      resizeCallback([{ target: root } as ResizeObserverEntry], {} as ResizeObserver)
    })
    expect(preview?.textContent).toBe('better_auth_verification')

    unmount()
    expect(fonts.fontSet.removeEventListener).toHaveBeenCalledOnce()
  })
})
