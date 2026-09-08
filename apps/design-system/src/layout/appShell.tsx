import {
  Box,
  Button,
  KeyboardInput,
  ShellLayout,
  Text,
  ThemeSwitch,
  Tree,
  Tooltip,
  useShellLayout,
} from '@inspektor/ds'
import { useHotkey } from '@tanstack/react-hotkeys'
import { HeadContent, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { FolderTree, Info, type LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type ComponentProps, type ReactElement, useState } from 'react'

import { getAdjacentNavigationItems, navSections } from '@/lib/registry'
import { AppShellDetailsTargetContext } from '@/layout/appShellDetails'
import { createDesignSystemShellLayoutPersistence } from '@/layout/appShellStorage'

const appShellHotkeyOptions = {
  ignoreInputs: true,
  preventDefault: false,
  stopPropagation: false,
} as const
const appShellHotkeys = {
  toggleLeftDock: 'Alt+B',
  toggleRightDock: 'Alt+D',
} as const
const shellLayoutPersistence = createDesignSystemShellLayoutPersistence()

function runDockHotkey(event: KeyboardEvent, toggle: () => void): void {
  if (event.defaultPrevented === true || event.isComposing === true || event.repeat === true) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  toggle()
}

function DockControl({
  artwork,
  hotkey,
  isOpen,
  label,
  onClick,
}: {
  artwork: LucideIcon
  hotkey: ComponentProps<typeof KeyboardInput>['hotkey']
  isOpen: boolean
  label: string
  onClick: () => void
}): ReactElement {
  const action = isOpen === true ? 'Hide' : 'Show'
  const accessibleLabel = `${action} ${label}`

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Button
            iconOnly
            variant="ghost"
            size="s"
            aria-label={accessibleLabel}
            aria-pressed={isOpen}
            onClick={onClick}
          >
            <Button.Glyph artwork={artwork} />
          </Button>
        }
      />
      <Tooltip.Content>
        {accessibleLabel}{' '}
        <KeyboardInput
          hotkey={hotkey}
          size="small"
        />
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

export function AppShellFooter(): ReactElement {
  const { leftDock, rightDock } = useShellLayout()

  useHotkey(
    appShellHotkeys.toggleLeftDock,
    (event) => runDockHotkey(event, leftDock.toggle),
    appShellHotkeyOptions,
  )
  useHotkey(
    appShellHotkeys.toggleRightDock,
    (event) => runDockHotkey(event, rightDock.toggle),
    appShellHotkeyOptions,
  )

  return (
    <Box
      as="footer"
      width="full"
      alignItems="center"
      justifyContent="between"
      padding="xs"
    >
      <DockControl
        artwork={FolderTree}
        hotkey={appShellHotkeys.toggleLeftDock}
        isOpen={leftDock.isOpen}
        label="components tree"
        onClick={leftDock.toggle}
      />
      <DockControl
        artwork={Info}
        hotkey={appShellHotkeys.toggleRightDock}
        isOpen={rightDock.isOpen}
        label="details"
        onClick={rightDock.toggle}
      />
    </Box>
  )
}

export function AppShellNavigation({ pathname }: { pathname: string }): ReactElement {
  return (
    <Tree.Root aria-label="Design system navigation">
      {navSections.map((section) => (
        <Tree.Section
          key={section.title}
          defaultOpen
        >
          <Tree.Trigger>{section.title}</Tree.Trigger>
          <Tree.Content>
            {section.items.map((item) => (
              <Tree.Item
                key={item.href}
                render={<Link to={item.href} />}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.title}
              </Tree.Item>
            ))}
          </Tree.Content>
        </Tree.Section>
      ))}
    </Tree.Root>
  )
}

export function AppShell(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const [detailsTarget, setDetailsTarget] = useState<HTMLElement | null>(null)
  const { previous, next } = getAdjacentNavigationItems(pathname)
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  useHotkey(
    'ArrowLeft',
    () => {
      if (previous !== undefined) {
        void navigate({ to: previous.href })
      }
    },
    { enabled: previous !== undefined, ignoreInputs: true },
  )
  useHotkey(
    'ArrowRight',
    () => {
      if (next !== undefined) {
        void navigate({ to: next.href })
      }
    },
    { enabled: next !== undefined, ignoreInputs: true },
  )

  return (
    <>
      <HeadContent />
      <ShellLayout.Root persistence={shellLayoutPersistence}>
        <ShellLayout.Header>
          <Box
            as="header"
            width="full"
            alignItems="center"
            justifyContent="between"
            paddingHorizontal="m"
            paddingVertical="s"
          >
            <Link to="/">
              <Text
                as="span"
                variant="title"
              >
                Inspektor Design System
              </Text>
            </Link>
            <ThemeSwitch
              theme={theme}
              onThemeChange={setTheme}
            />
          </Box>
        </ShellLayout.Header>
        <AppShellDetailsTargetContext.Provider value={detailsTarget}>
          <ShellLayout.Body>
            <ShellLayout.LeftDock>
              <AppShellNavigation pathname={pathname} />
            </ShellLayout.LeftDock>
            <ShellLayout.View>
              <Box
                id="main-content"
                as="main"
                width="full"
                height="full"
                minWidth={0}
                minHeight={0}
                overflow="hidden"
              >
                <Outlet />
              </Box>
            </ShellLayout.View>
            <ShellLayout.RightDock>
              <Box
                ref={setDetailsTarget}
                width="full"
                height="full"
                minHeight={0}
                flexDirection="column"
                overflowX="hidden"
                overflowY="auto"
                padding="m"
              />
            </ShellLayout.RightDock>
          </ShellLayout.Body>
        </AppShellDetailsTargetContext.Provider>
        <ShellLayout.Footer>
          <AppShellFooter />
        </ShellLayout.Footer>
      </ShellLayout.Root>
    </>
  )
}
