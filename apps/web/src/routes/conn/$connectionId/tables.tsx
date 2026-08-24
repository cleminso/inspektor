import { Outlet, createFileRoute } from '@tanstack/react-router'

import { InspectorLayout } from '@app/shell/layout'
import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { SidePanelLayoutProvider, useSidePanelLayout } from '@tables/tableList/layout'
import { TableTabsProvider } from '@tables/workspace/tabsProvider'
import { TableHotkeys } from '@tables/workspace/tableHotkeys'
import { TableNavigationHistoryProvider } from '@tables/workspace/navigationHistory'
import { TableMutationLedgerWorkspaceProvider } from '@tables/mutationLedger/provider'
import { createTableMutationWorkspaceScope } from '@tables/mutationLedger/scope'
import { TableExplorerScreen } from '@tables/view'
import type { TablePageSize, TableRouteSearch } from '@tables/tableTypes'

export function parsePositiveInteger(value: unknown): number | undefined {
  const numberValue = typeof value === 'string' ? Number(value) : value
  return typeof numberValue === 'number' && Number.isSafeInteger(numberValue) && numberValue > 0
    ? numberValue
    : undefined
}

function parsePageSize(value: unknown): TablePageSize | undefined {
  const pageSize = parsePositiveInteger(value)
  return pageSize === 100 || pageSize === 500 || pageSize === 1000 ? pageSize : undefined
}

export const Route = createFileRoute('/conn/$connectionId/tables')({
  head: () => ({
    meta: [{ title: 'Tables | Inspector' }],
  }),
  component: TablesLayoutRoute,
  validateSearch: (search): TableRouteSearch => ({
    ...search,
    dir: typeof search.dir === 'string' ? search.dir : undefined,
    empty: search.empty === 'true' ? 'true' : undefined,
    filters: typeof search.filters === 'string' ? search.filters : undefined,
    mode: typeof search.mode === 'string' ? search.mode : undefined,
    page: parsePositiveInteger(search.page),
    pageSize: parsePageSize(search.pageSize),
    rowId: typeof search.rowId === 'string' ? search.rowId : undefined,
    sort: typeof search.sort === 'string' ? search.sort : undefined,
    tab: typeof search.tab === 'string' ? search.tab : undefined,
    view: typeof search.view === 'string' ? search.view : undefined,
  }),
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
  const tabScope = createTableMutationWorkspaceScope({
    branch: currentBranch,
    connectionId: currentConnectionId,
    schemaHash: currentSchemaHash,
  })

  return (
    <InspectorLayout
      leftDock={{ isOpen, onToggle: toggle }}
      pageTitle="Tables"
    >
      <TableMutationLedgerWorkspaceProvider key={tabScope}>
        <TableNavigationHistoryProvider>
          <TableTabsProvider scope={tabScope}>
            <TableHotkeys />
            <TableExplorerScreen />
            <Outlet />
          </TableTabsProvider>
        </TableNavigationHistoryProvider>
      </TableMutationLedgerWorkspaceProvider>
    </InspectorLayout>
  )
}
