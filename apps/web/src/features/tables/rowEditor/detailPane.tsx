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
        height="panel-bar-height"
        flexShrink={0}
        alignItems="center"
        borderBottomWidth={1}
        borderColor="default"
        borderStyle="solid"
        px="l"
      >
        {title}
      </Box>
      <Box minHeight={0} flex={1} flexDirection="column" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
