import { CopyButton } from "@regarde/ui/copyButton";

import { ActionsBar } from "@/components/table-explorer/actionsBar";
import { useInspector } from "@/components/providers/inspectorProvider";
import type { TableExplorerView } from "@/types/tableExplorer";

interface SchemaViewProps {
  isListPaneOpen: boolean;
  onToggleListPane: () => void;
  onViewChange: (view: TableExplorerView) => Promise<void>;
  tableName: string;
  view: TableExplorerView;
}

export function SchemaView({ isListPaneOpen, onToggleListPane, onViewChange, tableName, view }: SchemaViewProps): React.ReactElement {
  const { runtime } = useInspector();
  const tableSchema = runtime.wasmSchema?.[tableName] ?? null;
  const tablePermissions = runtime.storedPermissions?.permissions?.[tableName] ?? null;
  const schemaJson = JSON.stringify({ [tableName]: tableSchema }, null, 2);
  const permissionsJson = JSON.stringify({ [tableName]: tablePermissions }, null, 2);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <ActionsBar view={view} isListPaneOpen={isListPaneOpen} onToggleListPane={onToggleListPane} onViewChange={onViewChange} />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden border-b border-border xl:border-r xl:border-b-0">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
            <h2 className="text-sm font-medium text-foreground">Schema</h2>
            <CopyButton text={schemaJson} variant="ghost" size="icon-sm" />
          </div>
          <div className="app-scrollbar min-h-0 flex-1 overflow-auto p-3">
            <pre className="text-xs text-muted-foreground">{schemaJson}</pre>
          </div>
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
            <h2 className="text-sm font-medium text-foreground">Permissions</h2>
            <CopyButton text={permissionsJson} variant="ghost" size="icon-sm" />
          </div>
          <div className="app-scrollbar min-h-0 flex-1 overflow-auto p-3">
            <pre className="text-xs text-muted-foreground">{permissionsJson}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
