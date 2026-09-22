import { SchemaView } from '@tables/schema/view'
import { TableView } from '@tables/workspace/tableView'

export function SelectedTableView({
  tableName,
  view,
}: {
  tableName: string
  view: 'data' | 'schema'
}): React.ReactElement {
  if (view === 'schema') {
    return <SchemaView tableName={tableName} />
  }

  return (
    <TableView
      key={tableName}
      tableName={tableName}
    />
  )
}
