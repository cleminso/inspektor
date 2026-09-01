import { useMemo, type PropsWithChildren } from 'react'

import { Box, ButtonLink, ShellLayout, Text } from '@inspector/ds'

import { useAppCommandPalette } from '@app/hotkeys/appHotkeys'

import { InspectorHeader } from './header/view'
import { InspectorFooterCenterProvider } from './footer/centerSlot'
import { InspectorFooter } from './footer/view'
import { createInspectorShellLayoutPersistence } from './shellLayoutStorage'

interface InspectorLayoutProps extends PropsWithChildren {
  pageTitle: string
}

export function InspectorLayout({ children, pageTitle }: InspectorLayoutProps): React.ReactElement {
  const commandPalette = useAppCommandPalette()
  const shellLayoutPersistence = useMemo(() => createInspectorShellLayoutPersistence(), [])

  return (
    <InspectorFooterCenterProvider>
      <Box
        position="fixed"
        inset="none"
        color="default"
        height="screen-height-dynamic"
        data-layout="viewport"
        data-page-scroll="locked"
      >
        <ShellLayout.Root persistence={shellLayoutPersistence}>
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
          <ShellLayout.Header>
            <InspectorHeader />
          </ShellLayout.Header>
          <Box
            as="main"
            id="main-content"
            tabIndex={-1}
            minHeight={0}
            minWidth={0}
            flex={1}
            flexDirection="column"
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
          <ShellLayout.Footer>
            <InspectorFooter onOpenCommands={commandPalette.open} />
          </ShellLayout.Footer>
        </ShellLayout.Root>
      </Box>
    </InspectorFooterCenterProvider>
  )
}
