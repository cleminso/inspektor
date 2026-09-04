import { Link } from '@tanstack/react-router'

import { Box, ButtonLink, Text } from '@inspector/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { appRoutes } from '@app/routing/appRoutes'

import { ConnectionList } from './connectionList'

interface ConnectionsSectionProps {
  children: React.ReactNode
  title: string
}

function ConnectionsSection({ children, title }: ConnectionsSectionProps): React.ReactElement {
  return (
    <Box
      as="section"
      width="full"
      flexDirection="column"
      alignItems="start"
      gap="m"
    >
      <Box
        width="full"
        alignItems="center"
        gap="l"
        paddingHorizontal="xs"
      >
        <Text
          as="h2"
          variant="label"
          color="muted"
        >
          {title}
        </Text>
        <Box
          flex={1}
          borderTopWidth={1}
          borderColor="subtle"
          borderStyle="solid"
        />
      </Box>
      <Box
        width="full"
        flexDirection="column"
        alignItems="start"
        paddingHorizontal="m"
      >
        {children}
      </Box>
    </Box>
  )
}

export function ConnectionsView(): React.ReactElement {
  const { connections } = useInspectorSessionContext()
  const hasConnections = connections.length > 0

  return (
    <Box
      width="full"
      maxWidth="popup-width-l"
      flexDirection="column"
      alignItems="start"
      gap="3xl"
    >
      <ConnectionsSection title="GET STARTED">
        <ButtonLink
          variant="ghost"
          size="s"
          layout="row"
          render={<Link to={appRoutes.newConnection} />}
        >
          Add connection
        </ButtonLink>
        <ButtonLink
          variant="ghost"
          size="s"
          layout="row"
          href="https://jazz.tools/docs"
          target="_blank"
          rel="noreferrer"
        >
          Jazz documentation
        </ButtonLink>
      </ConnectionsSection>

      {hasConnections === true ? (
        <ConnectionsSection title="SAVED CONNECTIONS">
          <ConnectionList />
        </ConnectionsSection>
      ) : null}
    </Box>
  )
}
