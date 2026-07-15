import { useMemo, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { Button, ContextSwitcher, Text } from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  getConnectionDisplayName,
  getConnectionSecondaryLabel,
  type StoredConnection,
} from "@/lib/config/connections";
import { appRoutes } from "@/lib/navigation/appRoutes";

interface ConnectionSwitcherProps {
  placement?: "default" | "header";
  triggerLabel?: string;
  width?: "auto" | "md";
}

function sortConnections(
  connections: StoredConnection[],
  currentConnectionId: string | null,
): StoredConnection[] {
  const activeConnections = connections.filter((connection) => connection.id === currentConnectionId);
  const inactiveConnections = connections.filter((connection) => connection.id !== currentConnectionId);

  return [...activeConnections, ...inactiveConnections];
}

export function ConnectionSwitcher({
  placement = "default",
  triggerLabel,
  width = "auto",
}: ConnectionSwitcherProps = {}): React.ReactElement {
  const { connections, currentConnectionId, openConnection } = useInspector();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const orderedConnections = useMemo(
    () => sortConnections(connections, currentConnectionId),
    [connections, currentConnectionId],
  );
  const activeConnection =
    orderedConnections.find((connection) => connection.id === currentConnectionId) ?? null;
  const resolvedTriggerLabel =
    triggerLabel ??
    (activeConnection !== null && activeConnection.id === currentConnectionId
      ? getConnectionDisplayName(activeConnection)
      : "Open connections");

  return (
    <ContextSwitcher.Root<StoredConnection>
      items={orderedConnections}
      value={activeConnection}
      itemToStringLabel={getConnectionDisplayName}
      itemToStringValue={(connection) => connection.id}
      isItemEqualToValue={(connection, selected) => connection.id === selected.id}
      filter={(connection, query) =>
        `${connection.name} ${connection.appId}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      }
      open={open}
      onOpenChange={setOpen}
      onValueChange={(connection) => {
        if (connection !== null) {
          void openConnection(connection.id);
        }
      }}
    >
      <ContextSwitcher.Trigger
        label="Switch connection"
        size={placement === "header" ? "m" : "l"}
        width={width === "md" ? "m" : "content"}
      >
        <Text as="span" color="inherit" truncate>
          {resolvedTriggerLabel}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Popup>
        <ContextSwitcher.Search
          label="Search connections"
          placeholder="Search connections"
        />
        <ContextSwitcher.Content maxHeight="l">
          <ContextSwitcher.Empty>No saved connections.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(connection: StoredConnection) => (
              <ContextSwitcher.Item key={connection.id} value={connection}>
                <ContextSwitcher.ItemText
                  label={getConnectionDisplayName(connection)}
                  description={getConnectionSecondaryLabel(connection)}
                />
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Content>
        <ContextSwitcher.Footer>
          <Button
            variant="ghost"
            size="s"
            fullWidth
            justify="start"
            onClick={() => {
              setOpen(false);
              void navigate({ to: appRoutes.newConnection });
            }}
          >
            Add new connection
          </Button>
        </ContextSwitcher.Footer>
      </ContextSwitcher.Popup>
    </ContextSwitcher.Root>
  );
}
