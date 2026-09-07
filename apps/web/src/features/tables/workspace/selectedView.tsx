import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { SchemaView } from '@tables/schema/view'
import { TableView } from '@tables/workspace/tableView'

export function SelectedTableView({ tableName }: { tableName: string }): React.ReactElement {
  const searchState = useTableExplorerSearchParams()

  if (searchState.view === 'schema') {
    return <SchemaView tableName={tableName} />
  }

  return (
    <TableView
      key={tableName}
      tableName={tableName}
    />
  )
}
