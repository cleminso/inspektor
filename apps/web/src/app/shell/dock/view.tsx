import { Box, Button, Icon, Tooltip } from "@inspector/ds";
import { Activity, Table } from "lucide-react";

export interface InspectorLeftDockControl {
  isOpen: boolean;
  onToggle: () => void;
}

interface InspectorDockProps {
  leftDock?: InspectorLeftDockControl;
}

export function InspectorDock({ leftDock }: InspectorDockProps): React.ReactElement {
  const leftDockLabel = leftDock?.isOpen === true ? "Close left dock" : "Open left dock";

  return (
    <Box
      as="footer"
      width="full"
      height="control-height-l"
      flexShrink={0}
      alignItems="center"
      gap="s"
      paddingVertical="s"
      paddingHorizontal="xs"
      backgroundColor="bg-page"
      data-height="fixed"
    >
      <Box minWidth={0} flex={1} alignItems="center" gap="xs">
        {leftDock !== undefined ? (
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={leftDockLabel}
                  aria-pressed={leftDock.isOpen}
                  iconOnly
                  onClick={leftDock.onToggle}
                >
                  <Icon render={<Table />} size="xs" />
                </Button>
              }
            />
            <Tooltip.Content>{leftDockLabel}</Tooltip.Content>
          </Tooltip.Root>
        ) : null}
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label="Open subscriptions dock"
                iconOnly
              >
                <Icon render={<Activity />} size="xs" />
              </Button>
            }
          />
          <Tooltip.Content>Open subscriptions dock</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Box>
  );
}
