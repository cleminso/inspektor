import { Link } from '@tanstack/react-router'

import { RelationValue } from '@inspektor/ds'

import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { buildRelationTableLink } from '@tables/routing/buildRelationTableLink'
import { shouldPrepareTableLink } from '@tables/routing/preparedTableLink'
import { useTableTabs } from '@tables/workspace/tabsProvider'

interface RelationCellLinkProps {
  relationId: string
  relationTable: string
}

export function RelationCellLink({
  relationId,
  relationTable,
}: RelationCellLinkProps): React.ReactElement {
  const { currentConnectionId } = useInspectorSessionState()
  const { openTable, pendingTableName } = useTableTabs()

  if (currentConnectionId === null) {
    return <RelationValue id={relationId} />
  }

  const relationLink = buildRelationTableLink({
    connectionId: currentConnectionId,
    tableName: relationTable,
  })

  return (
    <RelationValue
      id={relationId}
      navigation={{
        render: (
          <Link
            to={relationLink.to}
            params={relationLink.params}
            search={relationLink.search}
            aria-busy={pendingTableName === relationTable ? true : undefined}
            onClick={(event) => {
              if (shouldPrepareTableLink(event) === false) return
              event.preventDefault()
              openTable(relationTable, relationLink.search)
            }}
          />
        ),
      }}
    />
  )
}
