import * as stylex from "@stylexjs/stylex";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { type ReactElement } from "react";

import { navSections } from "@/lib/registry";

export function AppShell(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div {...stylex.props(styles.shell)}>
      <aside {...stylex.props(styles.sidebar)}>
        <Link to="/" {...stylex.props(styles.wordmark)}>
          <span {...stylex.props(styles.wordmarkTitle)}>Inspector</span>
          <span {...stylex.props(styles.wordmarkSubtitle)}>Design System</span>
        </Link>

        <nav {...stylex.props(styles.navigation)} aria-label="Design system navigation">
          {navSections.map((section) => (
            <section key={section.title} {...stylex.props(styles.navSection)}>
              <h2 {...stylex.props(styles.navSectionTitle)}>{section.title}</h2>
              <div {...stylex.props(styles.navItems)}>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      {...stylex.props(styles.navItem, isActive === true && styles.navItemActive)}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = stylex.create({
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    backgroundColor: "oklch(0.962 0.002 286)",
    color: "oklch(0.145 0 0)",
  },
  sidebar: {
    position: "sticky",
    top: 0,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    padding: 20,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: "oklch(0.89 0.004 286)",
    backgroundColor: "oklch(0.985 0 0)",
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
  wordmarkSubtitle: {
    fontSize: 12,
    color: "oklch(0.46 0.006 286)",
  },
  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  navSectionTitle: {
    margin: 0,
    padding: "0 10px",
    fontSize: 11,
    fontWeight: 650,
    color: "oklch(0.52 0.006 286)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  navItems: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 9,
    fontSize: 14,
    color: "oklch(0.34 0.006 286)",
  },
  navItemActive: {
    backgroundColor: "oklch(0.94 0.005 286)",
    color: "oklch(0.145 0 0)",
  },
  main: {
    minWidth: 0,
    padding: 12,
  },
});
