import { Box } from "@inspector/ds";

interface ToolbarProps {
  actions: React.ReactNode;
  children?: React.ReactNode;
}

export function Toolbar({ actions, children }: ToolbarProps): React.ReactElement {
  return (
    <Box
      width="full"
      flexShrink={0}
      alignItems="end"
      gap="s"
      padding="s"
      backgroundColor="bg-page"
      borderColor="border-secondary"
      borderStyle="solid"
    >
      <Box minWidth={0} flex={1}>
        {children}
      </Box>
      <Box flexShrink={0} alignItems="center" gap="s">
        {actions}
      </Box>
    </Box>
  );
}
