import { describe, expect, it } from 'vitest'

import {
  createTableMutationScopeKey,
  createTableMutationWorkspaceScope,
} from '@tables/mutationLedger/scope'

describe('table mutation scope', () => {
  it('builds table scope keys from one workspace identity', () => {
    const workspaceScope = createTableMutationWorkspaceScope({
      branch: 'main',
      connectionId: 'connection-1',
      schemaHash: 'schema-1',
    })

    expect(workspaceScope).toBe('connection-1:main:schema-1')
    expect(createTableMutationScopeKey(workspaceScope, 'accounts')).toBe(
      'connection-1:main:schema-1:accounts',
    )
  })
})
