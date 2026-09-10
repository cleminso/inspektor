import { Box, Button, ShellLayout, Text, useShellLayout } from '@inspektor/ds'
import { type ReactElement, type ReactNode } from 'react'

function DockControls(): ReactElement {
  const { leftDock, rightDock } = useShellLayout()

  return (
    <Box
      width="full"
      alignItems="center"
      justifyContent="between"
      paddingHorizontal="xs"
      paddingVertical="s"
      backgroundColor="surface-background"
    >
      <Button
        size="s"
        variant="ghost"
        onClick={leftDock.toggle}
      >
        {leftDock.isOpen === true ? 'Close left dock' : 'Open left dock'}
      </Button>
      <Button
        size="s"
        variant="ghost"
        onClick={rightDock.toggle}
      >
        {rightDock.isOpen === true ? 'Close right dock' : 'Open right dock'}
      </Button>
    </Box>
  )
}

function Region({ children }: { children: ReactNode }): ReactElement {
  return (
    <Box
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
      backgroundColor="surface-background"
      padding="s"
    >
      <Text color="muted">{children}</Text>
    </Box>
  )
}

export default function ShellLayoutDefaultDemo(): ReactElement {
  return (
    <Box
      width="full"
      height="panel-height"
    >
      <ShellLayout.Root>
        <ShellLayout.Header>
          <Box
            width="full"
            padding="s"
            backgroundColor="surface-background"
          >
            <Text>Inspector header</Text>
          </Box>
        </ShellLayout.Header>
        <ShellLayout.Body>
          <ShellLayout.LeftDock>
            <Region>Left Dock</Region>
          </ShellLayout.LeftDock>
          <ShellLayout.View>
            <Region>Center</Region>
          </ShellLayout.View>
          <ShellLayout.RightDock>
            <Region>Right Dock</Region>
          </ShellLayout.RightDock>
        </ShellLayout.Body>
        <ShellLayout.Footer>
          <DockControls />
        </ShellLayout.Footer>
      </ShellLayout.Root>
    </Box>
  )
}
