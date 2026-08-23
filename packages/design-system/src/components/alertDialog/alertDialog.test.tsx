import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '../button/button'
import { AlertDialog } from './alertDialog'

afterEach(cleanup)

describe('AlertDialog', () => {
  it('provides alertdialog naming, description, and initial focus', async () => {
    render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete connection?</AlertDialog.Title>
          <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Cancel</AlertDialog.Close>
            <AlertDialog.Close render={<Button variant="danger" />}>Delete</AlertDialog.Close>
            <AlertDialog.Close disabled>Unavailable</AlertDialog.Close>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>,
    )

    const dialog = screen.getByRole('alertdialog', { name: 'Delete connection?' })
    expect(dialog.getAttribute('data-open')).toBe('')
    expect(dialog.getAttribute('aria-describedby')).toBe(
      screen.getByText('This action cannot be undone.').id,
    )
    expect(screen.getByRole('button', { name: 'Unavailable' }).getAttribute('data-disabled')).toBe(
      '',
    )
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' })),
    )
  })

  it('requests a controlled close without replacing controlled state', () => {
    const onOpenChange = vi.fn()
    render(
      <AlertDialog.Root open onOpenChange={onOpenChange}>
        <AlertDialog.Content>
          <AlertDialog.Title>Leave page?</AlertDialog.Title>
          <AlertDialog.Close>Stay</AlertDialog.Close>
        </AlertDialog.Content>
      </AlertDialog.Root>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }))

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press' }),
    )
    expect(screen.getByRole('alertdialog', { name: 'Leave page?' })).toBeTruthy()
  })

  it('preserves Escape dismissal', () => {
    render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Content>
          <AlertDialog.Title>Discard changes?</AlertDialog.Title>
          <AlertDialog.Close>Keep editing</AlertDialog.Close>
        </AlertDialog.Content>
      </AlertDialog.Root>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('restores focus after closing', async () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Delete
          </button>
          <AlertDialog.Root open={open} onOpenChange={setOpen}>
            <AlertDialog.Content>
              <AlertDialog.Title>Delete item?</AlertDialog.Title>
              <AlertDialog.Close>Cancel</AlertDialog.Close>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </>
      )
    }

    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Delete' })
    trigger.focus()
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('composes Close onto Button while preserving handlers, state, and refs', () => {
    const onClick = vi.fn()
    const ref = createRef<HTMLElement>()
    render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete item?</AlertDialog.Title>
          <AlertDialog.Close ref={ref} onClick={onClick} render={<Button variant="danger" />}>
            Delete
          </AlertDialog.Close>
        </AlertDialog.Content>
      </AlertDialog.Root>,
    )

    const close = screen.getByRole('button', { name: 'Delete' })
    expect(close.getAttribute('data-variant')).toBe('danger')
    expect(close.getAttribute('data-disabled')).toBeNull()
    expect(ref.current).toBe(close)

    fireEvent.click(close)
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})
