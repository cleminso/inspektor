import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toaster, toasts } from './toaster'
import { toasterStyles } from './toaster.styles'

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

  it('runs the constrained Undo action', async () => {
    const onUndo = vi.fn()

    render(<Toaster />)

    toasts.message('Row deleted', { undo: onUndo })

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))

    expect(onUndo).toHaveBeenCalledOnce()
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
