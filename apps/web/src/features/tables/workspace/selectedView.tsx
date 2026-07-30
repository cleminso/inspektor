import { useInspector } from "@app/providers/inspectorProvider";
import { useTableExplorerSearchParams } from "@tables/routing/useTableSearchParams";
import { SchemaView } from "@tables/schema/view";
import { TableView } from "@tables/workspace/tableView";

interface SelectedTableViewProps {
  tableName: string | null;
}

export function SelectedTableView({ tableName }: SelectedTableViewProps): React.ReactElement | null {
  const { currentBranch, currentConnectionId, currentSchemaHash, runtime } = useInspector();
  const searchState = useTableExplorerSearchParams();

  if (tableName === null) {
    return null;
  }

  if (runtime.wasmSchema === null) {
    return null;
  }

  if (searchState.view === "schema") {
    return <SchemaView tableName={tableName} />;
  }

  // Key the table-scoped state boundary by its complete identity so React resets interactions without synchronization effects.
  const TableViewKey = `${currentConnectionId ?? "unknown"}:${currentBranch ?? "unknown"}:${currentSchemaHash ?? "unknown"}:${tableName}`;
  return <TableView key={TableViewKey} tableName={tableName} />;
}
