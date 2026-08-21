import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { borderColors, surfaceColors, textColors } from '../../tokens/semantics.stylex'
import { spacing } from '../../tokens/value.stylex'
import { Toaster, toasts } from './toaster'
import { toasterStyles } from './toaster.styles'

const stackContractStyles = stylex.create({
  frontmostOrder: {
    zIndex: 3,
  },
  middleOrder: {
    zIndex: 2,
  },
  backOrder: {
    zIndex: 1,
  },
  expandedGap: {
    transform: `translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-offset-y) * -1 - var(--toast-index) * ${spacing.m} + var(--toast-swipe-movement-y)))`,
  },
})

const semanticStatusStyles = stylex.create({
  toast: {
    borderColor: borderColors.default,
    backgroundColor: surfaceColors.raised,
    color: textColors.default,
  },
  titleError: {
    color: textColors.danger,
  },
  titleSuccess: {
    color: textColors.success,
  },
  titleWarning: {
    color: textColors.warning,
  },
  action: {
    backgroundColor: surfaceColors.subtle,
    borderWidth: 0,
  },
})

function expectStyleClasses(element: Element | null, className: string | undefined) {
  for (const atomicClassName of className?.split(' ') ?? []) {
    expect(element?.className).toContain(atomicClassName)
  }
}

afterEach(async () => {
  toasts.dismiss()
  await new Promise((resolve) => window.setTimeout(resolve, 1_000))
  cleanup()
})

