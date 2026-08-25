import { describe, expect, it } from 'vitest'

import { createTableScope, createTableWorkspaceScope } from '@tables/workspace/scope'

describe('table workspace scope', () => {
  it('builds workspace and table identities from one format', () => {
    const workspaceScope = createTableWorkspaceScope({
      branch: 'main',
      connectionId: 'connection-1',
      schemaHash: 'schema-1',
    })

    expect(workspaceScope).toBe('connection-1:main:schema-1')
    expect(createTableScope(workspaceScope, 'accounts')).toBe('connection-1:main:schema-1:accounts')
  })

  it('uses one fallback for an incomplete workspace identity', () => {
    expect(createTableWorkspaceScope({ branch: null, connectionId: null, schemaHash: null })).toBe(
      'none:none:none',
    )
  })
})
