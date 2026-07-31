import { Box, Button, Text } from "@inspector/ds";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { BranchSwitcher } from "@app/shell/header/branchSwitcher";
import { SchemaSwitcher } from "@app/shell/header/schemaSwitcher";
import { ConnectionSwitcher } from "@shared/connections/connectionSwitcher";

export function InspectorHeader(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

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
          {isDarkTheme === true ? (
            <Sun aria-hidden="true" size={14} />
          ) : (
            <Moon aria-hidden="true" size={14} />
          )}
        </Button>
      </Box>
    </Box>
  );
}
