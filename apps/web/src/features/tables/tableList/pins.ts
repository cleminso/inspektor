const TABLE_PINS_STORAGE_KEY = "regarde-inspector-table-pins";

interface StoredTablePins {
  version: 1;
  scopes: Record<string, string[]>;
}

function readStoredScopes(): Record<string, string[]> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(TABLE_PINS_STORAGE_KEY) ?? "null") as {
      version?: unknown;
      scopes?: unknown;
    } | null;
    if (parsed?.version !== 1 || typeof parsed.scopes !== "object" || parsed.scopes === null) {
      return {};
    }

    const scopes: Record<string, string[]> = {};
    for (const [scope, value] of Object.entries(parsed.scopes)) {
      if (Array.isArray(value) === true && value.every((entry) => typeof entry === "string")) {
        scopes[scope] = value;
      }
    }
    return scopes;
  } catch {
    return {};
  }
}

export function loadPinnedTableNames(scope: string): ReadonlySet<string> {
  return new Set(readStoredScopes()[scope] ?? []);
}

export function updatePinnedTableNames(
  currentTableNames: ReadonlySet<string>,
  tableNames: readonly string[],
  pinned: boolean,
): ReadonlySet<string> {
  const nextTableNames = new Set(currentTableNames);
  for (const tableName of tableNames) {
    if (pinned === true) {
      nextTableNames.add(tableName);
    } else {
      nextTableNames.delete(tableName);
    }
  }
  return nextTableNames;
}

export function savePinnedTableNames(scope: string, tableNames: ReadonlySet<string>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const scopes = readStoredScopes();
    scopes[scope] = [...tableNames];
    const value: StoredTablePins = { version: 1, scopes };
    window.localStorage.setItem(TABLE_PINS_STORAGE_KEY, JSON.stringify(value));
  } catch {}
}
