import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useTable, type ColumnVisibilityState } from '@tanstack/react-table'
import type { DynamicTableRow } from 'jazz-tools'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { dataGridFeatures, Tooltip } from '@inspektor/ds'

import { DataGridColumnVisibility } from '@tables/grid/columnVisibility'

function VisibilityMenu(): React.ReactElement {
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({})
  const table = useTable({
    features: dataGridFeatures,
    columns: [
      { accessorKey: 'id', enableHiding: false },
      { accessorKey: 'name' },
      { accessorKey: 'role' },
    ],
    data: [] as DynamicTableRow[],
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  return (
    <Tooltip.Provider delay={0}>
      <DataGridColumnVisibility table={table} />
    </Tooltip.Provider>
  )
}

afterEach(cleanup)

describe('DataGridColumnVisibility', () => {
  it('labels the trigger on hover', async () => {
    render(<VisibilityMenu />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Choose visible columns' }))

    expect(await screen.findByText('Columns visibility')).toBeTruthy()
  })

  it('marks the trigger as pressed while any column is hidden', () => {
    render(<VisibilityMenu />)

    const trigger = screen.getByRole('button', { name: 'Choose visible columns' })
    expect(trigger.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select name' }))
    expect(trigger.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Check all from role' }))
    expect(trigger.getAttribute('aria-pressed')).toBe('false')
  })

  it('lists fixed and hideable columns and keeps the menu open for multiselect', () => {
    render(<VisibilityMenu />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose visible columns' }))

    expect(screen.getByRole('checkbox', { name: 'Select id' }).getAttribute('aria-disabled')).toBe(
      'true',
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select name' }))

    expect(screen.getByRole('checkbox', { name: 'Select name' }).getAttribute('aria-checked')).toBe(
      'false',
    )
    expect(screen.getByRole('dialog', { name: 'Visible columns' })).toBeTruthy()
  })

  it('restores every hideable column through one convenience action', () => {
    render(<VisibilityMenu />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose visible columns' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check all from role' }))

    expect(screen.getByRole('checkbox', { name: 'Select name' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    expect(screen.getByRole('checkbox', { name: 'Select role' }).getAttribute('aria-checked')).toBe(
      'true',
    )
  })
})
