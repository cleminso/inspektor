import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlaygroundControls } from './playgroundControls'

afterEach(cleanup)

describe('PlaygroundControls', () => {
  it('associates a property label with its control', () => {
    const onChange = vi.fn()

    render(
      <PlaygroundControls
        controls={[{ kind: 'boolean', key: 'enabled', label: 'Enabled' }]}
        state={{ enabled: false }}
        onChange={onChange}
        onReset={() => undefined}
      />,
    )

    fireEvent.click(screen.getByText('Enabled'))

    expect(onChange).toHaveBeenCalledWith('enabled', true)
  })

  it('keeps labels on one line and lets the action use its content width', () => {
    render(
      <PlaygroundControls
        controls={[{ kind: 'select', key: 'orientation', label: 'Orientation', options: [] }]}
        state={{ orientation: 'horizontal' }}
        onChange={() => undefined}
        onReset={() => undefined}
      />,
    )

    expect(
      screen.getByText('Properties').parentElement?.parentElement?.getAttribute('style'),
    ).toContain('width: 100%;')
    expect(screen.getByText('Orientation').getAttribute('title')).toBe('Orientation')
    expect(screen.getByText('Orientation').parentElement?.getAttribute('style')).toContain(
      'flex: 1 1 0px;',
    )
    expect(screen.getByRole('combobox').parentElement?.getAttribute('style')).not.toContain(
      'flex: 1 1 0px;',
    )
  })
})
