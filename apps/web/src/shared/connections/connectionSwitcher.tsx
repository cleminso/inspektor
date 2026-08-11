import { useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'

import {
  ButtonLink,
  ContextSwitcher,
  Text,
  toasts,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from '@inspector/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import {
  getConnectionDisplayName,
  getConnectionSecondaryLabel,
  type StoredConnection,
} from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'
import { normalizeConnectionOpenError } from '@app/connections/connectionValidation'

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
  const { connections, currentConnectionId, openingConnectionId, openConnection } =
    useInspectorSessionContext()
  const [open, setOpen] = useState(false)

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

  return (
    <ContextSwitcher.Root<StoredConnection>
      items={orderedConnections}
      value={activeConnection}
      itemToStringLabel={getConnectionDisplayName}
      itemToStringValue={(connection) => connection.id}
      isItemEqualToValue={(connection, selected) => connection.id === selected.id}
      filter={(connection, query) =>
        `${connection.name} ${connection.appId}`.toLowerCase().includes(query.trim().toLowerCase())
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
          void openConnection(connection.id)
            .then((result) => {
              if (result === 'opened') {
                setOpen(false)
              }
            })
            .catch((error: unknown) => {
              const normalizedError = normalizeConnectionOpenError(error)
              toasts.error(normalizedError.title, { description: normalizedError.description })
            })
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
        {orderedConnections.length > 1 ? (
          <ContextSwitcher.Search
            label="Search connections"
            placeholder="Search connections…"
          />
        ) : null}
        {orderedConnections.length > 0 ? (
          <ContextSwitcher.Viewport maxHeight="l">
            {openingConnectionId !== null ? (
              <ContextSwitcher.Status>Opening connection…</ContextSwitcher.Status>
            ) : null}
            {orderedConnections.length > 1 ? (
              <ContextSwitcher.Empty>No matching connections.</ContextSwitcher.Empty>
            ) : null}
            <ContextSwitcher.List>
              {(connection: StoredConnection) => (
                <ContextSwitcher.Item
                  key={connection.id}
                  value={connection}
                  disabled={openingConnectionId !== null}
                >
                  <ContextSwitcher.ItemText
                    label={getConnectionDisplayName(connection)}
                    description={getConnectionSecondaryLabel(connection)}
                  />
                </ContextSwitcher.Item>
              )}
            </ContextSwitcher.List>
          </ContextSwitcher.Viewport>
        ) : null}
        <ContextSwitcher.Footer>
          <ButtonLink
            variant="ghost"
            size="s"
            layout="row"
            render={<Link to={appRoutes.newConnection} />}
            onClick={() => {
              setOpen(false)
            }}
          >
            Add new connection
          </ButtonLink>
        </ContextSwitcher.Footer>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}
