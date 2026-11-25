import { Context, Effect, Layer } from 'effect'
import type {
  fetchPublishedBundles,
  fetchSchemaHashes,
  fetchStoredWasmSchema,
  PublishedBundle,
  WasmSchema,
} from 'jazz-tools'
import type { ConnectionCredentials } from '../studio/connection.ts'

export type { PublishedBundle, WasmSchema } from 'jazz-tools'
export type SchemaHashesResponse = Awaited<ReturnType<typeof fetchSchemaHashes>>
export type StoredSchemaResponse = Awaited<ReturnType<typeof fetchStoredWasmSchema>>
export type PublishedBundles = Awaited<ReturnType<typeof fetchPublishedBundles>>

/** Public Jazz metadata access only. Jazz remains the authority for admission and schema. */
export class JazzMetadata extends Context.Service<
  JazzMetadata,
  {
    readonly fetchSchemaHashes: (
      connection: ConnectionCredentials,
    ) => Effect.Effect<SchemaHashesResponse, unknown>
    readonly fetchPublishedBundles: (
      connection: ConnectionCredentials,
    ) => Effect.Effect<PublishedBundles, unknown>
    readonly fetchStoredWasmSchema: (
      connection: ConnectionCredentials,
      schemaHash: string,
    ) => Effect.Effect<StoredSchemaResponse, unknown>
  }
>()('@inspektor/core/jazz/schema/JazzMetadata') {
  static readonly layer = Layer.succeed(
    JazzMetadata,
    JazzMetadata.of({
      fetchSchemaHashes: (connection) =>
        Effect.tryPromise({
          try: async () => {
            const jazz = await import('jazz-tools')
            return jazz.fetchSchemaHashes(connection.serverUrl, {
              appId: connection.appId,
              adminSecret: connection.adminSecret,
            })
          },
          catch: (error) => error,
        }),
      fetchPublishedBundles: (connection) =>
        Effect.tryPromise({
          try: async () => {
            const jazz = await import('jazz-tools')
            return jazz.fetchPublishedBundles(connection.serverUrl, {
              appId: connection.appId,
              adminSecret: connection.adminSecret,
            })
          },
          catch: (error) => error,
        }),
      fetchStoredWasmSchema: (connection, schemaHash) =>
        Effect.tryPromise({
          try: async () => {
            const jazz = await import('jazz-tools')
            return jazz.fetchStoredWasmSchema(connection.serverUrl, {
              appId: connection.appId,
              adminSecret: connection.adminSecret,
              schemaHash,
            })
          },
          catch: (error) => error,
        }),
    }),
  )
}

/** Permissions follow latest publication, independently of the selected stored schema. */
// @lat: [[jazzAccess#Metadata access]]
export const loadLatestPermissions = Effect.fnUntraced(function* (
  connection: ConnectionCredentials,
) {
  const metadata = yield* JazzMetadata
  const bundles = yield* metadata.fetchPublishedBundles(connection)
  return bundles.at(-1) ?? null
})

export const loadStoredSchema = Effect.fnUntraced(function* (
  connection: ConnectionCredentials,
  schemaHash: string,
) {
  const metadata = yield* JazzMetadata
  return yield* metadata.fetchStoredWasmSchema(connection, schemaHash)
})

/** Live public Jazz adapters for a session that owns failure policy and resource lifetime. */
export const fetchStoredSchema = (
  connection: ConnectionCredentials,
  schemaHash: string,
): Effect.Effect<WasmSchema, unknown> =>
  loadStoredSchema(connection, schemaHash).pipe(
    Effect.map(({ schema }) => schema),
    Effect.provide(JazzMetadata.layer),
  )

export const fetchLatestPermissions = (
  connection: ConnectionCredentials,
): Effect.Effect<PublishedBundle | null, unknown> =>
  loadLatestPermissions(connection).pipe(Effect.provide(JazzMetadata.layer))
