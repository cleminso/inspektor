import { Box, ButtonLink, Text } from '@inspector/ds'

import { ConnectionSwitcher } from '@shared/connections/connectionSwitcher'

interface ConnectionsLayoutProps {
  children: React.ReactNode
  pageTitle: string
}

export function ConnectionsLayout({
  children,
  pageTitle,
}: ConnectionsLayoutProps): React.ReactElement {
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
        position="fixed"
        top="xs"
        left="xs"
        zIndex="navigation"
        opacity={{ base: 0, focusWithin: 1 }}
        pointerEvents={{ base: 'none', focusWithin: 'auto' }}
      >
        <ButtonLink
          href="#main-content"
          size="s"
        >
          Skip to content
        </ButtonLink>
      </Box>
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
        id="main-content"
        tabIndex={-1}
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
        <Box
          position="absolute"
          opacity={0}
          pointerEvents="none"
        >
          <Text as="h1">{pageTitle}</Text>
        </Box>
        {children}
      </Box>
    </Box>
  )
}
