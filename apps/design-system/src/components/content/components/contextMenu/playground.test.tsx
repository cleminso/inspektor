import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContextMenuPlayground, serializeContextMenuPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('ContextMenu playground', () => {
  it('serializes a safe representative composition', () => {
    const source = serializeContextMenuPlayground({
      side: 'right',
      align: 'center',
      disabled: false,
      danger: true,
    })

    expect(source).toContain('import { ContextMenu } from "@inspektor/ds";')
    expect(source).toContain('<ContextMenu.Content side="right" align="center">')
    expect(source).toContain('<ContextMenu.Item variant="danger"')
  })

  it('updates serialized root state from curated controls', () => {
    const { container } = render(<ContextMenuPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))

    expect(container.querySelector('pre')?.textContent).toContain('<ContextMenu.Root disabled>')
  })
})
