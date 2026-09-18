import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeSwitch } from './themeSwitch'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ThemeSwitch', () => {
  it('requests the destination theme with matching accessible copy', () => {
    const onThemeChange = vi.fn()

    render(<ThemeSwitch theme="light" onThemeChange={onThemeChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(onThemeChange).toHaveBeenCalledWith('dark')
  })

  it('requests the light theme from the dark theme', () => {
    const onThemeChange = vi.fn()

    render(<ThemeSwitch theme="dark" onThemeChange={onThemeChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(onThemeChange).toHaveBeenCalledWith('light')
  })

  it('finishes the outgoing icon before entering the destination icon', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(
      <ThemeSwitch theme="light" onThemeChange={() => undefined} />,
    )
    const getIcon = () => container.querySelector<HTMLElement>('[data-slot="theme-switch-icon"]')

    expect(getIcon()?.dataset.themeIcon).toBe('moon')

    rerender(<ThemeSwitch theme="dark" onThemeChange={() => undefined} />)

    expect(getIcon()?.dataset.animationPhase).toBe('exiting')
    expect(getIcon()?.dataset.themeIcon).toBe('moon')

    act(() => vi.advanceTimersByTime(200))

    expect(getIcon()?.dataset.animationPhase).toBe('entering')
    expect(getIcon()?.dataset.themeIcon).toBe('sun')

    act(() => vi.advanceTimersByTime(200))

    expect(getIcon()?.dataset.animationPhase).toBe('idle')
  })

  it('animates toward the latest theme during a rapid reversal', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(
      <ThemeSwitch theme="light" onThemeChange={() => undefined} />,
    )
    const getIcon = () => container.querySelector<HTMLElement>('[data-slot="theme-switch-icon"]')

    rerender(<ThemeSwitch theme="dark" onThemeChange={() => undefined} />)
    rerender(<ThemeSwitch theme="light" onThemeChange={() => undefined} />)

    act(() => vi.advanceTimersByTime(200))

    expect(getIcon()?.dataset.animationPhase).toBe('entering')
    expect(getIcon()?.dataset.themeIcon).toBe('moon')

    act(() => vi.advanceTimersByTime(200))

    expect(getIcon()?.dataset.animationPhase).toBe('idle')
  })

  it('updates immediately when reduced motion is requested', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    const { container, rerender } = render(
      <ThemeSwitch theme="light" onThemeChange={() => undefined} />,
    )

    rerender(<ThemeSwitch theme="dark" onThemeChange={() => undefined} />)

    const icon = container.querySelector<HTMLElement>('[data-slot="theme-switch-icon"]')
    expect(icon?.dataset.animationPhase).toBe('idle')
    expect(icon?.dataset.themeIcon).toBe('sun')
  })
})
