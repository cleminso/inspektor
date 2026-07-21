import { Children, isValidElement } from "react";

import { Box, Button } from "@inspector/ds";
import { ListFilter } from "lucide-react";

import { SidePanelLayout } from "@/components/layout/sidePanelLayout";

interface ActionsBarProps {
  children?: React.ReactNode;
  filterCount?: number;
  isFilterOpen?: boolean;
  onFilterOpenChange?: (open: boolean) => void;
}

interface ActionsBarSectionProps {
  children?: React.ReactNode;
}

function ActionsBarLeading({ children }: ActionsBarSectionProps): React.ReactNode {
  return children;
}

function ActionsBarTrailing({ children }: ActionsBarSectionProps): React.ReactNode {
  return children;
}

function ActionsBarRoot({
  children,
  filterCount = 0,
  isFilterOpen = false,
  onFilterOpenChange,
}: ActionsBarProps): React.ReactElement {
  const canShowFilters = onFilterOpenChange !== undefined;
  const leadingChildren: React.ReactNode[] = [];
  const trailingChildren: React.ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (
      isValidElement<ActionsBarSectionProps>(child) === true &&
      child.type === ActionsBarLeading
    ) {
      leadingChildren.push(child.props.children);
      return;
    }

    if (
      isValidElement<ActionsBarSectionProps>(child) === true &&
      child.type === ActionsBarTrailing
    ) {
      trailingChildren.push(child.props.children);
      return;
    }

    trailingChildren.push(child);
  });

  return (
    <Box
      width="full"
      flexShrink={0}
      alignItems="center"
      justifyContent="between"
      gap="s"
      padding="s"
      backgroundColor="bg-page"
      borderBottomWidth={1}
      borderColor="border-secondary"
      borderStyle="solid"
    >
      <Box alignItems="center" gap="s">
        <SidePanelLayout.Toggle label="Toggle table list" />
        {canShowFilters === true ? (
          <Button
            type="button"
            variant={isFilterOpen === true ? "secondary" : "ghost"}
            size="s"
            shape="square"
            aria-pressed={isFilterOpen}
            aria-label="Toggle filters"
            title={filterCount > 0 ? `Filters (${filterCount})` : "Filters"}
            onClick={() => {
              onFilterOpenChange(isFilterOpen === false);
            }}
          >
            <ListFilter aria-hidden="true" size={14} />
          </Button>
        ) : null}
        {leadingChildren}
      </Box>
      <Box alignItems="center" gap="s">
        {trailingChildren}
      </Box>
    </Box>
  );
}

export const ActionsBar = Object.assign(ActionsBarRoot, {
  Leading: ActionsBarLeading,
  Trailing: ActionsBarTrailing,
});
