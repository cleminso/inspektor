import { Outlet, createFileRoute } from "@tanstack/react-router";

import { InspectorLayout } from "@app/shell/layout";
import { useInspector } from "@app/providers/inspectorProvider";
import { SidePanelLayoutProvider } from "@tables/tableList/layout";
import { TableTabsProvider } from "@tables/workspace/tabsProvider";
import type { TableRouteSearch } from "@tables/tableTypes";

export const Route = createFileRoute("/conn/$connectionId/tables")({
  component: TablesLayoutRoute,
  validateSearch: (search): TableRouteSearch => ({
    ...search,
    dir: typeof search.dir === "string" ? search.dir : undefined,
    empty: search.empty === "true" ? "true" : undefined,
    filters: typeof search.filters === "string" ? search.filters : undefined,
    mode: typeof search.mode === "string" ? search.mode : undefined,
    rowId: typeof search.rowId === "string" ? search.rowId : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
    tab: typeof search.tab === "string" ? search.tab : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
  }),
});

function TablesLayoutRoute(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const tabScope = `${currentConnectionId ?? "none"}:${currentBranch ?? "none"}:${currentSchemaHash ?? "none"}`;

  return (
    <SidePanelLayoutProvider>
      {({ isOpen, toggle }) => (
        <InspectorLayout leftDock={{ isOpen, onToggle: toggle }}>
          <TableTabsProvider key={tabScope} scope={tabScope}>
            <Outlet />
          </TableTabsProvider>
        </InspectorLayout>
      )}
    </SidePanelLayoutProvider>
  );
}
