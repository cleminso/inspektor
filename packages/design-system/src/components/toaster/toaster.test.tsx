import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { backgroundColors, textColors } from '../../tokens/semantics.stylex'
import { spacing } from '../../tokens/value.stylex'
import { Toaster, toasts } from './toaster'
import { toasterStyles } from './toaster.styles'
import { toasterVars } from './toasterVars.stylex'

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
    transform:
      `translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-offset-y) * -1 - var(--toast-index) * ${spacing.m} + var(--toast-swipe-movement-y)))`,
  },
})

const semanticStatusStyles = stylex.create({
  error: {
    [toasterVars.actionBackground]: backgroundColors['bg-danger'],
    backgroundColor: backgroundColors['bg-danger'],
    boxShadow: 'none',
    color: textColors['fg-danger'],
  },
  success: {
    [toasterVars.actionBackground]: backgroundColors['bg-success'],
    backgroundColor: backgroundColors['bg-success'],
    boxShadow: 'none',
    color: textColors['fg-success'],
  },
  warning: {
    [toasterVars.actionBackground]: backgroundColors['bg-warning'],
    backgroundColor: backgroundColors['bg-warning'],
    boxShadow: 'none',
    color: textColors['fg-warning'],
  },
  action: {
    backgroundColor: toasterVars.actionBackground,
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
    expect(closeButton?.className).toContain(stylex.props(toasterStyles.close).className)
  })

  it('uses semantic status surfaces without leading icons', async () => {
    render(<Toaster />)

    toasts.error('Danger notification', { preserve: true, undo: () => undefined })
    toasts.warning('Warning notification', { preserve: true })
    toasts.success('Success notification', { preserve: true })

    const errorToast = (await screen.findByText('Danger notification')).closest(
      '[data-slot="toast"]',
    )
    const warningToast = screen.getByText('Warning notification').closest('[data-slot="toast"]')
    const successToast = screen.getByText('Success notification').closest('[data-slot="toast"]')
    const action = screen.getByRole('button', { name: 'Undo' })

    expectStyleClasses(errorToast, stylex.props(semanticStatusStyles.error).className)
    expectStyleClasses(warningToast, stylex.props(semanticStatusStyles.warning).className)
    expectStyleClasses(successToast, stylex.props(semanticStatusStyles.success).className)
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

  it('deduplicates matching notifications and replays the pulse', async () => {
    expect(stylex.props(toasterStyles.pulseOdd).className).not.toBe(
      stylex.props(toasterStyles.pulseEven).className,
    )

    render(<Toaster />)

    toasts.success('Draft saved', { preserve: true })

    const toast = (await screen.findByText('Draft saved')).closest('[data-slot="toast"]')
    expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1)
    expect(toast?.className).not.toContain(stylex.props(toasterStyles.pulseOdd).className)

    toasts.success('Draft saved', { preserve: true })

    await waitFor(() => {
      expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1)
      expect(toast?.className).toContain(stylex.props(toasterStyles.pulseOdd).className)
    })

    toasts.success('Draft saved', { preserve: true })

    await waitFor(() => {
      expect(toast?.className).toContain(stylex.props(toasterStyles.pulseEven).className)
    })
  })

  it('keeps matching notifications separate when they have distinct ids', async () => {
    render(<Toaster />)

    toasts.message('Export complete', { id: 'first', preserve: true })
    toasts.message('Export complete', { id: 'second', preserve: true })

    await screen.findAllByText('Export complete')
    expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(2)
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
