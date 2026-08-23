import { Box, Button, Text, Tooltip } from '@inspector/ds'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { BranchSwitcher } from '@app/shell/header/branchSwitcher'
import { SchemaSwitcher } from '@app/shell/header/schemaSwitcher'
import { ConnectionSwitcher } from '@shared/connections/connectionSwitcher'

export function InspectorHeader(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  const themeLabel = isDarkTheme === true ? 'Switch to light theme' : 'Switch to dark theme'

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
        <ConnectionSwitcher width="m" />
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
        pr="s"
      >
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="s"
                aria-label="Toggle theme"
                iconOnly
                onClick={() => {
                  setTheme(isDarkTheme === true ? 'light' : 'dark')
                }}
              >
                <Button.Glyph artwork={isDarkTheme === true ? Sun : Moon} />
              </Button>
            }
          />
          <Tooltip.Content>{themeLabel}</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Box>
  )
}
