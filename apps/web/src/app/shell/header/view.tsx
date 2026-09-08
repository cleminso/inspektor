import { Box, Text, ThemeSwitch } from '@inspektor/ds'
import { useTheme } from 'next-themes'

import { BranchSwitcher } from '@app/shell/header/branchSwitcher'
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
        gap="xxs"
      >
        <ConnectionSwitcher />
        <Box
          as="span"
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
        <Box
          minWidth={0}
          alignItems="center"
          gap="xxs"
        >
          <BranchSwitcher width="s" />
          <Text
            as="span"
            color="muted"
            aria-hidden="true"
          >
            /
          </Text>
          <SchemaSwitcher width="m" />
        </Box>
      </Box>

      <Box
        flex={1}
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
