interface TableMutationWorkspaceIdentity {
  branch: string | null
  connectionId: string | null
  schemaHash: string | null
}

/** Builds the shared identity used by table tabs and workspace-owned mutation ledgers. */
export function createTableMutationWorkspaceScope({
  branch,
  connectionId,
  schemaHash,
}: TableMutationWorkspaceIdentity): string {
  return `${connectionId ?? 'none'}:${branch ?? 'none'}:${schemaHash ?? 'none'}`
}

/** Extends a workspace identity with the table whose staged mutations it owns. */
export function createTableMutationScopeKey(workspaceScope: string, tableName: string): string {
  return `${workspaceScope}:${tableName}`
}
