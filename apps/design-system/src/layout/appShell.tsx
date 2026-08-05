import { Box, Button, ButtonLink, Icon, Text } from "@inspector/ds";
import { useHotkey } from "@tanstack/react-hotkeys";
import { HeadContent, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactElement } from "react";

import { navigationItems, navSections, type NavItem } from "@/lib/registry";
import { AppShellLayoutProvider, useAppShellLayout } from "@/layout/appShellLayout";

export function getMainContentOverflowY(pathname: string): "auto" | "hidden" {
  return pathname.startsWith("/components/") || pathname.startsWith("/foundations/")
    ? "hidden"
    : "auto";
}

export function getAdjacentNavigationItems(pathname: string): {
  previous: NavItem | undefined;
  next: NavItem | undefined;
} {
  const currentIndex = navigationItems.findIndex((item) => item.href === pathname);

  if (currentIndex < 0) {
    return { previous: undefined, next: undefined };
  }

  return {
    previous: navigationItems.at(currentIndex - 1) ?? navigationItems.at(-1),
    next: navigationItems[currentIndex + 1] ?? navigationItems[0],
  };
}

function ThemeSwitch(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  const handleToggleTheme = (): void => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="s"
      onClick={handleToggleTheme}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      <Icon render={resolvedTheme === "dark" ? <Sun /> : <Moon />} size="s" />
    </Button>
  );
}

function AppShellContent(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { isNavigationOpen } = useAppShellLayout();
  const { previous, next } = getAdjacentNavigationItems(pathname);

  useHotkey(
    "ArrowLeft",
    () => {
      if (previous !== undefined) {
        void navigate({ to: previous.href });
      }
    },
    { enabled: previous !== undefined, ignoreInputs: true },
  );
  useHotkey(
    "ArrowRight",
    () => {
      if (next !== undefined) {
        void navigate({ to: next.href });
      }
    },
    { enabled: next !== undefined, ignoreInputs: true },
  );

  return (
    <>
      <HeadContent />
      <Box
        height="full"
        flexDirection="column"
        overflow="hidden"
        backgroundColor="bg-page"
        color="text-default"
      >
        <Box
          as="header"
          alignItems="center"
          justifyContent="between"
          flexShrink={0}
          paddingHorizontal={{ base: "xl", md: "xl" }}
          paddingVertical="m"
          borderBottomWidth={1}
          borderStyle="solid"
          borderColor="border"
        >
          <Link to="/">
            <Text as="span" variant="title">
              Inspector Design System
            </Text>
          </Link>
          <ThemeSwitch />
        </Box>

        <Box flex={1} flexDirection={{ base: "column", xl: "row" }} minHeight={0}>
          {isNavigationOpen === true ? (
            <Box
              as="aside"
              display={{ base: "none", xl: "flex" }}
              flexDirection="column"
              flexShrink={0}
              gap="2xl"
              width="popup-width-s"
              overflowY="auto"
              data-scroll-area="navigation"
              padding="m"
            >
              <Box as="nav" flexDirection="column" gap="2xl" aria-label="Design system navigation">
                {navSections.map((section) => (
                  <Box as="section" key={section.title} flexDirection="column" gap="m">
                    <Text as="span" variant="label" color="muted">
                      {section.title}
                    </Text>
                    <Box flexDirection="column" gap="none">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <ButtonLink
                            key={item.href}
                            variant={isActive === true ? "secondary" : "ghost"}
                            size="m"
                            layout="row"
                            render={<Link to={item.href} />}
                            aria-current={isActive === true ? "page" : undefined}
                            radius="none"
                          >
                            {item.title}
                          </ButtonLink>
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}

          <Box
            id="main-content"
            as="main"
            display="block"
            flex={1}
            minWidth={0}
            minHeight={0}
            overflowX="hidden"
            overflowY={getMainContentOverflowY(pathname)}
            data-scroll-area={
              getMainContentOverflowY(pathname) === "auto" ? "main-content" : undefined
            }
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export function AppShell(): ReactElement {
  return (
    <AppShellLayoutProvider>
      <AppShellContent />
    </AppShellLayoutProvider>
  );
}
