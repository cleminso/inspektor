/**
 * Local persistence model for Inspector connection profiles.
 *
 * From the Jazz side, each connection stores the credentials needed to create an admin
 * runtime against a Jazz app: server URL, app ID, admin secret, and env.
 *
 * From the Inspector side, the same store keeps UI session preferences separate from
 * credentials so branch/schema selection can change without rewriting connection data.
 */
export const CONNECTIONS_STORAGE_KEY = "regarde-inspector-connections";
export const DEFAULT_SERVER_URL = "https://v2.sync.jazz.tools/";
export const DEFAULT_BRANCH_NAME = "main";

/** Connection values before the Inspector assigns its local profile ID. */
export interface ConnectionDraft {
  name: string;
  serverUrl: string;
  appId: string;
  adminSecret: string;
  env: string;
}

/** Saved Jazz admin connection used to start the Inspector runtime. */
export interface StoredConnection extends ConnectionDraft {
  id: string;
}

/** Inspector view state stored separately from Jazz connection credentials. */
export interface ConnectionPreferences {
  lastBranch: string;
  lastSchemaHash: string | null;
  rememberedBranches: string[];
}

/** Version 3 localStorage schema for Jazz credentials and Inspector preferences. */
export interface StoredConnectionsStore {
  version: 3;
  activeConnectionId: string | null;
  connections: StoredConnection[];
  preferencesByConnectionId: Record<string, ConnectionPreferences>;
}

interface LegacyStoredConnection extends ConnectionDraft {
  id: string;
  branch: string;
  schemaHash: string;
}

interface LegacyStoredConnectionsStore {
  version: 2;
  activeConnectionId: string | null;
  connections: LegacyStoredConnection[];
}

type LegacyStoredConfig = Omit<LegacyStoredConnection, "id" | "name">;

/** Creates the empty Inspector connection store used when persisted data is unavailable. */
export function createEmptyConnectionStore(): StoredConnectionsStore {
  return {
    version: 3,
    activeConnectionId: null,
    connections: [],
    preferencesByConnectionId: {},
  };
}

/**
 * Reads and validates the persisted Inspector connection store.
 *
 * Stored JSON is treated as untrusted input because localStorage can be edited
 * manually and legacy Inspector stores used different shapes.
 */
export function readStoredConnections(): StoredConnectionsStore {
  if (typeof localStorage === "undefined") {
    return createEmptyConnectionStore();
  }

  try {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (raw === null) {
      return createEmptyConnectionStore();
    }

    const parsed = JSON.parse(raw) as unknown;
    return migrateStoredConnections(parsed) ?? createEmptyConnectionStore();
  } catch {
    return createEmptyConnectionStore();
  }
}

/** Persists the complete Inspector connection store. */
export function writeStoredConnections(store: StoredConnectionsStore): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(store));
}

/** Resolves the active Inspector profile, falling back when the saved ID is stale. */
export function getActiveConnection(store: StoredConnectionsStore): StoredConnection | null {
  if (store.activeConnectionId !== null) {
    const activeConnection = store.connections.find((connection) => connection.id === store.activeConnectionId);
    if (activeConnection !== undefined) {
      return activeConnection;
    }
  }

  return store.connections[0] ?? null;
}

export function getConnectionById(
  store: StoredConnectionsStore,
  connectionId: string | null | undefined,
): StoredConnection | null {
  if (connectionId === null || connectionId === undefined || connectionId.length === 0) {
    return null;
  }

  return store.connections.find((connection) => connection.id === connectionId) ?? null;
}

/** Returns Inspector preferences with defaults so callers never handle a missing record. */
export function getConnectionPreferences(
  store: StoredConnectionsStore,
  connectionId: string,
): ConnectionPreferences {
  return (
    store.preferencesByConnectionId[connectionId] ?? {
      lastBranch: DEFAULT_BRANCH_NAME,
      lastSchemaHash: null,
      rememberedBranches: [DEFAULT_BRANCH_NAME],
    }
  );
}

