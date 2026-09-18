import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useAppCommands, type AppCommand } from '@app/hotkeys/appHotkeys'
import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { appRoutes } from '@app/routing/appRoutes'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import { createTableSearchByName, loadTableTabsState, type TableTab } from '@tables/workspace/tabs'
import { createTableWorkspaceScope } from '@tables/workspace/scope'

export function TableCommands({ tabs }: { tabs?: readonly TableTab[] }): null {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const { isSchemaReady, tables } = useAvailableTables()
  const navigate = useNavigate()
  const scope = createTableWorkspaceScope({
    branch: currentBranch,
    connectionId: currentConnectionId,
    schemaHash: currentSchemaHash,
  })
  const tableSearchByName = useMemo(
    () => createTableSearchByName(tabs ?? loadTableTabsState(scope).tabs),
    [scope, tabs],
  )
  const commands = useMemo<readonly AppCommand[]>(
    () =>
      isSchemaReady === false || currentConnectionId === null
        ? []
        : tables.map((tableName) => ({
            group: 'Tables',
            id: `tables.open.${encodeURIComponent(tableName)}`,
            label: tableName,
            perform: () => {
              void navigate({
                to: appRoutes.table,
                params: { connectionId: currentConnectionId, tableName },
                search: tableSearchByName.get(tableName) ?? {},
              })
            },
          })),
    [currentConnectionId, isSchemaReady, navigate, tableSearchByName, tables],
  )
  useAppCommands(commands)

  return null
}
