import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InputGroupPlayground, serializeInputGroupPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('InputGroup playground', () => {
  it('serializes a constrained affix composition without default root props', () => {
    const source = serializeInputGroupPlayground({
      size: 'm',
      fullWidth: false,
      disabled: false,
      invalid: false,
      prefix: true,
      suffix: true,
    })

    expect(source).toContain('<InputGroup>')
    expect(source).toContain('<InputGroup.Prefix>https://</InputGroup.Prefix>')
    expect(source).toContain('<InputGroup.Suffix>.com</InputGroup.Suffix>')
    expect(source).not.toContain('size="m"')
  })

  it('updates and resets the compound preview and source', () => {
    const { container } = render(<InputGroupPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Code' }))

    expect((screen.getByRole('textbox', { name: 'Domain' }) as HTMLInputElement).disabled).toBe(
      true,
    )
    expect(container.querySelector('pre')?.textContent).toContain('disabled')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))

    expect((screen.getByRole('textbox', { name: 'Domain' }) as HTMLInputElement).disabled).toBe(
      false,
    )
    expect(container.querySelector('pre')?.textContent).not.toContain('disabled')
  })
})
