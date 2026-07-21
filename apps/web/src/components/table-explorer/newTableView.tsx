import { ActionList, Box, Text } from "@inspector/ds";
import { Layers3, Table2 } from "lucide-react";

import { createBaseTableTabId } from "@/components/table-explorer/tableTabs";
import { useTableTabs } from "@/components/table-explorer/tableTabsProvider";

export function NewTableView(): React.ReactElement {
  const { openRecentView, recentViews } = useTableTabs();

  return (
    <Box width="full" height="xl" minHeight={0} alignItems="center" justifyContent="center" paddingTop="5xl">
      <Box width="full" maxWidth="popup-width-l" flexDirection="column" gap="xl">
        <Box width="full" alignItems="center" gap="s">
          <Text variant="caption" color="muted">
            RECENT VIEWS
          </Text>
          <Box
            flex={1}
            borderTopWidth={1}
            borderColor="border-secondary"
            borderStyle="solid"
          />
        </Box>
        {recentViews.length === 0 ? (
          <Box paddingBlock="m">
            <Text variant="caption" color="muted">
              Open a table to add it to recent views.
            </Text>
          </Box>
        ) : (
          <ActionList aria-label="Recent table views">
            {recentViews.map((view) => {
              const isBaseView = view.id === createBaseTableTabId(view.tableName);
              return (
                <ActionList.Item key={view.id}>
                  <ActionList.Trigger
                    prefix={
                      isBaseView === true ? (
                        <Table2 aria-hidden="true" size={14} />
                      ) : (
                        <Layers3 aria-hidden="true" size={14} />
                      )
                    }
                    onClick={() => {
                      openRecentView(view);
                    }}
                  >
                    {view.tableName}
                  </ActionList.Trigger>
                </ActionList.Item>
              );
            })}
          </ActionList>
        )}
      </Box>
    </Box>
  );
}
