import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { contextMenuItem } from '@/lib/registry'

import ContextMenuContent from './page.mdx'

describe('Context Menu documentation', () => {
  it('renders each context menu scenario with the standard trigger presentation', () => {
    render(
      <ComponentPage item={contextMenuItem}>
        <ContextMenuContent />
      </ComponentPage>,
    )

    expect(screen.getAllByText('Right click here')).toHaveLength(3)
  })

  it('renders an interactive default scenario', () => {
    render(
      <ComponentPage item={contextMenuItem}>
        <ContextMenuContent />
      </ComponentPage>,
    )

    const defaultTrigger = screen.getAllByText('Right click here')[0]
    if (defaultTrigger === undefined) {
      throw new Error('Expected the default context menu trigger')
    }

    fireEvent.contextMenu(defaultTrigger)

    expect(screen.getByRole('menuitemcheckbox', { name: 'Show details' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Close tab' })).toBeTruthy()
  })

  it('renders disabled and submenu item scenarios', () => {
    render(
      <ComponentPage item={contextMenuItem}>
        <ContextMenuContent />
      </ComponentPage>,
    )

    const triggers = screen.getAllByText('Right click here')
    const disabledItemsTrigger = triggers[1]
    const submenuItemsTrigger = triggers[2]
    if (disabledItemsTrigger === undefined || submenuItemsTrigger === undefined) {
      throw new Error('Expected disabled-item and submenu context menu triggers')
    }

    fireEvent.contextMenu(disabledItemsTrigger)

    expect(
      screen.getByRole('menuitem', { name: 'Rename table' }).getAttribute('aria-disabled'),
    ).toBe('true')

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    fireEvent.contextMenu(submenuItemsTrigger)

    expect(screen.getByRole('menuitem', { name: 'Move column' })).toBeTruthy()
  })
})
