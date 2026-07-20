import { Box, Button, Text } from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import { getConnectionDisplayName, getConnectionSecondaryLabel } from "@/lib/config/connections";

export function ConnectionList(): React.ReactElement {
  const { connections, openConnection } = useInspector();

  return (
    <Box width="full" flexDirection="column" gap="xs">
      {connections.map((connection) => (
        <Button
          key={connection.id}
          type="button"
          variant="ghost"
          size="s"
          fullWidth
          justify="start"
          inset="default"
          onClick={() => {
            void openConnection(connection.id);
          }}
        >
          <Box minWidth={0} flexDirection="column" alignItems="start" gap="xs">
            <Text as="span" variant="default" color="inherit">
              {getConnectionDisplayName(connection)}
            </Text>
            <Text as="span" variant="caption" color="muted" truncate>
              {getConnectionSecondaryLabel(connection)}
            </Text>
          </Box>
        </Button>
      ))}
    </Box>
  );
}
