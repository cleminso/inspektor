import { Box, Button, KeyboardInput, Tooltip } from '@inspector/ds'
import { Rss, Search } from 'lucide-react'

import { productGlyphs } from '@app/icons/productGlyphs'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { InspectorDockCenterSlot } from './centerSlot'

export interface InspectorLeftDockControl {
  isOpen: boolean
  onToggle: () => void
}

interface InspectorDockProps {
  leftDock?: InspectorLeftDockControl
  onOpenCommands: () => void
}

export function InspectorDock({
  leftDock,
  onOpenCommands,
}: InspectorDockProps): React.ReactElement {
  const leftDockLabel = leftDock?.isOpen === true ? 'Close left dock' : 'Open left dock'

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
      <Box
        role="group"
        aria-label="dock left"
        minWidth={0}
        flex={1}
        alignItems="center"
      >
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
            <Tooltip.Content>
              {leftDockLabel}{' '}
              <KeyboardInput
                hotkey={appHotkeys.toggleTableNavigator}
                size="small"
              />
            </Tooltip.Content>
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
        <Box
          as="span"
          role="separator"
          aria-label="Command actions"
          aria-orientation="vertical"
          height="icon-size-xs"
          mx="xxs"
          borderLeftWidth={1}
          borderColor="subtle"
          borderStyle="solid"
        />
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="s"
                aria-label="Open commands"
                glyphSize="compact"
                iconOnly
                onClick={onOpenCommands}
              >
                <Button.Glyph artwork={Search} />
              </Button>
            }
          />
          <Tooltip.Content>
            Open commands{' '}
            <KeyboardInput
              hotkey={appHotkeys.openCommandPalette}
              size="small"
            />
          </Tooltip.Content>
        </Tooltip.Root>
      </Box>
      <Box
        flexShrink={0}
        alignItems="center"
        justifyContent="center"
      >
        <InspectorDockCenterSlot />
      </Box>
      <Box
        minWidth={0}
        flex={1}
      />
    </Box>
  )
}
