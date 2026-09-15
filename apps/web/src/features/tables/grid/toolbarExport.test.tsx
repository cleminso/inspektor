import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useTable } from '@tanstack/react-table'
import type { DynamicTableRow } from '@tables/tableTypes'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dataGridFeatures } from '@inspektor/ds'

import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { DataGridExport } from '@tables/grid/toolbar'
import type { TableColumnMeta } from '@tables/tableTypes'

const tableColumns = [
  { accessorKey: 'name', column: null, id: 'name', isSortable: true, label: 'Name' },
  { accessorKey: 'note', column: null, id: 'note', isSortable: true, label: 'Note' },
  { accessorKey: 'hidden', column: null, id: 'hidden', isSortable: true, label: 'Hidden' },
] satisfies readonly TableColumnMeta[]

function ExportMenu({ data }: { data: DynamicTableRow[] }): React.ReactElement {
  const table = useTable({
    features: dataGridFeatures,
    columns: [
      { id: tableGridSelectionColumnId },
      { accessorKey: 'note' },
      { accessorKey: 'hidden' },
      { accessorKey: 'name' },
    ],
    data,
    getRowId: (row) => String(row.id),
    state: {
      columnPinning: { start: ['name'], end: [] },
      columnVisibility: { hidden: false },
    },
  })

  return (
    <DataGridExport
      table={table}
      tableColumns={tableColumns}
      tableName="people"
    />
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DataGridExport', () => {
  it('downloads current rows in visible table-column order', async () => {
    const { rerender } = render(<ExportMenu data={[]} />)
    const trigger = screen.getByRole('button', { name: 'Export rows' })
    expect(trigger.hasAttribute('disabled')).toBe(true)

    rerender(<ExportMenu data={[{ hidden: 'secret', id: '1', name: 'Ada', note: null }]} />)
    fireEvent.click(trigger)
    const jsonItem = await screen.findByRole('menuitem', { name: 'JSON' })

    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const createElement = vi.spyOn(document, 'createElement')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    fireEvent.click(jsonItem)

    const anchor = createElement.mock.results[0]?.value
    const blob = createObjectURL.mock.calls[0]?.[0]
    expect(anchor).toMatchObject({ download: 'people.json', href: 'blob:export' })
    expect(click).toHaveBeenCalledOnce()
    expect(blob?.type).toBe('application/json;charset=utf-8')
    expect(await blob?.text()).toBe('[\n  {\n    "Name": "Ada",\n    "Note": null\n  }\n]')
    await vi.waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:export'))
  })
})
