import {
  getConnectionScopedStorageKey,
  getConnectionScopedStorageValue,
} from '@app/storage/connectionScopedStorage'

function readStoredTableNames(scope: string): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = getConnectionScopedStorageValue('tablePins', scope)
    const parsed = JSON.parse(storedValue ?? 'null') as {
      version?: unknown
      tableNames?: unknown
    } | null
    if (
      parsed?.version !== 1 ||
      Array.isArray(parsed.tableNames) === false ||
      parsed.tableNames.every((entry) => typeof entry === 'string') === false
    ) {
      return []
    }

    return parsed.tableNames
  } catch {
    return []
  }
}

export function loadPinnedTableNames(scope: string): ReadonlySet<string> {
  return new Set(readStoredTableNames(scope))
}

export function updatePinnedTableNames(
  currentTableNames: ReadonlySet<string>,
  tableNames: readonly string[],
  pinned: boolean,
): ReadonlySet<string> {
  const nextTableNames = new Set(currentTableNames)
  for (const tableName of tableNames) {
    if (pinned === true) {
      nextTableNames.add(tableName)
    } else {
      nextTableNames.delete(tableName)
    }
  }
  return nextTableNames
}

export function savePinnedTableNames(scope: string, tableNames: ReadonlySet<string>): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getConnectionScopedStorageKey('tablePins', scope),
      JSON.stringify({ version: 1, tableNames: [...tableNames] }),
    )
  } catch {}
}
