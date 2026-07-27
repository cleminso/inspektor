/**
 * Resolves partial Inspector navigation into concrete Jazz runtime targets.
 *
 * Entry routes may only know the connection. These helpers combine stored Inspector
 * preferences with Jazz schema-hash metadata so table and query-subscriptions routes can bootstrap
 * the same runtime context after direct navigation, refresh, or redirect.
 */
import { redirect } from "@tanstack/react-router";

import {
  getConnectionById,
  readStoredConnections,
  resolveDefaultBranch,
  resolveDefaultSchemaHash,
  type StoredConnection,
  type StoredConnectionsStore,
} from "@/lib/config/connections";

import { appRoutes } from "./appRoutes";

/** Route params that identify one inspectable Jazz runtime context. */
export interface ResolvedTablesNavigationTarget {
  connectionId: string;
  branch: string;
  schemaHash: string;
}

interface ResolveTablesNavigationTargetOptions {
  connectionId: string;
  branchOverride?: string | null;
  schemaHashOverride?: string | null;
  getConnection: (connectionId: string) => StoredConnection | null;
  resolveBranch: (connectionId: string, branchOverride?: string | null) => string;
  resolveSchemaHash: (
    connectionId: string,
    availableSchemaHashes: string[],
    schemaHashOverride?: string | null,
  ) => string | null;
  reusableSchemaHashes?: string[];
}

interface ResolveStoredTablesNavigationTargetOptions {
  connectionId: string;
  branchOverride?: string | null;
  schemaHashOverride?: string | null;
  store?: StoredConnectionsStore;
}

/**
 * Resolves a connection into branch and schema-hash route params without requiring a mounted Jazz
 * provider.
 *
 * The Jazz metadata import stays inside this user-triggered navigation path so onboarding does not
 * make it part of the application-root graph. `reusableSchemaHashes` prevents refetching when the
 * mounted runtime already has the hash list.
 */
export async function resolveTablesNavigationTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  getConnection,
  resolveBranch,
  resolveSchemaHash,
  reusableSchemaHashes,
}: ResolveTablesNavigationTargetOptions): Promise<ResolvedTablesNavigationTarget | null> {
  const connection = getConnection(connectionId);
  if (connection === null) {
    return null;
  }

  const branch = resolveBranch(connectionId, branchOverride);
  const fetchSchemaHashes = async () => {
    const jazzTools = await import("jazz-tools");

    return jazzTools.fetchSchemaHashes(connection.serverUrl, {
      appId: connection.appId,
      adminSecret: connection.adminSecret,
    });
  };
  const availableSchemaHashes =
    reusableSchemaHashes !== undefined && reusableSchemaHashes.length > 0
      ? reusableSchemaHashes
      : await fetchSchemaHashes()
          .then((response) => response.hashes)
          .catch(() => []);

  const schemaHash = resolveSchemaHash(connectionId, availableSchemaHashes, schemaHashOverride);
  if (schemaHash === null) {
    return null;
  }

  return {
    connectionId,
    branch,
    schemaHash,
  };
}

/** Uses persisted Inspector connections when loaders need a complete runtime route. */
export async function resolveStoredTablesNavigationTarget({
  connectionId,
  branchOverride,
  schemaHashOverride,
  store,
}: ResolveStoredTablesNavigationTargetOptions): Promise<ResolvedTablesNavigationTarget | null> {
  const resolvedStore = store ?? readStoredConnections();

  return resolveTablesNavigationTarget({
    connectionId,
    branchOverride,
    schemaHashOverride,
    getConnection: (nextConnectionId) => getConnectionById(resolvedStore, nextConnectionId),
    resolveBranch: (nextConnectionId, nextBranchOverride) => resolveDefaultBranch(resolvedStore, nextConnectionId, nextBranchOverride),
    resolveSchemaHash: (nextConnectionId, availableSchemaHashes, nextSchemaHashOverride) =>
      resolveDefaultSchemaHash(resolvedStore, nextConnectionId, availableSchemaHashes, nextSchemaHashOverride),
  });
}

/** Sends users back to connection setup when a Jazz runtime target is unavailable. */
export function redirectToConnections(): never {
  throw redirect({ to: appRoutes.connections });
}

/** Enters the schema-driven table explorer for a resolved runtime context. */
export function redirectToTablesTarget(target: ResolvedTablesNavigationTarget): never {
  throw redirect({
    to: appRoutes.tables,
    params: target,
  });
}
