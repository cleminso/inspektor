import { Box, CopyButton } from "@inspector/ds";

import { useInspector } from "@app/providers/inspectorProvider";
interface SchemaViewProps {
  tableName: string;
}

export function SchemaView({ tableName }: SchemaViewProps): React.ReactElement {
  const { runtime } = useInspector();
  const tableSchema = runtime.wasmSchema?.[tableName] ?? null;
  const tablePermissions = runtime.storedPermissions?.permissions?.[tableName] ?? null;
  const schemaJson = JSON.stringify({ [tableName]: tableSchema }, null, 2);
  const permissionsJson = JSON.stringify({ [tableName]: tablePermissions }, null, 2);

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
            <h2 className="text-sm font-medium text-foreground">Schema</h2>
            <CopyButton textToCopy={schemaJson} label="Copy schema" />
          </Box>
          <Box unsafeClassName="app-scrollbar" minHeight={0} flex={1} overflow="auto" padding="l">
            <pre className="text-xs text-muted-foreground">{schemaJson}</pre>
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
            <h2 className="text-sm font-medium text-foreground">Permissions</h2>
            <CopyButton textToCopy={permissionsJson} label="Copy permissions" />
          </Box>
          <Box unsafeClassName="app-scrollbar" minHeight={0} flex={1} overflow="auto" padding="l">
            <pre className="text-xs text-muted-foreground">{permissionsJson}</pre>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
