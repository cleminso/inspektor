import { describe, expect, it } from 'vitest'

import {
  createConnectionFromDraft,
  createEmptyConnectionStore,
  getConnectionPreferences,
  setActiveConnectionContext,
  upsertConnection,
} from '@app/connections/connections'

describe('setActiveConnectionContext', () => {
  it('selects the connection and remembers its runtime context atomically', () => {
    const connection = createConnectionFromDraft(
      {
        name: 'Local app',
        serverUrl: 'https://sync.example.com',
        appId: 'app-1',
        adminSecret: 'secret',
        env: 'dev',
      },
      'connection-1',
    )
    const store = upsertConnection(createEmptyConnectionStore(), connection)

    const nextStore = setActiveConnectionContext(store, 'connection-1', 'feature', 'schema-2')

    expect(nextStore.activeConnectionId).toBe('connection-1')
    expect(getConnectionPreferences(nextStore, 'connection-1')).toEqual({
      lastBranch: 'feature',
      lastSchemaHash: 'schema-2',
      rememberedBranches: ['feature', 'main'],
    })
  })
})
