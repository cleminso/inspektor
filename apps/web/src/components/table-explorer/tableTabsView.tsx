import { Box, Button, TabView } from "@inspector/ds";
import { Layers3, Plus, Table2 } from "lucide-react";

import { SidePanelLayout } from "@/components/layout/sidePanelLayout";
import { NewTableView } from "@/components/table-explorer/newTableView";
import { SelectedTableView } from "@/components/table-explorer/selectedTableView";
import {
  NEW_VIEW_TAB_ID,
  createBaseTableTabId,
} from "@/components/table-explorer/tableTabs";
import { useTableTabs } from "@/components/table-explorer/tableTabsProvider";

interface TableTabsViewProps {
  tableName: string | null;
}

export function TableTabsView({ tableName }: TableTabsViewProps): React.ReactElement {
  const { activeTabId, activateTab, closeTab, openNewView, tabs } = useTableTabs();
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <TabView.Root
      value={activeTabId}
      onValueChange={(value) => {
        if (value !== null) {
          activateTab(String(value));
        }
      }}
    >
      <Box
        width="full"
        flexShrink={0}
        alignItems="center"
        gap="s"
        padding="xs"
        backgroundColor="bg-page"
        borderBottomWidth={1}
        borderColor="border-secondary"
        borderStyle="solid"
        overflow="hidden"
      >
        <SidePanelLayout.Toggle label="Toggle table list" />
        <Box
          aria-hidden="true"
          data-slot="table-tabs-separator"
          height="icon-size-m"
          flexShrink={0}
          borderRightWidth={1}
          borderColor="border-secondary"
          borderStyle="solid"
        />
        <Box minWidth={0} flex={1} alignItems="center" gap="xs" overflow="hidden">
          <TabView.List aria-label="Open table views">
            {tabs.map((tab) => {
              if (tab.kind === "newView") {
                const canCloseNewView = tabs.length > 1;
                return (
                  <TabView.Item
                    key={tab.id}
                    value={tab.id}
                    closeLabel="Close New view"
                    onClose={
                      canCloseNewView === true
                        ? () => {
                            closeTab(tab.id);
                          }
                        : undefined
                    }
                  >
                    New view
                  </TabView.Item>
                );
              }

              const isBaseTab = tab.id === createBaseTableTabId(tab.tableName);
              return (
                <TabView.Item
                  key={tab.id}
                  value={tab.id}
                  prefix={
                    isBaseTab === true ? (
                      <Table2 aria-hidden="true" size={14} />
                    ) : (
                      <Layers3 aria-hidden="true" size={14} />
                    )
                  }
                  details={
                    isBaseTab === false ? `Filtered view of ${tab.tableName}` : undefined
                  }
                  closeLabel={`Close ${tab.tableName}`}
                  onClose={() => {
                    closeTab(tab.id);
                  }}
                >
                  {tab.tableName}
                </TabView.Item>
              );
            })}
          </TabView.List>
          <Button
            type="button"
            variant="ghost"
            size="s"
            shape="square"
            aria-label="Open new table view"
            title="Open new table view"
            onClick={openNewView}
          >
            <Plus aria-hidden="true" size={14} />
          </Button>
        </Box>
      </Box>
      {activeTab?.kind === "table" && tableName !== null ? (
        <TabView.Panel value={activeTab.id}>
          <SelectedTableView tableName={tableName} />
        </TabView.Panel>
      ) : activeTab?.kind === "newView" ? (
        <TabView.Panel value={NEW_VIEW_TAB_ID}>
          <NewTableView />
        </TabView.Panel>
      ) : (
        <Box minHeight={0} flex={1}>
          <NewTableView />
        </Box>
      )}
    </TabView.Root>
  );
}
