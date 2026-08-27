import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Combobox } from './combobox'

afterEach(cleanup)

describe('Combobox', () => {
  it('uses the standard treatment on its scrolling viewport', () => {
    const { container } = render(
      <Combobox.Root items={['main']} defaultOpen>
        <Combobox.Input aria-label="Branch" />
        <Combobox.Content keepMounted>
          <Combobox.Viewport>
            <Combobox.List>
              <Combobox.Item value="main">main</Combobox.Item>
            </Combobox.List>
          </Combobox.Viewport>
        </Combobox.Content>
      </Combobox.Root>,
    )

    expect(
      container.ownerDocument
        .querySelector('[data-slot="combobox-viewport"]')
        ?.getAttribute('data-scrollbar'),
    ).toBe('standard')
  })

  it('keeps the input as the generic combobox control', () => {
    render(
      <Combobox.Root items={['main']}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Branch" />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content>
          <Combobox.List>
            <Combobox.Item value="main">main</Combobox.Item>
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>,
    )

    expect(screen.getByRole('combobox', { name: 'Branch' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open options' }).tabIndex).toBe(-1)
  })

  it('does not render a chevron icon in the generic trigger', () => {
    const { container } = render(
      <Combobox.Root items={[]}>
        <Combobox.Trigger>Open connection</Combobox.Trigger>
      </Combobox.Root>,
    )

    expect(container.querySelector('[data-slot="combobox-chevron"]')).toBeNull()
  })

  it('moves focus-visible state to the compound input group', () => {
    render(
      <Combobox.Root items={[]}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Branch" />
        </Combobox.InputGroup>
      </Combobox.Root>,
    )
    const input = screen.getByRole('combobox', { name: 'Branch' })
    const group = input.closest('[data-slot="combobox-input-group"]')
    vi.spyOn(input, 'matches').mockReturnValue(true)

    fireEvent.focus(input)
    expect(group?.getAttribute('data-focus-visible')).toBe('')

    fireEvent.blur(input)
    expect(group?.getAttribute('data-focus-visible')).toBe(null)
  })
})
