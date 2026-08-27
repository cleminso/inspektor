import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToggleGroup } from './toggleGroup'

afterEach(cleanup)

describe('ToggleGroup', () => {
  it('applies its shared default and compact size to root and items', () => {
    render(
      <>
        <ToggleGroup aria-label="Data view">
          <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
        </ToggleGroup>
        <ToggleGroup aria-label="Compact data view" size="s">
          <ToggleGroup.Item value="records">Records</ToggleGroup.Item>
        </ToggleGroup>
      </>,
    )

    expect(screen.getByRole('group', { name: 'Data view' }).getAttribute('data-size')).toBe('l')
    expect(screen.getByRole('button', { name: 'Tables' }).getAttribute('data-size')).toBe('l')
    expect(screen.getByRole('group', { name: 'Compact data view' }).getAttribute('data-size')).toBe(
      's',
    )
    expect(screen.getByRole('button', { name: 'Records' }).getAttribute('data-size')).toBe('s')
  })
})
