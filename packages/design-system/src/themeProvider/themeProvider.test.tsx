import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { useTheme } from 'next-themes'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from './themeProvider'

function ThemeValue(): React.ReactElement {
  const { theme } = useTheme()
  return <output>{theme}</output>
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => true,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } satisfies MediaQueryList
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
})

describe('ThemeProvider', () => {
  it('restores its persisted theme when a document returns from history', async () => {
    window.localStorage.setItem('test-theme', 'light')
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="test-theme"
      >
        <ThemeValue />
      </ThemeProvider>,
    )
    expect(await screen.findByText('light')).toBeDefined()

    window.localStorage.setItem('test-theme', 'dark')
    const event = new Event('pageshow')
    Object.defineProperty(event, 'persisted', { value: true })
    window.dispatchEvent(event)

    await waitFor(() => {
      expect(screen.getByText('dark')).toBeDefined()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('preserves the current theme when no persisted theme exists', async () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="test-theme"
      >
        <ThemeValue />
      </ThemeProvider>,
    )
    expect(await screen.findByText('light')).toBeDefined()

    const event = new Event('pageshow')
    Object.defineProperty(event, 'persisted', { value: true })
    window.dispatchEvent(event)

    expect(screen.getByText('light')).toBeDefined()
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})
