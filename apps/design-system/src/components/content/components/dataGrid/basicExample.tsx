import { useState } from "react";

import { DataGrid, Text, dataGridFeatures, type DataGridFeatures } from "@inspector/ds";
import { createColumnHelper, useTable, type CellSelectionState } from "@tanstack/react-table";

interface Account {
  email: string;
  id: string;
  role: string;
}

const data: Account[] = [
  { id: "account_01", email: "ada@example.com", role: "admin" },
  { id: "account_02", email: "grace@example.com", role: "member" },
  { id: "account_03", email: "linus@example.com", role: "member" },
];
const columnHelper = createColumnHelper<DataGridFeatures, Account>();
const columns = columnHelper.columns([
  columnHelper.accessor("id", { header: "ID", size: 160 }),
  columnHelper.accessor("email", { header: "Email", size: 220 }),
  columnHelper.accessor("role", { header: "Role", size: 120 }),
]);
const reorderableColumnIds = ["id", "email", "role"];

export default function BasicExample() {
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([]);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState(["id", "email", "role"]);
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    getRowId: (row) => row.id,
    state: { cellSelection, columnOrder },
    onCellSelectionChange: setCellSelection,
    onColumnOrderChange: setColumnOrder,
  });

  return (
    <DataGrid.Root
      table={table}
      density="compact"
      activeColumnId={activeColumnId}
      activeRowId={activeRowId}
      reorderableColumnIds={reorderableColumnIds}
      onColumnActivate={(columnId) => {
        if (columnId !== null) {
          setCellSelection([]);
        }
        setActiveColumnId(columnId);
      }}
      onRowActivate={(rowId) => {
        setCellSelection([]);
        setActiveColumnId(null);
        setActiveRowId(rowId);
      }}
      onCellActivate={(target) => {
        setActiveColumnId(null);
        setActiveRowId(target.rowId);
      }}
    >
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Accounts">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
      <DataGrid.Footer>
        <Text color="muted" variant="caption">
          3 rows
        </Text>
        <Text color="muted" variant="caption">
          Select a row, column, or cell
        </Text>
      </DataGrid.Footer>
    </DataGrid.Root>
  );
}
