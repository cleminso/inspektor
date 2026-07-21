import { Outlet, createFileRoute } from "@tanstack/react-router";

import { InspectorLayout } from "@/components/layout/inspectorLayout";
import { useInspector } from "@/components/providers/inspectorProvider";
import { TableTabsProvider } from "@/components/table-explorer/tableTabsProvider";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/tables")({
  component: TablesLayoutRoute,
});

function TablesLayoutRoute(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const tabScope = `${currentConnectionId ?? "none"}:${currentBranch ?? "none"}:${currentSchemaHash ?? "none"}`;

  return (
    <InspectorLayout>
      <TableTabsProvider key={tabScope} scope={tabScope}>
        <Outlet />
      </TableTabsProvider>
    </InspectorLayout>
  );
}
