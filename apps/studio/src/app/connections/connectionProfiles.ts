import { Effect } from 'effect'
import { createConnectionProfiles, type ConnectionProfileAccess } from '@inspektor/core/connection'
import { readStoredConnections, writeStoredConnections } from './connections'
import {
  clearConnectionCredential,
  resolveRuntimeConnection,
  saveConnectionCredential,
} from './connectionCredentials'
import { removeConnectionScopedStorage } from '@app/storage/connectionScopedStorage'

/** Synchronous browser ports preserve the existing synchronous command contract. */
const profileAccess: ConnectionProfileAccess = {
  persistProfiles: (store) =>
    Effect.try({ try: () => writeStoredConnections(store), catch: (error) => error }),
  resolveCredential: (profile) =>
    Effect.try({ try: () => resolveRuntimeConnection(profile), catch: (error) => error }),
  saveCredential: (profile, adminSecret) =>
    Effect.try({
      try: () => saveConnectionCredential(profile, adminSecret),
      catch: (error) => error,
    }),
  clearCredential: (connectionId) =>
    Effect.try({ try: () => clearConnectionCredential(connectionId), catch: (error) => error }),
  removeScopedPreferences: (connectionId) =>
    Effect.try({ try: () => removeConnectionScopedStorage(connectionId), catch: (error) => error }),
}

let profiles: Effect.Success<ReturnType<typeof createConnectionProfiles>> | undefined

/** Entry and React share one tab-local authority, even when a loader runs before root mount. */
export function getConnectionProfiles() {
  profiles ??= Effect.runSync(createConnectionProfiles(readStoredConnections(), profileAccess))
  return profiles
}

export function readConnectionProfiles() {
  return Effect.runSync(getConnectionProfiles().snapshot)
}
