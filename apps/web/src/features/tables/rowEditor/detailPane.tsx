import { Box } from "@inspector/ds";

interface DetailPaneProps {
  children: React.ReactNode;
  title: React.ReactNode;
}

export function DetailPane({
  children,
  title,
}: DetailPaneProps): React.ReactElement {
  return (
    <Box height="full" flexDirection="column" overflow="hidden" backgroundColor="surface-background">
      <Box
        data-slot="row-editor-header"
        flexShrink={0}
        alignItems="center"
        paddingHorizontal="m"
        paddingVertical="s"
      >
        {title}
      </Box>
      <Box
        data-slot="row-editor-body"
        minHeight={0}
        flex={1}
        flexDirection="column"
        overflow="hidden"
        borderTopWidth={1}
        borderColor="default"
        borderStyle="solid"
      >
        {children}
      </Box>
    </Box>
  );
}
