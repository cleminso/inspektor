import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '../button/button'
import { AlertDialog } from './alertDialog'

afterEach(cleanup)

describe('AlertDialog', () => {
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
