import { Box, Button, ShellLayout, Text, useShellLayout } from '@inspektor/ds'
import { type ReactElement } from 'react'

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

function Region({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <Box
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
      padding="m"
    >
      <Text color="muted">{children}</Text>
    </Box>
  )
}

export default function BasicExample(): ReactElement {
  return (
    <ShellLayout.Root>
      <ShellLayout.Header>
        <Box
          width="full"
          padding="m"
          backgroundColor="surface-background"
        >
          <Text>Header</Text>
        </Box>
      </ShellLayout.Header>
      <ShellLayout.Body>
        <ShellLayout.LeftDock>
          <Region>Left dock</Region>
        </ShellLayout.LeftDock>
        <ShellLayout.View>
          <Region>View</Region>
        </ShellLayout.View>
        <ShellLayout.RightDock>
          <Region>Right dock</Region>
        </ShellLayout.RightDock>
      </ShellLayout.Body>
      <ShellLayout.Footer>
        <DockControls />
      </ShellLayout.Footer>
    </ShellLayout.Root>
  )
}
