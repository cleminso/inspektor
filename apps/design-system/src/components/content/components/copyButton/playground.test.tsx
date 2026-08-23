import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CopyButtonPlayground, serializeCopyButtonPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Copy Button playground', () => {
  it('serializes the initial copy action without redundant defaults', () => {
    const source = serializeCopyButtonPlayground({
      variant: 'ghost',
      size: 's',
      tooltipSide: 'top',
      disabled: false,
    })

    expect(source).toContain('import { Box, CopyButton, Text } from "@inspector/ds";')
    expect(source).toContain('const schemaHash = "sha256:41f17cc82ca";')
    expect(source).toContain('<Box alignItems="center" gap="xs">')
    expect(source).toContain('<Text as="code" monospace>')
    expect(source).toContain('<CopyButton textToCopy={schemaHash} label="Copy schema hash" />')
  })

  it('updates the preview and source from the disabled control', () => {
    const { container } = render(<CopyButtonPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(
      (screen.getByRole('button', { name: 'Copy schema hash' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(container.querySelector('pre')?.textContent).toContain('disabled')
  })

  it('resets the preview and source', () => {
    const { container } = render(<CopyButtonPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(
      (screen.getByRole('button', { name: 'Copy schema hash' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(container.querySelector('pre')?.textContent).not.toContain('disabled')
  })
})
