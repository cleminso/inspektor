import { Outlet, createFileRoute } from '@tanstack/react-router'

import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { ConnectionContentBoundary } from '@app/runtime/connectionContentBoundary'
import { TableTabsProvider } from '@tables/workspace/tabsProvider'
import { TableHotkeys } from '@tables/workspace/tableHotkeys'
import { TableNavigationHistoryProvider } from '@tables/workspace/navigationHistory'
import { createTableWorkspaceScope } from '@tables/workspace/scope'
import { TableMutationLedgerWorkspaceProvider } from '@tables/mutationLedger/provider'
import { TableExplorerScreen } from '@tables/view'
import { canonicalizeTableRouteSearch } from '@tables/routing/tableRowsSearch'

import { ConnectionRouteLoading } from '../-connectionRouteStatus'

export const Route = createFileRoute('/conn/$connectionId/tables')({
  head: () => ({
    meta: [{ title: 'Tables | Inspektor' }],
  }),
  component: TablesWorkspaceLayout,
  validateSearch: canonicalizeTableRouteSearch,
})

/**
 * Owns connected table presentation after session and runtime identity are available.
 *
 * Connection, branch, and schema form the workspace scope so tabs, history, and pending mutations
 * cannot leak into another runtime. This layer consumes runtime projections; it does not resolve or
 * initialize the connection.
 */
function TablesWorkspaceLayout(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const workspaceScope = createTableWorkspaceScope({
    branch: currentBranch,
    connectionId: currentConnectionId,
    schemaHash: currentSchemaHash,
  })

  return (
    <ConnectionContentBoundary
      key={workspaceScope}
      fallback={<ConnectionRouteLoading />}
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
