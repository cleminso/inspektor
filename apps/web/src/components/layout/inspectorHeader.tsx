import { Box, Button, Text, ToggleGroup } from "@inspector/ds";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { BranchSwitcher, ConnectionSwitcher, SchemaSwitcher } from "@/components/navigation";
import { useInspector } from "@/components/providers/inspectorProvider";
import { appRoutes } from "@/lib/navigation/appRoutes";

export function InspectorHeader(): React.ReactElement {
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";
  const routeParams =
    currentConnectionId !== null && currentBranch !== null && currentSchemaHash !== null
      ? {
          branch: currentBranch,
          connectionId: currentConnectionId,
          schemaHash: currentSchemaHash,
        }
      : null;
  const isTablesActive =
    routeParams !== null &&
    matchRoute({ to: appRoutes.tables, params: routeParams, fuzzy: true }) !== false;
  const isSubscriptionsActive =
    routeParams !== null &&
    matchRoute({ to: appRoutes.QuerySubscriptions, params: routeParams, fuzzy: true }) !== false;
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
                  : appRoutes.QuerySubscriptions,
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
          shape="square"
          aria-label="Toggle theme"
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
