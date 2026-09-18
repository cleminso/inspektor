import { Box, Text, ThemeSwitch } from '@inspektor/ds'
import { useTheme } from 'next-themes'

import { SchemaSwitcher } from '@app/shell/header/schemaSwitcher'
import { ConnectionSwitcher } from '@shared/connections/connectionSwitcher'

export function InspectorHeader(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <Box
      as="header"
      width="full"
      flexShrink={0}
      alignItems="center"
      gap="s"
      paddingVertical="s"
      paddingHorizontal="xs"
      backgroundColor="surface-background"
    >
      <Box
        minWidth={0}
        flex={1}
        alignItems="center"
        flexWrap="wrap"
        gap="xxs"
      >
        <Box
          maxWidth="full"
          flexShrink={0}
        >
          <ConnectionSwitcher />
        </Box>
        <Box
          maxWidth="full"
          flexShrink={0}
          alignItems="center"
          gap="xxs"
        >
          <Box
            as="span"
            display={{ base: 'none', sm: 'flex' }}
            ml="xs"
          >
            <Text
              as="span"
              color="muted"
              aria-hidden="true"
            >
              /
            </Text>
          </Box>
          <SchemaSwitcher width="m" />
        </Box>
      </Box>

      <Box
        flexShrink={0}
        justifyContent="end"
      >
        <ThemeSwitch
          theme={theme}
          onThemeChange={setTheme}
        />
      </Box>
    </Box>
  )
}
