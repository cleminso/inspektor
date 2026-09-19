import { useEffect } from 'react'

import { Box, ButtonLink, ShellLayout, Text } from '@inspektor/ds'

import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'
import { ConnectionSwitcher } from '@shared/connections/connectionSwitcher'

interface ConnectionsLayoutProps {
  children: React.ReactNode
  connectionTriggerLabel?: string
  pageTitle: string
}

export function ConnectionsLayout({
  children,
  connectionTriggerLabel,
  pageTitle,
}: ConnectionsLayoutProps): React.ReactElement {
  useEffect(() => {
    void prepareJazzWasm()
  }, [])

  return (
    <Box
      height="screen-height-small"
      minHeight={0}
      width="full"
      overflow="hidden"
    >
      <ShellLayout.Root>
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
          <Box
            as="header"
            width="full"
            alignItems="center"
            paddingHorizontal="xs"
            paddingVertical="s"
          >
            <ConnectionSwitcher triggerLabel={connectionTriggerLabel} />
          </Box>
        </ShellLayout.Header>
        <ShellLayout.Body>
          <ShellLayout.View>
            <Box
              as="main"
              backgroundColor="surface-background"
              id="main-content"
              tabIndex={-1}
              height="full"
              minHeight={0}
              width="full"
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
          </ShellLayout.View>
        </ShellLayout.Body>
      </ShellLayout.Root>
    </Box>
  )
}