export function setActiveConnectionId(
  store: StoredConnectionsStore,
  connectionId: string | null,
): StoredConnectionsStore {
  return {
    ...store,
    activeConnectionId: connectionId,
  };
}

export function setActiveConnectionContext(
  store: StoredConnectionsStore,
  connectionId: string,
  branch: string,
  schemaHash: string,
): StoredConnectionsStore {
  return updateConnectionPreferences(
    rememberBranch(setActiveConnectionId(store, connectionId), connectionId, branch),
    connectionId,
    { lastSchemaHash: schemaHash },
  );
}

/** Saves a Jazz connection profile, marks it active, and ensures it has preferences. */
export function upsertConnection(
  store: StoredConnectionsStore,
  connection: StoredConnection,
): StoredConnectionsStore {
  const existingConnection = getConnectionById(store, connection.id);

  return {
    ...store,
    activeConnectionId: connection.id,
    connections: existingConnection !== null
      ? store.connections.map((item) => (item.id === connection.id ? connection : item))
      : [...store.connections, connection],
    preferencesByConnectionId: {
      ...store.preferencesByConnectionId,
      [connection.id]: getConnectionPreferences(store, connection.id),
    },
  };
}

export function removeConnection(
  store: StoredConnectionsStore,
  connectionId: string,
): StoredConnectionsStore {
  const connections = store.connections.filter((connection) => connection.id !== connectionId);
  const preferencesByConnectionId = { ...store.preferencesByConnectionId };
  delete preferencesByConnectionId[connectionId];

  return {
    ...store,
    activeConnectionId:
      store.activeConnectionId === connectionId ? (connections[0]?.id ?? null) : store.activeConnectionId,
    connections,
    preferencesByConnectionId,
  };
}

/**
 * Updates Inspector runtime preferences while keeping branch values normalized and deduped.
 *
 * Branch and schema hash are Jazz runtime context, but the Inspector stores them as
 * preferences because they describe the selected view of a saved connection.
 */
export function updateConnectionPreferences(
  store: StoredConnectionsStore,
  connectionId: string,
  updates: Partial<ConnectionPreferences>,
): StoredConnectionsStore {
  const currentPreferences = getConnectionPreferences(store, connectionId);
  const nextPreferences: ConnectionPreferences = {
    lastBranch: normalizeBranchName(updates.lastBranch ?? currentPreferences.lastBranch),
    lastSchemaHash:
      updates.lastSchemaHash === undefined ? currentPreferences.lastSchemaHash : updates.lastSchemaHash,
    rememberedBranches: dedupeBranches(updates.rememberedBranches ?? currentPreferences.rememberedBranches),
  };

  if (nextPreferences.rememberedBranches.includes(nextPreferences.lastBranch) === false) {
    nextPreferences.rememberedBranches = dedupeBranches([
      nextPreferences.lastBranch,
      ...nextPreferences.rememberedBranches,
    ]);
  }

  return {
    ...store,
    preferencesByConnectionId: {
      ...store.preferencesByConnectionId,
      [connectionId]: nextPreferences,
    },
  };
}

export function rememberBranch(
  store: StoredConnectionsStore,
  connectionId: string,
  branch: string,
): StoredConnectionsStore {
  const currentPreferences = getConnectionPreferences(store, connectionId);
  const normalizedBranch = normalizeBranchName(branch);

  return updateConnectionPreferences(store, connectionId, {
    lastBranch: normalizedBranch,
    rememberedBranches: [normalizedBranch, ...currentPreferences.rememberedBranches],
  });
}

/** Converts editable values into the saved Jazz connection shape used by runtime hooks. */
export function createConnectionFromDraft(
  draft: ConnectionDraft,
  connectionId = createConnectionId(),
): StoredConnection {
  return {
    id: connectionId,
    name: draft.name.trim() || deriveConnectionName(draft),
    serverUrl: draft.serverUrl.trim(),
    appId: draft.appId.trim(),
    adminSecret: draft.adminSecret.trim(),
    env: normalizeEnvName(draft.env),
  };
}

