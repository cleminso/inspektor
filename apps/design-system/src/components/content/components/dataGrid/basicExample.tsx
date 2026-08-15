import { useState } from "react";

import { DataGrid, Text, dataGridFeatures, type DataGridFeatures } from "@inspector/ds";
import { createColumnHelper, useTable, type CellSelectionState } from "@tanstack/react-table";

interface Account {
  email: string;
  id: string;
  role: string;
}

const names = ["ada", "grace", "linus", "margaret", "donald"];
const data: Account[] = Array.from({ length: 1000 }, (_, index) => {
  const name = names[index % names.length] ?? "member";
  const number = String(index + 1).padStart(4, "0");
  return {
    id: `account_${number}`,
    email: `${name}.${number}@example.com`,
    role: index % 10 === 0 ? "admin" : "member",
  };
});
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
  const [editTarget, setEditTarget] = useState<{ columnId: string; rowId: string } | null>(null);
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
      onCellEditRequest={setEditTarget}
    >
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Accounts">
          <DataGrid.Content rowRendering="virtual" />
        </DataGrid.Table>
      </DataGrid.Viewport>
      <DataGrid.Footer>
        <Text color="muted" variant="caption">
          1,000 rows
        </Text>
        <Text color="muted" variant="caption">
          {editTarget === null
            ? "Select a row, column, or cell"
            : `Edit ${editTarget.rowId} · ${editTarget.columnId}`}
        </Text>
      </DataGrid.Footer>
    </DataGrid.Root>
  );
}
