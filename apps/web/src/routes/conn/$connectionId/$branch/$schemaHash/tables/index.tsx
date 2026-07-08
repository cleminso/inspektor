import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { TableExplorerScreen } from "@/components/table-explorer/tableExplorerScreen";
import { useInspectorTables } from "@/hooks/useInspectorTables";
import { appRoutes } from "@/lib/navigation/appRoutes";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/tables/")({
  component: TablesRoute,
});

function TablesRoute(): React.ReactElement {
  const navigate = useNavigate();
  const params = Route.useParams();
  const { isSchemaReady, tables } = useInspectorTables();

  useEffect(() => {
    if (isSchemaReady === false || tables.length === 0) {
      return;
    }

    void navigate({
      to: appRoutes.table,
      params: {
        ...params,
        tableName: tables[0],
      },
      replace: true,
    });
  }, [isSchemaReady, navigate, params, tables]);

  return <TableExplorerScreen />;
}
