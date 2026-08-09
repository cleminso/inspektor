import { useCallback, useRef, useState } from "react";

export type ConnectionOpenResult = "opened" | "ignored";

type PerformConnectionOpen = (
  connectionId: string,
  knownSchemaHashes?: readonly string[],
) => Promise<void>;

interface ConnectionOpenCoordinator {
  openingConnectionId: string | null;
  openConnection: (
    connectionId: string,
    knownSchemaHashes?: readonly string[],
  ) => Promise<ConnectionOpenResult>;
}

export function useConnectionOpenCoordinator(
  performOpen: PerformConnectionOpen,
): ConnectionOpenCoordinator {
  const requestRef = useRef<Promise<ConnectionOpenResult> | null>(null);
  const [openingConnectionId, setOpeningConnectionId] = useState<string | null>(null);

  const openConnection = useCallback(
    (
      connectionId: string,
      knownSchemaHashes?: readonly string[],
    ): Promise<ConnectionOpenResult> => {
      if (requestRef.current !== null) {
        return Promise.resolve("ignored");
      }

      setOpeningConnectionId(connectionId);
      const request = performOpen(connectionId, knownSchemaHashes).then(() => "opened" as const);
      requestRef.current = request;

      return request.finally(() => {
        if (requestRef.current === request) {
          requestRef.current = null;
          setOpeningConnectionId(null);
        }
      });
    },
    [performOpen],
  );

  return { openingConnectionId, openConnection };
}
