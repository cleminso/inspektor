import { Outlet, createFileRoute, useSearch } from '@tanstack/react-router'

import { formatStudioDocumentTitle } from '@shared/documentTitle'
import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { ConnectionContentBoundary } from '@app/runtime/connectionContentBoundary'
import { TableTabsProvider } from '@tables/workspace/tabsProvider'
import { TableHotkeys } from '@tables/workspace/tableHotkeys'
import { TableNavigationHistoryProvider } from '@tables/workspace/navigationHistory'
import { createTableWorkspaceScope } from '@tables/workspace/scope'
import { TableMutationLedgerWorkspaceProvider } from '@tables/mutationLedger/provider'
import { TableExplorerScreen } from '@tables/view'
import { canonicalizeTableRouteSearch, toTableTabSearch } from '@tables/routing/tableRowsSearch'

import { ConnectionRouteLoading } from '../-connectionRouteStatus'

export const Route = createFileRoute('/conn/$connectionId/tables')({
  head: () => ({
    meta: [{ title: formatStudioDocumentTitle('Tables') }],
  }),
  component: TablesWorkspaceLayout,
  validateSearch: canonicalizeTableRouteSearch,
})

/**
 * Owns connected table presentation after session and runtime identity are available.
 *
 * Connection, local branch label, and schema form the workspace scope so tabs, history, and pending
 * mutations cannot leak into another workspace. The branch label does not select Jazz data. This
 * layer consumes runtime projections; it does not resolve or initialize the connection.
 */
function TablesWorkspaceLayout(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash, currentTableName } =
    useInspectorSessionState()
  const routeSearch = useSearch({ strict: false })
  const workspaceScope = createTableWorkspaceScope({
    branch: currentBranch,
    connectionId: currentConnectionId,
    schemaHash: currentSchemaHash,
  })
  const readinessKey = JSON.stringify([
    currentTableName,
    routeSearch.empty,
    toTableTabSearch(routeSearch),
  ])

  return (
    <ConnectionContentBoundary
      key={workspaceScope}
      fallback={<ConnectionRouteLoading />}
      readinessKey={readinessKey}
    >
      <TableMutationLedgerWorkspaceProvider>
        <TableNavigationHistoryProvider>
          <TableTabsProvider scope={workspaceScope}>
            <TableHotkeys />
            <TableExplorerScreen />
            <Outlet />
          </TableTabsProvider>
        </TableNavigationHistoryProvider>
      </TableMutationLedgerWorkspaceProvider>
    </ConnectionContentBoundary>
  )
}
