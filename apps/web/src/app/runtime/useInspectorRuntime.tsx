import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSchemaHashes, fetchStoredPermissions, fetchStoredWasmSchema, type StoredPermissionsResponse, type WasmSchema } from "jazz-tools";
import { createJazzClient, type JazzClient } from "jazz-tools/react";

import type { StoredConnection } from "@app/connections/connections";

export interface InspectorRuntimeState {
  client: JazzClient | null;
  wasmSchema: WasmSchema | null;
  storedPermissions: StoredPermissionsResponse | null;
  availableSchemaHashes: string[];
  error: string | null;
  isLoading: boolean;
  clearRuntime: () => void;
}

interface UseInspectorRuntimeOptions {
  connection: StoredConnection | null;
  branch: string | null;
  schemaHash: string | null;
  initialSchemaHashes?: readonly string[];
}

/**
 * Owns the Inspector's Jazz runtime for the selected connection, branch, and schema hash.
 *
 * It creates an in-memory Jazz admin client, loads the stored WASM schema metadata used
 * by the generic data explorer, fetches available schema hashes, and exposes stored
 * permissions when the server can provide them.
 *
 * It starts async work in an effect, then stores resolved data in React state.
 * Consumers read `runtime.wasmSchema`, `runtime.client`, etc.
 */
export function useInspectorRuntime({
  connection,
  branch,
  schemaHash,
  initialSchemaHashes,
}: UseInspectorRuntimeOptions): InspectorRuntimeState {
  const [client, setClient] = useState<JazzClient | null>(null);
  const [wasmSchema, setWasmSchema] = useState<WasmSchema | null>(null);
  const [storedPermissions, setStoredPermissions] = useState<StoredPermissionsResponse | null>(null);
  const [availableSchemaHashes, setAvailableSchemaHashes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Shut down the active client before dropping schema-dependent runtime state.
  const clearRuntime = useCallback(() => {
    setClient((currentClient) => {
      if (currentClient !== null) {
        void currentClient.shutdown();
      }
      return null;
    });
    setWasmSchema(null);
    setStoredPermissions(null);
  }, []);

  useEffect(() => {
    if (connection === null || branch === null || schemaHash === null) {
      clearRuntime();
      setAvailableSchemaHashes([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Guards against stale async work updating state after the selected runtime changes.
    let active = true;
    const isActive = () => active;
    let runtimeClient: JazzClient | null = null;

    setError(null);
    setIsLoading(true);

    const run = async () => {
      try {
        runtimeClient = await createJazzClient({
          appId: connection.appId,
          serverUrl: connection.serverUrl,
          env: connection.env,
          userBranch: branch,
          adminSecret: connection.adminSecret,
          driver: { type: "memory" },
        });

        if (isActive() === false) {
          // The user selected a different runtime while client creation was in flight.
          void runtimeClient.shutdown();
          runtimeClient = null;
          return;
        }

        const schemaHashesRequest =
          initialSchemaHashes !== undefined && initialSchemaHashes.length > 0
            ? Promise.resolve({ hashes: [...initialSchemaHashes] })
            : fetchSchemaHashes(connection.serverUrl, {
                appId: connection.appId,
                adminSecret: connection.adminSecret,
              });
        const [{ schema }, { hashes }, permissions] = await Promise.all([
          fetchStoredWasmSchema(connection.serverUrl, {
            appId: connection.appId,
            adminSecret: connection.adminSecret,
            schemaHash,
          }),
          schemaHashesRequest,
          // Permissions enrich the UI but should not block the runtime if unavailable.
          fetchStoredPermissions(connection.serverUrl, {
            appId: connection.appId,
            adminSecret: connection.adminSecret,
          }).catch(() => null),
        ]);

        if (isActive() === false) {
          // Schema/hash requests can finish after navigation; discard their client and data.
          if (runtimeClient !== null) {
            void runtimeClient.shutdown();
            runtimeClient = null;
          }
          return;
        }

        const nextClient = runtimeClient;

        setClient((currentClient) => {
          if (currentClient !== null) {
            void currentClient.shutdown();
          }
          return nextClient;
        });
        setWasmSchema(schema);
        setStoredPermissions(permissions);
        setAvailableSchemaHashes(hashes);
        setIsLoading(false);
      } catch (runtimeError) {
        if (runtimeClient !== null) {
          void runtimeClient.shutdown();
          runtimeClient = null;
        }

        if (isActive() === false) {
          return;
        }

        setError(runtimeError instanceof Error ? runtimeError.message : String(runtimeError));
        setIsLoading(false);
      }
    };

    clearRuntime();
    void run();

    return () => {
      active = false;
      if (runtimeClient !== null) {
        const clientToShutdown = runtimeClient;
        runtimeClient = null;
        void clientToShutdown.shutdown();
        setClient((currentClient) => (currentClient === clientToShutdown ? null : currentClient));
      }
    };
  }, [branch, clearRuntime, connection, initialSchemaHashes, schemaHash]);

  // Keep the returned object stable for consumers that use it in dependency arrays.
  return useMemo(
    () => ({
      client,
      wasmSchema,
      storedPermissions,
      availableSchemaHashes,
      error,
      isLoading,
      clearRuntime,
    }),
    [availableSchemaHashes, clearRuntime, client, error, isLoading, storedPermissions, wasmSchema],
  );
}
