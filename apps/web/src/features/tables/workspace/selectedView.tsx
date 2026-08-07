import { Box, Text } from "@inspector/ds";

import {
  useInspectorSessionState,
  useRuntimeError,
  useRuntimeSchema,
} from "@app/providers/inspectorProvider";
import { useTableExplorerSearchParams } from "@tables/routing/useTableSearchParams";
import { SchemaView } from "@tables/schema/view";
import { TableView } from "@tables/workspace/tableView";

interface SelectedTableViewProps {
  tableName: string | null;
}

function TableWorkspaceStatus({
  description,
  kind,
  title,
}: {
  description?: string;
  kind: "error" | "loading";
  title: string;
}): React.ReactElement {
  return (
    <Box
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="bg-page"
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "loading" ? "polite" : undefined}
    >
      <Box flexDirection="column" alignItems="center" gap="xs">
        <Text variant="label" color={kind === "error" ? "error" : "muted"}>
          {title}
        </Text>
        {description === undefined ? null : <Text color="muted">{description}</Text>}
      </Box>
    </Box>
  );
}

export function SelectedTableView({ tableName }: SelectedTableViewProps): React.ReactElement | null {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState();
  const error = useRuntimeError();
  const wasmSchema = useRuntimeSchema();
  const searchState = useTableExplorerSearchParams();

  if (tableName === null) {
    return null;
  }

  if (error !== null) {
    return (
      <TableWorkspaceStatus
        kind="error"
        title="Couldn't load this table"
        description="Check the connection and schema details."
      />
    );
  }

  if (searchState.view === "schema") {
    if (wasmSchema === null) {
      return <TableWorkspaceStatus kind="loading" title="Loading schema" />;
    }
    return <SchemaView tableName={tableName} />;
  }

  // Key the table-scoped state boundary by its complete identity so React resets interactions without synchronization effects.
  const TableViewKey = `${currentConnectionId ?? "unknown"}:${currentBranch ?? "unknown"}:${currentSchemaHash ?? "unknown"}:${tableName}`;
  return <TableView key={TableViewKey} tableName={tableName} />;
}
