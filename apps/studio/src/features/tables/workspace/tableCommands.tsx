import { useNavigate } from '@tanstack/react-router'
import { toasts } from '@inspektor/ds'
import { useMemo } from 'react'

import { useAppCommands, type AppCommand } from '@app/hotkeys/appHotkeys'
import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { appRoutes } from '@app/routing/appRoutes'
import { resolveTableRowsSearch } from '@tables/routing/tableRowsSearch'
import { useTableNavigationPreparation } from '@tables/routing/tableNavigationPreparation'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import {
  createTableSearchByName,
  loadTableTabsState,
  type TableTab,
  type TableTabSearch,
} from '@tables/workspace/tabs'
import { createTableWorkspaceScope } from '@tables/workspace/scope'

interface TableCommandsProps {
  onOpenTable?: (tableName: string, search: TableTabSearch) => void
  tabs?: readonly TableTab[]
}

export function TableCommands({ onOpenTable, tabs }: TableCommandsProps): null {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const { isSchemaReady, tables } = useAvailableTables()
  const navigate = useNavigate()
  const { prepare } = useTableNavigationPreparation()
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
              const search = tableSearchByName.get(tableName) ?? {}
              if (onOpenTable !== undefined) {
                onOpenTable(tableName, search)
                return
              }
              void prepare(
                {
                  policy: 'replace',
                  search: resolveTableRowsSearch(search),
                  tableName,
                },
                () =>
                  navigate({
                    to: appRoutes.table,
                    params: { connectionId: currentConnectionId, tableName },
                    search,
                  }),
              ).catch(() => toasts.error("Couldn't open table"))
            },
          })),
    [currentConnectionId, isSchemaReady, navigate, onOpenTable, prepare, tableSearchByName, tables],
  )
  useAppCommands(commands)

  return null
}
