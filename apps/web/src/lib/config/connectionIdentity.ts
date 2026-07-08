/**
 * Defines how the Inspector recognizes a Jazz app connection.
 *
 * Dev-tool links can be opened repeatedly, so matching is based on the Jazz admin
 * credentials rather than Inspector labels or view preferences.
 */
import { type ConnectionDraft, type StoredConnection } from "@/lib/config/connections";

/** Compares server identity without treating a trailing slash as a different app. */
function normalizeServerUrl(serverUrl: string): string {
  return serverUrl.trim().replace(/\/+$/u, "");
}

/** Removes form/link whitespace that is not part of the credential identity. */
function normalizeCredentialField(value: string): string {
  return value.trim();
}

/**
 * Compares the Jazz credentials that define a runtime connection.
 *
 * Name, env, branch, and schema hash are excluded because they describe Inspector
 * display or runtime view state, not the Jazz admin connection itself.
 */
export function matchesConnectionCredentials(
  connection: Pick<StoredConnection, "serverUrl" | "appId" | "adminSecret">,
  draft: Pick<ConnectionDraft, "serverUrl" | "appId" | "adminSecret">,
): boolean {
  return (
    normalizeServerUrl(connection.serverUrl) === normalizeServerUrl(draft.serverUrl) &&
    normalizeCredentialField(connection.appId) === normalizeCredentialField(draft.appId) &&
    normalizeCredentialField(connection.adminSecret) === normalizeCredentialField(draft.adminSecret)
  );
}

/** Finds the saved Inspector profile for the same Jazz admin credentials. */
export function findConnectionByCredentials(
  connections: StoredConnection[],
  draft: Pick<ConnectionDraft, "serverUrl" | "appId" | "adminSecret">,
): StoredConnection | null {
  return connections.find((connection) => matchesConnectionCredentials(connection, draft)) ?? null;
}
