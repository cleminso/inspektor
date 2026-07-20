import { Link } from "@tanstack/react-router";

import { Box, Button, Text } from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import { appRoutes } from "@/lib/navigation/appRoutes";

import { ConnectionList } from "./connectionList";

interface ConnectionsSectionProps {
  children: React.ReactNode;
  title: string;
}

// TODO: limit the recent connection list to 5 items.
function ConnectionsSection({ children, title }: ConnectionsSectionProps): React.ReactElement {
  return (
    <Box as="section" width="full" flexDirection="column" alignItems="start" gap="m">
      <Box width="full" alignItems="center" gap="l" paddingHorizontal="xs">
        <Text as="h2" variant="label" color="muted">
          {title}
        </Text>
        <Box flex={1} borderTopWidth={1} borderColor="border-secondary" borderStyle="solid" />
      </Box>
      <Box width="full" flexDirection="column" alignItems="start" paddingHorizontal="m">
        {children}
      </Box>
    </Box>
  );
}

export function ConnectionsView(): React.ReactElement {
  const { connections } = useInspector();
  const hasConnections = connections.length > 0;

  return (
    <Box width="full" maxWidth="popup-width-l" flexDirection="column" alignItems="start" gap="3xl">
      <ConnectionsSection title="GET STARTED">
        <Button
          type="button"
          variant="ghost"
          size="s"
          fullWidth
          justify="start"
          inset="flush"
          render={<Link to={appRoutes.newConnection} />}
        >
          Add connection
        </Button>
        <Button
          variant="ghost"
          size="s"
          fullWidth
          justify="start"
          inset="flush"
          render={<a href="https://jazz.tools/docs" target="_blank" rel="noreferrer" />}
        >
          Jazz documentation
        </Button>
      </ConnectionsSection>

      {hasConnections === true ? (
        <ConnectionsSection title="RECENT CONNECTIONS">
          <ConnectionList />
        </ConnectionsSection>
      ) : null}
    </Box>
  );
}
