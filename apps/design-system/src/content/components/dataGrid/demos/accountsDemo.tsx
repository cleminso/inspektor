import { Box, DataGrid, Text, dataGridFeatures, type DataGridFeatures } from '@inspektor/ds'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import { type ReactElement } from 'react'

interface Account {
  email: string
  id: string
  role: string
}

const accounts: Account[] = [
  { id: 'account_0001', email: 'ada@example.com', role: 'admin' },
  { id: 'account_0002', email: 'grace@example.com', role: 'member' },
  { id: 'account_0003', email: 'linus@example.com', role: 'member' },
]
const columnHelper = createColumnHelper<DataGridFeatures, Account>()
const columns = columnHelper.columns([
  columnHelper.accessor('id', { header: 'ID', size: 160 }),
  columnHelper.accessor('email', { header: 'Email', size: 220 }),
  columnHelper.accessor('role', { header: 'Role', size: 120 }),
])

export default function AccountsDataGridDemo(): ReactElement {
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: accounts,
    getRowId: (row) => row.id,
    initialState: { columnPinning: { start: ['id', 'email'], end: [] } },
  })

  return (
    <Box
      width="full"
      height="panel-height"
    >
      <DataGrid.Root
        table={table}
        density="compact"
        reorderableColumnIds={['id', 'email', 'role']}
      >
        <DataGrid.Viewport>
          <DataGrid.Table aria-label="Accounts">
            <DataGrid.Content rowRendering="all" />
          </DataGrid.Table>
        </DataGrid.Viewport>
        <DataGrid.Footer>
          <Text
            color="muted"
            variant="caption"
          >
            3 rows
          </Text>
        </DataGrid.Footer>
      </DataGrid.Root>
    </Box>
  )
}
