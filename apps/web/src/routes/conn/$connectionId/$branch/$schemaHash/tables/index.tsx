import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";

import { TableExplorerScreen } from "@/components/table-explorer/tableExplorerScreen";
import { useInspectorTables } from "@/hooks/useInspectorTables";
import { appRoutes } from "@/lib/navigation/appRoutes";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/tables/")({
  component: TablesRoute,
});

function TablesRoute(): React.ReactElement {
  const navigate = useNavigate();
  const params = Route.useParams();
  const search = useSearch({ strict: false }) as { empty?: string; tab?: string };
  const { isSchemaReady, tables } = useInspectorTables();

  useEffect(() => {
    if (
      search.empty === "true" ||
      search.tab === "new-view" ||
      isSchemaReady === false ||
      tables.length === 0
    ) {
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
  }, [isSchemaReady, navigate, params, search.empty, search.tab, tables]);

  return <TableExplorerScreen />;
}