describe('Toaster', () => {
  it('renders a polite neutral message with the Base UI renderer', async () => {
    render(<Toaster />)

    toasts.message('Row inserted')

    expect(await screen.findByText('Row inserted')).not.toBeNull()
    const notificationRegion = screen.getByLabelText('Notifications')
    const toast = (await screen.findByText('Row inserted')).closest('[data-slot="toast"]')

    expect(notificationRegion.getAttribute('role')).toBe('region')
    expect(toast?.getAttribute('data-status')).toBe('message')
    expect(document.querySelector('[data-sonner-toaster]')).toBeNull()
  })

  it('automatically closes a brief notification', async () => {
    vi.useFakeTimers()

    try {
      render(<Toaster />)
      toasts.success('Cell value copied', { duration: 'brief' })

      await act(async () => undefined)
      const toast = screen.getByText('Cell value copied').closest('[data-slot="toast"]')

      act(() => vi.advanceTimersByTime(1_499))
      expect(toast?.hasAttribute('data-ending-style')).toBe(false)

      act(() => vi.advanceTimersByTime(1))
      expect(toast?.hasAttribute('data-ending-style')).toBe(true)
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

      expect(
        screen
          .getByText('Schema changed')
          .closest('[data-slot="toast"]')
          ?.hasAttribute('data-ending-style'),
      ).toBe(false)
      expect(
        screen
          .getByText('Row deleted')
          .closest('[data-slot="toast"]')
          ?.hasAttribute('data-ending-style'),
      ).toBe(false)
      expect(
        screen
          .getByText('Import complete')
          .closest('[data-slot="toast"]')
          ?.hasAttribute('data-ending-style'),
      ).toBe(false)
    } finally {
      toasts.dismiss()
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })

  it('renders the loading state used by promise notifications', async () => {
    render(<Toaster />)

    const pending = new Promise<never>(() => undefined)
    void toasts.promise(pending, {
      loading: 'Saving connection',
      success: 'Connection saved',
      error: 'Connection failed',
    })

    expect(
      (await screen.findByText('Saving connection'))
        .closest('[data-slot="toast"]')
        ?.getAttribute('data-status'),
    ).toBe('loading')
  })

  it('uses Inspector styles for descriptions and the close control', async () => {
    render(<Toaster />)

    toasts.error('Couldn’t insert row', { description: 'Review the values and try again' })

    const description = await screen.findByText('Review the values and try again')
    const closeButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="Dismiss notification"]',
    )

    expect(description.className).toContain(stylex.props(toasterStyles.description).className)
    expect(closeButton?.getAttribute('data-slot')).toBe('button')
    expect(closeButton?.getAttribute('data-variant')).toBe('ghost')
    expect(closeButton?.getAttribute('data-size')).toBe('s')
    expect(closeButton?.hasAttribute('data-icon-only')).toBe(true)
  })

  it('groups the title, Undo action, and close control above the description', async () => {
    render(<Toaster />)

    toasts.error('Couldn’t insert row', {
      description: 'Review the values and try again',
      undo: () => undefined,
    })

    const title = await screen.findByText('Couldn’t insert row')
    const description = screen.getByText('Review the values and try again')
    const action = screen.getByRole('button', { name: 'Undo' })
    const close = document.querySelector<HTMLButtonElement>(
      '[aria-label="Dismiss notification"]',
    )
    const header = title.parentElement

    expect(close).not.toBeNull()
    expect(header?.contains(action)).toBe(true)
    expect(header?.contains(close)).toBe(true)
    expect(header?.contains(description)).toBe(false)
    expect(header?.nextElementSibling).toBe(description)
  })

  it('uses a neutral surface and border with status color limited to the title', async () => {
    render(<Toaster />)

    toasts.error('Danger notification', { preserve: true, undo: () => undefined })
    toasts.warning('Warning notification', { preserve: true })
    toasts.success('Success notification', { preserve: true })

    const errorToast = (await screen.findByText('Danger notification')).closest(
      '[data-slot="toast"]',
    )
    const warningToast = screen.getByText('Warning notification').closest('[data-slot="toast"]')
    const successToast = screen.getByText('Success notification').closest('[data-slot="toast"]')
    const errorTitle = screen.getByText('Danger notification')
    const warningTitle = screen.getByText('Warning notification')
    const successTitle = screen.getByText('Success notification')
    const action = screen.getByRole('button', { name: 'Undo' })

    expectStyleClasses(errorToast, stylex.props(semanticStatusStyles.toast).className)
    expectStyleClasses(warningToast, stylex.props(semanticStatusStyles.toast).className)
    expectStyleClasses(successToast, stylex.props(semanticStatusStyles.toast).className)
    expectStyleClasses(errorTitle, stylex.props(semanticStatusStyles.titleError).className)
    expectStyleClasses(warningTitle, stylex.props(semanticStatusStyles.titleWarning).className)
    expectStyleClasses(successTitle, stylex.props(semanticStatusStyles.titleSuccess).className)
    expectStyleClasses(action, stylex.props(semanticStatusStyles.action).className)
    expect(document.querySelector('[data-slot="toast-icon"]')).toBeNull()
  })

  it('keeps the front toast above hidden content and spaces the expanded stack', async () => {
    render(<Toaster />)

    toasts.message('First notification', { preserve: true })
    toasts.message('Second notification', { preserve: true })
    toasts.message('Third notification', { preserve: true })

    await screen.findByText('Third notification')

    const viewport = screen.getByLabelText('Notifications')
    const toastElements = Array.from(viewport.querySelectorAll('[data-slot="toast"]'))
    const orderClassNames = [
      stylex.props(stackContractStyles.frontmostOrder).className,
      stylex.props(stackContractStyles.middleOrder).className,
      stylex.props(stackContractStyles.backOrder).className,
    ]
    const expandedGapClassName = stylex.props(stackContractStyles.expandedGap).className

    for (const [index, toast] of toastElements.entries()) {
      expect(toast.className).toContain(orderClassNames[index])
    }

    fireEvent.mouseEnter(viewport)

    await waitFor(() => {
      for (const toast of toastElements) {
        expect(toast.className).toContain(expandedGapClassName)
      }
    })
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

  it('updates a promise toast when its lifecycle completes', async () => {
    render(<Toaster />)

    await toasts.promise(Promise.resolve('production'), {
      loading: 'Connecting',
      success: (environment) => `Connected to ${environment}`,
      error: 'Connection failed',
    })

    expect(await screen.findByText('Connected to production')).not.toBeNull()
  })

  it('returns the original promise after registering a rejection handler', () => {
    const promise = Promise.reject(new Error('Connection failed'))

    expect(
      toasts.promise(promise, {
        loading: 'Connecting',
        success: 'Connected',
        error: 'Connection failed',
      }),
    ).toBe(promise)
  })
})
