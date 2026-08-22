import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import { Link } from '@tanstack/react-router'

import {
  ButtonLink,
  ContextSwitcher,
  Icon,
  Text,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from '@inspector/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import {
  getConnectionDisplayName,
  type StoredConnection,
} from '@app/connections/connections'
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
  const { connections, currentConnectionId } = useInspectorSessionContext()
  const openConnection = useSavedConnectionOpen()
  const [open, setOpen] = useState(false)
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null)

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

        if (nextOpen === false) {
          setHoveredConnectionId(null)
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
        {orderedConnections.length > 1 ? (
          <ContextSwitcher.Search
            label="Search connections"
            placeholder="Search connections…"
          />
        ) : null}
        {orderedConnections.length > 0 ? (
          <ContextSwitcher.Viewport maxHeight="l">
            {orderedConnections.length > 1 ? (
              <ContextSwitcher.Empty>No matching connections.</ContextSwitcher.Empty>
            ) : null}
            <ContextSwitcher.List>
              {(connection: StoredConnection) => (
                <ContextSwitcher.Item
                  key={connection.id}
                  value={connection}
                  indicator="none"
                  onMouseEnter={() => {
                    setHoveredConnectionId(connection.id)
                  }}
                  onMouseLeave={() => {
                    setHoveredConnectionId(null)
                  }}
                >
                  <ContextSwitcher.ItemText
                    label={getConnectionDisplayName(connection)}
                    description={connection.appId}
                  />
                  {connection.id !== currentConnectionId &&
                  connection.id === hoveredConnectionId ? (
                    <Icon artwork={ArrowRight} size="s" />
                  ) : null}
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
