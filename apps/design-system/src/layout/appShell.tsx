import {
  Box,
  Button,
  ShellLayout,
  SidePanel,
  Text,
  TextLink,
  ThemeSwitch,
  Tree,
  useShellLayout,
} from '@inspektor/ds'
import { HeadContent, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { FolderTree, PanelLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type ReactElement, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { docsSections } from '@/lib/registry'

const wideLayoutQuery = '(min-width: 768px)'

function subscribeToWideLayout(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(wideLayoutQuery)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function getWideLayoutSnapshot(): boolean {
  return window.matchMedia(wideLayoutQuery).matches
}

function useWideLayout(): boolean {
  return useSyncExternalStore(subscribeToWideLayout, getWideLayoutSnapshot, () => false)
}

function PrimaryNavigation({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void
  pathname: string
}): ReactElement {
  return (
    <SidePanel aria-label="Design system navigation">
      <Tree.Root aria-label="Design system pages">
        {docsSections.map((section) => (
          <Tree.Section
            key={section.title}
            defaultOpen
          >
            <Tree.Trigger>{section.title}</Tree.Trigger>
            <Tree.Content>
              {section.items.map((item) => (
                <Tree.Item
                  key={item.href}
                  render={
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                    />
                  }
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.title}
                </Tree.Item>
              ))}
            </Tree.Content>
          </Tree.Section>
        ))}
      </Tree.Root>
    </SidePanel>
  )
}

function LeftDockControl(): ReactElement {
  const { leftDock } = useShellLayout()
  const action = leftDock.isOpen === true ? 'Hide' : 'Show'

  return (
    <Button
      iconOnly
      variant="ghost"
      size="m"
      aria-label={`${action} components tree`}
      aria-pressed={leftDock.isOpen}
      onClick={leftDock.toggle}
    >
      <Button.Glyph artwork={FolderTree} />
    </Button>
  )
}

export function AppShell(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { resolvedTheme, setTheme } = useTheme()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const navigationToggleRef = useRef<HTMLButtonElement>(null)
  const isWideLayout = useWideLayout()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    if (isWideLayout === true && isNavigationOpen === true) {
      setIsNavigationOpen(false)
      document.getElementById('main-content')?.focus()
    }
  }, [isNavigationOpen, isWideLayout])

  const closeNavigation = (): void => {
    if (isNavigationOpen === true) {
      setIsNavigationOpen(false)
      navigationToggleRef.current?.focus()
    }
  }

  return (
    <>
      <HeadContent />
      <ShellLayout.Root>
        <ShellLayout.Header>
          <Box
            as="header"
            position="relative"
            width="full"
            alignItems="center"
            justifyContent="between"
            gap="m"
            paddingHorizontal="m"
            paddingVertical="s"
          >
            <Box
              position="absolute"
              left="s"
              top="s"
              zIndex="content"
              padding="xs"
              opacity={{ base: 0, focusWithin: 1 }}
              backgroundColor="surface-background"
            >
              <TextLink
                href="#main-content"
                aria-label="Skip to content"
                variant="caption"
              >
                Skip to content
              </TextLink>
            </Box>
            <Box
              alignItems="center"
              gap="s"
            >
              <Box display={{ base: 'flex', md: 'none' }}>
                <Button
                  ref={navigationToggleRef}
                  iconOnly
                  size="m"
                  variant="ghost"
                  aria-label={isNavigationOpen === true ? 'Hide navigation' : 'Show navigation'}
                  aria-controls="primary-navigation"
                  aria-expanded={isNavigationOpen}
                  onClick={() => setIsNavigationOpen((isOpen) => isOpen === false)}
                >
                  <Button.Glyph artwork={PanelLeft} />
                </Button>
              </Box>
              <Link to="/">
                <Text
                  as="span"
                  variant="title"
                >
                  Inspektor Design System
                </Text>
              </Link>
            </Box>
            <ThemeSwitch
              theme={theme}
              onThemeChange={setTheme}
            />
          </Box>
        </ShellLayout.Header>
        <ShellLayout.Body>
          {isWideLayout === true ? (
            <ShellLayout.LeftDock>
              <PrimaryNavigation pathname={pathname} />
            </ShellLayout.LeftDock>
          ) : null}
          <ShellLayout.View>
            {isWideLayout === false ? (
              <Box
                id="primary-navigation"
                display={isNavigationOpen === true ? 'flex' : 'none'}
                width="full"
                height="full"
                backgroundColor="surface-default"
              >
                <PrimaryNavigation
                  pathname={pathname}
                  onNavigate={closeNavigation}
                />
              </Box>
            ) : null}
            <Box
              id="main-content"
              as="main"
              tabIndex={-1}
              display={{ base: isNavigationOpen === true ? 'none' : 'flex', md: 'flex' }}
              flex={1}
              width="full"
              height="full"
              minWidth={0}
              minHeight={0}
              overflow="hidden"
            >
              <Outlet />
            </Box>
          </ShellLayout.View>
        </ShellLayout.Body>
        {isWideLayout === true ? (
          <ShellLayout.Footer>
            <Box
              as="footer"
              width="full"
              alignItems="center"
              padding="xs"
            >
              <LeftDockControl />
            </Box>
          </ShellLayout.Footer>
        ) : null}
      </ShellLayout.Root>
    </>
  )
}
