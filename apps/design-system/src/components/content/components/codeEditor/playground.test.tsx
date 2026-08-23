import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CodeEditorPlayground, serializeCodeEditorPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('CodeEditor playground', () => {
  it('omits inactive states from the initial source', () => {
    const source = serializeCodeEditorPlayground({
      expanded: false,
      invalid: false,
      disabled: false,
      readOnly: false,
    })

    expect(source).toContain('value={value}')
    expect(source).toContain('onValueChange={setValue}')
    expect(source).not.toContain('invalid\n')
    expect(source).not.toContain('disabled\n')
    expect(source).not.toContain('readOnly\n')
  })

  it('uses one state for the preview and displayed source', async () => {
    const { container } = render(<CodeEditorPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Invalid' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(
      (
        await screen.findByRole('textbox', { name: 'Account JSON' }, { timeout: 5_000 })
      ).getAttribute('aria-invalid'),
    ).toBe('true')
    expect(container.querySelector('pre')?.textContent).toContain('invalid')
  })
})
