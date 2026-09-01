import {
  Box,
  Button,
  ButtonLink,
  Icon,
  KeyboardInput,
  Tooltip,
  useShellLayout,
} from '@inspector/ds'
import { useHotkey } from '@tanstack/react-hotkeys'
import { Link, useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { Rss, Search } from 'lucide-react'

import { appHotkeyOptions, runAppHotkey } from '@app/hotkeys/appHotkeys'
import { productGlyphs } from '@app/icons/productGlyphs'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { appRoutes } from '@app/routing/appRoutes'
import { InspectorFooterCenterSlot } from './centerSlot'

interface InspectorFooterProps {
  onOpenCommands: () => void
}

interface WorkspaceDockControlProps {
  artwork: React.ComponentProps<typeof Icon>['artwork']
  connectionId: string
  label: string
  openHotkey: React.ComponentProps<typeof KeyboardInput>['hotkey']
  selected: boolean
  to: typeof appRoutes.tables | typeof appRoutes.queries
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

function WorkspaceDockControl({
  artwork,
  connectionId,
  label,
  openHotkey,
  selected,
  to,
  onClick,
}: WorkspaceDockControlProps): React.ReactElement {
  const actionLabel = `${selected === true ? 'Close' : 'Open'} ${label}`

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <ButtonLink
            variant="ghost"
            size="s"
            aria-label={actionLabel}
            aria-current={selected === true ? 'page' : 'false'}
            iconOnly
            onClick={onClick}
            render={
              <Link
                to={to}
                params={{ connectionId }}
              />
            }
          >
            <Icon
              artwork={artwork}
              size="xs"
            />
          </ButtonLink>
        }
      />
      <Tooltip.Content>
        {actionLabel}{' '}
        <KeyboardInput
          hotkey={selected === true ? appHotkeys.toggleLeftDock : openHotkey}
          size="small"
        />
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

export function InspectorFooter({ onOpenCommands }: InspectorFooterProps): React.ReactElement {
  const { connectionId } = useParams({ from: appRoutes.connection })
  const navigate = useNavigate()
  const { isOpen, toggle } = useShellLayout().leftDock
  const isQueriesActive = useRouterState({
    select: (state) => state.location.pathname.endsWith('/queries'),
  })

  const isTablesSelected = isOpen === true && isQueriesActive === false
  const isQueriesSelected = isOpen === true && isQueriesActive === true
  const openTables = () => {
    if (isOpen === false) toggle()
    void navigate({ to: appRoutes.tables, params: { connectionId } })
  }
  const openQueries = () => {
    if (isOpen === false) toggle()
    void navigate({ to: appRoutes.queries, params: { connectionId } })
  }
  const toggleDockFromLink = (event: React.MouseEvent, selected: boolean) => {
    if (selected === true) event.preventDefault()
    if (selected === true || isOpen === false) toggle()
  }

  useHotkey(appHotkeys.toggleLeftDock, (event) => runAppHotkey(event, toggle), appHotkeyOptions)
  useHotkey(appHotkeys.openTablesDock, (event) => runAppHotkey(event, openTables), appHotkeyOptions)
  useHotkey(
    appHotkeys.openQueriesDock,
    (event) => runAppHotkey(event, openQueries),
    appHotkeyOptions,
  )

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
        <WorkspaceDockControl
          artwork={productGlyphs.table}
          connectionId={connectionId}
          label="tables"
          openHotkey={appHotkeys.openTablesDock}
          selected={isTablesSelected}
          to={appRoutes.tables}
          onClick={(event) => toggleDockFromLink(event, isTablesSelected)}
        />
        <WorkspaceDockControl
          artwork={Rss}
          connectionId={connectionId}
          label="subscriptions"
          openHotkey={appHotkeys.openQueriesDock}
          selected={isQueriesSelected}
          to={appRoutes.queries}
          onClick={(event) => toggleDockFromLink(event, isQueriesSelected)}
        />
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
        <InspectorFooterCenterSlot />
      </Box>
      <Box
        minWidth={0}
        flex={1}
      />
    </Box>
  )
}
