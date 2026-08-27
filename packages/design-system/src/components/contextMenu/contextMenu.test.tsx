import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ContextMenu } from './contextMenu'

afterEach(cleanup)

describe('ContextMenu', () => {
  it('owns its bounded popup and item presentation', () => {
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Canvas</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.LinkItem href="/record/1">
            <ContextMenu.Prefix>Record</ContextMenu.Prefix>
            Open
            <ContextMenu.Suffix>New tab</ContextMenu.Suffix>
          </ContextMenu.LinkItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    )

    expect(screen.getByRole('menu').getAttribute('data-scrollbar')).toBe('standard')
    const link = screen.getByRole('menuitem', { name: 'Open' })
    expect(link.querySelectorAll("[data-slot^='context-menu-']")).toHaveLength(2)
  })
})
