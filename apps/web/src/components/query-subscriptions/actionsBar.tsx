import { Box, Text } from "@inspector/ds";

import { SidePanelLayout } from "@/components/layout/sidePanelLayout";

interface ActionsBarProps {
  error: string | null;
  generatedAt: number | null;
  isRefreshing: boolean;
  rowCount: number;
}

function formatLastRefresh(generatedAt: number | null): string {
  if (generatedAt === null) {
    return "Polling every 20s.";
  }

  return `Polling every 20s. Last refresh ${new Date(generatedAt).toLocaleTimeString()}.`;
}

export function ActionsBar({
  error,
  generatedAt,
  isRefreshing,
  rowCount,
}: ActionsBarProps): React.ReactElement {
  const statusText = `${formatLastRefresh(generatedAt)}${isRefreshing === true ? " Refreshing..." : ""}`;

  return (
    <Box
      width="full"
      flexShrink={0}
      alignItems="center"
      justifyContent="between"
      gap="s"
      padding="s"
      backgroundColor="bg-page"
      borderBottomWidth={1}
      borderColor="border-secondary"
      borderStyle="solid"
    >
      <SidePanelLayout.Toggle label="Toggle query subscriptions table list" />
      <Box flexDirection="column" alignItems="end" gap="xs">
        <Text variant="caption" color="muted">
          {statusText}
        </Text>
        {error !== null && rowCount > 0 ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
