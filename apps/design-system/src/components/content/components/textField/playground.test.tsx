import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { serializeTextFieldPlayground, TextFieldPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('TextField playground', () => {
  it('serializes only the selected TextField options', () => {
    const source = serializeTextFieldPlayground({
      required: false,
      disabled: false,
      invalid: false,
      fullWidth: true,
      description: true,
      error: false,
    })

    expect(source).toContain('description="Sync server that stores your app data."')
    expect(source).not.toContain('required')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('fullWidth')
  })

  it('uses one state for preview, source, and reset', () => {
    const { container } = render(<TextFieldPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Required' }))
    fireEvent.click(screen.getByRole('button', { name: 'Code' }))

    expect((screen.getByRole('textbox', { name: 'Server URL' }) as HTMLInputElement).required).toBe(
      true,
    )
    expect(container.querySelector('pre')?.textContent).toContain('required')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))

    expect((screen.getByRole('textbox', { name: 'Server URL' }) as HTMLInputElement).required).toBe(
      false,
    )
    expect(container.querySelector('pre')?.textContent).not.toContain('required')
  })
})
