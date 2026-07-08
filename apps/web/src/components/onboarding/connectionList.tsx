import { useState } from "react";

import { Button } from "@regarde/ui/button";
import { EmptyState } from "@regarde/ui/emptyState";

import { useInspector } from "@/components/providers/inspectorProvider";
import { getConnectionDisplayName, getConnectionSecondaryLabel } from "@/lib/config/connections";

export function ConnectionList(): React.ReactElement {
  const { connections, openConnection } = useInspector();
  const [openingConnectionId, setOpeningConnectionId] = useState<string | null>(null);
  const hasConnections = connections.length > 0;

  if (hasConnections === false) {
    return <EmptyState title="No saved connections" description="Add a connection to inspect a Jazz app." />;
  }

  return (
    <div className="flex w-full flex-col gap-1">
      {connections.map((connection) => {
        const isOpening = openingConnectionId === connection.id;

        return (
          <Button
            key={connection.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpeningConnectionId(connection.id);
              void openConnection(connection.id).finally(() => {
                setOpeningConnectionId((currentConnectionId) =>
                  currentConnectionId === connection.id ? null : currentConnectionId,
                );
              });
            }}
            loading={isOpening === true}
            disabled={openingConnectionId !== null && isOpening === false}
            className="h-auto w-full flex-col items-start gap-1 rounded-xs border-transparent px-3 py-1 text-left"
          >
            <span className="text-sm text-foreground">{getConnectionDisplayName(connection)}</span>
            <span className="text-xs leading-4 text-muted-foreground">{getConnectionSecondaryLabel(connection)}</span>
          </Button>
        );
      })}
    </div>
  );
}
