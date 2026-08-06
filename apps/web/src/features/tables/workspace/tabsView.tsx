import { Box, Button, Icon, TabView, Tooltip } from "@inspector/ds";
import { Layers3, Plus, Table2 } from "lucide-react";

import { useTableTabs } from "@tables/workspace/tabsProvider";
import { NewTableView } from "@tables/workspace/newView";
import { SelectedTableView } from "@tables/workspace/selectedView";
import { NEW_VIEW_TAB_ID, createBaseTableTabId } from "@tables/workspace/tabs";

interface TableTabsViewProps {
  tableName: string | null;
}

export function TableTabsView({ tableName }: TableTabsViewProps): React.ReactElement {
  const { activeTabId, activateTab, closeTab, openNewView, reorderTabs, tabs } = useTableTabs();
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
        <Box minWidth={0} flex={1} alignItems="center" gap="xs" overflow="hidden">
          <TabView.List
            aria-label="Open table views"
            values={tabs.map((tab) => tab.id)}
            onReorder={(orderedTabIds) => {
              reorderTabs(
                orderedTabIds.filter((tabId): tabId is string => typeof tabId === "string"),
              );
            }}
          >
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
                      <Icon render={<Table2 />} size="s" />
                    ) : (
                      <Icon render={<Layers3 />} size="s" />
                    )
                  }
                  details={isBaseTab === false ? `Filtered view of ${tab.tableName}` : undefined}
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
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  aria-label="Open new table view"
                  iconOnly
                  onClick={openNewView}
                >
                  <Icon render={<Plus />} size="s" />
                </Button>
              }
            />
            <Tooltip.Content>Open new table view</Tooltip.Content>
          </Tooltip.Root>
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
