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
  return `${connectionId ?? 'none'}:${branch ?? 'none'}:${schemaHash ?? 'none'}`
}

/** Extends a table workspace identity with one table. */
export function createTableScope(workspaceScope: string, tableName: string): string {
  return `${workspaceScope}:${tableName}`
}
