import { Box, Button, Text, toasts } from "@inspector/ds";

import { useInspectorSessionContext } from "@app/providers/inspectorSessionProvider";
import { getConnectionDisplayName, getConnectionSecondaryLabel } from "@app/connections/connections";
import { normalizeConnectionOpenError } from "@app/connections/connectionValidation";

export function ConnectionList(): React.ReactElement {
  const { connections, openingConnectionId, openConnection } = useInspectorSessionContext();

  return (
    <Box width="full" flexDirection="column" gap="xs">
      {connections.map((connection) => (
        <Button
          key={connection.id}
          type="button"
          variant="ghost"
          size="s"
          layout="row"
          disabled={openingConnectionId !== null}
          loading={openingConnectionId === connection.id}
          onClick={() => {
            void openConnection(connection.id)
              .catch((error: unknown) => {
                const normalizedError = normalizeConnectionOpenError(error);
                toasts.error(normalizedError.title, { description: normalizedError.description });
              });
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
