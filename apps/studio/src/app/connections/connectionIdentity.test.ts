import { describe, expect, it } from 'vitest'

import { findConnectionByCredentials, matchesConnectionCredentials } from './connectionIdentity'
import type { RuntimeConnection } from './connections'

const firstConnection: RuntimeConnection = {
  id: 'connection-1',
  name: 'First credential',
  serverUrl: 'https://sync.example.com',
  appId: 'app-1',
  adminSecret: 'first-secret',
  env: 'dev',
  credentialRetention: 'memory',
}

describe('connection credential identity', () => {
  it('keeps profiles for the same server and app separate when their secrets differ', () => {
    const secondCredentials = {
      serverUrl: firstConnection.serverUrl,
      appId: firstConnection.appId,
      adminSecret: 'second-secret',
    }

    expect(matchesConnectionCredentials(firstConnection, secondCredentials)).toBe(false)
    expect(findConnectionByCredentials([firstConnection], secondCredentials)).toBeNull()
  })
})
