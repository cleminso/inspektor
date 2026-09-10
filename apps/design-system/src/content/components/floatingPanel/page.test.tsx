import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { floatingPanelItem } from '@/lib/registry'

import FloatingPanelContent from './page.mdx'

describe('Floating Panel documentation', () => {
  it('reviews and applies pending account changes', () => {
    render(
      <ComponentPage item={floatingPanelItem}>
        <FloatingPanelContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeTruthy()
    expect(screen.getByText('3 changes staged')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Review pending changes' }))

    expect(screen.getByRole('region', { name: 'Affected rows' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Review pending changes' }).getAttribute('aria-expanded'),
    ).toBe('true')
    expect(screen.getByRole('button', { name: 'Pending updates, 2' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pending deletions, 1' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Undo: account_0003' }))

    expect(screen.getByText('2 changes staged')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Pending deletions, 1' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }))

    expect(screen.getByText('Changes applied')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Apply changes' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }))

    expect(screen.getByText('3 changes staged')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))

    expect(screen.getByRole('status').textContent).toBe('Changes discarded')
    expect(screen.queryByRole('complementary', { name: 'Pending changes' })).toBeNull()
  })
})
