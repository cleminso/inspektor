import { useMemo, useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'

import {
  AlertDialog,
  Box,
  Button,
  ButtonLink,
  ContextSwitcher,
  Text,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from '@inspector/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { getConnectionDisplayName, type StoredConnection } from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'

import { useSavedConnectionOpen } from './useSavedConnectionOpen'

interface ConnectionSwitcherProps {
  size?: ContextSwitcherTriggerSize
  triggerLabel?: string
  width?: ContextSwitcherTriggerWidth
}

function sortConnections(
  connections: StoredConnection[],
  currentConnectionId: string | null,
): StoredConnection[] {
  const activeConnections = connections.filter(
    (connection) => connection.id === currentConnectionId,
  )
  const inactiveConnections = connections.filter(
    (connection) => connection.id !== currentConnectionId,
  )

  return [...activeConnections, ...inactiveConnections]
}

export function ConnectionSwitcher({
  size = 's',
  triggerLabel,
  width = 'content',
}: ConnectionSwitcherProps = {}): React.ReactElement {
  const { connections, currentConnectionId, deleteConnection, runtimeScopeExitBlocked } =
    useInspectorSessionContext()
  const openConnection = useSavedConnectionOpen()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [connectionToRemove, setConnectionToRemove] = useState<StoredConnection | null>(null)

  const orderedConnections = useMemo(
    () => sortConnections(connections, currentConnectionId),
    [connections, currentConnectionId],
  )
  const activeConnection =
    orderedConnections.find((connection) => connection.id === currentConnectionId) ?? null
  const resolvedTriggerLabel =
    triggerLabel ??
    (activeConnection !== null && activeConnection.id === currentConnectionId
      ? getConnectionDisplayName(activeConnection)
      : 'Open connections')

  const preventBlockedNavigation = (event: React.MouseEvent) => {
    if (runtimeScopeExitBlocked === true) {
      event.preventDefault()
    } else {
      setOpen(false)
    }
  }

  return (
    <>
      <ContextSwitcher.Root<StoredConnection>
        items={orderedConnections}
        value={activeConnection}
        itemToStringLabel={getConnectionDisplayName}
        itemToStringValue={(connection) => connection.id}
        isItemEqualToValue={(connection, selected) => connection.id === selected.id}
        filter={(connection, query) =>
          `${getConnectionDisplayName(connection)} ${connection.appId}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        }
        open={open}
        onOpenChange={(nextOpen, details) => {
          if (nextOpen === false && details.reason === 'item-press') {
            return
          }
          setOpen(nextOpen)
        }}
        onValueChange={(connection) => {
          if (connection !== null) {
            setOpen(false)
            openConnection(connection.id)
          }
        }}
      >
        <ContextSwitcher.Trigger
          label="Switch connection"
          size={size}
          width={width}
        >
          <Text
            as="span"
            color="inherit"
            truncate
          >
            {resolvedTriggerLabel}
          </Text>
        </ContextSwitcher.Trigger>
        <ContextSwitcher.Content>
          {orderedConnections.length > 5 ? (
            <ContextSwitcher.Search
              label="Search connections"
              placeholder="Search connections…"
            />
          ) : null}
          {orderedConnections.length > 0 ? (
            <ContextSwitcher.Viewport maxHeight="fiveItems">
              {orderedConnections.length > 5 ? (
                <ContextSwitcher.Empty>No matching connections.</ContextSwitcher.Empty>
              ) : null}
              <ContextSwitcher.List>
                {(connection: StoredConnection) => (
                  <ContextSwitcher.Item
                    key={connection.id}
                    value={connection}
                    indicator="none"
                  >
                    <ContextSwitcher.ItemText
                      label={getConnectionDisplayName(connection)}
                      description={connection.appId}
                    />
                  </ContextSwitcher.Item>
                )}
              </ContextSwitcher.List>
            </ContextSwitcher.Viewport>
          ) : null}
          {activeConnection !== null ? (
            <ContextSwitcher.Footer>
              <Box flexDirection="column">
                <ButtonLink
                  variant="ghost"
                  size="s"
                  layout="row"
                  render={
                    <Link
                      to={appRoutes.editConnection}
                      params={{ connectionId: activeConnection.id }}
                    />
                  }
                  onClick={preventBlockedNavigation}
                >
                  Edit connection
                </ButtonLink>
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  layout="row"
                  onClick={() => {
                    if (runtimeScopeExitBlocked === false) {
                      setConnectionToRemove(activeConnection)
                    }
                  }}
                >
                  Remove connection
                </Button>
              </Box>
            </ContextSwitcher.Footer>
          ) : null}
          <ContextSwitcher.Footer>
            <ButtonLink
              variant="ghost"
              size="s"
              layout="row"
              render={<Link to={appRoutes.newConnection} />}
              onClick={preventBlockedNavigation}
            >
              Add new connection
            </ButtonLink>
          </ContextSwitcher.Footer>
        </ContextSwitcher.Content>
      </ContextSwitcher.Root>
      <AlertDialog.Root
        open={connectionToRemove !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen === false) {
            setConnectionToRemove(null)
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Remove connection?</AlertDialog.Title>
          <AlertDialog.Description>
            {connectionToRemove === null
              ? null
              : `Remove ${getConnectionDisplayName(connectionToRemove)} and its saved preferences from this browser? This does not affect the Jazz app.`}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Keep connection</AlertDialog.Close>
            <Button
              variant="danger"
              onClick={() => {
                if (connectionToRemove === null || runtimeScopeExitBlocked === true) {
                  return
                }

                deleteConnection(connectionToRemove.id)
                setConnectionToRemove(null)
                setOpen(false)
                void navigate({ to: appRoutes.connections })
              }}
            >
              Remove connection
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}
