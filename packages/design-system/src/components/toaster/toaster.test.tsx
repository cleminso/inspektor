import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toaster, toasts } from './toaster'

afterEach(cleanup)

describe('Toaster', () => {
  it('renders a polite neutral message with the Base UI renderer', async () => {
    render(<Toaster />)

    toasts.message('Row inserted')

    expect(await screen.findByText('Row inserted')).not.toBeNull()
    const notificationRegion = screen.getByLabelText('Notifications')
    const toast = (await screen.findByText('Row inserted')).closest('[data-slot="toast"]')

    expect(notificationRegion.getAttribute('role')).toBe('region')
    expect(toast?.getAttribute('data-status')).toBe('message')
  })

  it('automatically closes a brief notification', async () => {
    vi.useFakeTimers()

    try {
      render(<Toaster />)
      toasts.success('Cell value copied', { duration: 'brief' })

      await act(async () => undefined)
      act(() => vi.advanceTimersByTime(1_499))
      expect(screen.queryByText('Cell value copied')).not.toBeNull()

      act(() => vi.advanceTimersByTime(1))
      act(() => vi.runAllTimers())
      expect(screen.queryByText('Cell value copied')).toBeNull()
    } finally {
      toasts.dismiss()
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })

  it('keeps brief timing off warnings and notifications with supporting content', async () => {
    vi.useFakeTimers()

    try {
      render(<Toaster />)
      toasts.warning('Schema changed', { duration: 'brief' })
      toasts.success('Row deleted', { duration: 'brief', undo: vi.fn() })
      toasts.success('Import complete', { description: 'Review imported rows', duration: 'brief' })

      await act(async () => undefined)
      act(() => vi.advanceTimersByTime(1_500))

      expect(screen.getByText('Schema changed')).toBeTruthy()
      expect(screen.getByText('Row deleted')).toBeTruthy()
      expect(screen.getByText('Import complete')).toBeTruthy()
    } finally {
      toasts.dismiss()
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })

  it('presents supporting content and controls in the Inspector toast structure', async () => {
    render(<Toaster />)

    toasts.error('Couldn’t insert row', {
      description: 'Review the values and try again',
      undo: () => undefined,
    })

    const title = await screen.findByText('Couldn’t insert row')
    const description = screen.getByText('Review the values and try again')
    const action = screen.getByRole('button', { name: 'Undo' })
    const close = document.querySelector<HTMLButtonElement>('[aria-label="Dismiss notification"]')
    const header = title.parentElement

    expect(close).not.toBeNull()
    expect(header?.contains(action)).toBe(true)
    expect(header?.contains(close)).toBe(true)
    expect(header?.contains(description)).toBe(false)
    expect(header?.nextElementSibling).toBe(description)
    expect(document.querySelector('[data-slot="toast-icon"]')).toBeNull()
  })

  it('runs the constrained Undo action', async () => {
    const onUndo = vi.fn()

    render(<Toaster />)

    toasts.message('Row deleted', { undo: onUndo })

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))

    expect(onUndo).toHaveBeenCalledOnce()
  })

  it('deduplicates matching notifications and pulses the mounted toast', async () => {
    const animatePulse = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation)
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animatePulse,
    })

    try {
      render(<Toaster />)

      toasts.success('Draft saved', { preserve: true })

      const toast = (await screen.findByText('Draft saved')).closest('[data-slot="toast"]')
      expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1)
      expect(animatePulse).not.toHaveBeenCalled()

      toasts.success('Draft saved', { preserve: true })

      await waitFor(() => {
        expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1)
        expect(animatePulse).toHaveBeenCalledOnce()
      })
      expect(toast).toBe(screen.getByText('Draft saved').closest('[data-slot="toast"]'))
    } finally {
      if (originalAnimate === undefined) {
        delete (HTMLElement.prototype as Partial<HTMLElement>).animate
      } else {
        Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
      }
    }
  })

  it('does not pulse matching notifications when reduced motion is requested', async () => {
    const animatePulse = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation)
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
    const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animatePulse,
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true }) as MediaQueryList),
    })

    try {
      render(<Toaster />)

      toasts.success('Draft saved', { preserve: true })
      await screen.findByText('Draft saved')
      toasts.success('Draft saved', { preserve: true })

      await waitFor(() => {
        expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1)
      })
      expect(animatePulse).not.toHaveBeenCalled()
    } finally {
      if (originalAnimate === undefined) {
        delete (HTMLElement.prototype as Partial<HTMLElement>).animate
      } else {
        Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
      }
      if (originalMatchMedia === undefined) {
        delete (window as Partial<Window>).matchMedia
      } else {
        Object.defineProperty(window, 'matchMedia', originalMatchMedia)
      }
    }
  })

  it('keeps matching notifications separate when they have distinct ids', async () => {
    render(<Toaster />)

    toasts.message('Export complete', { id: 'first', preserve: true })
    toasts.message('Export complete', { id: 'second', preserve: true })

    await screen.findAllByText('Export complete')
    expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(2)
  })

  it('dismisses a notification by the id returned from an add method', async () => {
    render(<Toaster />)

    const id = toasts.message('Dismiss by returned id', { preserve: true })
    expect(await screen.findByText('Dismiss by returned id')).not.toBeNull()

    toasts.dismiss(id)

    await waitFor(() => {
      expect(screen.queryByText('Dismiss by returned id')).toBeNull()
    })
  })

  it('keeps promise identity while presenting loading, success, and error states', async () => {
    render(<Toaster />)

    let resolveSuccessfulPromise!: (value: string) => void
    const successfulPromise = new Promise<string>((resolve) => {
      resolveSuccessfulPromise = resolve
    })
    expect(
      toasts.promise(successfulPromise, {
        loading: 'Connecting',
        success: (environment) => `Connected to ${environment}`,
        error: 'Connection failed',
      }),
    ).toBe(successfulPromise)
    expect(
      (await screen.findByText('Connecting'))
        .closest('[data-slot="toast"]')
        ?.getAttribute('data-status'),
    ).toBe('loading')

    resolveSuccessfulPromise('production')
    await successfulPromise
    expect(
      (await screen.findByText('Connected to production'))
        .closest('[data-slot="toast"]')
        ?.getAttribute('data-status'),
    ).toBe('success')

    const error = new Error('Connection failed')
    const failedPromise = Promise.reject(error)
    expect(
      toasts.promise(failedPromise, {
        loading: 'Reconnecting',
        success: 'Connected',
        error: (reason) => (reason === error ? 'Connection failed' : 'Unexpected failure'),
      }),
    ).toBe(failedPromise)
    await expect(failedPromise).rejects.toBe(error)
    expect(
      (await screen.findByText('Connection failed'))
        .closest('[data-slot="toast"]')
        ?.getAttribute('data-status'),
    ).toBe('error')
  })
})
