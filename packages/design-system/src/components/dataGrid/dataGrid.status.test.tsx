import { cleanup, render, screen } from '@testing-library/react'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { DataGrid } from './dataGrid'
import { dataGridFeatures, type DataGridFeatures } from './dataGridFeatures'

interface Person {
  id: string
  name: string
}

const columnHelper = createColumnHelper<DataGridFeatures, Person>()
const columns = columnHelper.columns([columnHelper.accessor('name', { header: 'Name' })])
const rows = [{ id: 'person-1', name: 'Ada' }]

function StatusDataGrid({
  busy = false,
  statusContent,
}: {
  busy?: boolean
  statusContent?: ReactNode
}) {
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
  })

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table
          aria-busy={busy}
          aria-label="People"
          statusContent={statusContent}
        >
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

afterEach(cleanup)

describe('DataGrid status semantics', () => {
  it('keeps settled rows while exposing refresh progress and completion through stable semantics', () => {
    const { rerender } = render(
      <StatusDataGrid
        busy
        statusContent="Refreshing people"
      />,
    )
    const table = screen.getByRole('table', { name: 'People' })
    const status = screen.getByRole('status')

    expect(table.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeTruthy()
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.getAttribute('aria-atomic')).toBe('true')
    expect(status.textContent).toBe('Refreshing people')

    rerender(<StatusDataGrid statusContent="People refreshed" />)

    expect(screen.getByRole('table', { name: 'People' }).hasAttribute('aria-busy')).toBe(false)
    expect(screen.getByRole('status')).toBe(status)
    expect(status.textContent).toBe('People refreshed')
  })
})
