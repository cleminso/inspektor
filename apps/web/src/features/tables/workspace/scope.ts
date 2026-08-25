/**
 * Ownership: connection session state owns connection, branch, schema, and table identity.
 * Projections: identity segments become collision-safe workspace and table scope keys.
 * Persistence: none; tabs, pins, preferences, and mutation ledgers consume the projected keys.
 * Reset boundary: connection, branch, or schema changes reset a workspace; table changes reset a table scope.
 */
import { encodeConnectionScopeSegment } from '@app/storage/connectionScopedStorage'

interface TableWorkspaceIdentity {
  branch: string | null
  connectionId: string | null
  schemaHash: string | null
}

/** Builds the connection, branch, and schema identity shared by table workspace state. */
export function createTableWorkspaceScope({
  branch,
  connectionId,
  schemaHash,
}: TableWorkspaceIdentity): string {
  return [connectionId, branch, schemaHash].map(encodeConnectionScopeSegment).join(':')
}

/** Extends a table workspace identity with one table. */
export function createTableScope(workspaceScope: string, tableName: string): string {
  return `${workspaceScope}:${encodeConnectionScopeSegment(tableName)}`
}
