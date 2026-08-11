import { Box } from "@inspector/ds";

import { ConnectionSwitcher } from "@shared/connections/connectionSwitcher";

interface ConnectionsLayoutProps {
  children: React.ReactNode;
}

export function ConnectionsLayout({ children }: ConnectionsLayoutProps): React.ReactElement {
  return (
    <Box
      height="screen-height-small"
      minHeight={0}
      width="full"
      flexDirection="column"
      overflow="hidden"
      backgroundColor="surface-background"
    >
      <Box
        as="header"
        width="full"
        flexShrink={0}
        alignItems="center"
        paddingHorizontal="l"
        paddingVertical="s"
        backgroundColor="element-default"
        borderBottomWidth={1}
        borderColor="subtle"
        borderStyle="solid"
      >
        <ConnectionSwitcher triggerLabel="Open connection" />
      </Box>
      <Box
        as="main"
        minHeight={0}
        flex={1}
        alignItems="start"
        justifyContent="center"
        overflowY="auto"
        paddingTop="5xl"
        paddingRight="2xl"
        paddingBottom="5xl"
        paddingLeft="2xl"
      >
        {children}
      </Box>
    </Box>
  );
}
