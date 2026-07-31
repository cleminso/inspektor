import { Box, Button, Text } from "@inspector/ds";

import { useInspectorSessionContext } from "@app/providers/inspectorSessionProvider";
import { getConnectionDisplayName, getConnectionSecondaryLabel } from "@app/connections/connections";

export function ConnectionList(): React.ReactElement {
  const { connections, openConnection } = useInspectorSessionContext();

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
