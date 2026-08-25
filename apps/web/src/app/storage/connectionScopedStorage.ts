const storageKeyPrefixes = {
  tablePins: 'inspektor-table-pins:',
  tablePreferences: 'inspektor-table-preferences:',
  tabs: 'inspektor-tabs:',
} as const

export function getConnectionScopedStorageKey(
  kind: keyof typeof storageKeyPrefixes,
  scope: string,
): string {
  return `${storageKeyPrefixes[kind]}${encodeURIComponent(scope)}`
}

export function removeConnectionScopedStorage(connectionId: string): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  const encodedScopePrefix = encodeURIComponent(`${connectionId}:`)
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (
        key !== null &&
        Object.values(storageKeyPrefixes).some((prefix) =>
          key.startsWith(`${prefix}${encodedScopePrefix}`),
        )
      ) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}
