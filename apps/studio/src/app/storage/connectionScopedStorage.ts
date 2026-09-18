const storageKeyPrefixes = {
  tablePins: 'inspektor-table-pins:',
  tablePreferences: 'inspektor-table-preferences:',
  tabs: 'inspektor-tabs:',
} as const

export function encodeConnectionScopeSegment(value: string | null): string {
  return value === null ? '%' : value.replaceAll('%', '%25').replaceAll(':', '%3A')
}

function decodeConnectionScopeSegment(value: string): string {
  return value === '%' ? 'none' : value.replaceAll('%3A', ':').replaceAll('%25', '%')
}

export function getConnectionScopedStorageKey(
  kind: keyof typeof storageKeyPrefixes,
  scope: string,
): string {
  return `${storageKeyPrefixes[kind]}${encodeURIComponent(scope)}`
}

export function getConnectionScopedStorageKeyCandidates(
  kind: keyof typeof storageKeyPrefixes,
  scope: string,
): readonly string[] {
  const storageKey = getConnectionScopedStorageKey(kind, scope)
  const legacyStorageKey = getConnectionScopedStorageKey(
    kind,
    scope.split(':').map(decodeConnectionScopeSegment).join(':'),
  )
  return storageKey === legacyStorageKey ? [storageKey] : [storageKey, legacyStorageKey]
}

/** Reads the collision-safe key first, then its pre-encoding equivalent for persisted compatibility. */
export function getConnectionScopedStorageValue(
  kind: keyof typeof storageKeyPrefixes,
  scope: string,
): string | null {
  if (typeof localStorage === 'undefined') return null

  for (const key of getConnectionScopedStorageKeyCandidates(kind, scope)) {
    const value = localStorage.getItem(key)
    if (value !== null) return value
  }
  return null
}

export function removeConnectionScopedStorage(connectionId: string): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  const encodedScopePrefixes = [
    encodeURIComponent(`${encodeConnectionScopeSegment(connectionId)}:`),
    encodeURIComponent(`${connectionId}:`),
  ]
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (
        key !== null &&
        Object.values(storageKeyPrefixes).some((prefix) =>
          encodedScopePrefixes.some((scopePrefix) => key.startsWith(`${prefix}${scopePrefix}`)),
        )
      ) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}
