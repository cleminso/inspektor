import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckboxPlayground, serializeCheckboxPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Checkbox playground', () => {
  it('omits package defaults from the initial source', () => {
    expect(
      serializeCheckboxPlayground({
        size: 'm',
        checked: false,
        indeterminate: false,
        disabled: false,
        readOnly: false,
      }),
    ).toBe(
      'import { Checkbox } from "@inspektor/ds";\n\nexport default function Example() {\n  return <Checkbox aria-label="Notifications" />;\n}',
    )
  })

  it('uses one state for the preview and source, then resets it', () => {
    const { container } = render(<CheckboxPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Indeterminate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))
    expect(
      screen.getByRole('checkbox', { name: 'Notifications' }).getAttribute('data-indeterminate'),
    ).not.toBeNull()
    expect(container.querySelector('pre')?.textContent).toContain('indeterminate')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    expect(
      screen.getByRole('checkbox', { name: 'Notifications' }).getAttribute('data-indeterminate'),
    ).toBeNull()
    expect(container.querySelector('pre')?.textContent).not.toContain('indeterminate')
  })
})
