import { Box, Button, Icon } from "@inspector/ds";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, PanelLeft, PanelRight } from "lucide-react";
import { type ReactElement } from "react";

import { SourceLink } from "@/components/docs/sourceLink";
import { navigationItems, type NavItem } from "@/lib/registry";
import { useAppShellLayout } from "@/layout/appShellLayout";

interface DocsHeaderProps {
  item: NavItem;
}

export function DocsHeader({ item }: DocsHeaderProps): ReactElement {
  const { isControlsOpen, isNavigationOpen, toggleControls, toggleNavigation } =
    useAppShellLayout();
  const navigate = useNavigate();
  const itemIndex = navigationItems.findIndex(
    (navigationItem) => navigationItem.href === item.href,
  );
  const previousItem = itemIndex >= 0 ? navigationItems.at(itemIndex - 1) : undefined;
  const nextItem =
    itemIndex >= 0 ? (navigationItems[itemIndex + 1] ?? navigationItems[0]) : undefined;

  const navigatePrevious = (): void => {
    if (previousItem !== undefined) {
      void navigate({ to: previousItem.href });
    }
  };

  const navigateNext = (): void => {
    if (nextItem !== undefined) {
      void navigate({ to: nextItem.href });
    }
  };

  return (
    <Box
      as="header"
      alignItems="center"
      justifyContent="between"
      gap="l"
      flexShrink={0}
      padding="m"
      backgroundColor="bg-page"
    >
      <Box alignItems="center" gap="m" minWidth={0}>
        <Button
          variant="ghost"
          size="s"
          radius="s"
          iconOnly
          aria-label={isNavigationOpen === true ? "Hide navigation" : "Show navigation"}
          aria-pressed={isNavigationOpen}
          onClick={toggleNavigation}
        >
          <Icon render={<PanelLeft />} size="s" />
        </Button>
        <SourceLink source={item.source} title={item.title} />
      </Box>
      <Box alignItems="center" gap="none">
        <Button
          variant="ghost"
          size="s"
          radius="s"
          iconOnly
          aria-label={
            previousItem !== undefined ? `Previous page: ${previousItem.title}` : "No previous page"
          }
          disabled={previousItem === undefined}
          onClick={navigatePrevious}
        >
          <Icon render={<ArrowLeft />} size="s" />
        </Button>
        <Button
          variant="ghost"
          size="s"
          radius="s"
          iconOnly
          aria-label={nextItem !== undefined ? `Next page: ${nextItem.title}` : "No next page"}
          disabled={nextItem === undefined}
          onClick={navigateNext}
        >
          <Icon render={<ArrowRight />} size="s" />
        </Button>
        {item.componentId !== undefined ? (
          <Button
            variant="ghost"
            size="s"
            radius="s"
            iconOnly
            aria-label={isControlsOpen === true ? "Hide controls" : "Show controls"}
            aria-pressed={isControlsOpen}
            onClick={toggleControls}
          >
            <Icon render={<PanelRight />} size="s" />
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
