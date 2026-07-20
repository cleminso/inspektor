import { Box } from "@inspector/ds";

import { ConnectionSwitcher } from "@/components/navigation";

interface ConnectionsLayoutProps {
  children: React.ReactNode;
}

export function ConnectionsLayout({ children }: ConnectionsLayoutProps): React.ReactElement {
  return (
    <Box
      height="full"
      minHeight={0}
      width="full"
      flexDirection="column"
      overflow="hidden"
      backgroundColor="bg-page"
      unsafeClassName="h-svh"
    >
      <Box
        as="header"
        width="full"
        flexShrink={0}
        alignItems="center"
        paddingHorizontal="l"
        paddingVertical="s"
        backgroundColor="bg-secondary"
        borderBottomWidth={1}
        borderColor="border-secondary"
        borderStyle="solid"
      >
        <ConnectionSwitcher placement="header" triggerLabel="Open connection" />
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
