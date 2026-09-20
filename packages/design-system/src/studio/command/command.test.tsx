import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Command } from './command'

afterEach(cleanup)

const items = [
  { description: 'User identifier', keywords: ['primary key'], label: 'id' },
  { description: 'Display name', keywords: ['profile'], label: 'name' },
]

function CommandList({ onSelect = vi.fn() }: { onSelect?: (value: string) => void }) {
  return (
    <Command.Root items={items} itemToStringLabel={(item) => item.label}>
      <Command.Input aria-label="Filter columns" placeholder="Search columns" />
      <Command.List>
        <Command.Empty>No columns found.</Command.Empty>
        {items.map((item) => (
          <Command.Item key={item.label} value={item} onClick={() => onSelect(item.label)}>
            <Command.ItemText label={item.label} description={item.description} />
          </Command.Item>
        ))}
      </Command.List>
    </Command.Root>
  )
}

describe('Command', () => {
  it('exposes value labels and descriptions while preserving explicit accessible names', () => {
    render(
      <Command.Root items={items} itemToStringLabel={(item) => item.label}>
        <Command.Input aria-label="Filter columns" />
        <span id="command-item-detail">Primary key</span>
        <span id="command-item-label">Profile name</span>
        <Command.List>
          <Command.Item value={items[0]} aria-describedby="command-item-detail">
            <Command.ItemText label="id" description="Rendered detail" />
          </Command.Item>
          <Command.Item
            value={items[1]}
            aria-label="Name override"
            aria-labelledby="command-item-label"
          >
            <Command.ItemText label="name" />
          </Command.Item>
        </Command.List>
      </Command.Root>,
    )

    screen.getByRole('option', {
      name: 'id',
      description: 'Primary key User identifier',
    })

    expect(
      screen
        .getByRole('option', { name: 'Profile name', description: 'Display name' })
        .getAttribute('aria-label'),
    ).toBe('Name override')
  })

  it.each(['ID', 'identifier', 'PRIMARY'])(
    'filters labels, descriptions, and keywords for %s',
    (query) => {
      render(<CommandList />)
      const input = screen.getByRole('combobox', { name: 'Filter columns' })

      fireEvent.change(input, { target: { value: query } })

      expect(
        screen.getByRole('option', { name: 'id', description: 'User identifier' }),
      ).toBeTruthy()
      expect(screen.queryByRole('option', { name: 'name' })).toBeNull()
    },
  )

  it('uses substring matching for non-Latin text', () => {
    const localizedItems = [{ label: '東京テーブル' }, { label: '大阪テーブル' }]
    render(
      <Command.Root items={localizedItems} itemToStringLabel={(item) => item.label}>
        <Command.Input aria-label="Filter tables" />
        <Command.List>
          {localizedItems.map((item) => (
            <Command.Item key={item.label} value={item}>
              {item.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command.Root>,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '東京' } })

    expect(screen.getByRole('option', { name: '東京テーブル' })).toBeTruthy()
    expect(screen.queryByRole('option', { name: '大阪テーブル' })).toBeNull()
  })

  it('does not select before explicit keyboard navigation when auto highlighting is disabled', () => {
    const onSelect = vi.fn()
    render(
      <Command.Root autoHighlight={false} items={items} itemToStringLabel={(item) => item.label}>
        <Command.Input aria-label="Filter columns" />
        <Command.List>
          {items.map((item) => (
            <Command.Item key={item.label} value={item} onClick={() => onSelect(item.label)}>
              {item.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command.Root>,
    )
    const input = screen.getByRole('combobox', { name: 'Filter columns' })

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('id')
  })

  it('matches exact operator glyph aliases without including compound operators', () => {
    const operatorItems = [
      { label: 'Equals', keywords: ['=', '=='] },
      { label: 'Greater than or equal', keywords: ['>='] },
    ]
    render(
      <Command.Root items={operatorItems} itemToStringLabel={(item) => item.label}>
        <Command.Input aria-label="Filter operators" />
        <Command.List>
          {operatorItems.map((item) => (
            <Command.Item key={item.label} value={item}>
              {item.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command.Root>,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '=' } })

    expect(screen.getByRole('option', { name: 'Equals' })).toBeTruthy()
    expect(screen.queryByRole('option', { name: 'Greater than or equal' })).toBeNull()
  })

  it('provides a close action and restores trigger focus', async () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Add filter
          </button>
          <Command.Dialog open={open} onOpenChange={setOpen}>
            <Command.Title>Choose a column</Command.Title>
            <CommandList />
            <Command.Close />
          </Command.Dialog>
        </>
      )
    }

    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Add filter' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(await screen.findByRole('dialog', { name: 'Choose a column' })).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox')))
    fireEvent.click(screen.getByRole('button', { name: 'Close command palette' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})
