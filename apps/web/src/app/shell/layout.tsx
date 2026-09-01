import type { PropsWithChildren } from 'react'

import { Box, ButtonLink, Text } from '@inspector/ds'

import { useAppCommandPalette } from '@app/hotkeys/appHotkeys'

import { InspectorHeader } from './header/view'
import { InspectorDock } from './dock/view'
import { InspectorDockCenterProvider } from './dock/centerSlot'

interface InspectorLayoutProps extends PropsWithChildren {
  pageTitle: string
}

export function InspectorLayout({ children, pageTitle }: InspectorLayoutProps): React.ReactElement {
  const commandPalette = useAppCommandPalette()

  return (
    <InspectorDockCenterProvider>
      <Box
        minHeight={0}
        width="full"
        flexDirection="column"
        rowGap="xs"
        overflow="hidden"
        position="fixed"
        inset="none"
        backgroundColor="surface-canvas"
        color="default"
        height="screen-height-dynamic"
        data-layout="viewport"
        data-page-scroll="locked"
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
        <InspectorHeader />
        <Box
          as="main"
          id="main-content"
          tabIndex={-1}
          minHeight={0}
          minWidth={0}
          flex={1}
          overflow="hidden"
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
        <InspectorDock onOpenCommands={commandPalette.open} />
      </Box>
    </InspectorDockCenterProvider>
  )
}
