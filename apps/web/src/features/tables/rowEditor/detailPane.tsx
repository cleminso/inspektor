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
    <Box height="full" flexDirection="column" overflow="hidden" backgroundColor="bg-page">
      <Box
        height="panel-bar-height"
        flexShrink={0}
        alignItems="center"
        borderBottomWidth={1}
        borderColor="border"
        borderStyle="solid"
        px="l"
      >
        <h2 className="flex min-w-0 flex-1 items-center text-sm font-medium text-foreground">
          {title}
        </h2>
      </Box>
      <Box minHeight={0} flex={1} flexDirection="column" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
