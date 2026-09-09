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

  it('labels a control group and its reset action', () => {
    render(
      <PlaygroundControls
        title="Primary action"
        controls={[{ kind: 'select', key: 'orientation', label: 'Orientation', options: [] }]}
        state={{ orientation: 'horizontal' }}
        onChange={() => undefined}
        onReset={() => undefined}
      />,
    )

    expect(screen.getByRole('group', { name: 'Primary action' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reset Primary action controls' })).toBeTruthy()
    expect(screen.getByText('Orientation').getAttribute('title')).toBe('Orientation')
    expect(screen.getByRole('combobox', { name: 'Orientation' })).toBeTruthy()
  })
})