export function createConnectionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `connection-${Math.random().toString(36).slice(2, 10)}`;
}

export function deriveConnectionName(connection: Pick<ConnectionDraft, "serverUrl" | "appId">): string {
  try {
    const host = new URL(connection.serverUrl).host;
    return host.length > 0 ? `${connection.appId} @ ${host}` : connection.appId;
  } catch {
    return connection.appId.length > 0 ? connection.appId : "Jazz connection";
  }
}

export function getConnectionDisplayName(connection: StoredConnection): string {
  const name = connection.name.trim();
  return name.length > 0 ? name : deriveConnectionName(connection);
}

export function getConnectionSecondaryLabel(connection: StoredConnection): string {
  try {
    return `${connection.appId} @ ${new URL(connection.serverUrl).host}`;
  } catch {
    return `${connection.appId} @ ${connection.serverUrl}`;
  }
}

export function normalizeBranchName(branch: string | null | undefined): string {
  const normalizedBranch = branch?.trim() ?? "";
  return normalizedBranch.length > 0 ? normalizedBranch : DEFAULT_BRANCH_NAME;
}

export function normalizeEnvName(env: string | null | undefined): string {
  const normalizedEnv = env?.trim() ?? "";
  return normalizedEnv.length > 0 ? normalizedEnv : "dev";
}

export function resolveDefaultBranch(
  store: StoredConnectionsStore,
  connectionId: string,
  branch?: string | null,
): string {
  return normalizeBranchName(branch ?? getConnectionPreferences(store, connectionId).lastBranch);
}

/**
 * Chooses the schema hash the Inspector should use for a connection.
 *
 * Jazz can expose multiple stored schema hashes for the same app. The Inspector only
 * reuses a requested or remembered hash when Jazz reports it as available.
 */
export function resolveDefaultSchemaHash(
  store: StoredConnectionsStore,
  connectionId: string,
  availableSchemaHashes: string[],
  schemaHash?: string | null,
): string | null {
  const nextSchemaHash = schemaHash ?? getConnectionPreferences(store, connectionId).lastSchemaHash;
  if (nextSchemaHash !== null && availableSchemaHashes.includes(nextSchemaHash) === true) {
    return nextSchemaHash;
  }

  // TODO: Replace this fallback with an explicit schema selection policy once schema metadata/UI is defined.
  return availableSchemaHashes[0] ?? null;
}

/** Migrates recognized Inspector localStorage shapes into store version 3. */
function migrateStoredConnections(parsed: unknown): StoredConnectionsStore | null {
  if (isStoredConnectionsStore(parsed) === true) {
    return {
      version: 3,
      activeConnectionId: parsed.activeConnectionId,
      connections: parsed.connections.map((connection) => ({
        ...connection,
        env: normalizeEnvName(connection.env),
      })),
      preferencesByConnectionId: Object.fromEntries(
        Object.entries(parsed.preferencesByConnectionId).map(([connectionId, preferences]) => [
          connectionId,
          {
            lastBranch: normalizeBranchName(preferences.lastBranch),
            lastSchemaHash: preferences.lastSchemaHash,
            rememberedBranches: dedupeBranches(preferences.rememberedBranches),
          },
        ]),
      ),
    };
  }

  if (isLegacyStoredConnectionsStore(parsed) === true) {
    return {
      version: 3,
      activeConnectionId: parsed.activeConnectionId,
      connections: parsed.connections.map((connection) => ({
        id: connection.id,
        name: connection.name,
        serverUrl: connection.serverUrl,
        appId: connection.appId,
        adminSecret: connection.adminSecret,
        env: normalizeEnvName(connection.env),
      })),
      preferencesByConnectionId: Object.fromEntries(
        parsed.connections.map((connection) => [
          connection.id,
          {
            lastBranch: normalizeBranchName(connection.branch),
            lastSchemaHash: connection.schemaHash,
            rememberedBranches: dedupeBranches([connection.branch]),
          },
        ]),
      ),
    };
  }

  if (isLegacyStoredConfig(parsed) === true) {
    const connection = createConnectionFromDraft(
      {
        name: deriveConnectionName(parsed),
        serverUrl: parsed.serverUrl,
        appId: parsed.appId,
        adminSecret: parsed.adminSecret,
        env: normalizeEnvName(parsed.env),
      },
      createConnectionId(),
    );

    return {
      version: 3,
      activeConnectionId: connection.id,
      connections: [connection],
      preferencesByConnectionId: {
        [connection.id]: {
          lastBranch: normalizeBranchName(parsed.branch),
          lastSchemaHash: parsed.schemaHash,
          rememberedBranches: dedupeBranches([parsed.branch]),
        },
      },
    };
  }

  return null;
}

