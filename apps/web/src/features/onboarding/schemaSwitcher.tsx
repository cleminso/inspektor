import { Box, Button, CopyButton, Text } from "@inspector/ds";

import type { ConnectionError } from "@app/connections/connectionValidation";

interface SchemaSwitcherProps {
  appId: string;
  error: ConnectionError | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSelectSchema: (schemaHash: string) => Promise<void>;
  schemaHashes: string[];
}

export function SchemaSwitcher({
  appId,
  error,
  isSubmitting,
  onCancel,
  onSelectSchema,
  schemaHashes,
}: SchemaSwitcherProps): React.ReactElement {
  const hasError = error !== null;
  const hasSchemas = schemaHashes.length > 0;
  const appLabel = appId.trim().length > 0 ? appId.trim() : "this connection";

  return (
    <Box minHeight={0} width="full" flexDirection="column" gap="xl">
      <Box flexDirection="column" gap="xs">
        <Text as="h2" variant="label">
          Select schema
        </Text>
        <Text color="muted">Choose the stored schema to open for {appLabel}.</Text>
      </Box>
      <Box minHeight={0} flexDirection="column" gap="m" overflowY="auto" paddingRight="xs">
        {hasSchemas === true ? (
          schemaHashes.map((schemaHash) => (
            <Box
              key={schemaHash}
              alignItems="center"
              gap="xs"
              paddingHorizontal="m"
              paddingVertical="xs"
              borderWidth={1}
              borderColor="border"
              borderStyle="solid"
              borderRadius="xs"
            >
              <Button
                type="button"
                variant="ghost"
                size="s"
                layout="row"
                onClick={() => {
                  void onSelectSchema(schemaHash);
                }}
                disabled={isSubmitting === true}
                aria-label={`Open schema ${schemaHash}`}
              >
                <Text as="span" color="inherit" monospace truncate>
                  {schemaHash}
                </Text>
              </Button>
              <CopyButton
                textToCopy={schemaHash}
                label={`Copy schema ${schemaHash}`}
                disabled={isSubmitting === true}
              />
            </Box>
          ))
        ) : (
          <Box flexDirection="column" gap="xs" paddingVertical="2xl">
            <Text variant="label">No schemas found</Text>
            <Text color="muted">Try a different server, app ID, or admin secret.</Text>
          </Box>
        )}
      </Box>
      {hasError === true ? (
        <Box flexDirection="column" gap="xs" role="status" aria-live="polite">
          <Text color="error" variant="label">
            {error.title}
          </Text>
          <Text color="error">{error.description}</Text>
        </Box>
      ) : null}
      <Box alignItems="center" justifyContent="end" paddingTop="xl">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting === true}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
