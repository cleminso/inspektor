import { Box, Button, Text, ToggleGroup } from "@inspector/ds";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useInspector } from "@app/providers/inspectorProvider";
import { appRoutes } from "@app/routing/appRoutes";
import { BranchSwitcher } from "@app/shell/header/branchSwitcher";
import { SchemaSwitcher } from "@app/shell/header/schemaSwitcher";
import { ConnectionSwitcher } from "@shared/connections/connectionSwitcher";

export function InspectorHeader(): React.ReactElement {
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const { currentConnectionId } = useInspector();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";
  const routeParams =
    currentConnectionId === null ? null : { connectionId: currentConnectionId };
  const isTablesActive =
    routeParams !== null &&
    matchRoute({ to: appRoutes.tables, params: routeParams, fuzzy: true }) !== false;
  const isSubscriptionsActive =
    routeParams !== null &&
    matchRoute({ to: appRoutes.queries, params: routeParams, fuzzy: true }) !== false;
  const activeView = isTablesActive === true ? ["tables"] : isSubscriptionsActive === true ? ["subscriptions"] : [];

  return (
    <Box
      as="header"
      width="full"
      flexShrink={0}
      alignItems="center"
      gap="s"
      padding="s"
      backgroundColor="bg-secondary"
      borderBottomWidth={1}
      borderColor="border-secondary"
      borderStyle="solid"
    >
      <Box minWidth={0} flex={1} alignItems="center" gap="none">
        <ConnectionSwitcher width="m" />
        <Box minWidth={0} alignItems="center" gap="s">
          <BranchSwitcher width="s" />
          <Text as="span" color="muted" aria-hidden="true">
            /
          </Text>
          <SchemaSwitcher width="m" />
        </Box>
      </Box>

      <Box as="nav" aria-label="Inspector navigation" flexShrink={0}>
        <ToggleGroup
          value={activeView}
          aria-label="Inspector view"
          disabled={routeParams === null}
          onValueChange={(nextValue) => {
            const selectedView = nextValue[0];

            if (routeParams === null || selectedView === undefined) {
              return;
            }

            void navigate({
              to:
                selectedView === "tables"
                  ? appRoutes.tables
                  : appRoutes.queries,
              params: routeParams,
            });
          }}
        >
          <ToggleGroup.Item
            value="tables"
            aria-current={isTablesActive === true ? "page" : undefined}
          >
            Tables
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="subscriptions"
            aria-current={isSubscriptionsActive === true ? "page" : undefined}
          >
            Subscriptions
          </ToggleGroup.Item>
        </ToggleGroup>
      </Box>

      <Box flex={1} justifyContent="end">
        <Button
          type="button"
          variant="ghost"
          size="s"
          aria-label="Toggle theme"
          iconOnly
          title={isDarkTheme === true ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => {
            setTheme(isDarkTheme === true ? "light" : "dark");
          }}
        >
          {isDarkTheme === true ? <Sun aria-hidden="true" size={14} /> : <Moon aria-hidden="true" size={14} />}
        </Button>
      </Box>
    </Box>
  );
}