function isStoredConnectionsStore(value: unknown): value is StoredConnectionsStore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as StoredConnectionsStore;
  return (
    candidate.version === 3 &&
    (candidate.activeConnectionId === null || typeof candidate.activeConnectionId === "string") &&
    Array.isArray(candidate.connections) === true &&
    candidate.connections.every(isStoredConnection) === true &&
    typeof candidate.preferencesByConnectionId === "object" &&
    candidate.preferencesByConnectionId !== null &&
    Object.values(candidate.preferencesByConnectionId).every(isConnectionPreferences) === true
  );
}

function isLegacyStoredConnectionsStore(value: unknown): value is LegacyStoredConnectionsStore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as LegacyStoredConnectionsStore;
  return (
    candidate.version === 2 &&
    (candidate.activeConnectionId === null || typeof candidate.activeConnectionId === "string") &&
    Array.isArray(candidate.connections) === true &&
    candidate.connections.every(isLegacyStoredConnection) === true
  );
}

function isStoredConnection(value: unknown): value is StoredConnection {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as StoredConnection;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.serverUrl === "string" &&
    typeof candidate.appId === "string" &&
    typeof candidate.adminSecret === "string" &&
    typeof candidate.env === "string"
  );
}

function isLegacyStoredConnection(value: unknown): value is LegacyStoredConnection {
  return (
    isStoredConnection(value) === true &&
    typeof (value as LegacyStoredConnection).branch === "string" &&
    typeof (value as LegacyStoredConnection).schemaHash === "string"
  );
}

function isLegacyStoredConfig(value: unknown): value is LegacyStoredConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as LegacyStoredConfig;
  return (
    typeof candidate.serverUrl === "string" &&
    typeof candidate.appId === "string" &&
    typeof candidate.adminSecret === "string" &&
    typeof candidate.schemaHash === "string"
  );
}

function isConnectionPreferences(value: unknown): value is ConnectionPreferences {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as ConnectionPreferences;
  return (
    typeof candidate.lastBranch === "string" &&
    (candidate.lastSchemaHash === null || typeof candidate.lastSchemaHash === "string") &&
    Array.isArray(candidate.rememberedBranches) === true &&
    candidate.rememberedBranches.every((branch) => typeof branch === "string") === true
  );
}

/** Normalizes branch history while preserving input order for the branch picker. */
function dedupeBranches(branches: string[]): string[] {
  const normalizedBranches: string[] = [];
  const seen = new Set<string>();

  for (const branch of branches) {
    const normalizedBranch = normalizeBranchName(branch);
    if (seen.has(normalizedBranch) === true) {
      continue;
    }

    seen.add(normalizedBranch);
    normalizedBranches.push(normalizedBranch);
  }

  return normalizedBranches.length > 0 ? normalizedBranches : [DEFAULT_BRANCH_NAME];
}
