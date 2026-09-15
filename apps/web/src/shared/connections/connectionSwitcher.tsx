import { useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'

import {
  AlertDialog,
  Badge,
  Box,
  Button,
  ButtonLink,
  ContextSwitcher,
  Text,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from '@inspektor/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { getConnectionDisplayName, type StoredConnection } from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'

interface ConnectionSwitcherProps {
  size?: ContextSwitcherTriggerSize
  triggerLabel?: string
  width?: ContextSwitcherTriggerWidth
}

export function ConnectionSwitcher({
  size = 's',
  triggerLabel,
  width = 'content',
}: ConnectionSwitcherProps = {}): React.ReactElement {
  const {
    connections,
    currentConnectionId,
    deleteConnection,
    openConnection,
    runtimeScopeExitBlocked,
  } = useInspectorSessionContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [connectionToRemove, setConnectionToRemove] = useState<StoredConnection | null>(null)
  const contextualConnectionId = triggerLabel === undefined ? currentConnectionId : null
  const activeConnection =
    connections.find((connection) => connection.id === contextualConnectionId) ?? null
  const resolvedTriggerLabel =
    triggerLabel ??
    (activeConnection !== null ? getConnectionDisplayName(activeConnection) : 'Connections')

  const preventBlockedNavigation = (event: React.MouseEvent) => {
    if (runtimeScopeExitBlocked === true) {
      event.preventDefault()
    } else {
      setOpen(false)
    }
  }

  return (
    <>
      <Box
        minWidth={0}
        alignItems="center"
        gap="xxs"
      >
        <ContextSwitcher.Root<StoredConnection>
          items={connections}
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
            if (connection !== null && openConnection(connection.id) === 'accepted') {
              setOpen(false)
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
          <ContextSwitcher.Content width="content">
            {connections.length > 5 ? (
              <ContextSwitcher.Search
                label="Search connections"
                placeholder="Search connections…"
              />
            ) : null}
            {connections.length > 0 ? (
              <ContextSwitcher.Viewport maxHeight="fiveItems">
                {connections.length > 5 ? (
                  <ContextSwitcher.Empty>No matching connections.</ContextSwitcher.Empty>
                ) : null}
                <ContextSwitcher.List>
                  {(connection: StoredConnection) => (
                    <ContextSwitcher.Item
                      key={connection.id}
                      value={connection}
                      description={connection.appId}
                      indicator="none"
                    >
                      <Box
                        as="span"
                        display="inline-flex"
                        minWidth={0}
                        alignItems="center"
                        flexDirection="row"
                        gap="xxs"
                      >
                        <Text
                          as="span"
                          color="inherit"
                          truncate
                        >
                          {getConnectionDisplayName(connection)}
                        </Text>
                        <Badge
                          size="xs"
                          translate="no"
                        >
                          {connection.env}
                        </Badge>
                      </Box>
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
                    Remove saved connection
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
                Add connection
              </ButtonLink>
            </ContextSwitcher.Footer>
          </ContextSwitcher.Content>
        </ContextSwitcher.Root>
        {activeConnection === null ? null : (
          <Badge
            size="s"
            translate="no"
          >
            {activeConnection.env}
          </Badge>
        )}
      </Box>
      <AlertDialog.Root
        open={connectionToRemove !== null}
        onOpenChange={(nextOpen) => {
          if (nextOpen === false) {
            setConnectionToRemove(null)
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Remove saved connection?</AlertDialog.Title>
          <AlertDialog.Description>
            {connectionToRemove === null
              ? null
              : `This removes ${getConnectionDisplayName(connectionToRemove)} and its saved preferences from this browser. It does not affect the Jazz app.`}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Keep saved connection</AlertDialog.Close>
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
              Remove saved connection
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}
