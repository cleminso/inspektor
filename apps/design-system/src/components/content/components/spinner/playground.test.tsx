import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { serializeSpinnerPlayground, SpinnerPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Spinner playground', () => {
  it('omits the package default size from the initial source', () => {
    expect(serializeSpinnerPlayground({ size: 'm' })).toBe(
      'import { Spinner } from "@inspector/ds";\n\nexport default function Example() {\n  return <Spinner label="Loading" />;\n}',
    )
  })

  it('serializes a selected visual size', () => {
    expect(serializeSpinnerPlayground({ size: 'l' })).toContain('size="l"')
  })

  it('renders a reset control with the initial preview', () => {
    render(<SpinnerPlayground />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    expect(screen.getByRole('status', { name: 'Loading' })).not.toBeNull()
  })
})
