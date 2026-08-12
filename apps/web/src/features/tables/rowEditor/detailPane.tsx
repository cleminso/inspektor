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
    <Box height="full" flexDirection="column" overflow="hidden" backgroundColor="surface-background" paddingVertical="xxs">
      <Box
        data-slot="row-editor-header"
        flexShrink={0}
        alignItems="center"
        borderBottomWidth={1}
        borderColor="default"
        borderStyle="solid"
        padding="m"
      >
        {title}
      </Box>
      <Box minHeight={0} flex={1} flexDirection="column" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
