import { createFileRoute } from "@tanstack/react-router";

import { TableExplorerScreen } from "@/components/table-explorer/tableExplorerScreen";

export const Route = createFileRoute("/conn/$connectionId/tables/$tableName/")({
  component: TableDataRoute,
});

function TableDataRoute(): React.ReactElement {
  return <TableExplorerScreen />;
}
