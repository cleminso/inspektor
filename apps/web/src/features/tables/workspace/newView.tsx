import { ActionList, Box, Icon, Text } from "@inspector/ds";

import { productGlyphs } from "@app/icons/productGlyphs";
import { useTableTabs } from "@tables/workspace/tabsProvider";

export function NewTableView(): React.ReactElement {
  const { openRecentView, recentViews } = useTableTabs();

  return (
    <Box
      width="full"
      height="full"
      minHeight={0}
      alignItems="center"
      justifyContent="center"
      paddingTop="5xl"
    >
      <Box width="full" maxWidth="popup-width-l" flexDirection="column" gap="xl">
        <Box width="full" alignItems="center" gap="s">
          <Text variant="caption" color="muted">
            RECENT VIEWS
          </Text>
          <Box flex={1} borderTopWidth={1} borderColor="subtle" borderStyle="solid" />
        </Box>
        {recentViews.length === 0 ? (
          <Box paddingTop="m" paddingBottom="m">
            <Text variant="caption" color="muted">
              Open a table to add it to recent views.
            </Text>
          </Box>
        ) : (
          <ActionList aria-label="Recent table views">
            {recentViews.map((view) => {
              const isSchemaView = view.search.view === "schema";
              return (
                <ActionList.Item key={view.id}>
                  <ActionList.Trigger
                    prefix={
                      isSchemaView === true ? (
                        <Icon artwork={productGlyphs.derivedView} size="s" />
                      ) : (
                        <Icon artwork={productGlyphs.table} size="s" />
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
