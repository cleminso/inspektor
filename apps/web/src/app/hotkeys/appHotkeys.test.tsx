import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useMemo } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider, useAppCommandPalette, useAppCommands } from './appHotkeys'

afterEach(cleanup)

describe('AppHotkeysProvider', () => {
  it('opens the command palette with Mod+K from an input and executes a registered command', async () => {
    const perform = vi.fn()

    function RegisteredCommands(): React.ReactElement {
      const commands = useMemo(
        () => [
          {
            id: 'test-command',
            label: 'Run test command',
            description: 'Verify the command palette',
            hotkey: 'Mod+B' as const,
            perform,
          },
        ],
        [],
      )
      useAppCommands(commands)
      return <input aria-label="Page input" />
    }

    render(
      <AppHotkeysProvider>
        <RegisteredCommands />
      </AppHotkeysProvider>,
    )

    const pageInput = screen.getByRole('textbox', { name: 'Page input' })
    pageInput.focus()
    fireEvent.keyDown(pageInput, { key: 'k', ctrlKey: true })

    expect(await screen.findByRole('dialog', { name: 'Commands' })).toBeTruthy()
    const option = screen.getByRole('option', {
      name: 'Run test command',
      description: 'Verify the command palette',
    })
    expect(screen.getByLabelText('Ctrl+B').getAttribute('data-variant')).toBe('default')

    fireEvent.click(option)

    expect(perform).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Commands' })).toBeNull())
  })

  it('shows an empty state when the current route has no commands', async () => {
    render(
      <AppHotkeysProvider>
        <div>Content</div>
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(await screen.findByText('No commands available.')).toBeTruthy()
  })

  it('does not open the command palette while text composition is active', () => {
    render(
      <AppHotkeysProvider>
        <input aria-label="Composing input" />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Composing input' }), {
      key: 'k',
      ctrlKey: true,
      isComposing: true,
    })

    expect(screen.queryByRole('dialog', { name: 'Commands' })).toBeNull()
  })

  it('does not open the command palette over another modal interaction', () => {
    render(
      <AppHotkeysProvider>
        <div role="alertdialog" aria-label="Confirm changes">
          <button type="button">Keep editing</button>
        </div>
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Keep editing' }), {
      key: 'k',
      ctrlKey: true,
    })

    expect(screen.queryByRole('dialog', { name: 'Commands' })).toBeNull()
  })

  it('does not open the command palette from a combobox with a portaled listbox', () => {
    render(
      <AppHotkeysProvider>
        <input
          role="combobox"
          aria-label="Filter column"
          aria-controls="filter-columns"
          aria-expanded="true"
        />
        <div id="filter-columns" role="listbox" aria-label="Filter columns" />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Filter column' }), {
      key: 'k',
      ctrlKey: true,
    })

    expect(screen.queryByRole('dialog', { name: 'Commands' })).toBeNull()
  })

  it('exposes a pointer-accessible command palette action', async () => {
    function PaletteTrigger(): React.ReactElement {
      const { open } = useAppCommandPalette()
      return <button onClick={open}>Open commands</button>
    }

    render(
      <AppHotkeysProvider>
        <PaletteTrigger />
      </AppHotkeysProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open commands' }))

    expect(await screen.findByRole('dialog', { name: 'Commands' })).toBeTruthy()
  })

  it('shows navigation and selection guidance together without close guidance', async () => {
    render(
      <AppHotkeysProvider>
        <div>Content</div>
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    await screen.findByText('Navigate')

    expect(document.querySelector('[data-slot="command-footer"]')?.textContent).toBe(
      '↑ ↓ NavigateEnter Select',
    )
  })
})
