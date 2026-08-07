import { Box, CopyButton, Text } from "@inspector/ds";
import { useMemo } from "react";

import { useRuntimePermissions, useRuntimeSchema } from "@app/providers/inspectorProvider";
interface SchemaViewProps {
  tableName: string;
}

export function SchemaView({ tableName }: SchemaViewProps): React.ReactElement {
  const wasmSchema = useRuntimeSchema();
  const storedPermissions = useRuntimePermissions();
  const tableSchema = wasmSchema?.[tableName] ?? null;
  const tablePermissions = storedPermissions?.permissions?.[tableName] ?? null;
  const schemaJson = useMemo(
    () => JSON.stringify({ [tableName]: tableSchema }, null, 2),
    [tableName, tableSchema],
  );
  const permissionsJson = useMemo(
    () => JSON.stringify({ [tableName]: tablePermissions }, null, 2),
    [tableName, tablePermissions],
  );

  return (
    <Box minHeight={0} flex={1} flexDirection="column" overflow="hidden" backgroundColor="bg-page">
      <Box
        display="grid"
        minHeight={0}
        flex={1}
        gridTemplateColumns={{ base: "one", xl: "two" }}
        overflow="hidden"
      >
        <Box
          as="section"
          minHeight={0}
          flexDirection="column"
          overflow="hidden"
          borderBottomWidth={{ base: 1, xl: 0 }}
          borderRightWidth={{ base: 0, xl: 1 }}
          borderColor="border"
          borderStyle="solid"
        >
          <Box
            height="panel-bar-height"
            flexShrink={0}
            alignItems="center"
            justifyContent="between"
            borderBottomWidth={1}
            borderColor="border"
            borderStyle="solid"
            px="l"
          >
            <Text as="h2" variant="label">
              Schema
            </Text>
            <CopyButton textToCopy={schemaJson} label="Copy schema" />
          </Box>
          <Box minHeight={0} flex={1} overflow="auto" padding="l">
            <Text as="pre" variant="caption" color="muted" monospace>
              {schemaJson}
            </Text>
          </Box>
        </Box>
        <Box as="section" minHeight={0} flexDirection="column" overflow="hidden">
          <Box
            height="panel-bar-height"
            flexShrink={0}
            alignItems="center"
            justifyContent="between"
            borderBottomWidth={1}
            borderColor="border"
            borderStyle="solid"
            px="l"
          >
            <Text as="h2" variant="label">
              Permissions
            </Text>
            <CopyButton textToCopy={permissionsJson} label="Copy permissions" />
          </Box>
          <Box minHeight={0} flex={1} overflow="auto" padding="l">
            <Text as="pre" variant="caption" color="muted" monospace>
              {permissionsJson}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
