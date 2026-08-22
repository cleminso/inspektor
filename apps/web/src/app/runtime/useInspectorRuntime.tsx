import { useEffect, useMemo } from "react";
import { atom, type ReadableAtom, type WritableAtom } from "nanostores";

import {
  fetchSchemaHashes,
  fetchStoredPermissions,
  fetchStoredWasmSchema,
  type StoredPermissionsResponse,
  type WasmSchema,
} from "jazz-tools";
import type { JazzClient } from "jazz-tools/react";

import type { StoredConnection } from "@app/connections/connections";
import {
  normalizeRuntimeError,
  reportRuntimeError,
  type InspectorRuntimeError,
} from "@app/runtime/runtimeError";
import { readCachedWasmSchema, writeCachedWasmSchema } from "@app/runtime/wasmSchemaCache";

export interface InspectorRuntimeStore {
  $availableSchemaHashes: ReadableAtom<readonly string[]>;
  $client: ReadableAtom<JazzClient | null>;
  $error: ReadableAtom<InspectorRuntimeError | null>;
  $isSchemaHashesLoading: ReadableAtom<boolean>;
  $isPermissionsLoading: ReadableAtom<boolean>;
  $isWasmSchemaLoading: ReadableAtom<boolean>;
  $storedPermissions: ReadableAtom<StoredPermissionsResponse | null>;
  $wasmSchema: ReadableAtom<WasmSchema | null>;
  clearClient: (client: JazzClient) => void;
  clearRuntime: () => void;
  publishClient: (client: JazzClient) => void;
  publishClientError: (error: unknown) => void;
}

interface MutableInspectorRuntimeStore extends InspectorRuntimeStore {
  $availableSchemaHashes: WritableAtom<readonly string[]>;
  $client: WritableAtom<JazzClient | null>;
  $error: WritableAtom<InspectorRuntimeError | null>;
  $isSchemaHashesLoading: WritableAtom<boolean>;
  $isPermissionsLoading: WritableAtom<boolean>;
  $isWasmSchemaLoading: WritableAtom<boolean>;
  $storedPermissions: WritableAtom<StoredPermissionsResponse | null>;
  $wasmSchema: WritableAtom<WasmSchema | null>;
}

interface UseInspectorRuntimeOptions {
  connection: StoredConnection | null;
  branch: string | null;
  schemaHash: string | null;
  initialSchemaHashes?: readonly string[];
  retryGeneration?: number;
}

function createInspectorRuntimeStore(
  initialSchema: WasmSchema | null,
  isSchemaHashesLoading: boolean,
  isWasmSchemaLoading: boolean,
  sensitiveValues: readonly string[],
): MutableInspectorRuntimeStore {
  const $client = atom<JazzClient | null>(null);
  const $wasmSchema = atom<WasmSchema | null>(initialSchema);
  const $storedPermissions = atom<StoredPermissionsResponse | null>(null);
  const $availableSchemaHashes = atom<readonly string[]>([]);
  const $error = atom<InspectorRuntimeError | null>(null);
  const $isSchemaHashesLoading = atom(isSchemaHashesLoading);
  const $isPermissionsLoading = atom(isWasmSchemaLoading);
  const $isWasmSchemaLoading = atom(isWasmSchemaLoading);

  const publishClient = (client: JazzClient) => {
    $client.set(client);
  };

  const clearClient = (client: JazzClient) => {
    // Cleanup from an old provider must not clear a replacement client published into this store.
    if ($client.get() === client) {
      $client.set(null);
    }
  };

  const publishClientError = (error: unknown) => {
    $client.set(null);
    const runtimeError = { source: "client", error: normalizeRuntimeError(error) } as const;
    $error.set(runtimeError);
    reportRuntimeError(runtimeError, sensitiveValues);
  };

  const clearRuntime = () => {
    $client.set(null);
    $wasmSchema.set(null);
    $storedPermissions.set(null);
    $availableSchemaHashes.set([]);
    $isSchemaHashesLoading.set(false);
    $isPermissionsLoading.set(false);
    $isWasmSchemaLoading.set(false);
    $error.set(null);
  };

  return {
    $availableSchemaHashes,
    $client,
    $error,
    $isSchemaHashesLoading,
    $isPermissionsLoading,
    $isWasmSchemaLoading,
    $storedPermissions,
    $wasmSchema,
    clearClient,
    clearRuntime,
    publishClient,
    publishClientError,
  };
}

/** Synchronizes Jazz metadata into independently subscribable runtime projection stores. */
export function useInspectorRuntime({
  connection,
  branch,
  schemaHash,
  initialSchemaHashes,
  retryGeneration = 0,
}: UseInspectorRuntimeOptions): InspectorRuntimeStore {
  const shouldDiscoverSchemaHashes =
    initialSchemaHashes === undefined || initialSchemaHashes.length === 0;
  const runtime = useMemo(
    () =>
      createInspectorRuntimeStore(
        connection !== null && schemaHash !== null
          ? readCachedWasmSchema(connection, schemaHash)
          : null,
        connection !== null &&
          branch !== null &&
          schemaHash !== null &&
          shouldDiscoverSchemaHashes,
        connection !== null && branch !== null && schemaHash !== null,
        connection === null ? [] : [connection.adminSecret],
      ),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Retry intentionally replaces the runtime store.
    [branch, connection, retryGeneration, schemaHash, shouldDiscoverSchemaHashes],
  );

  useEffect(() => {
    if (connection === null || branch === null || schemaHash === null) {
      runtime.clearRuntime();
      return;
    }

    let active = true;
    const failRuntime = (error: unknown) => {
      if (active === false) {
        return;
      }
      const runtimeError = { source: "schema", error: normalizeRuntimeError(error) } as const;
      runtime.$error.set(runtimeError);
      reportRuntimeError(runtimeError, [connection.adminSecret]);
      runtime.$isWasmSchemaLoading.set(false);
    };

    runtime.$isWasmSchemaLoading.set(true);
    runtime.$isPermissionsLoading.set(true);
    runtime.$isSchemaHashesLoading.set(shouldDiscoverSchemaHashes);
    runtime.$availableSchemaHashes.set(
      initialSchemaHashes !== undefined ? [...initialSchemaHashes] : [],
    );

    const schemaRequest = fetchStoredWasmSchema(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
      schemaHash,
    }).then(({ schema }) => {
      if (active === false) {
        return;
      }
      runtime.$wasmSchema.set(schema);
      writeCachedWasmSchema(connection, schemaHash, schema);
      runtime.$isWasmSchemaLoading.set(false);
    });

    if (shouldDiscoverSchemaHashes === true) {
      void fetchSchemaHashes(connection.serverUrl, {
        appId: connection.appId,
        adminSecret: connection.adminSecret,
      }).then(
        ({ hashes }) => {
          if (active === true) {
            runtime.$availableSchemaHashes.set(hashes);
            runtime.$isSchemaHashesLoading.set(false);
          }
        },
        () => {
          if (active === true) {
            runtime.$isSchemaHashesLoading.set(false);
          }
        },
      );
    }

    void fetchStoredPermissions(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
    }).then(
      (permissions) => {
        if (active === true) {
          runtime.$storedPermissions.set(permissions);
          runtime.$isPermissionsLoading.set(false);
        }
      },
      () => {
        if (active === true) {
          runtime.$isPermissionsLoading.set(false);
        }
      },
    );

    void schemaRequest.catch(failRuntime);

    return () => {
      active = false;
    };
  }, [
    branch,
    connection,
    initialSchemaHashes,
    runtime,
    schemaHash,
    shouldDiscoverSchemaHashes,
  ]);

  return runtime;
}
