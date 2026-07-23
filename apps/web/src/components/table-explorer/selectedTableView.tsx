import { DataView } from "@/components/table-explorer/data/view";
import { SchemaView } from "@/components/table-explorer/schema/view";
import { useInspector } from "@/components/providers/inspectorProvider";
import { useTableExplorerSearchParams } from "@/hooks/useTableExplorerSearchParams";

interface SelectedTableViewProps {
  tableName: string | null;
}

export function SelectedTableView({ tableName }: SelectedTableViewProps): React.ReactElement {
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
  const dataViewKey = `${currentConnectionId ?? "unknown"}:${currentBranch ?? "unknown"}:${currentSchemaHash ?? "unknown"}:${tableName}`;
  return <DataView key={dataViewKey} tableName={tableName} />;
}
