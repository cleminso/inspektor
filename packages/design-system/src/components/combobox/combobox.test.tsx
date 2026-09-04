import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Combobox } from './combobox'

afterEach(cleanup)

describe('Combobox', () => {
  it('exposes item text as a separate accessible name and description', () => {
    render(
      <Combobox.Root items={['main']} defaultOpen>
        <Combobox.Input aria-label="Branch" />
        <Combobox.Content>
          <Combobox.List>
            <Combobox.Item value="main" description="Default branch">
              main
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>,
    )

    screen.getByRole('option', { name: 'main', description: 'Default branch' })
  })

  it('preserves consumer item names', () => {
    render(
      <Combobox.Root items={['main', 'preview']} defaultOpen>
        <span id="preview-name">Preview branch</span>
        <Combobox.Input aria-label="Branch" />
        <Combobox.Content>
          <Combobox.List>
            <Combobox.Item value="main" description="Default branch" aria-label="Pinned branch">
              main
            </Combobox.Item>
            <Combobox.Item
              value="preview"
              description="Deploy preview"
              aria-labelledby="preview-name"
            >
              preview
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>,
    )

    expect(screen.getByRole('option', { name: 'Pinned branch' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Preview branch' })).toBeTruthy()
  })

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
})
