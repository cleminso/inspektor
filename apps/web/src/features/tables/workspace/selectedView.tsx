import { Box, Text } from '@inspector/ds'

import { useInspectorSessionState, useRuntimeSchema } from '@app/providers/inspectorProvider'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { SchemaView } from '@tables/schema/view'
import { TableView } from '@tables/workspace/tableView'

interface SelectedTableViewProps {
  tableName: string | null
}

function SchemaLoadingStatus(): React.ReactElement {
  return (
    <Box
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="surface-background"
      role="status"
      aria-live="polite"
    >
      <Box
        flexDirection="column"
        alignItems="center"
        gap="xs"
      >
        <Text
          variant="label"
          color="muted"
        >
          Loading schema
        </Text>
      </Box>
    </Box>
  )
}

export function SelectedTableView({
  tableName,
}: SelectedTableViewProps): React.ReactElement | null {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const wasmSchema = useRuntimeSchema()
  const searchState = useTableExplorerSearchParams()

  if (tableName === null) {
    return null
  }

  if (searchState.view === 'schema') {
    if (wasmSchema === null) {
      return <SchemaLoadingStatus />
    }
    return <SchemaView tableName={tableName} />
  }

  // Key the table-scoped state boundary by its complete identity so React resets interactions without synchronization effects.
  const TableViewKey = `${currentConnectionId ?? 'unknown'}:${currentBranch ?? 'unknown'}:${currentSchemaHash ?? 'unknown'}:${tableName}`
  return (
    <TableView
      key={TableViewKey}
      tableName={tableName}
    />
  )
}
