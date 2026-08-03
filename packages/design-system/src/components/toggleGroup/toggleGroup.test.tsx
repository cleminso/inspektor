import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToggleGroup } from './toggleGroup'

afterEach(cleanup)

describe('ToggleGroup', () => {
  it('reports selected items as pressed', () => {
    render(
      <ToggleGroup aria-label="Data view" defaultValue={['tables']}>
        <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
        <ToggleGroup.Item value="records">Records</ToggleGroup.Item>
      </ToggleGroup>,
    )

    expect(screen.getByRole('button', { name: 'Tables' }).getAttribute('data-pressed')).toBe('')
    expect(screen.getByRole('button', { name: 'Records' }).getAttribute('data-pressed')).toBeNull()
  })

  it('does not update an individually disabled item', () => {
    let changeCount = 0

    render(
      <ToggleGroup
        aria-label="Data view"
        onValueChange={() => {
          changeCount += 1
        }}
      >
        <ToggleGroup.Item disabled value="tables">
          Tables
        </ToggleGroup.Item>
      </ToggleGroup>,
    )

    const item = screen.getByRole('button', { name: 'Tables' })
    fireEvent.click(item)

    expect(item.getAttribute('data-disabled')).toBe('')
    expect(item.getAttribute('data-pressed')).toBeNull()
    expect(changeCount).toBe(0)
  })

  it('uses the medium size by default', () => {
    render(
      <ToggleGroup aria-label="Data view">
        <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
      </ToggleGroup>,
    )

    expect(screen.getByRole('group', { name: 'Data view' }).getAttribute('data-size')).toBe('m')
    expect(screen.getByRole('button', { name: 'Tables' }).getAttribute('data-size')).toBe('m')
  })

  it('provides a compact small size', () => {
    render(
      <ToggleGroup aria-label="Data view" size="s">
        <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
      </ToggleGroup>,
    )

    expect(screen.getByRole('group', { name: 'Data view' }).getAttribute('data-size')).toBe('s')
    expect(screen.getByRole('button', { name: 'Tables' }).getAttribute('data-size')).toBe('s')
  })
})
