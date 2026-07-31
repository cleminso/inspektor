import { Box, Button } from "@inspector/ds";
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
      flexShrink={0}
      alignItems="center"
      gap="s"
      padding="xs"
      backgroundColor="bg-secondary"
      borderTopWidth={1}
      borderColor="border-secondary"
      borderStyle="solid"
    >
      <Box minWidth={0} flex={1} alignItems="center" gap="xs">
        {leftDock !== undefined ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={leftDockLabel}
            aria-pressed={leftDock.isOpen}
            iconOnly
            title={leftDockLabel}
            onClick={leftDock.onToggle}
          >
            <Table aria-hidden="true" size={12} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Open subscriptions dock"
          iconOnly
          title="Open subscriptions dock"
        >
          <Activity aria-hidden="true" size={12} />
        </Button>
      </Box>
    </Box>
  );
}
