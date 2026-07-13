import { Box, Button, Text } from "@inspector/ds";
import * as stylex from "@stylexjs/stylex";
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
      size="icon-m"
      onClick={handleToggleTheme}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {resolvedTheme === "dark" ? (
        <Sun aria-hidden="true" size={15} />
      ) : (
        <Moon aria-hidden="true" size={15} />
      )}
    </Button>
  );
}

export function AppShell(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <HeadContent />
      <a href="#main-content" {...stylex.props(styles.skipLink)}>
        Skip to content
      </a>
      <Box
        minHeight="100vh"
        display="grid"
        backgroundColor="bg-surface-1"
        color="text-primary"
        {...stylex.props(styles.shell)}
      >
      <Box
        as="aside"
        flexDirection="column"
        gap="3xl"
        padding="none"
        borderStyle="solid"
        borderRightWidth={1}
        borderColor="border"
        backgroundColor="bg-primary"
        {...stylex.props(styles.sidebar)}
      >
        <Box flexDirection="row" alignItems="center" justifyContent="between" gap="m" paddingRight="m">
            <Link to="/" {...stylex.props(styles.wordmark)}>
            <span {...stylex.props(styles.wordmarkTitle)}>Inspector</span>
              <Text as="span" variant="caption" color="muted">
                Design System
              </Text>
          </Link>
          <ThemeSwitch />
        </Box>

        <Box
          as="nav"
          flexDirection="column"
          gap="2xl"
          aria-label="Design system navigation"
          {...stylex.props(styles.navigation)}
        >
          {navSections.map((section) => (
            <Box as="section" key={section.title} flexDirection="column" gap="m">
              <Box as="span" paddingHorizontal="l">
                <Text as="span" variant="label" color="muted">
                  {section.title}
                </Text>
              </Box>
              <Box flexDirection="column" gap="none">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Button
                      key={item.href}
                      variant={isActive === true ? "secondary" : "ghost"}
                      size="l"
                      fullWidth
                      justify="start"
                      render={<Link to={item.href} />}
                      aria-current={isActive === true ? "page" : undefined}
                      radius="none"
                    >
                      {item.title}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box id="main-content" as="main" display="block" minWidth={0} padding="l">
        <Outlet />
      </Box>
      </Box>
    </>
  );
}

const styles = stylex.create({
  shell: {
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 768px)": "260px minmax(0, 1fr)",
    },
  },
  sidebar: {
    position: {
      default: "static",
      "@media (min-width: 768px)": "sticky",
    },
    top: 0,
    height: {
      default: "auto",
      "@media (min-width: 768px)": "100vh",
    },
    borderRightWidth: {
      default: 0,
      "@media (min-width: 768px)": 1,
    },
    borderBottomWidth: {
      default: 1,
      "@media (min-width: 768px)": 0,
    },
  },
  navigation: {
    display: {
      default: "grid",
      "@media (min-width: 768px)": "flex",
    },
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  skipLink: {
    position: "fixed",
    top: 8,
    left: 8,
    zIndex: 10,
    padding: "8px 12px",
    borderRadius: 4,
    backgroundColor: "light-dark(oklch(0.268 0.013 320.606), oklch(0.991 0.003 106.448))",
    color: "light-dark(oklch(0.991 0.003 106.448), oklch(0.268 0.013 320.606))",
    transform: {
      default: "translateY(-150%)",
      ":focus-visible": "translateY(0)",
    },
  },
  wordmark: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "8px 10px",
    borderRadius: 10,
  },
  wordmarkTitle: {
    fontSize: 15,
    fontWeight: 650,
    letterSpacing: "-0.01em",
  },
});
