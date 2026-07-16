import { Box, Button, Text } from "@inspector/ds";
import * as stylex from "@stylexjs/stylex";
import { HeadContent, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactElement } from "react";

import { navSections } from "@/lib/registry";

const shellMaxWidth = {
  base: 1220,
  xl: 1440,
} as const;

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
      {resolvedTheme === "dark" ? (
        <Sun aria-hidden="true" size={16} />
      ) : (
        <Moon aria-hidden="true" size={16} />
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
        display="block"
        backgroundColor="bg-surface"
        color="text-primary"
        paddingHorizontal={{ base: "xl", md: "5xl" }}
        {...stylex.props(styles.page)}
      >
        <Box as="header" display="block" maxWidth={shellMaxWidth} {...stylex.props(styles.header)}>
          <Box
            display="grid"
            backgroundColor="bg-page"
            borderColor="border"
            borderStyle="solid"
            {...stylex.props(styles.headerInner)}
          >
            <Box
              alignItems="center"
              borderColor="border"
              borderStyle="solid"
              borderTopWidth={0}
              borderRightWidth={1}
              borderBottomWidth={0}
              borderLeftWidth={0}
              {...stylex.props(styles.brandRegion)}
            >
              <Link to="/" {...stylex.props(styles.brandLink)}>
                <span {...stylex.props(styles.brandTitle)}>Inspector Design System</span>
              </Link>
            </Box>

            <Box alignItems="center" justifyContent="end" {...stylex.props(styles.headerActions)}>
              <ThemeSwitch />
            </Box>
          </Box>
        </Box>

        <Box display="block">
          <Box
            display="grid"
            backgroundColor="bg-surface"
            borderColor="border"
            borderStyle="solid"
            maxWidth={shellMaxWidth}
            {...stylex.props(styles.shell)}
          >
            <Box
              as="aside"
              flexDirection="column"
              gap="3xl"
              borderStyle="solid"
              borderTopWidth={0}
              borderRightWidth={1}
              borderBottomWidth={0}
              borderLeftWidth={0}
              borderColor="border"
              backgroundColor="bg-surface"
              {...stylex.props(styles.sidebar)}
            >
              <Box
                as="nav"
                flexDirection="column"
                gap="2xl"
                aria-label="Design system navigation"
              >
                {navSections.map((section) => (
                  <Box as="section" key={section.title} flexDirection="column" gap="m">
                    <Box as="span" {...stylex.props(styles.sectionTitle)}>
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

            <Box
              id="main-content"
              as="main"
              display="block"
              minWidth={0}
              padding="l"
            >
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

const styles = stylex.create({
  page: {
    minHeight: "100vh",
  },
  header: {
    flexShrink: 0,
    marginInline: "auto",
    position: "sticky",
    top: 0,
    width: "100%",
    zIndex: 100,
  },
  headerInner: {
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 0,
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      "@media (min-width: 1280px)": "260px minmax(0, 1fr)",
    },
    minHeight: 65,
    width: "100%",
  },
  brandRegion: {
    gap: 16,
    minWidth: 0,
    paddingBlock: 16,
    paddingLeft: 22,
  },
  brandLink: {
    alignItems: "center",
    display: "flex",
    gap: 16,
    minWidth: 0,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "-0.32px",
    lineHeight: "24px",
    whiteSpace: "nowrap",
  },
  headerActions: {
    flexGrow: 1,
    padding: 16,
  },
  shell: {
    borderBottomWidth: 0,
    borderLeftWidth: {
      default: 0,
      "@media (min-width: 1280px)": 1,
    },
    borderRightWidth: {
      default: 0,
      "@media (min-width: 1280px)": 1,
    },
    borderTopWidth: 0,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1280px)": "260px minmax(0, 1fr)",
    },
    marginInline: "auto",
    minHeight: "calc(100vh - 65px)",
    width: "100%",
  },
  sidebar: {
    alignSelf: "start",
    display: {
      default: "none",
      "@media (min-width: 1280px)": "flex",
    },
    height: "calc(100vh - 65px)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingBlock: 24,
    position: "sticky",
    top: 65,
    width: 260,
  },
  sectionTitle: {
    paddingLeft: 8,
  },
  skipLink: {
    backgroundColor: "light-dark(oklch(0.268 0.013 320.606), oklch(0.991 0.003 106.448))",
    borderRadius: 4,
    color: "light-dark(oklch(0.991 0.003 106.448), oklch(0.268 0.013 320.606))",
    left: 8,
    padding: "8px 12px",
    position: "fixed",
    top: 8,
    transform: {
      default: "translateY(-150%)",
      ":focus-visible": "translateY(0)",
    },
    zIndex: 101,
  },
});
