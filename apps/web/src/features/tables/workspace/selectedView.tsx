import { Box, Text } from '@inspector/ds'

import { useRuntimeSchema } from '@app/providers/inspectorProvider'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { SchemaView } from '@tables/schema/view'
import { TableView } from '@tables/workspace/tableView'

export function SelectedTableView({
  tableName,
}: {
  tableName: string | null
}): React.ReactElement | null {
  const wasmSchema = useRuntimeSchema()
  const searchState = useTableExplorerSearchParams()

  if (tableName === null) {
    return null
  }

  if (searchState.view === 'schema') {
    if (wasmSchema === null) {
      return (
        <Box
          flex={1}
          alignItems="center"
          justifyContent="center"
          backgroundColor="surface-background"
          role="status"
          aria-live="polite"
        >
          <Text
            variant="label"
            color="muted"
          >
            Loading schema
          </Text>
        </Box>
      )
    }
    return <SchemaView tableName={tableName} />
  }

  return (
    <TableView
      key={tableName}
      tableName={tableName}
    />
  )
}
