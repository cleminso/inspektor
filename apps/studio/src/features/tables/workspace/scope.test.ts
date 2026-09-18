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
      '%:%:%',
    )
  })

  it('keeps workspace segments and null values collision-safe', () => {
    expect(
      createTableWorkspaceScope({ branch: 'c', connectionId: 'a:b', schemaHash: 'd' }),
    ).not.toBe(createTableWorkspaceScope({ branch: 'b:c', connectionId: 'a', schemaHash: 'd' }))
    expect(
      createTableWorkspaceScope({ branch: null, connectionId: 'a', schemaHash: 'd' }),
    ).not.toBe(createTableWorkspaceScope({ branch: 'none', connectionId: 'a', schemaHash: 'd' }))
  })

  it('keeps table names separate from workspace segments', () => {
    const leftWorkspace = createTableWorkspaceScope({
      branch: 'main',
      connectionId: 'connection',
      schemaHash: 'schema:accounts',
    })
    const rightWorkspace = createTableWorkspaceScope({
      branch: 'main',
      connectionId: 'connection',
      schemaHash: 'schema',
    })

    expect(createTableScope(leftWorkspace, 'rows')).not.toBe(
      createTableScope(rightWorkspace, 'accounts:rows'),
    )
  })
})
