import { useState } from 'react'

import { DataTable, Text } from '@inspector/ds'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'

interface Account {
  email: string
  id: string
  role: string
}

const data: Account[] = [
  { id: 'account_01', email: 'ada@example.com', role: 'admin' },
  { id: 'account_02', email: 'grace@example.com', role: 'member' },
  { id: 'account_03', email: 'linus@example.com', role: 'member' },
]
const columnHelper = createColumnHelper<Account>()
const columns = [
  columnHelper.accessor('id', { header: 'ID', size: 160 }),
  columnHelper.accessor('email', { header: 'Email', size: 220 }),
  columnHelper.accessor('role', { header: 'Role', size: 120 }),
]

export default function BasicExample() {
  const [activeCell, setActiveCell] = useState<{ columnId: string; rowId: string } | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [columnOrder, setColumnOrder] = useState(['id', 'email', 'role'])
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { columnOrder },
  })

  return (
    <DataTable.Root
      table={table}
      density="compact"
      activeCell={activeCell}
      activeColumnId={activeColumnId}
      activeRowId={activeRowId}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      onColumnActivate={(columnId) => {
        setActiveCell(null)
        setActiveColumnId(columnId)
      }}
      onRowActivate={(rowId) => {
        setActiveCell(null)
        setActiveColumnId(null)
        setActiveRowId(rowId)
      }}
      onCellActivate={(target) => {
        setActiveCell(target)
        setActiveColumnId(null)
        setActiveRowId(target.rowId)
      }}
    >
      <DataTable.Viewport>
        <DataTable.Table aria-label="Accounts">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
      <DataTable.Footer>
        <Text color="muted" variant="caption">3 rows</Text>
        <Text color="muted" variant="caption">Select a row, column, or cell</Text>
      </DataTable.Footer>
    </DataTable.Root>
  )
}
