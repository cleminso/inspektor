import { Box, Button, Text } from "@inspector/ds";
import { HeadContent, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactElement } from "react";

import { navSections } from "@/lib/registry";

function ThemeSwitch(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  const handleToggleTheme = (): void => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon-s"
      radius="m"
      onClick={handleToggleTheme}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {resolvedTheme === "dark" ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
    </Button>
  );
}

export function AppShell(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <HeadContent />
      <Box height="full" flexDirection="column" overflow="hidden" backgroundColor="bg-page" color="text-default">
        <Box as="header" alignItems="center" justifyContent="between" flexShrink={0} paddingHorizontal={{ base: "xl", md: "5xl" }} paddingVertical="m" borderBottomWidth={1} borderStyle="solid" borderColor="border">
          <Link to="/"><Text as="span" variant="title">Inspector Design System</Text></Link>
          <ThemeSwitch />
        </Box>

        <Box flex={1} flexDirection={{ base: "column", xl: "row" }} minHeight={0}>
          <Box as="aside" display={{ base: "none", xl: "flex" }} flexDirection="column" flexShrink={0} gap="2xl" width="popup-width-m" overflowY="auto" paddingVertical="xl" paddingHorizontal="m" borderRightWidth={1} borderStyle="solid" borderColor="border">
            <Box as="nav" flexDirection="column" gap="2xl" aria-label="Design system navigation">
              {navSections.map((section) => (
                <Box as="section" key={section.title} flexDirection="column" gap="m">
                  <Text as="span" variant="label" color="muted">{section.title}</Text>
                  <Box flexDirection="column" gap="none">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return <Button key={item.href} variant={isActive === true ? "secondary" : "ghost"} size="l" fullWidth justify="start" render={<Link to={item.href} />} aria-current={isActive === true ? "page" : undefined} radius="none">{item.title}</Button>;
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box id="main-content" as="main" display="block" flex={1} minWidth={0} overflowY="auto" padding="xl"><Outlet /></Box>
        </Box>
      </Box>
    </>
  );
}
