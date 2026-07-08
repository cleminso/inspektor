import { EmptyState } from "@regarde/ui/emptyState";

import { DataView } from "@/components/table-explorer/data/view";
import { SchemaView } from "@/components/table-explorer/schema/view";
import { useInspector } from "@/components/providers/inspectorProvider";
import { useTableExplorerSearchParams } from "@/hooks/useTableExplorerSearchParams";

interface SelectedTableViewProps {
  isListPaneOpen: boolean;
  tableName: string | null;
  onToggleListPane: () => void;
}

export function SelectedTableView({
  isListPaneOpen,
  tableName,
  onToggleListPane,
}: SelectedTableViewProps): React.ReactElement {
  const { runtime } = useInspector();
  const searchState = useTableExplorerSearchParams();

  if (tableName === null) {
    return <EmptyState title="Select a table" description="Choose a table from the list to view its content." />;
  }

  if (runtime.wasmSchema === null) {
    return <EmptyState title="Loading schema" description="Waiting for schema metadata to load." />;
  }

  if (searchState.view === "schema") {
    return (
      <SchemaView
        tableName={tableName}
        view="schema"
        isListPaneOpen={isListPaneOpen}
        onToggleListPane={onToggleListPane}
        onViewChange={searchState.setView}
      />
    );
  }

  return (
    <DataView
      tableName={tableName}
      view="data"
      isListPaneOpen={isListPaneOpen}
      onToggleListPane={onToggleListPane}
      onViewChange={searchState.setView}
    />
  );
}
