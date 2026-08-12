import { Box, Button, Tooltip } from "@inspector/ds";
import { Rss } from "lucide-react";

import { productGlyphs } from "@app/icons/productGlyphs";

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
      paddingVertical="s"
      paddingHorizontal="xs"
      backgroundColor="surface-background"
    >
      <Box minWidth={0} flex={1} alignItems="center" gap="xs">
        {leftDock !== undefined ? (
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  aria-label={leftDockLabel}
                  aria-pressed={leftDock.isOpen}
                  glyphSize="compact"
                  iconOnly
                  onClick={leftDock.onToggle}
                >
                  <Button.Glyph artwork={productGlyphs.table} />
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
                size="s"
                aria-label="Open subscriptions dock"
                glyphSize="compact"
                iconOnly
              >
                <Button.Glyph artwork={Rss} />
              </Button>
            }
          />
          <Tooltip.Content>Open subscriptions dock</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Box>
  );
}
