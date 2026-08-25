import { Outlet, createFileRoute } from '@tanstack/react-router'

import { InspectorLayout } from '@app/shell/layout'
import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { SidePanelLayoutProvider, useSidePanelLayout } from '@tables/tableList/layout'
import { TableTabsProvider } from '@tables/workspace/tabsProvider'
import { TableHotkeys } from '@tables/workspace/tableHotkeys'
import { TableNavigationHistoryProvider } from '@tables/workspace/navigationHistory'
import { createTableWorkspaceScope } from '@tables/workspace/scope'
import { TableMutationLedgerWorkspaceProvider } from '@tables/mutationLedger/provider'
import { TableExplorerScreen } from '@tables/view'
import { canonicalizeTableRouteSearch } from '@tables/routing/tableRowsSearch'

export const Route = createFileRoute('/conn/$connectionId/tables')({
  head: () => ({
    meta: [{ title: 'Tables | Inspector' }],
  }),
  component: TablesLayoutRoute,
  validateSearch: canonicalizeTableRouteSearch,
})

function TablesLayoutRoute(): React.ReactElement {
  return (
    <SidePanelLayoutProvider>
      <TablesWorkspaceLayout />
    </SidePanelLayoutProvider>
  )
}

/**
 * Owns connected table presentation after session and runtime identity are available.
 *
 * Connection, branch, and schema form the workspace scope so tabs, history, and pending mutations
 * cannot leak into another runtime. This layer consumes runtime projections; it does not resolve or
 * initialize the connection.
 */
function TablesWorkspaceLayout(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const { isOpen, toggle } = useSidePanelLayout()
  const workspaceScope = createTableWorkspaceScope({
    branch: currentBranch,
    connectionId: currentConnectionId,
    schemaHash: currentSchemaHash,
  })

  return (
    <InspectorLayout
      leftDock={{ isOpen, onToggle: toggle }}
      pageTitle="Tables"
    >
      <TableMutationLedgerWorkspaceProvider key={workspaceScope}>
        <TableNavigationHistoryProvider>
          <TableTabsProvider scope={workspaceScope}>
            <TableHotkeys />
            <TableExplorerScreen />
            <Outlet />
          </TableTabsProvider>
        </TableNavigationHistoryProvider>
      </TableMutationLedgerWorkspaceProvider>
    </InspectorLayout>
  )
}
